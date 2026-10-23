const crypto = require('crypto');
const fs = require('fs');
const pool = require('../config/db');
const { recordAudit } = require('../utils/auditLog');

function removeFile(filePath) {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
}

async function uploadPhoto(req, res, next) {
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ error: 'File foto diperlukan' });
    }

    const farmerId = req.user.farmerId;
    if (!farmerId) {
      removeFile(file.path);
      return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
    }

    const { field_id, latitude, longitude, timestamp } = req.body;
    const takenAt = req.body.taken_at ? new Date(req.body.taken_at) : new Date();
    if (Number.isNaN(takenAt.getTime())) {
      removeFile(file.path);
      return res.status(400).json({ error: 'Waktu pengambilan foto tidak valid' });
    }

    const fileBuffer = fs.readFileSync(file.path);
    const photoHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const duplicate = await pool.query(
      'SELECT id FROM field_photos WHERE field_id = $1 AND photo_hash = $2 LIMIT 1',
      [field_id, photoHash]
    );
    if (duplicate.rows.length > 0) {
      removeFile(file.path);
      return res.status(409).json({ error: 'Foto ini sudah pernah diunggah untuk lahan tersebut' });
    }

    const photoUrl = `/uploads/${file.filename}`;
    const result = await pool.query(
      `INSERT INTO field_photos
         (field_id, photo_url, taken_at, latitude, longitude, timestamp, photo_hash, geofencing_valid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING *`,
      [field_id, photoUrl, takenAt, latitude, longitude, timestamp || null, photoHash]
    );

    const photo = result.rows[0];

    await recordAudit(pool, {
      actor: req.user,
      action: 'upload',
      entityType: 'photo',
      entityId: photo.id,
      summary: `Petani mengunggah foto untuk lahan (field_id: ${field_id})`,
      metadata: { field_id, photo_url: photoUrl, photo_hash: photoHash },
    });

    res.status(201).json({
      success: true,
      data: {
        ...photo,
        geofencing_valid: true,
        distance: req.geofencingDistance,
      },
    });
  } catch (err) {
    if (file) removeFile(file.path);
    next(err);
  }
}

async function listMyPhotos(req, res, next) {
  const farmerId = req.user.farmerId;
  if (!farmerId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  const { field_id } = req.query;
  const params = [farmerId];
  let filter = '';

  if (field_id !== undefined) {
    const fieldId = Number(field_id);
    if (!Number.isInteger(fieldId) || fieldId <= 0) {
      return res.status(400).json({ error: 'field_id tidak valid' });
    }
    params.push(fieldId);
    filter = ' AND f.id = $2';
  }

  try {
    const result = await pool.query(
      `SELECT fp.*, f.name AS field_name
       FROM field_photos fp
       JOIN fields f ON fp.field_id = f.id
       WHERE f.farmer_id = $1${filter}
       ORDER BY fp.created_at DESC
       LIMIT 30`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadPhoto, listMyPhotos };
