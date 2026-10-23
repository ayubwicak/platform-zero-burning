const pool = require('../config/db');
const { recordAudit } = require('../utils/auditLog');

function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function listFields(req, res, next) {
  const isFarmer = req.user.role === 'petani';
  const farmerId = req.user.farmerId;

  if (isFarmer && !farmerId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  const params = [];
  let scope = '';
  if (isFarmer) {
    scope = 'AND f.farmer_id = $1';
    params.push(farmerId);
  }

  try {
    const result = await pool.query(
      `SELECT f.*,
              u.nama AS owner_name,
              fa.phone AS owner_phone,
              latest.status AS latest_photo_status,
              COUNT(fp.id)::int AS photo_count,
              COUNT(fp.id) FILTER (WHERE fp.status = 'terverifikasi')::int AS verified_photo_count,
              COUNT(fp.id) FILTER (WHERE fp.status = 'menunggu_verifikasi')::int AS pending_photo_count,
              COUNT(fp.id) FILTER (WHERE fp.status = 'ditolak')::int AS rejected_photo_count,
              MAX(fp.created_at) AS last_photo_at
       FROM fields f
       JOIN farmers fa ON fa.id = f.farmer_id
       JOIN users u ON u.id = fa.id_user
       LEFT JOIN field_photos fp ON fp.field_id = f.id
       LEFT JOIN LATERAL (
         SELECT fp2.status
         FROM field_photos fp2
         WHERE fp2.field_id = f.id
         ORDER BY fp2.created_at DESC, fp2.id DESC
         LIMIT 1
       ) latest ON TRUE
       WHERE f.is_active = TRUE ${scope}
       GROUP BY f.id, u.nama, fa.phone, latest.status
       ORDER BY f.created_at DESC, f.id DESC`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

function parseFieldInput(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const cropType = typeof body.crop_type === 'string' ? body.crop_type.trim() : '';
  const area = toNumber(body.area);
  const latitude = toNumber(body.latitude);
  const longitude = toNumber(body.longitude);

  if (!name) {
    return { error: 'Nama lahan wajib diisi' };
  }
  if (name.length > 100) {
    return { error: 'Nama lahan maksimal 100 karakter' };
  }
  if (area === null || area <= 0) {
    return { error: 'Luas lahan harus berupa angka lebih dari 0' };
  }
  if (!cropType) {
    return { error: 'Jenis tanaman wajib diisi' };
  }
  if (cropType.length > 50) {
    return { error: 'Jenis tanaman maksimal 50 karakter' };
  }
  if (latitude === null || latitude < -90 || latitude > 90) {
    return { error: 'Latitude tidak valid' };
  }
  if (longitude === null || longitude < -180 || longitude > 180) {
    return { error: 'Longitude tidak valid' };
  }

  return { value: { name, cropType, area, latitude, longitude } };
}

async function createField(req, res, next) {
  const farmerId = req.user.farmerId;
  if (!farmerId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  const parsed = parseFieldInput(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  const { name, cropType, area, latitude, longitude } = parsed.value;

  try {
    const result = await pool.query(
      `INSERT INTO fields (farmer_id, name, area, crop_type, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [farmerId, name, area, cropType, latitude, longitude]
    );

    const field = result.rows[0];

    await recordAudit(pool, {
      actor: req.user,
      action: 'create',
      entityType: 'field',
      entityId: field.id,
      summary: `Petani membuat lahan baru "${name}"`,
      metadata: { name, area, cropType, latitude, longitude },
    });

    res.status(201).json({
      success: true,
      data: { ...field, photo_count: 0, verified_photo_count: 0 },
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

async function updateField(req, res, next) {
  const id = Number(req.params.id);
  const farmerId = req.user.farmerId;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID lahan tidak valid' });
  }
  if (!farmerId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  const parsed = parseFieldInput(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  const { name, cropType, area, latitude, longitude } = parsed.value;

  try {
    const existing = await pool.query(
      'SELECT id FROM fields WHERE id = $1 AND farmer_id = $2 AND is_active = TRUE',
      [id, farmerId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Lahan tidak ditemukan' });
    }

    const result = await pool.query(
      `UPDATE fields
       SET name = $1, area = $2, crop_type = $3, latitude = $4, longitude = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND farmer_id = $7 AND is_active = TRUE
       RETURNING *`,
      [name, area, cropType, latitude, longitude, id, farmerId]
    );

    const field = result.rows[0];

    await recordAudit(pool, {
      actor: req.user,
      action: 'update',
      entityType: 'field',
      entityId: id,
      summary: `Petani mengubah lahan "${name}"`,
      metadata: { name, area, cropType, latitude, longitude },
    });

    res.json({ success: true, data: field });
  } catch (err) {
    next(err);
  }
}

async function deleteField(req, res, next) {
  const id = Number(req.params.id);
  const farmerId = req.user.farmerId;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID lahan tidak valid' });
  }
  if (!farmerId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM fields WHERE id = $1 AND farmer_id = $2 AND is_active = TRUE',
      [id, farmerId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Lahan tidak ditemukan' });
    }

    const pendingClaim = await pool.query(
      `SELECT id FROM incentive_claims
       WHERE field_id = $1 AND status = 'diajukan'
       LIMIT 1`,
      [id]
    );
    if (pendingClaim.rows.length > 0) {
      return res.status(409).json({
        error: 'Lahan masih memiliki klaim yang menunggu distribusi. Selesaikan klaim terlebih dahulu.',
      });
    }

    await pool.query(
      'UPDATE fields SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    await recordAudit(pool, {
      actor: req.user,
      action: 'delete',
      entityType: 'field',
      entityId: id,
      summary: `Petani menghapus lahan (soft delete)`,
      metadata: { field_id: id },
    });

    res.json({ success: true, message: 'Lahan berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listFields, createField, getField, updateField, deleteField };
