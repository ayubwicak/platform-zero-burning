const pool = require('../config/db');

async function listCategories(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM incentive_categories ORDER BY name');
    res.json({ success: true, data: result.rows });
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
       WHERE f.id = $1 AND f.farmer_id = $2
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

module.exports = { listCategories, listClaims, createClaim, recordDistribution };
