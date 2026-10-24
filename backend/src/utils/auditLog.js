/**
 * Catat aktivitas administratif ke tabel audit_logs.
 * Menerima pool atau client transaksi agar perubahan data dan audit log
 * dapat disimpan dalam satu transaksi.
 */
async function recordAudit(
  db,
  { actor, action, entityType, entityId = null, summary, metadata = null }
) {
  const actorId = actor?.id ?? null;
  const actorName = String(actor?.nama || 'Sistem').slice(0, 100);
  const actorRole = String(actor?.role || 'sistem').slice(0, 20);

  await db.query(
    `INSERT INTO audit_logs
       (actor_id, actor_name, actor_role, action, entity, entity_type, entity_id,
        description, summary, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      actorId,
      actorName,
      actorRole,
      action,
      entityType,
      entityType,
      entityId,
      summary,
      summary,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
}

module.exports = { recordAudit };
