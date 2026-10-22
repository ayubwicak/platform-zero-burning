const pool = require('../config/db');

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function listFields(req, res, next) {
  const farmerId = req.user.farmerId;
  if (!farmerId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  try {
    const result = await pool.query(
      `SELECT f.*,
              COUNT(fp.id)::int AS photo_count,
              COUNT(fp.id) FILTER (WHERE fp.status = 'terverifikasi')::int AS verified_photo_count,
              MAX(fp.created_at) AS last_photo_at
       FROM fields f
       LEFT JOIN field_photos fp ON fp.field_id = f.id
       WHERE f.farmer_id = $1 AND f.is_active = TRUE
       GROUP BY f.id
       ORDER BY f.created_at DESC`,
      [farmerId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createField(req, res, next) {
  const farmerId = req.user.farmerId;
  if (!farmerId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const cropType = typeof req.body.crop_type === 'string' ? req.body.crop_type.trim() : '';
  const area = toNumber(req.body.area);
  const latitude = toNumber(req.body.latitude);
  const longitude = toNumber(req.body.longitude);

  if (!name) {
    return res.status(400).json({ error: 'Nama lahan wajib diisi' });
  }
  if (area === null || area <= 0) {
    return res.status(400).json({ error: 'Luas lahan harus berupa angka lebih dari 0' });
  }
  if (!cropType) {
    return res.status(400).json({ error: 'Jenis tanaman wajib diisi' });
  }
  if (latitude === null || latitude < -90 || latitude > 90) {
    return res.status(400).json({ error: 'Latitude tidak valid' });
  }
  if (longitude === null || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Longitude tidak valid' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO fields (farmer_id, name, area, crop_type, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [farmerId, name, area, cropType, latitude, longitude]
    );

    res.status(201).json({
      success: true,
      data: { ...result.rows[0], photo_count: 0, verified_photo_count: 0 },
    });
  } catch (err) {
    next(err);
  }
}

async function getField(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID lahan tidak valid' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM fields WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lahan tidak ditemukan' });
    }

    const field = result.rows[0];
    if (req.user.role === 'petani' && field.farmer_id !== req.user.farmerId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke lahan ini' });
    }

    res.json({ success: true, data: field });
  } catch (err) {
    next(err);
  }
}

module.exports = { listFields, createField, getField };
