const pool = require('../config/db');

function toCount(value) {
  return Number(value) || 0;
}

const SUMMARY_SQL = `
  SELECT
    (SELECT COUNT(*) FROM fields WHERE status = 'active') AS total_fields,
    (SELECT COUNT(*) FROM fields f
      WHERE f.status = 'active'
        AND EXISTS (
          SELECT 1 FROM field_photos fp
          WHERE fp.field_id = f.id AND fp.verification_status = 'terverifikasi'
        )) AS verified_fields,
    (SELECT COUNT(*) FROM field_photos) AS total_photos,
    (SELECT COUNT(*) FROM field_photos WHERE verification_status = 'terverifikasi') AS verified_photos,
    (SELECT COUNT(*) FROM incentive_claims) AS total_claims,
    (SELECT COUNT(*) FROM incentive_claims WHERE status = 'disetujui') AS approved_claims,
    (SELECT COUNT(*) FROM incentive_distributions) AS total_distributions,
    (SELECT COUNT(*) FROM farmers) AS total_farmers,
    (SELECT COUNT(*) FROM users WHERE role = 'petani') AS total_petani_users,
    (SELECT COUNT(*) FROM users WHERE role = 'petugas') AS total_petugas_users
`;

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
      pool.query(SUMMARY_SQL),
      // Fields by latest photo status
      pool.query(`
        SELECT
          COALESCE((
            SELECT fp.verification_status
            FROM field_photos fp
            WHERE fp.field_id = f.id
            ORDER BY fp.created_at DESC, fp.id DESC
            LIMIT 1
          ), 'belum_ada_foto') AS status,
          COUNT(*) AS count
        FROM fields f
        WHERE f.status = 'active'
        GROUP BY COALESCE((
          SELECT fp.verification_status
          FROM field_photos fp
          WHERE fp.field_id = f.id
          ORDER BY fp.created_at DESC, fp.id DESC
          LIMIT 1
        ), 'belum_ada_foto')
      `),
      // Top farmers by approved claims
      pool.query(`
        SELECT
          fa.id,
          u.nama,
          u.email,
          SUM(CASE WHEN c.status = 'disetujui' THEN 1 ELSE 0 END) AS approved_claims,
          COUNT(c.id) AS total_claims
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
          COUNT(d.id) AS total_distributed,
          ic.quantity - COUNT(d.id) AS remaining_stock
        FROM incentive_categories ic
        LEFT JOIN incentive_distributions d ON d.category_id = ic.id
        GROUP BY ic.id, ic.name, ic.quantity
      `),
      // Monthly trend (last 12 months)
      pool.query(`
        SELECT
          strftime('%Y-%m', c.claim_date) AS month,
          'claims' AS type,
          COUNT(c.id) AS count
        FROM incentive_claims c
        WHERE c.claim_date >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', c.claim_date)

        UNION ALL

        SELECT
          strftime('%Y-%m', d.distribution_date) AS month,
          'distributions' AS type,
          COUNT(d.id) AS count
        FROM incentive_distributions d
        WHERE d.distribution_date >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', d.distribution_date)

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
    const result = await pool.query(SUMMARY_SQL);

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
