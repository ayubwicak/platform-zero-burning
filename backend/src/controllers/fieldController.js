const pool = require('../config/db');
const { recordAudit } = require('../utils/auditLog');

function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function ensureFarmerId(req) {
  if (req.user.role !== 'petani') return null;
  if (req.user.farmerId) return req.user.farmerId;

  try {
    const check = await pool.query('SELECT id FROM farmers WHERE id_user = ?', [req.user.id]);
    if (check.rows.length > 0) {
      req.user.farmerId = check.rows[0].id;
      return req.user.farmerId;
    }

    const userCheck = await pool.query('SELECT nik, phone, address FROM users WHERE id = ?', [req.user.id]);
    const u = userCheck.rows[0] || {};
    const ins = await pool.query(
      'INSERT INTO farmers (id_user, nik, phone, address) VALUES (?, ?, ?, ?)',
      [req.user.id, u.nik || '0000000000000000', u.phone || null, u.address || null]
    );
    req.user.farmerId = ins.rows[0].id;
    return req.user.farmerId;
  } catch (err) {
    console.error('Error ensuring farmer profile:', err.message);
    return null;
  }
}

async function listFields(req, res, next) {
  const isFarmer = req.user.role === 'petani';
  let farmerId = null;

  if (isFarmer) {
    farmerId = await ensureFarmerId(req);
  }

  const params = [];
  let scope = '';
  if (isFarmer) {
    if (farmerId) {
      scope = 'AND (f.id_farmer = ? OR (f.id_farmer IS NULL AND f.id_user = ?))';
      params.push(farmerId, req.user.id);
    } else {
      scope = 'AND f.id_user = ?';
      params.push(req.user.id);
    }
  }

  try {
    const result = await pool.query(
      `SELECT f.*,
              COALESCE(u.nama, '') AS owner_name,
              COALESCE(fa.phone, u.phone, '') AS owner_phone,
              (SELECT fp2.verification_status
                 FROM field_photos fp2
                WHERE fp2.field_id = f.id
                ORDER BY fp2.created_at DESC, fp2.id DESC
                LIMIT 1) AS latest_photo_status,
              COUNT(fp.id) AS photo_count,
              SUM(CASE WHEN fp.verification_status = 'terverifikasi' THEN 1 ELSE 0 END) AS verified_photo_count,
              SUM(CASE WHEN fp.verification_status = 'menunggu_verifikasi' THEN 1 ELSE 0 END) AS pending_photo_count,
              SUM(CASE WHEN fp.verification_status = 'ditolak' THEN 1 ELSE 0 END) AS rejected_photo_count,
              MAX(fp.created_at) AS last_photo_at
       FROM fields f
       LEFT JOIN farmers fa ON fa.id = f.id_farmer
       LEFT JOIN users u ON u.id = COALESCE(fa.id_user, f.id_user)
       LEFT JOIN field_photos fp ON fp.field_id = f.id
       WHERE f.status = 'active' ${scope}
       GROUP BY f.id
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
  const farmerId = await ensureFarmerId(req);
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
      `INSERT INTO fields
         (id_user, id_farmer, name, area, category, crop_type, latitude, longitude, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        req.user.id,
        farmerId,
        name,
        area,
        cropType,
        cropType,
        latitude,
        longitude,
        req.body.address || '',
      ]
    );

    const inserted = await pool.query('SELECT * FROM fields WHERE id = ?', [result.rows[0].id]);
    const field = inserted.rows[0];

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
      "SELECT * FROM fields WHERE id = ? AND status = 'active'",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lahan tidak ditemukan' });
    }

    const field = result.rows[0];
    if (req.user.role === 'petani') {
      const farmerId = await ensureFarmerId(req);
      if (field.id_farmer !== farmerId && field.id_user !== req.user.id) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke lahan ini' });
      }
    }

    res.json({ success: true, data: field });
  } catch (err) {
    next(err);
  }
}

async function updateField(req, res, next) {
  const id = Number(req.params.id);
  const farmerId = await ensureFarmerId(req);

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
      "SELECT id FROM fields WHERE id = ? AND (id_farmer = ? OR (id_farmer IS NULL AND id_user = ?)) AND status = 'active'",
      [id, farmerId, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Lahan tidak ditemukan' });
    }

    await pool.query(
      `UPDATE fields
       SET name = ?, area = ?, category = ?, crop_type = ?, latitude = ?, longitude = ?,
           id_farmer = COALESCE(id_farmer, ?),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'active'`,
      [name, area, cropType, cropType, latitude, longitude, farmerId, id]
    );

    const updated = await pool.query('SELECT * FROM fields WHERE id = ?', [id]);
    const field = updated.rows[0];

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
  const farmerId = await ensureFarmerId(req);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID lahan tidak valid' });
  }
  if (!farmerId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM fields WHERE id = ? AND (id_farmer = ? OR (id_farmer IS NULL AND id_user = ?)) AND status = 'active'",
      [id, farmerId, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Lahan tidak ditemukan' });
    }

    const pendingClaim = await pool.query(
      `SELECT id FROM incentive_claims
       WHERE field_id = ? AND status = 'diajukan'
       LIMIT 1`,
      [id]
    );
    if (pendingClaim.rows.length > 0) {
      return res.status(409).json({
        error: 'Lahan masih memiliki klaim yang menunggu distribusi. Selesaikan klaim terlebih dahulu.',
      });
    }

    await pool.query(
      "UPDATE fields SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
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
