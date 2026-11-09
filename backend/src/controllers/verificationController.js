const pool = require('../config/db');
const { recordAudit } = require('../utils/auditLog');
const { createNotification } = require('../utils/notificationService');
const { resolvePhotoUrls } = require('../utils/storage');

const PHOTO_STATUSES = ['menunggu_verifikasi', 'terverifikasi', 'ditolak'];
const COMMUNITY_STATUSES = ['setuju', 'tidak_setuju'];
const OFFICIAL_STATUSES = ['lolos', 'tidak_lolos'];

function getVotingConfig() {
  const approveThreshold = Number(process.env.VOTE_APPROVE_THRESHOLD);
  const rejectThreshold = Number(process.env.VOTE_REJECT_THRESHOLD);
  const autoMode = process.env.VOTE_AUTO_MODE || 'flag';

  return {
    approveThreshold: Number.isInteger(approveThreshold) && approveThreshold > 0 ? approveThreshold : 5,
    rejectThreshold: Number.isInteger(rejectThreshold) && rejectThreshold > 0 ? rejectThreshold : 3,
    autoMode: ['off', 'flag', 'auto'].includes(autoMode) ? autoMode : 'flag',
  };
}

async function communityVerify(req, res, next) {
  const { photo_id, status, note } = req.body;
  const verifierId = req.user.farmerId;

  if (!verifierId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }
  if (!photo_id || !COMMUNITY_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'photo_id dan status (setuju/tidak_setuju) wajib diisi' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const photoRes = await client.query(
        `SELECT fp.id, fp.field_id, fp.verification_status, fp.distance_from_center,
                f.id_farmer, fa.id_user AS farmer_user_id, f.name AS field_name
         FROM field_photos fp
         JOIN fields f ON fp.field_id = f.id
         JOIN farmers fa ON f.id_farmer = fa.id
         WHERE fp.id = ? AND f.id_farmer <> ? AND f.status = 'active'`,
        [photo_id, verifierId]
      );
      if (photoRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Foto tidak ditemukan atau merupakan foto lahan Anda sendiri' });
      }

      const photo = photoRes.rows[0];

      // Verifikasi akun pemilih harus aktif
      const verifierUser = await client.query(
        `SELECT u.is_active FROM users u JOIN farmers fa ON fa.id_user = u.id WHERE fa.id = ?`,
        [verifierId]
      );
      if (!verifierUser.rows[0]?.is_active) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Akun pemilih belum terverifikasi atau tidak aktif' });
      }

      const existing = await client.query(
        `SELECT id FROM community_verifications WHERE photo_id = ? AND verifier_id = ?`,
        [photo_id, verifierId]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE community_verifications SET status = ?, note = ?, verified_at = CURRENT_TIMESTAMP
           WHERE photo_id = ? AND verifier_id = ?`,
          [status, note || null, photo_id, verifierId]
        );
      } else {
        await client.query(
          `INSERT INTO community_verifications (photo_id, verifier_id, status, note)
           VALUES (?, ?, ?, ?)`,
          [photo_id, verifierId, status, note || null]
        );
      }

      // Hitung hanya suara valid (1 suara per akun per foto, akun aktif, bukan pemilik)
      const votesCountRes = await client.query(
        `SELECT 
           CAST(SUM(CASE WHEN cv.status = 'setuju' THEN 1 ELSE 0 END) AS INTEGER) AS setuju_count,
           CAST(SUM(CASE WHEN cv.status = 'tidak_setuju' THEN 1 ELSE 0 END) AS INTEGER) AS tidak_setuju_count
         FROM community_verifications cv
         JOIN farmers fa ON fa.id = cv.verifier_id
         JOIN users u ON u.id = fa.id_user
         WHERE cv.photo_id = ? AND u.is_active = 1`,
        [photo_id]
      );
      const setujuCount = votesCountRes.rows[0]?.setuju_count || 0;
      const tidakSetujuCount = votesCountRes.rows[0]?.tidak_setuju_count || 0;

      const { approveThreshold, rejectThreshold, autoMode } = getVotingConfig();

      let communityRecommendation = null;
      if (setujuCount >= approveThreshold) {
        communityRecommendation = 'rekomendasi_setuju';
      } else if (tidakSetujuCount >= rejectThreshold) {
        communityRecommendation = 'perlu_ditinjau';
      }

      let autoApproved = false;

      if (autoMode === 'flag') {
        // Mode flag: hanya memberi label rekomendasi warga, status foto TIDAK berubah
        await client.query(
          `UPDATE field_photos SET community_recommendation = ? WHERE id = ?`,
          [communityRecommendation, photo_id]
        );

        if (communityRecommendation) {
          await recordAudit(client, {
            actor: { id: null, nama: 'Sistem', role: 'system' },
            action: 'vote_flagged',
            entityType: 'photo',
            entityId: photo_id,
            summary: `Foto #${photo_id} ditandai oleh sistem: "${communityRecommendation}" (${setujuCount} setuju, ${tidakSetujuCount} tolak)`,
            metadata: { photo_id, setuju_count: setujuCount, tidak_setuju_count: tidakSetujuCount, recommendation: communityRecommendation, mode: autoMode },
          });
        }
      } else if (autoMode === 'auto') {
        // Mode auto: jika setuju >= threshold DAN tidak ada tolak signifikan (< rejectThreshold)
        const isGeofenceValid =
          photo.distance_from_center === undefined ||
          photo.distance_from_center === null ||
          Number(photo.distance_from_center) <= 50;

        if (setujuCount >= approveThreshold && tidakSetujuCount < rejectThreshold && isGeofenceValid) {
          if (photo.verification_status === 'menunggu_verifikasi') {
            await client.query(
              `UPDATE field_photos
               SET verification_status = 'terverifikasi',
                   verified_by_system = 1,
                   community_recommendation = 'rekomendasi_setuju'
               WHERE id = ?`,
              [photo_id]
            );
            autoApproved = true;

            await recordAudit(client, {
              actor: { id: null, nama: 'Sistem', role: 'system' },
              action: 'verify_auto_approved',
              entityType: 'photo',
              entityId: photo_id,
              summary: `Foto #${photo_id} diverifikasi otomatis oleh sistem berdasarkan ${setujuCount} suara setuju warga (threshold: ${approveThreshold})`,
              metadata: { photo_id, setuju_count: setujuCount, tidak_setuju_count: tidakSetujuCount, threshold: approveThreshold },
            });

            await createNotification(client, {
              userId: photo.farmer_user_id,
              type: 'photo.auto_verified',
              title: 'Foto Lahan Terverifikasi Otomatis',
              message: `Foto progres lahan "${photo.field_name}" telah diverifikasi otomatis oleh sistem berdasarkan rekomendasi warga sekitar (${setujuCount} persetujuan).`,
              data: { photo_id, field_id: photo.field_id, status: 'terverifikasi', verified_by: 'sistem' },
            });
          }
        } else {
          // Tidak ada auto-reject, cukup tandai "perlu_ditinjau"
          await client.query(
            `UPDATE field_photos SET community_recommendation = ? WHERE id = ?`,
            [communityRecommendation, photo_id]
          );
        }
      }

      await recordAudit(client, {
        actor: req.user,
        action: 'verify_community',
        entityType: 'photo',
        entityId: photo_id,
        summary: `Petani memberikan verifikasi komunitas: ${status}`,
        metadata: { photo_id, status, note, setuju_count: setujuCount, tidak_setuju_count: tidakSetujuCount },
      });

      await client.query('COMMIT');

      res.json({
        success: true,
        setujuCount,
        tidakSetujuCount,
        recommendation: communityRecommendation,
        autoApproved,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

async function officialVerify(req, res, next) {
  const { photo_id, status, note, is_override } = req.body;
  const officerId = req.user.officerId || null;

  if (!photo_id || !OFFICIAL_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'photo_id dan status (lolos/tidak_lolos) wajib diisi' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const photoRes = await client.query(
        `SELECT fp.id, fp.verification_status, fp.verified_by_system, fp.field_id,
                f.name AS field_name, fa.id_user AS farmer_user_id
         FROM field_photos fp
         JOIN fields f ON fp.field_id = f.id
         JOIN farmers fa ON f.id_farmer = fa.id
         WHERE fp.id = ? AND f.status = 'active'`,
        [photo_id]
      );
      if (photoRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Foto tidak ditemukan' });
      }

      const photo = photoRes.rows[0];

      // Jika menganulir foto yang diverifikasi otomatis (atau override eksplisit), alasan (note) wajib diisi
      const isOverriding = Boolean(photo.verified_by_system) || Boolean(is_override);
      if (isOverriding && (!note || typeof note !== 'string' || note.trim().length < 5)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Alasan (catatan) wajib diisi minimal 5 karakter untuk menganulir hasil verifikasi sistem',
        });
      }

      const existing = await client.query(
        `SELECT id FROM official_verifications WHERE photo_id = ?`,
        [photo_id]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE official_verifications SET officer_id = ?, status = ?, note = ?, verified_at = CURRENT_TIMESTAMP
           WHERE photo_id = ?`,
          [officerId, status, note || null, photo_id]
        );
      } else {
        await client.query(
          `INSERT INTO official_verifications (photo_id, officer_id, status, note)
           VALUES (?, ?, ?, ?)`,
          [photo_id, officerId, status, note || null]
        );
      }

      const newStatus = status === 'lolos' ? 'terverifikasi' : 'ditolak';
      await client.query(
        'UPDATE field_photos SET verification_status = ?, verified_by_system = 0 WHERE id = ?',
        [newStatus, photo_id]
      );

      const updated = await client.query(
        'SELECT * FROM field_photos WHERE id = ?',
        [photo_id]
      );

      const auditAction = isOverriding ? 'verify_override' : 'verify_official';
      const auditSummary = isOverriding
        ? `Petugas/Admin menganulir verifikasi foto #${photo_id}: status menjadi ${newStatus}. Alasan: ${note}`
        : `Petugas/Admin melakukan verifikasi resmi foto #${photo_id}: ${status} → status foto: ${newStatus}`;

      await recordAudit(client, {
        actor: req.user,
        action: auditAction,
        entityType: 'photo',
        entityId: photo_id,
        summary: auditSummary,
        metadata: {
          photo_id,
          status,
          note,
          photo_status: newStatus,
          was_auto_verified: Boolean(photo.verified_by_system),
        },
      });

      // Notifikasi ke pemilik foto
      if (newStatus === 'terverifikasi') {
        await createNotification(client, {
          userId: photo.farmer_user_id,
          type: 'photo.verified',
          title: 'Foto Lahan Telah Diverifikasi',
          message: `Foto progres lahan "${photo.field_name}" telah diverifikasi oleh petugas (${req.user.nama}).`,
          data: { photo_id, field_id: photo.field_id, status: newStatus },
        });
      } else {
        await createNotification(client, {
          userId: photo.farmer_user_id,
          type: 'photo.rejected',
          title: 'Foto Lahan Ditolak',
          message: `Foto progres lahan "${photo.field_name}" ditolak oleh petugas. Alasan: ${note || 'Tidak memenuhi kriteria zero burning.'}`,
          data: { photo_id, field_id: photo.field_id, status: newStatus, reason: note || null },
        });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Verifikasi resmi dicatat',
        data: { ...updated.rows[0], status: updated.rows[0].verification_status },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

async function listCommunityPhotos(req, res, next) {
  const verifierId = req.user.farmerId;

  if (!verifierId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  try {
    const result = await pool.query(
      `SELECT fp.id, fp.photo_url, fp.created_at AS taken_at, fp.latitude, fp.longitude,
              fp.verification_status, fp.verification_status AS status,
              fp.community_recommendation, fp.verified_by_system,
              f.id AS field_id, f.name AS field_name,
              u.nama AS farmer_name,
              CAST(SUM(CASE WHEN cv.status = 'setuju' THEN 1 ELSE 0 END) AS INTEGER) AS setuju_count,
              CAST(SUM(CASE WHEN cv.status = 'tidak_setuju' THEN 1 ELSE 0 END) AS INTEGER) AS tidak_setuju_count
       FROM field_photos fp
       JOIN fields f ON f.id = fp.field_id
       JOIN farmers fa ON fa.id = f.id_farmer
       JOIN users u ON u.id = fa.id_user
       LEFT JOIN community_verifications cv ON cv.photo_id = fp.id
       WHERE f.id_farmer <> ?
         AND f.status = 'active'
         AND fp.verification_status = 'menunggu_verifikasi'
       GROUP BY fp.id, f.id, f.name, u.nama
       ORDER BY fp.created_at DESC
       LIMIT 50`,
      [verifierId]
    );
    const rows = await resolvePhotoUrls(result.rows);
    res.json({ success: true, data: rows, config: getVotingConfig() });
  } catch (err) {
    next(err);
  }
}

async function listPhotos(req, res, next) {
  const { status, prioritas } = req.query;
  const params = [];
  let filter = "WHERE f.status = 'active'";

  if (status && status !== 'semua') {
    if (!PHOTO_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status verifikasi tidak valid' });
    }
    params.push(status);
    filter += ' AND fp.verification_status = ?';
  }

  let orderBy = 'fp.created_at DESC';
  if (prioritas === 'warga' || prioritas === 'true') {
    orderBy = `CASE 
      WHEN fp.community_recommendation = 'rekomendasi_setuju' THEN 1
      WHEN fp.community_recommendation = 'perlu_ditinjau' THEN 2
      ELSE 3
    END ASC, fp.created_at DESC`;
  }

  try {
    const result = await pool.query(
      `SELECT fp.*, fp.created_at AS taken_at, fp.verification_status AS status,
              f.name AS field_name, f.id_farmer, u.nama AS farmer_name,
              CAST(SUM(CASE WHEN cv.status = 'setuju' THEN 1 ELSE 0 END) AS INTEGER) AS setuju_count,
              CAST(SUM(CASE WHEN cv.status = 'tidak_setuju' THEN 1 ELSE 0 END) AS INTEGER) AS tidak_setuju_count
       FROM field_photos fp
       JOIN fields f ON fp.field_id = f.id
       JOIN farmers fa ON f.id_farmer = fa.id
       JOIN users u ON fa.id_user = u.id
       LEFT JOIN community_verifications cv ON cv.photo_id = fp.id
       ${filter}
       GROUP BY fp.id, f.name, f.id_farmer, u.nama
       ORDER BY ${orderBy}
       LIMIT 100`,
      params
    );
    const rows = await resolvePhotoUrls(result.rows);
    res.json({ success: true, data: rows, config: getVotingConfig() });
  } catch (err) {
    next(err);
  }
}

async function listPending(req, res, next) {
  req.query.status = 'menunggu_verifikasi';
  return listPhotos(req, res, next);
}

module.exports = {
  communityVerify,
  officialVerify,
  listCommunityPhotos,
  listPhotos,
  listPending,
  getVotingConfig,
};
