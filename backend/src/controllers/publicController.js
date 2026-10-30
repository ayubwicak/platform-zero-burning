const pool = require('../config/db');

let cachedStats = null;
let lastCachedTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 menit

function clearStatsCache() {
  cachedStats = null;
  lastCachedTime = 0;
}

async function getPublicStats(req, res, next) {
  try {
    const isTest = process.env.NODE_ENV === 'test';
    const now = Date.now();

    // Gunakan in-memory cache jika masih valid (dilewati saat test bila query bypass aktif)
    if (!isTest && cachedStats && now - lastCachedTime < CACHE_DURATION_MS) {
      res.set('Cache-Control', 'public, max-age=300');
      return res.json({ success: true, data: cachedStats, cached: true });
    }

    const query = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'petani' AND (is_active = 1 OR is_active = TRUE)) AS total_farmers,
        (SELECT COUNT(*) FROM fields WHERE status = 'active') AS total_fields,
        (SELECT COUNT(*) FROM fields f
          WHERE f.status = 'active'
            AND EXISTS (
              SELECT 1 FROM field_photos fp
              WHERE fp.field_id = f.id AND fp.verification_status = 'terverifikasi'
            )) AS verified_fields,
        COALESCE((
          SELECT ROUND(SUM(f.area), 2) FROM fields f
          WHERE f.status = 'active'
            AND EXISTS (
              SELECT 1 FROM field_photos fp
              WHERE fp.field_id = f.id AND fp.verification_status = 'terverifikasi'
            )
        ), 0) AS verified_area_ha,
        (SELECT COUNT(*) FROM incentive_distributions) AS distributed_incentives
    `;

    const result = await pool.query(query);
    const row = result.rows[0] || {};

    const stats = {
      total_farmers: Number(row.total_farmers) || 0,
      total_fields: Number(row.total_fields) || 0,
      verified_fields: Number(row.verified_fields) || 0,
      verified_area_ha: Number(row.verified_area_ha) || 0,
      distributed_incentives: Number(row.distributed_incentives) || 0,
    };

    cachedStats = stats;
    lastCachedTime = now;

    res.set('Cache-Control', 'public, max-age=300');
    return res.json({ success: true, data: stats });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPublicStats,
  clearStatsCache,
};
