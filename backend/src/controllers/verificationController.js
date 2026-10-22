const pool = require('../config/db');

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
       WHERE fp.id = $1 AND f.farmer_id <> $2`,
      [photo_id, verifierId]
    );
    if (photo.rows.length === 0) {
      return res.status(404).json({ error: 'Foto tidak ditemukan atau merupakan foto lahan Anda sendiri' });
    }

    await pool.query(
      `INSERT INTO community_verifications (photo_id, verifier_id, status, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (photo_id, verifier_id) DO UPDATE
         SET status = EXCLUDED.status, note = EXCLUDED.note, verified_at = CURRENT_TIMESTAMP`,
      [photo_id, verifierId, status, note || null]
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM community_verifications WHERE photo_id = $1 AND status = 'setuju'`,
      [photo_id]
    );

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
    const photo = await pool.query('SELECT id FROM field_photos WHERE id = $1', [photo_id]);
    if (photo.rows.length === 0) {
      return res.status(404).json({ error: 'Foto tidak ditemukan' });
    }

    await pool.query(
      `INSERT INTO official_verifications (photo_id, officer_id, status, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (photo_id) DO UPDATE
         SET officer_id = EXCLUDED.officer_id,
             status = EXCLUDED.status,
             note = EXCLUDED.note,
             verified_at = CURRENT_TIMESTAMP`,
      [photo_id, officerId, status, note || null]
    );

    const newStatus = status === 'lolos' ? 'terverifikasi' : 'ditolak';
    const updated = await pool.query(
      'UPDATE field_photos SET status = $1 WHERE id = $2 RETURNING *',
      [newStatus, photo_id]
    );

    res.json({
      success: true,
      message: 'Verifikasi resmi dicatat',
      data: updated.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

async function listPhotos(req, res, next) {
  const { status } = req.query;
  const params = [];
  let filter = '';

  if (status && status !== 'semua') {
    if (!PHOTO_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status verifikasi tidak valid' });
    }
    params.push(status);
    filter = 'WHERE fp.status = $1';
  }

  try {
    const result = await pool.query(
      `SELECT fp.*, f.name AS field_name, f.farmer_id, u.nama AS farmer_name
       FROM field_photos fp
       JOIN fields f ON fp.field_id = f.id
       JOIN farmers fa ON f.farmer_id = fa.id
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

module.exports = { communityVerify, officialVerify, listPhotos, listPending };
