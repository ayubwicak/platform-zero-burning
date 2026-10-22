const fs = require('fs');
const pool = require('../config/db');

function cleanupUpload(req) {
  if (req.file?.path) {
    fs.unlink(req.file.path, () => {});
  }
}

async function validateGeofencing(req, res, next) {
  const fieldId = Number(req.body.field_id);
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);

  if (!Number.isInteger(fieldId) || fieldId <= 0 || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    cleanupUpload(req);
    return res.status(400).json({ error: 'field_id, latitude, dan longitude diperlukan' });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    cleanupUpload(req);
    return res.status(400).json({ error: 'Koordinat GPS tidak valid' });
  }

  const farmerId = req.user.farmerId;
  if (!farmerId) {
    cleanupUpload(req);
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  try {
    const fieldResult = await pool.query(
      'SELECT latitude, longitude FROM fields WHERE id = $1 AND farmer_id = $2 AND is_active = TRUE',
      [fieldId, farmerId]
    );

    if (fieldResult.rows.length === 0) {
      cleanupUpload(req);
      return res.status(404).json({ error: 'Lahan tidak ditemukan' });
    }

    const centerLat = Number(fieldResult.rows[0].latitude);
    const centerLng = Number(fieldResult.rows[0].longitude);

    const R = 6371000;
    const dLat = ((latitude - centerLat) * Math.PI) / 180;
    const dLng = ((longitude - centerLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((centerLat * Math.PI) / 180) *
        Math.cos((latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance > 50) {
      cleanupUpload(req);
      return res.status(400).json({
        error: 'Foto diambil di luar radius lahan terdaftar (maksimal 50 meter)',
        distance: Math.round(distance),
      });
    }

    req.geofencingDistance = Math.round(distance);
    next();
  } catch (err) {
    cleanupUpload(req);
    next(err);
  }
}

module.exports = { validateGeofencing };
