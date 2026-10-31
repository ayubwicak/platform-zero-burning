const crypto = require('crypto');
const fs = require('fs');
const pool = require('../config/db');
const { recordAudit } = require('../utils/auditLog');
const { createNotification } = require('../utils/notificationService');
const {
  uploadFile,
  getPhotoUrl,
  resolvePhotoUrls,
  deleteFile,
  getStorageDriver,
} = require('../utils/storage');

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

    const { field_id, latitude, longitude } = req.body;
    const takenAt = req.body.taken_at ? new Date(req.body.taken_at) : new Date();
    if (Number.isNaN(takenAt.getTime())) {
      removeFile(file.path);
      return res.status(400).json({ error: 'Waktu pengambilan foto tidak valid' });
    }

    const fileBuffer = fs.readFileSync(file.path);
    // Verifikasi magic bytes gambar (JPEG, PNG, WebP)
    const isJpeg = fileBuffer.length >= 3 && fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8 && fileBuffer[2] === 0xFF;
    const isPng = fileBuffer.length >= 8 && fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4E && fileBuffer[3] === 0x47;
    const isRiffWebp = fileBuffer.length >= 12 &&
      fileBuffer.toString('ascii', 0, 4) === 'RIFF' &&
      fileBuffer.toString('ascii', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isRiffWebp) {
      removeFile(file.path);
      return res.status(400).json({ error: 'File bukan gambar valid (JPEG, PNG, atau WebP)' });
    }

    const photoHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const duplicate = await pool.query(
      'SELECT id FROM field_photos WHERE field_id = ? AND photo_hash = ? LIMIT 1',
      [field_id, photoHash]
    );
    if (duplicate.rows.length > 0) {
      removeFile(file.path);
      return res.status(409).json({ error: 'Foto ini sudah pernah diunggah untuk lahan tersebut' });
    }

    const objectKey = `photos/${file.filename}`;
    let storedKey = null;

    try {
      const uploadRes = await uploadFile({
        key: objectKey,
        filePath: file.path,
        contentType: file.mimetype,
      });
      storedKey = uploadRes.key;
    } catch (storageErr) {
      console.error('Storage upload error:', storageErr);
      removeFile(file.path);
      return res.status(500).json({ error: 'Gagal menyimpan foto ke storage' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO field_photos
           (field_id, photo_url, latitude, longitude, distance_from_center,
            photo_hash, verification_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'menunggu_verifikasi', ?)`,
        [
          field_id,
          storedKey,
          latitude,
          longitude,
          req.geofencingDistance ?? 0,
          photoHash,
          takenAt.toISOString(),
        ]
      );

      const inserted = await client.query(
        'SELECT *, created_at AS taken_at FROM field_photos WHERE id = ?',
        [result.rows[0].id]
      );
      const photo = inserted.rows[0];

      await recordAudit(client, {
        actor: req.user,
        action: 'upload',
        entityType: 'photo',
        entityId: photo.id,
        summary: `Petani mengunggah foto untuk lahan (field_id: ${field_id})`,
        metadata: { field_id, photo_url: storedKey, photo_hash: photoHash },
      });

      // Notifikasi ke petugas dan admin bahwa ada foto baru yang menunggu verifikasi
      const staffUsers = await client.query(
        `SELECT id FROM users WHERE role IN ('petugas', 'admin') AND is_active = 1 LIMIT 20`
      );
      for (const staff of staffUsers.rows) {
        await createNotification(client, {
          userId: staff.id,
          type: 'photo.submitted',
          title: 'Foto Lahan Baru',
          message: `${req.user.nama} mengunggah foto progres baru (Lahan #${field_id}) yang menunggu verifikasi.`,
          data: { photo_id: photo.id, field_id: Number(field_id) },
        }).catch(() => {});
      }

      await client.query('COMMIT');

      const viewableUrl = await getPhotoUrl(photo.photo_url);

      res.status(201).json({
        success: true,
        data: {
          ...photo,
          photo_url: viewableUrl,
          status: photo.verification_status,
          geofencing_valid: true,
          distance: req.geofencingDistance,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      // Kompensasi: hapus objek storage jika transaksi DB gagal
      if (storedKey) {
        await deleteFile(storedKey).catch(() => {});
      }
      throw err;
    } finally {
      client.release();
      if (getStorageDriver() === 's3') {
        removeFile(file.path);
      }
    }
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
    filter = ' AND f.id = ?';
  }

  try {
    const result = await pool.query(
      `SELECT fp.*, fp.created_at AS taken_at, fp.verification_status AS status,
              f.name AS field_name
       FROM field_photos fp
       JOIN fields f ON fp.field_id = f.id
       WHERE f.id_farmer = ?${filter}
       ORDER BY fp.created_at DESC
       LIMIT 30`,
      params
    );
    const rows = await resolvePhotoUrls(result.rows);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadPhoto, listMyPhotos };
