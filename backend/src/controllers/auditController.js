const pool = require('../config/db');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function cleanQuery(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function parseOffset(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

async function listAuditLogs(req, res, next) {
  const limit = parseLimit(req.query.limit);
  const offset = parseOffset(req.query.offset);
  const action = cleanQuery(req.query.action);
  const entityType = cleanQuery(req.query.entity_type);
  const keyword = cleanQuery(req.query.q);

  const conditions = [];
  const values = [];

  if (action) {
    values.push(action);
    conditions.push(`action = $${values.length}`);
  }

  if (entityType) {
    values.push(entityType);
    conditions.push(`entity_type = $${values.length}`);
  }

  if (keyword) {
    values.push(`%${keyword}%`);
    const placeholder = `$${values.length}`;
    conditions.push(
      `(summary ILIKE ${placeholder} OR actor_name ILIKE ${placeholder} OR action ILIKE ${placeholder})`
    );
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const listValues = [...values, limit, offset];
    const [listResult, countResult, summaryResult] = await Promise.all([
      pool.query(
        `SELECT id, actor_id, actor_name, actor_role, action, entity_type, entity_id,
                summary, metadata, created_at
         FROM audit_logs
         ${where}
         ORDER BY created_at DESC, id DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        listValues
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM audit_logs ${where}`, values),
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE action LIKE 'user.%')::int AS account,
                COUNT(*) FILTER (WHERE action LIKE 'category.%')::int AS catalog,
                COUNT(*) FILTER (WHERE action = 'stock.distributed')::int AS stock
         FROM audit_logs
         ${where}`,
        values
      ),
    ]);

    const total = countResult.rows[0]?.total || 0;

    res.json({
      success: true,
      data: listResult.rows,
      total,
      limit,
      offset,
      has_more: offset + listResult.rows.length < total,
      summary: summaryResult.rows[0] || { total: 0, account: 0, catalog: 0, stock: 0 },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAuditLogs };
