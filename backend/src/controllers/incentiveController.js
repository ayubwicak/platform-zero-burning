const pool = require('../config/db');

const MAX_STOCK = 2147483647;

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseQuantity(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return NaN;
  const normalized = typeof value === 'string' ? value.trim() : value;
  if (normalized === '') return NaN;
  const quantity = Number(normalized);
  return Number.isSafeInteger(quantity) && quantity >= 0 && quantity <= MAX_STOCK
    ? quantity
    : NaN;
}

async function categoryNameExists(name, excludeId = null) {
  const result = excludeId
    ? await pool.query(
        'SELECT id FROM incentive_categories WHERE LOWER(name) = LOWER($1) AND id <> $2',
        [name, excludeId]
      )
    : await pool.query('SELECT id FROM incentive_categories WHERE LOWER(name) = LOWER($1)', [
        name,
      ]);
  return result.rows.length > 0;
}

async function listCategories(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM incentive_categories ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  const body = req.body || {};
  const name = cleanText(body.name);
  const quantity = body.quantity === undefined ? 0 : parseQuantity(body.quantity);
  const requirements = cleanText(body.requirements);

  if (!name) {
    return res.status(400).json({ error: 'Nama kategori wajib diisi' });
  }
  if (name.length > 100) {
    return res.status(400).json({ error: 'Nama kategori maksimal 100 karakter' });
  }
  if (Number.isNaN(quantity)) {
    return res.status(400).json({ error: 'Stok harus berupa bilangan bulat 0 atau lebih' });
  }
  if (requirements.length > 500) {
    return res.status(400).json({ error: 'Persyaratan maksimal 500 karakter' });
  }

  try {
    if (await categoryNameExists(name)) {
      return res.status(400).json({ error: 'Nama kategori sudah digunakan' });
    }

    const result = await pool.query(
      `INSERT INTO incentive_categories (name, quantity, requirements)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, quantity, requirements || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(404).json({ error: 'Kategori insentif tidak ditemukan' });
  }

  const updates = [];
  const values = [];
  const body = req.body || {};

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = cleanText(body.name);
    if (!name) {
      return res.status(400).json({ error: 'Nama kategori wajib diisi' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'Nama kategori maksimal 100 karakter' });
    }
    values.push(name);
    updates.push(`name = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'quantity')) {
    const quantity = parseQuantity(body.quantity);
    if (Number.isNaN(quantity)) {
      return res.status(400).json({ error: 'Stok harus berupa bilangan bulat 0 atau lebih' });
    }
    values.push(quantity);
    updates.push(`quantity = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'requirements')) {
    const requirements = cleanText(body.requirements);
    if (requirements.length > 500) {
      return res.status(400).json({ error: 'Persyaratan maksimal 500 karakter' });
    }
    values.push(requirements || null);
    updates.push(`requirements = $${values.length}`);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Tidak ada perubahan yang dikirim' });
  }

  try {
    if (Object.prototype.hasOwnProperty.call(body, 'name')) {
      const name = cleanText(body.name);
      if (await categoryNameExists(name, id)) {
        return res.status(400).json({ error: 'Nama kategori sudah digunakan' });
      }
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE incentive_categories
       SET ${updates.join(', ')}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kategori insentif tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function listClaims(req, res, next) {
  const farmerId = req.user.farmerId;
  if (!farmerId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }

  try {
    const result = await pool.query(
      `SELECT c.*, f.name AS field_name, ic.name AS category_name,
              d.id AS distribution_id, d.distribution_date, d.receipt_proof
       FROM incentive_claims c
       JOIN fields f ON c.field_id = f.id
       JOIN incentive_categories ic ON c.category_id = ic.id
       LEFT JOIN incentive_distributions d ON d.claim_id = c.id
       WHERE c.farmer_id = $1
       ORDER BY c.claim_date DESC
       LIMIT 50`,
      [farmerId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function listPendingClaims(req, res, next) {
  try {
    const [claimsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT c.id, c.claim_date, c.status,
                f.id AS field_id, f.name AS field_name, f.area AS field_area,
                f.latitude, f.longitude,
                u.nama AS farmer_name, fa.phone AS farmer_phone, fa.address AS farmer_address,
                ic.id AS category_id, ic.name AS category_name, ic.quantity AS stock,
                p.photo_url AS verified_photo_url, p.taken_at AS verified_photo_at
         FROM incentive_claims c
         JOIN fields f ON f.id = c.field_id
         JOIN farmers fa ON fa.id = c.farmer_id
         JOIN users u ON u.id = fa.id_user
         JOIN incentive_categories ic ON ic.id = c.category_id
         LEFT JOIN LATERAL (
           SELECT fp.photo_url, fp.taken_at
           FROM field_photos fp
           WHERE fp.field_id = c.field_id AND fp.status = 'terverifikasi'
           ORDER BY fp.created_at DESC, fp.id DESC
           LIMIT 1
         ) p ON TRUE
         WHERE c.status = 'diajukan'
         ORDER BY c.claim_date ASC
         LIMIT 100`
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM incentive_claims WHERE status = 'diajukan'`),
    ]);

    res.json({
      success: true,
      data: claimsResult.rows,
      total: countResult.rows[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
}

async function listDistributions(req, res, next) {
  try {
    const [historyResult, countResult] = await Promise.all([
      pool.query(
        `SELECT d.id, d.claim_id, d.distribution_date, d.receipt_proof,
                ic.name AS category_name,
                f.name AS field_name,
                u.nama AS farmer_name,
                COALESCE(uo.nama, 'Admin') AS officer_name
         FROM incentive_distributions d
         JOIN incentive_claims c ON c.id = d.claim_id
         JOIN fields f ON f.id = c.field_id
         JOIN farmers fa ON fa.id = c.farmer_id
         JOIN users u ON u.id = fa.id_user
         JOIN incentive_categories ic ON ic.id = d.category_id
         LEFT JOIN officers o ON o.id = d.officer_id
         LEFT JOIN users uo ON uo.id = o.id_user
         ORDER BY d.distribution_date DESC, d.id DESC
         LIMIT 20`
      ),
      pool.query('SELECT COUNT(*)::int AS total FROM incentive_distributions'),
    ]);

    res.json({
      success: true,
      data: historyResult.rows,
      total: countResult.rows[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
}

async function createClaim(req, res, next) {
  const { field_id, category_id } = req.body;
  const farmerId = req.user.farmerId;

  if (!farmerId) {
    return res.status(403).json({ error: 'Profil petani tidak ditemukan' });
  }
  if (!field_id || !category_id) {
    return res.status(400).json({ error: 'field_id dan category_id wajib diisi' });
  }

  try {
    const category = await pool.query(
      'SELECT id, quantity FROM incentive_categories WHERE id = $1',
      [category_id]
    );
    if (category.rows.length === 0) {
      return res.status(404).json({ error: 'Kategori insentif tidak ditemukan' });
    }
    if (Number(category.rows[0].quantity) <= 0) {
      return res.status(400).json({ error: 'Stok insentif habis' });
    }

    const fieldCheck = await pool.query(
      `SELECT fp.status FROM field_photos fp
       JOIN fields f ON fp.field_id = f.id
       WHERE f.id = $1 AND f.farmer_id = $2 AND f.is_active = TRUE
       ORDER BY fp.created_at DESC LIMIT 1`,
      [field_id, farmerId]
    );

    if (fieldCheck.rows.length === 0 || fieldCheck.rows[0].status !== 'terverifikasi') {
      return res.status(400).json({ error: 'Lahan belum terverifikasi zero burning' });
    }

    const duplicate = await pool.query(
      `SELECT id FROM incentive_claims
       WHERE field_id = $1 AND category_id = $2 AND farmer_id = $3 AND status = 'diajukan'`,
      [field_id, category_id, farmerId]
    );
    if (duplicate.rows.length > 0) {
      return res.status(400).json({ error: 'Klaim untuk lahan dan kategori ini masih diproses' });
    }

    const result = await pool.query(
      `INSERT INTO incentive_claims (field_id, farmer_id, category_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [field_id, farmerId, category_id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function recordDistribution(req, res, next) {
  const { claim_id, receipt_proof } = req.body;
  const officerId = req.user.officerId || null;

  if (!claim_id) {
    return res.status(400).json({ error: 'claim_id wajib diisi' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const claim = await client.query(
      'SELECT id, status, category_id FROM incentive_claims WHERE id = $1 FOR UPDATE',
      [claim_id]
    );
    if (claim.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Klaim tidak ditemukan' });
    }
    if (claim.rows[0].status !== 'diajukan') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Klaim sudah diproses sebelumnya' });
    }

    const categoryId = claim.rows[0].category_id;
    const stock = await client.query(
      `UPDATE incentive_categories
       SET quantity = quantity - 1
       WHERE id = $1 AND quantity > 0
       RETURNING quantity`,
      [categoryId]
    );
    if (stock.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Stok insentif habis' });
    }

    await client.query(
      `UPDATE incentive_claims SET status = 'disetujui' WHERE id = $1`,
      [claim_id]
    );

    const result = await client.query(
      `INSERT INTO incentive_distributions (claim_id, officer_id, category_id, receipt_proof)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [claim_id, officerId, categoryId, receipt_proof || null]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: { ...result.rows[0], remaining_stock: stock.rows[0].quantity },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  listClaims,
  listPendingClaims,
  listDistributions,
  createClaim,
  recordDistribution,
};
