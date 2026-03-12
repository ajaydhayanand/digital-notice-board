const { pool } = require("../config/db");

const logAudit = async ({ user, action, entityType, entityId = null, details = null }) => {
  if (!user || !action || !entityType) return;

  const safeDetails = details ? JSON.stringify(details) : null;
  await pool.execute(
    `INSERT INTO audit_logs (user_id, username, role, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user.id, user.username, user.role, action, entityType, entityId, safeDetails]
  );
};

module.exports = {
  logAudit,
};
