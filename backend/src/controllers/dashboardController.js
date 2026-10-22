const pool = require('../config/db');

function toCount(value) {
  return Number(value) || 0;
}

async function getDashboard(req, res, next) {
  const isPetani = req.user.role === 'petani';
  const scope = isPetani ? 'personal' : 'program';
  const farmerId = req.user.farmerId;

  if (isPetani && !farmerId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  const params = isPetani ? [farmerId] : [];
  const farmerFilter = isPetani ? 'AND f.farmer_id = $1' : '';
  const claimFilter = isPetani ? 'WHERE c.farmer_id = $1' : '';

  try {
    const [
      fieldResult,
      photoResult,
      claimResult,
      distributionResult,
      farmerResult,
      activityResult,
    ] = await Promise.all([
      pool.query(
        `WITH latest_photo AS (
           SELECT DISTINCT ON (field_id) field_id, status
           FROM field_photos
           ORDER BY field_id, created_at DESC, id DESC
         )
         SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE lp.status = 'terverifikasi')::int AS verified,
           COUNT(*) FILTER (WHERE f.created_at >= NOW() - INTERVAL '7 days')::int AS new_7d
         FROM fields f
         LEFT JOIN latest_photo lp ON lp.field_id = f.id
         WHERE f.is_active = TRUE ${farmerFilter}`,
        params
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE fp.status = 'menunggu_verifikasi')::int AS pending,
           COUNT(*) FILTER (WHERE fp.created_at >= NOW() - INTERVAL '7 days')::int AS new_7d
         FROM field_photos fp
         JOIN fields f ON f.id = fp.field_id
         WHERE f.is_active = TRUE ${farmerFilter}`,
        params
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE c.status = 'diajukan')::int AS pending,
           COUNT(*) FILTER (WHERE c.status = 'disetujui')::int AS approved,
           COUNT(*) FILTER (WHERE c.claim_date >= NOW() - INTERVAL '7 days')::int AS new_7d
         FROM incentive_claims c
         ${claimFilter}`,
        params
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE d.distribution_date >= NOW() - INTERVAL '7 days')::int AS new_7d
         FROM incentive_distributions d
         JOIN incentive_claims c ON c.id = d.claim_id
         ${claimFilter}`,
        params
      ),
      isPetani
        ? Promise.resolve({ rows: [{ total: null }] })
        : pool.query('SELECT COUNT(*)::int AS total FROM farmers'),
      isPetani
        ? Promise.resolve({ rows: [] })
        : pool.query(
            `SELECT * FROM (
               SELECT
                 'photo' AS type,
                 fp.id,
                 fp.created_at AS occurred_at,
                 u.nama AS actor,
                 f.name AS target,
                 fp.status AS status
               FROM field_photos fp
               JOIN fields f ON f.id = fp.field_id
               JOIN farmers fa ON fa.id = f.farmer_id
               JOIN users u ON u.id = fa.id_user

               UNION ALL

               SELECT
                 'claim' AS type,
                 c.id,
                 c.claim_date AS occurred_at,
                 u.nama AS actor,
                 ic.name AS target,
                 c.status AS status
               FROM incentive_claims c
               JOIN farmers fa ON fa.id = c.farmer_id
               JOIN users u ON u.id = fa.id_user
               JOIN incentive_categories ic ON ic.id = c.category_id

               UNION ALL

               SELECT
                 'field' AS type,
                 f.id,
                 f.created_at AS occurred_at,
                 u.nama AS actor,
                 f.name AS target,
                 'terdaftar' AS status
               FROM fields f
               JOIN farmers fa ON fa.id = f.farmer_id
               JOIN users u ON u.id = fa.id_user
               WHERE f.is_active = TRUE

               UNION ALL

               SELECT
                 'distribution' AS type,
                 d.id,
                 d.distribution_date AS occurred_at,
                 COALESCE(uo.nama, 'Admin') AS actor,
                 ic.name AS target,
                 'disalurkan' AS status
               FROM incentive_distributions d
               JOIN incentive_claims c ON c.id = d.claim_id
               JOIN incentive_categories ic ON ic.id = d.category_id
               LEFT JOIN officers o ON o.id = d.officer_id
               LEFT JOIN users uo ON uo.id = o.id_user
             ) events
             ORDER BY occurred_at DESC
             LIMIT 6`
          ),
    ]);

    const fields = fieldResult.rows[0] || {};
    const photos = photoResult.rows[0] || {};
    const claims = claimResult.rows[0] || {};
    const distributions = distributionResult.rows[0] || {};
    const fieldsTotal = toCount(fields.total);
    const fieldsVerified = toCount(fields.verified);

    res.json({
      success: true,
      data: {
        role: req.user.role,
        scope,
        generated_at: new Date().toISOString(),
        metrics: {
          fields_total: fieldsTotal,
          fields_verified: fieldsVerified,
          fields_new_7d: toCount(fields.new_7d),
          photos_total: toCount(photos.total),
          photos_pending: toCount(photos.pending),
          photos_new_7d: toCount(photos.new_7d),
          claims_total: toCount(claims.total),
          claims_pending: toCount(claims.pending),
          claims_approved: toCount(claims.approved),
          claims_new_7d: toCount(claims.new_7d),
          distributions_total: toCount(distributions.total),
          distributions_new_7d: toCount(distributions.new_7d),
          farmers_total: farmerResult.rows[0]?.total ?? null,
          verification_rate: fieldsTotal
            ? Math.round((fieldsVerified / fieldsTotal) * 100)
            : 0,
        },
        activities: activityResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
