const pool = require('../config/db');
const { recordAudit } = require('../utils/auditLog');
const { createNotification } = require('../utils/notificationService');

const MAX_STOCK = 2147483647;

const STANDARD_CLAIM_REASONS = [
  'Petani tidak hadir',
  'Lahan bermasalah kembali',
  'Data tidak sesuai',
  'Stok tidak tersedia',
  'Kekeliruan input',
  'Lainnya',
];

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateReasonAndNote(reason, note) {
  const cleanReason = cleanText(reason);
  const cleanNote = cleanText(note);

  if (!cleanReason) {
    return { valid: false, error: 'Alasan penolakan/pembatalan wajib diisi' };
  }

  if (!STANDARD_CLAIM_REASONS.includes(cleanReason)) {
    return {
      valid: false,
      error: `Alasan harus salah satu dari: ${STANDARD_CLAIM_REASONS.join(', ')}`,
    };
  }

  if (cleanNote.length > 300) {
    return { valid: false, error: 'Catatan tambahan maksimal 300 karakter' };
  }

  if (cleanReason === 'Lainnya' && !cleanNote) {
    return {
      valid: false,
      error: 'Catatan teks bebas wajib diisi jika memilih alasan Lainnya',
    };
  }

  const finalReason = cleanNote
    ? cleanReason === 'Lainnya'
      ? cleanNote
      : `${cleanReason} (${cleanNote})`
    : cleanReason;

  return { valid: true, cleanReason, cleanNote, finalReason };
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

async function categoryNameExists(name, excludeId = null, db = pool) {
  const result = excludeId
    ? await db.query(
        'SELECT id FROM incentive_categories WHERE LOWER(name) = LOWER(?) AND id <> ?',
        [name, excludeId]
      )
    : await db.query('SELECT id FROM incentive_categories WHERE LOWER(name) = LOWER(?)', [
        name,
      ]);
  return result.rows.length > 0;
}

function buildCategoryUpdateSummary(before, after) {
  const changes = [];
  if (before.name !== after.name) {
    changes.push(`nama ${before.name} → ${after.name}`);
  }

  const beforeQuantity = Number(before.quantity) || 0;
  const afterQuantity = Number(after.quantity) || 0;
  if (beforeQuantity !== afterQuantity) {
    changes.push(`stok ${beforeQuantity} → ${afterQuantity}`);
  }

  if ((before.requirements || '') !== (after.requirements || '')) {
    changes.push('persyaratan');
  }

  return changes.length > 0
    ? `Memperbarui ${changes.join(', ')} — ${after.name}`
    : `Memperbarui kategori ${after.name}`;
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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (await categoryNameExists(name, null, client)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Nama kategori sudah digunakan' });
    }

    const result = await client.query(
      `INSERT INTO incentive_categories (name, quantity, requirements)
       VALUES (?, ?, ?)`,
      [name, quantity, requirements || null]
    );
    const insertedCategory = await client.query(
      'SELECT * FROM incentive_categories WHERE id = ?',
      [result.rows[0].id]
    );
    const created = insertedCategory.rows[0];

    await recordAudit(client, {
      actor: req.user,
      action: 'category.created',
      entityType: 'category',
      entityId: created.id,
      summary: `Menambahkan kategori ${created.name} dengan stok ${created.quantity}`,
      metadata: {
        name: created.name,
        quantity: created.quantity,
        requirements: created.requirements,
      },
    });

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
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
    updates.push(`name = ?`);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'quantity')) {
    const quantity = parseQuantity(body.quantity);
    if (Number.isNaN(quantity)) {
      return res.status(400).json({ error: 'Stok harus berupa bilangan bulat 0 atau lebih' });
    }
    values.push(quantity);
    updates.push(`quantity = ?`);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'requirements')) {
    const requirements = cleanText(body.requirements);
    if (requirements.length > 500) {
      return res.status(400).json({ error: 'Persyaratan maksimal 500 karakter' });
    }
    values.push(requirements || null);
    updates.push(`requirements = ?`);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Tidak ada perubahan yang dikirim' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const current = await client.query(
      'SELECT * FROM incentive_categories WHERE id = ?',
      [id]
    );
    if (current.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Kategori insentif tidak ditemukan' });
    }
    const before = current.rows[0];

    if (Object.prototype.hasOwnProperty.call(body, 'name')) {
      const name = cleanText(body.name);
      if (await categoryNameExists(name, id, client)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Nama kategori sudah digunakan' });
      }
    }

    values.push(id);
    await client.query(
      `UPDATE incentive_categories
       SET ${updates.join(', ')}
       WHERE id = ?`,
      values
    );

    // Fetch updated row
    const updatedResult = await client.query(
      'SELECT * FROM incentive_categories WHERE id = ?',
      [id]
    );

    if (updatedResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Kategori insentif tidak ditemukan' });
    }

    const after = updatedResult.rows[0];
    const changedFields = [];
    if (before.name !== after.name) changedFields.push('name');
    if (Number(before.quantity) !== Number(after.quantity)) changedFields.push('quantity');
    if ((before.requirements || '') !== (after.requirements || '')) {
      changedFields.push('requirements');
    }

    await recordAudit(client, {
      actor: req.user,
      action: 'category.updated',
      entityType: 'category',
      entityId: after.id,
      summary: buildCategoryUpdateSummary(before, after),
      metadata: {
        changed_fields: changedFields,
        before: {
          name: before.name,
          quantity: before.quantity,
          requirements: before.requirements,
        },
        after: {
          name: after.name,
          quantity: after.quantity,
          requirements: after.requirements,
        },
      },
    });

    await client.query('COMMIT');
    res.json({ success: true, data: after });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
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
              d.id AS distribution_id, d.distribution_date, d.receipt_proof,
              u_proc.nama AS processed_by_name
       FROM incentive_claims c
       JOIN fields f ON c.field_id = f.id
       JOIN incentive_categories ic ON c.category_id = ic.id
       LEFT JOIN incentive_distributions d ON d.claim_id = c.id
       LEFT JOIN users u_proc ON u_proc.id = c.processed_by
       WHERE c.farmer_id = ?
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
  const { status } = req.query;
  const params = [];
  let whereClause = '';

  if (status && status !== 'semua') {
    whereClause = 'WHERE c.status = ?';
    params.push(status);
  } else if (!status) {
    whereClause = "WHERE c.status = 'diajukan'";
  }

  try {
    const [claimsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT c.id, c.claim_date, c.status, c.reason, c.notes, c.processed_at, c.processed_by,
                f.id AS field_id, f.name AS field_name, f.area AS field_area,
                f.latitude, f.longitude,
                u.nama AS farmer_name, fa.phone AS farmer_phone, fa.address AS farmer_address,
                ic.id AS category_id, ic.name AS category_name, ic.quantity AS stock,
                u_proc.nama AS processed_by_name
         FROM incentive_claims c
         JOIN fields f ON f.id = c.field_id
         JOIN farmers fa ON fa.id = c.farmer_id
         JOIN users u ON u.id = fa.id_user
         JOIN incentive_categories ic ON ic.id = c.category_id
         LEFT JOIN users u_proc ON u_proc.id = c.processed_by
         ${whereClause}
         ORDER BY c.claim_date ASC
         LIMIT 100`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM incentive_claims c ${whereClause}`,
        params
      ),
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
        `SELECT d.id, d.distribution_date, d.receipt_proof,
                c.id AS claim_id, c.claim_date,
                ic.name AS category_name, ic.quantity AS category_quantity,
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
      pool.query('SELECT COUNT(*) AS total FROM incentive_distributions'),
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
      'SELECT id, quantity FROM incentive_categories WHERE id = ?',
      [category_id]
    );
    if (category.rows.length === 0) {
      return res.status(404).json({ error: 'Kategori insentif tidak ditemukan' });
    }
    if (Number(category.rows[0].quantity) <= 0) {
      return res.status(400).json({ error: 'Stok insentif habis' });
    }

    const fieldCheck = await pool.query(
      `SELECT fp.id, fp.verification_status, fp.created_at
       FROM field_photos fp
       JOIN fields f ON fp.field_id = f.id
       WHERE f.id = ? AND f.id_farmer = ? AND f.status = 'active'
       ORDER BY fp.created_at DESC, fp.id DESC
       LIMIT 1`,
      [field_id, farmerId]
    );

    if (fieldCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Lahan belum memiliki foto progres' });
    }

    const latestPhoto = fieldCheck.rows[0];
    if (latestPhoto.verification_status !== 'terverifikasi') {
      return res.status(400).json({ error: 'Foto terbaru lahan belum terverifikasi zero burning' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const photoDate = new Date(latestPhoto.created_at);
    if (photoDate < thirtyDaysAgo) {
      return res.status(400).json({
        error: 'Foto terverifikasi sudah kedaluwarsa (lebih dari 30 hari). Silakan unggah foto terbaru.',
      });
    }

    const duplicate = await pool.query(
      `SELECT id FROM incentive_claims
       WHERE field_id = ? AND category_id = ? AND farmer_id = ? AND status = 'diajukan'`,
      [field_id, category_id, farmerId]
    );
    if (duplicate.rows.length > 0) {
      return res.status(400).json({ error: 'Klaim untuk lahan dan kategori ini masih diproses' });
    }

    const result = await pool.query(
      `INSERT INTO incentive_claims (field_id, farmer_id, category_id)
       VALUES (?, ?, ?)`,
      [field_id, farmerId, category_id]
    );

    const insertedClaim = await pool.query(
      'SELECT * FROM incentive_claims WHERE id = ?',
      [result.rows[0].id]
    );
    const claim = insertedClaim.rows[0];

    await recordAudit(pool, {
      actor: req.user,
      action: 'claim.created',
      entityType: 'claim',
      entityId: claim.id,
      summary: `Petani mengajukan klaim insentif untuk lahan ID ${field_id}`,
      metadata: { field_id, category_id, claim_id: claim.id },
    });

    res.status(201).json({ success: true, data: claim });
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
      'SELECT id, status, category_id, farmer_id FROM incentive_claims WHERE id = ?',
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
       SET quantity = quantity - 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND quantity > 0`,
      [categoryId]
    );
    if (stock.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Stok insentif habis' });
    }

    const categoryAfter = await client.query(
      'SELECT name, quantity FROM incentive_categories WHERE id = ?',
      [categoryId]
    );
    const stockAfter = Number(categoryAfter.rows[0].quantity);
    const stockBefore = stockAfter + 1;

    await client.query(
      `UPDATE incentive_claims
       SET status = 'disetujui',
           processed_by = ?,
           processed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.user.id, claim_id]
    );

    const result = await client.query(
      `INSERT INTO incentive_distributions (claim_id, officer_id, category_id, farmer_id, receipt_proof)
       VALUES (?, ?, ?, ?, ?)`,
      [claim_id, officerId, categoryId, claim.rows[0].farmer_id, receipt_proof || null]
    );

    await recordAudit(client, {
      actor: req.user,
      action: 'stock.distributed',
      entityType: 'category',
      entityId: categoryId,
      summary: `Mendistribusikan ${categoryAfter.rows[0].name}: stok ${stockBefore} → ${stockAfter}`,
      metadata: {
        category_id: categoryId,
        category_name: categoryAfter.rows[0].name,
        stock_before: stockBefore,
        stock_after: stockAfter,
        claim_id: Number(claim_id),
        distribution_id: result.rows[0].id,
        receipt_proof: Boolean(receipt_proof),
      },
    });

    // Kirim notifikasi ke petani
    const farmerUserRes = await client.query(
      `SELECT fa.id_user FROM farmers fa WHERE fa.id = ?`,
      [claim.rows[0].farmer_id]
    );
    if (farmerUserRes.rows.length > 0) {
      await createNotification(client, {
        userId: farmerUserRes.rows[0].id_user,
        type: 'claim.approved',
        title: 'Klaim Insentif Disetujui',
        message: `Klaim insentif ${categoryAfter.rows[0].name} telah berhasil disetujui dan disalurkan.`,
        data: {
          claim_id: Number(claim_id),
          category_id: categoryId,
          category_name: categoryAfter.rows[0].name,
          status: 'disetujui',
        },
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: { ...result.rows[0], remaining_stock: stockAfter },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function rejectClaim(req, res, next) {
  const claimId = req.params.id;
  const { reason, note } = req.body;

  const validation = validateReasonAndNote(reason, note);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const claimRes = await client.query(
      `SELECT c.id, c.status, c.farmer_id, c.field_id, c.category_id,
              f.name AS field_name, fa.id_user AS farmer_user_id,
              ic.name AS category_name
       FROM incentive_claims c
       JOIN fields f ON f.id = c.field_id
       JOIN farmers fa ON fa.id = c.farmer_id
       JOIN incentive_categories ic ON ic.id = c.category_id
       WHERE c.id = ?`,
      [claimId]
    );

    if (claimRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Klaim tidak ditemukan' });
    }

    const claim = claimRes.rows[0];

    // Aturan transisi: hanya dari status "diajukan"
    if (claim.status !== 'diajukan') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Klaim dengan status "${claim.status}" tidak dapat ditolak. Hanya klaim berstatus "diajukan" yang dapat ditolak.`,
      });
    }

    await client.query(
      `UPDATE incentive_claims
       SET status = 'ditolak',
           reason = ?,
           notes = ?,
           processed_by = ?,
           processed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [validation.finalReason, validation.cleanNote || null, req.user.id, claimId]
    );

    await recordAudit(client, {
      actor: req.user,
      action: 'claim.rejected',
      entityType: 'claim',
      entityId: Number(claimId),
      summary: `Klaim insentif #${claimId} ditolak oleh ${req.user.nama}. Alasan: ${validation.finalReason}`,
      metadata: {
        claim_id: Number(claimId),
        old_status: 'diajukan',
        new_status: 'ditolak',
        reason: validation.cleanReason,
        note: validation.cleanNote,
        final_reason: validation.finalReason,
      },
    });

    await createNotification(client, {
      userId: claim.farmer_user_id,
      type: 'claim.rejected',
      title: 'Pengajuan Klaim Ditolak',
      message: `Pengajuan klaim insentif ${claim.category_name} untuk lahan "${claim.field_name}" ditolak. Alasan: ${validation.finalReason}`,
      data: {
        claim_id: Number(claimId),
        field_id: claim.field_id,
        category_name: claim.category_name,
        status: 'ditolak',
        reason: validation.finalReason,
      },
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Klaim berhasil ditolak',
      data: {
        id: Number(claimId),
        status: 'ditolak',
        reason: validation.finalReason,
        processed_by: req.user.id,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function cancelClaim(req, res, next) {
  const claimId = req.params.id;
  const { reason, note } = req.body;

  const validation = validateReasonAndNote(reason, note);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const claimRes = await client.query(
      `SELECT c.id, c.status, c.farmer_id, c.field_id, c.category_id,
              f.name AS field_name, fa.id_user AS farmer_user_id,
              ic.name AS category_name
       FROM incentive_claims c
       JOIN fields f ON f.id = c.field_id
       JOIN farmers fa ON fa.id = c.farmer_id
       JOIN incentive_categories ic ON ic.id = c.category_id
       WHERE c.id = ?`,
      [claimId]
    );

    if (claimRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Klaim tidak ditemukan' });
    }

    const claim = claimRes.rows[0];

    // Status yang sudah final: ditolak atau dibatalkan
    if (claim.status === 'ditolak' || claim.status === 'dibatalkan') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Klaim sudah berstatus "${claim.status}" dan tidak dapat dibatalkan lagi.`,
      });
    }

    // Jika sudah disetujui / didistribusikan: aturan eksplisit hanya admin
    let stockRestored = false;
    if (claim.status === 'disetujui') {
      if (req.user.role !== 'admin') {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: 'Hanya administrator yang berwenang membatalkan klaim yang sudah didistribusikan',
        });
      }

      // Kembalikan stok insentif secara atomik
      await client.query(
        `UPDATE incentive_categories
         SET quantity = quantity + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [claim.category_id]
      );
      stockRestored = true;

      // Hapus data distribusi terkait agar konsisten
      await client.query(
        `DELETE FROM incentive_distributions WHERE claim_id = ?`,
        [claimId]
      );
    }

    await client.query(
      `UPDATE incentive_claims
       SET status = 'dibatalkan',
           reason = ?,
           notes = ?,
           processed_by = ?,
           processed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [validation.finalReason, validation.cleanNote || null, req.user.id, claimId]
    );

    await recordAudit(client, {
      actor: req.user,
      action: 'claim.cancelled',
      entityType: 'claim',
      entityId: Number(claimId),
      summary: `Klaim insentif #${claimId} dibatalkan oleh ${req.user.nama}. Alasan: ${validation.finalReason}${stockRestored ? ' (Stok dikembalikan)' : ''}`,
      metadata: {
        claim_id: Number(claimId),
        old_status: claim.status,
        new_status: 'dibatalkan',
        reason: validation.cleanReason,
        note: validation.cleanNote,
        final_reason: validation.finalReason,
        stock_restored: stockRestored,
      },
    });

    await createNotification(client, {
      userId: claim.farmer_user_id,
      type: 'claim.cancelled',
      title: 'Klaim Insentif Dibatalkan',
      message: `Klaim insentif ${claim.category_name} untuk lahan "${claim.field_name}" telah dibatalkan. Alasan: ${validation.finalReason}`,
      data: {
        claim_id: Number(claimId),
        field_id: claim.field_id,
        category_name: claim.category_name,
        status: 'dibatalkan',
        reason: validation.finalReason,
        stock_restored: stockRestored,
      },
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Klaim berhasil dibatalkan',
      data: {
        id: Number(claimId),
        status: 'dibatalkan',
        reason: validation.finalReason,
        stock_restored: stockRestored,
      },
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
  rejectClaim,
  cancelClaim,
  STANDARD_CLAIM_REASONS,
};
