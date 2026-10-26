const pool = require('../config/db');
const { recordAudit } = require('../utils/auditLog');

const PHOTO_STATUSES = ['menunggu_verifikasi', 'terverifikasi', 'ditolak'];
const COMMUNITY_STATUSES = ['setuju', 'tidak_setuju'];
const OFFICIAL_STATUSES = ['lolos', 'tidak_lolos'];

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
    const photo = await pool.query(
      `SELECT fp.id
       FROM field_photos fp
       JOIN fields f ON fp.field_id = f.id
       WHERE fp.id = ? AND f.id_farmer <> ? AND f.status = 'active'`,
      [photo_id, verifierId]
    );
    if (photo.rows.length === 0) {
      return res.status(404).json({ error: 'Foto tidak ditemukan atau merupakan foto lahan Anda sendiri' });
    }

    const existing = await pool.query(
      `SELECT id FROM community_verifications WHERE photo_id = ? AND verifier_id = ?`,
      [photo_id, verifierId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE community_verifications SET status = ?, note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE photo_id = ? AND verifier_id = ?`,
        [status, note || null, photo_id, verifierId]
      );
    } else {
      await pool.query(
        `INSERT INTO community_verifications (photo_id, verifier_id, status, note)
         VALUES (?, ?, ?, ?)`,
        [photo_id, verifierId, status, note || null]
      );
    }

    const count = await pool.query(
      `SELECT CAST(COUNT(*) AS INTEGER) as count FROM community_verifications WHERE photo_id = ? AND status = 'setuju'`,
      [photo_id]
    );

    await recordAudit(pool, {
      actor: req.user,
      action: 'verify_community',
      entityType: 'photo',
      entityId: photo_id,
      summary: `Petani memberikan verifikasi komunitas: ${status}`,
      metadata: { photo_id, status, note },
    });

    res.json({ success: true, setujuCount: parseInt(count.rows[0].count, 10) });
  } catch (err) {
    next(err);
  }
}

async function officialVerify(req, res, next) {
  const { photo_id, status, note } = req.body;
  const officerId = req.user.officerId || null;

  if (!photo_id || !OFFICIAL_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'photo_id dan status (lolos/tidak_lolos) wajib diisi' });
  }

  try {
    const photo = await pool.query(
      `SELECT fp.id
       FROM field_photos fp
       JOIN fields f ON fp.field_id = f.id
       WHERE fp.id = ? AND f.status = 'active'`,
      [photo_id]
    );
    if (photo.rows.length === 0) {
      return res.status(404).json({ error: 'Foto tidak ditemukan' });
    }

    const existing = await pool.query(
      `SELECT id FROM official_verifications WHERE photo_id = ?`,
      [photo_id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE official_verifications SET officer_id = ?, status = ?, note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE photo_id = ?`,
        [officerId, status, note || null, photo_id]
      );
    } else {
      await pool.query(
        `INSERT INTO official_verifications (photo_id, officer_id, status, note)
         VALUES (?, ?, ?, ?)`,
        [photo_id, officerId, status, note || null]
      );
    }

    const newStatus = status === 'lolos' ? 'terverifikasi' : 'ditolak';
    await pool.query(
      'UPDATE field_photos SET verification_status = ? WHERE id = ?',
      [newStatus, photo_id]
    );

    const updated = await pool.query(
      'SELECT * FROM field_photos WHERE id = ?',
      [photo_id]
    );

    await recordAudit(pool, {
      actor: req.user,
      action: 'verify_official',
      entityType: 'photo',
      entityId: photo_id,
      summary: `Petugas/Admin melakukan verifikasi resmi foto: ${status} → status foto: ${newStatus}`,
      metadata: { photo_id, status, note, photo_status: newStatus },
    });

    res.json({
      success: true,
      message: 'Verifikasi resmi dicatat',
      data: { ...updated.rows[0], status: updated.rows[0].verification_status },
    });
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
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function listPhotos(req, res, next) {
  const { status } = req.query;
  const params = [];
  let filter = 'WHERE f.status = \'active\'';

  if (status && status !== 'semua') {
    if (!PHOTO_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status verifikasi tidak valid' });
    }
    params.push(status);
    filter += ' AND fp.verification_status = ?';
  }

  try {
    const result = await pool.query(
      `SELECT fp.*, fp.created_at AS taken_at, fp.verification_status AS status,
              f.name AS field_name, f.id_farmer, u.nama AS farmer_name
       FROM field_photos fp
       JOIN fields f ON fp.field_id = f.id
       JOIN farmers fa ON f.id_farmer = fa.id
       JOIN users u ON fa.id_user = u.id
       ${filter}
       ORDER BY fp.created_at DESC
       LIMIT 100`,
      params
    );
    res.json({ success: true, data: result.rows });
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
};
