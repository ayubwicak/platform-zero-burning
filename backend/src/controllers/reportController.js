const pool = require('../config/db');

function toCount(value) {
  return Number(value) || 0;
}

async function getReport(req, res, next) {
  // Admin only
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin yang dapat mengakses laporan' });
  }

  try {
    const [
      summaryResult,
      fieldsByStatusResult,
      topFarmersResult,
      categoryDistributionResult,
      monthlyTrendResult,
    ] = await Promise.all([
      // Summary
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM fields WHERE is_active = TRUE)::int AS total_fields,
          (SELECT COUNT(*) FROM fields WHERE is_active = TRUE AND (SELECT COUNT(*) FROM field_photos WHERE field_id = fields.id AND status = 'terverifikasi') > 0)::int AS verified_fields,
          (SELECT COUNT(*) FROM field_photos)::int AS total_photos,
          (SELECT COUNT(*) FROM field_photos WHERE status = 'terverifikasi')::int AS verified_photos,
          (SELECT COUNT(*) FROM incentive_claims)::int AS total_claims,
          (SELECT COUNT(*) FROM incentive_claims WHERE status = 'disetujui')::int AS approved_claims,
          (SELECT COUNT(*) FROM incentive_distributions)::int AS total_distributions,
          (SELECT COUNT(*) FROM farmers)::int AS total_farmers,
          (SELECT COUNT(*) FROM users WHERE role = 'petani')::int AS total_petani_users,
          (SELECT COUNT(*) FROM users WHERE role = 'petugas')::int AS total_petugas_users
      `),
      // Fields by status
      pool.query(`
        WITH field_status AS (
          SELECT DISTINCT ON (field_id) field_id, status
          FROM field_photos
          ORDER BY field_id, created_at DESC, id DESC
        )
        SELECT
          COALESCE(fs.status, 'belum_ada_foto') AS status,
          COUNT(*)::int AS count
        FROM fields f
        LEFT JOIN field_status fs ON fs.field_id = f.id
        WHERE f.is_active = TRUE
        GROUP BY COALESCE(fs.status, 'belum_ada_foto')
      `),
      // Top farmers by approved claims
      pool.query(`
        SELECT
          fa.id,
          u.nama,
          u.email,
          COUNT(CASE WHEN c.status = 'disetujui' THEN 1 END)::int AS approved_claims,
          COUNT(c.id)::int AS total_claims
        FROM farmers fa
        JOIN users u ON u.id = fa.id_user
        LEFT JOIN incentive_claims c ON c.farmer_id = fa.id
        GROUP BY fa.id, u.nama, u.email
        ORDER BY approved_claims DESC
        LIMIT 10
      `),
      // Distribution by category
      pool.query(`
        SELECT
          ic.name AS category,
          COUNT(*)::int AS total_distributed,
          ic.quantity - COALESCE(SUM(1), 0)::int AS remaining_stock
        FROM incentive_categories ic
        LEFT JOIN incentive_distributions d ON d.category_id = ic.id
        GROUP BY ic.id, ic.name, ic.quantity
      `),
      // Monthly trend (last 12 months)
      pool.query(`
        SELECT
          DATE_TRUNC('month', COALESCE(c.claim_date, d.distribution_date, f.created_at))::date AS month,
          'claims' AS type,
          COUNT(c.id)::int AS count
        FROM incentive_claims c
        WHERE c.claim_date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', c.claim_date)
        
        UNION ALL
        
        SELECT
          DATE_TRUNC('month', d.distribution_date)::date AS month,
          'distributions' AS type,
          COUNT(d.id)::int AS count
        FROM incentive_distributions d
        WHERE d.distribution_date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', d.distribution_date)
        
        ORDER BY month DESC
      `),
    ]);

    const summary = summaryResult.rows[0] || {};
    const fieldsByStatus = fieldsByStatusResult.rows || [];
    const topFarmers = topFarmersResult.rows || [];
    const categoryDistribution = categoryDistributionResult.rows || [];
    const monthlyTrend = monthlyTrendResult.rows || [];

    res.json({
      success: true,
      data: {
        generated_at: new Date().toISOString(),
        summary: {
          total_fields: toCount(summary.total_fields),
          verified_fields: toCount(summary.verified_fields),
          verification_rate: summary.total_fields
            ? Math.round((summary.verified_fields / summary.total_fields) * 100)
            : 0,
          total_photos: toCount(summary.total_photos),
          verified_photos: toCount(summary.verified_photos),
          total_claims: toCount(summary.total_claims),
          approved_claims: toCount(summary.approved_claims),
          approval_rate: summary.total_claims
            ? Math.round((summary.approved_claims / summary.total_claims) * 100)
            : 0,
          total_distributions: toCount(summary.total_distributions),
          total_farmers: toCount(summary.total_farmers),
          total_petani_users: toCount(summary.total_petani_users),
          total_petugas_users: toCount(summary.total_petugas_users),
        },
        fields_by_status: fieldsByStatus,
        top_farmers: topFarmers,
        category_distribution: categoryDistribution,
        monthly_trend: monthlyTrend,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function exportReport(req, res, next) {
  // Admin only
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin yang dapat mengakses laporan' });
  }

  const { format = 'json' } = req.query;

  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM fields WHERE is_active = TRUE)::int AS total_fields,
        (SELECT COUNT(*) FROM fields WHERE is_active = TRUE AND (SELECT COUNT(*) FROM field_photos WHERE field_id = fields.id AND status = 'terverifikasi') > 0)::int AS verified_fields,
        (SELECT COUNT(*) FROM field_photos)::int AS total_photos,
        (SELECT COUNT(*) FROM field_photos WHERE status = 'terverifikasi')::int AS verified_photos,
        (SELECT COUNT(*) FROM incentive_claims)::int AS total_claims,
        (SELECT COUNT(*) FROM incentive_claims WHERE status = 'disetujui')::int AS approved_claims,
        (SELECT COUNT(*) FROM incentive_distributions)::int AS total_distributions,
        (SELECT COUNT(*) FROM farmers)::int AS total_farmers
    `);

    const data = result.rows[0] || {};
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csv = `Laporan Program Zero Burning,${timestamp}
Metrik,Jumlah
Total Lahan Aktif,${data.total_fields}
Lahan Terverifikasi,${data.verified_fields}
Total Foto,${data.total_photos}
Foto Terverifikasi,${data.verified_photos}
Total Klaim,${data.total_claims}
Klaim Disetujui,${data.approved_claims}
Total Distribusi,${data.total_distributions}
Total Petani,${data.total_farmers}`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="laporan-${timestamp}.csv"`
      );
      res.send(csv);
    } else {
      // JSON
      res.json({
        success: true,
        data: {
          generated_at: timestamp,
          summary: {
            total_fields: toCount(data.total_fields),
            verified_fields: toCount(data.verified_fields),
            total_photos: toCount(data.total_photos),
            verified_photos: toCount(data.verified_photos),
            total_claims: toCount(data.total_claims),
            approved_claims: toCount(data.approved_claims),
            total_distributions: toCount(data.total_distributions),
            total_farmers: toCount(data.total_farmers),
          },
        },
      });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReport,
  exportReport,
};
