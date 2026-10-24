const pool = require('../config/db');

function toCount(value) {
  return Number(value) || 0;
}

async function getDashboard(req, res, next) {
  const isPetani = req.user.role === 'petani';
  const userId = req.user.id;

  try {
    // Query berdasarkan role
    let fieldQuery = `SELECT 
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(SUM(CASE WHEN verification_status = 'terverifikasi' THEN 1 ELSE 0 END) AS INTEGER) AS verified,
        CAST(SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS INTEGER) AS new_7d
       FROM (
         SELECT f.id, MAX(fp.verification_status) AS verification_status, f.created_at
         FROM fields f
         LEFT JOIN field_photos fp ON fp.field_id = f.id
         WHERE f.status = 'active'`;
    
    if (isPetani) {
      fieldQuery += ` AND f.id_farmer = (SELECT id FROM farmers WHERE id_user = ?)`;
    }
    
    fieldQuery += ` GROUP BY f.id)`;

    const fieldResult = await pool.query(fieldQuery, isPetani ? [userId] : []);

    let photoQuery = `SELECT
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(SUM(CASE WHEN verification_status IN ('pending', 'menunggu_verifikasi') THEN 1 ELSE 0 END) AS INTEGER) AS pending,
        CAST(SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS INTEGER) AS new_7d
       FROM field_photos`;
    
    if (isPetani) {
      photoQuery += ` WHERE field_id IN (SELECT f.id FROM fields f WHERE f.id_farmer = (SELECT id FROM farmers WHERE id_user = ?))`;
    }

    const photoResult = await pool.query(photoQuery, isPetani ? [userId] : []);

    // Query untuk claims dan distributions
    let claimQuery = `SELECT
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(SUM(CASE WHEN c.status = 'diajukan' THEN 1 ELSE 0 END) AS INTEGER) AS pending,
        CAST(SUM(CASE WHEN c.status = 'disetujui' THEN 1 ELSE 0 END) AS INTEGER) AS approved,
        CAST(SUM(CASE WHEN c.claim_date >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS INTEGER) AS new_7d
      FROM incentive_claims c`;
    let claimParams = [];
    if (isPetani) {
      claimQuery += ` JOIN farmers fa ON fa.id = c.farmer_id WHERE fa.id_user = ?`;
      claimParams = [userId];
    }
    const claimResult = await pool.query(claimQuery, claimParams);

    let distributionQuery = `SELECT
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(SUM(CASE WHEN d.distribution_date >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS INTEGER) AS new_7d
      FROM incentive_distributions d`;
    let distributionParams = [];
    if (isPetani) {
      distributionQuery += ` JOIN farmers fa ON fa.id = d.farmer_id WHERE fa.id_user = ?`;
      distributionParams = [userId];
    }
    const distributionResult = await pool.query(distributionQuery, distributionParams);

    const farmerResult = await pool.query(
      `SELECT CAST(COUNT(DISTINCT id_user) AS INTEGER) AS total FROM farmers`,
      []
    );

    // Get recent activities (maksimal 10 aktivitas terakhir)
    let activityQuery = `SELECT 
        al.id,
        al.action,
        al.entity,
        al.entity_id,
        al.created_at,
        u.nama as actor_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_id
      WHERE al.action NOT LIKE 'user.%'
        AND al.action NOT LIKE 'category.%'
      ORDER BY al.created_at DESC, al.id DESC
      LIMIT 10`;

    const activitiesResult = await pool.query(activityQuery, []);

    // Transform activities untuk frontend
    const activities = activitiesResult.rows.map(activity => {
      const action = String(activity.action || '').toLowerCase();
      const entity = String(activity.entity || '').toLowerCase();

      let type = 'field';
      let status = 'terdaftar';
      let target = 'Lahan Baru';

      if (entity === 'photo' || action.includes('upload') || action.includes('verify')) {
        type = 'photo';
        if (action === 'verify_official') {
          status = 'terverifikasi';
          target = 'Verifikasi Petugas';
        } else if (action === 'verify_community') {
          status = 'menunggu_verifikasi';
          target = 'Verifikasi Warga';
        } else {
          status = 'menunggu_verifikasi';
          target = 'Foto Lahan';
        }
      } else if (entity === 'claim' || action.startsWith('claim.')) {
        type = 'claim';
        status = 'diajukan';
        target = 'Klaim Insentif';
      } else if (entity === 'distribution' || action.startsWith('stock.')) {
        type = 'distribution';
        status = 'disalurkan';
        target = 'Distribusi Insentif';
      }

      return {
        id: activity.id,
        type: type,
        actor: activity.actor_name || 'Pengguna',
        target: target,
        status: status,
        occurred_at: activity.created_at
      };
    });

    // Calculate verification rate
    const fieldsTotal = toCount(fieldResult.rows[0]?.total);
    const fieldsVerified = toCount(fieldResult.rows[0]?.verified);
    const verificationRate = fieldsTotal > 0 ? Math.round((fieldsVerified / fieldsTotal) * 100) : 0;

    // Format response dengan struktur yang benar untuk frontend
    const data = {
      scope: isPetani ? 'personal' : 'program',
      metrics: {
        fields_total: fieldsTotal,
        fields_verified: fieldsVerified,
        fields_new_7d: toCount(fieldResult.rows[0]?.new_7d),
        photos_total: toCount(photoResult.rows[0]?.total),
        photos_pending: toCount(photoResult.rows[0]?.pending),
        claims_total: toCount(claimResult.rows[0]?.total),
        claims_pending: toCount(claimResult.rows[0]?.pending),
        claims_approved: toCount(claimResult.rows[0]?.approved),
        distributions_total: toCount(distributionResult.rows[0]?.total),
        distributions_new_7d: toCount(distributionResult.rows[0]?.new_7d),
        verification_rate: verificationRate,
        farmers_total: toCount(farmerResult.rows[0]?.total)
      },
      activities: activities
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
