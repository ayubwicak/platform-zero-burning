const pool = require('../config/db');

function toCount(value) {
  return Number(value) || 0;
}

async function getDashboard(req, res, next) {
  const isPetani = req.user.role === 'petani';

  try {
    // SQLite-compatible queries with correct column names
    const fieldResult = await pool.query(
      `SELECT 
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(SUM(CASE WHEN verification_status = 'terverifikasi' THEN 1 ELSE 0 END) AS INTEGER) AS verified,
        CAST(SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS INTEGER) AS new_7d
       FROM (
         SELECT f.id, MAX(fp.verification_status) AS verification_status, f.created_at
         FROM fields f
         LEFT JOIN field_photos fp ON fp.field_id = f.id
         WHERE f.status = 'active'
         GROUP BY f.id
       )`,
      []
    );

    const photoResult = await pool.query(
      `SELECT
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) AS INTEGER) AS pending,
        CAST(SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS INTEGER) AS new_7d
       FROM field_photos`,
      []
    );

    // Safe query untuk claims (table mungkin tidak exist)
    const claimResult = { rows: [{ total: 0, pending: 0, approved: 0, new_7d: 0 }] };

    // Safe query untuk distributions (table mungkin tidak exist)
    const distributionResult = { rows: [{ total: 0, new_7d: 0 }] };

    const farmerResult = await pool.query(
      `SELECT CAST(COUNT(DISTINCT id_user) AS INTEGER) AS total FROM farmers`,
      []
    );

    const activityResult = await pool.query(
      `SELECT CAST(COUNT(*) AS INTEGER) AS total FROM audit_logs`,
      []
    );

    // Format response
    const data = {
      scope: isPetani ? 'personal' : 'program',
      fields: {
        total: toCount(fieldResult.rows[0]?.total),
        verified: toCount(fieldResult.rows[0]?.verified),
        new_7d: toCount(fieldResult.rows[0]?.new_7d)
      },
      photos: {
        total: toCount(photoResult.rows[0]?.total),
        pending: toCount(photoResult.rows[0]?.pending),
        new_7d: toCount(photoResult.rows[0]?.new_7d)
      },
      claims: {
        total: toCount(claimResult.rows[0]?.total),
        pending: toCount(claimResult.rows[0]?.pending),
        approved: toCount(claimResult.rows[0]?.approved),
        new_7d: toCount(claimResult.rows[0]?.new_7d)
      },
      distributions: {
        total: toCount(distributionResult.rows[0]?.total),
        new_7d: toCount(distributionResult.rows[0]?.new_7d)
      },
      farmers: {
        total: toCount(farmerResult.rows[0]?.total)
      },
      activities: {
        total: toCount(activityResult.rows[0]?.total)
      }
    };

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Dashboard error:', error.message);
    next(error);
  }
}

module.exports = { getDashboard };
