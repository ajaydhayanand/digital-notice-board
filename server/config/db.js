const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "digital_notice_board",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const runSafe = async (sql) => {
  try {
    await pool.query(sql);
  } catch (error) {
    // Ignore duplicate/exists errors so startup remains idempotent.
    const ignorable = new Set([
      "ER_DUP_FIELDNAME",
      "ER_CANT_DROP_FIELD_OR_KEY",
      "ER_DUP_KEYNAME",
      "ER_TABLE_EXISTS_ERROR",
      "ER_FK_DUP_NAME",
      "ER_DUP_ENTRY",
    ]);
    if (!ignorable.has(error.code)) {
      throw error;
    }
  }
};

const ensureSchema = async () => {
  await runSafe(
    "ALTER TABLE users MODIFY COLUMN role ENUM('superadmin','admin','editor','viewer','student') NOT NULL DEFAULT 'student'"
  );
  await runSafe("ALTER TABLE notices ADD COLUMN attachment_url VARCHAR(500) NULL");
  await runSafe("ALTER TABLE notices ADD COLUMN publish_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await runSafe("ALTER TABLE notices ADD COLUMN expires_at DATETIME NULL");
  await runSafe("ALTER TABLE notices ADD COLUMN status ENUM('scheduled','published','archived') NOT NULL DEFAULT 'published'");
  await runSafe("CREATE INDEX idx_notices_publish_at ON notices(publish_at)");
  await runSafe("CREATE INDEX idx_notices_expires_at ON notices(expires_at)");
  await runSafe("CREATE INDEX idx_notices_status ON notices(status)");

  await runSafe(`
    CREATE TABLE IF NOT EXISTS notification_subscriptions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      channel ENUM('email', 'whatsapp', 'push') NOT NULL,
      destination VARCHAR(255) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_by VARCHAR(80) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_channel_destination (channel, destination)
    )
  `);

  await runSafe(`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      notice_id INT NOT NULL,
      channel ENUM('email', 'whatsapp', 'push') NOT NULL,
      destination VARCHAR(255) NOT NULL,
      payload TEXT NOT NULL,
      delivery_status ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_notification_logs_notice FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE
    )
  `);

  await runSafe(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      username VARCHAR(80) NOT NULL,
      role VARCHAR(20) NOT NULL,
      action VARCHAR(80) NOT NULL,
      entity_type VARCHAR(60) NOT NULL,
      entity_id INT NULL,
      details JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await runSafe(`
    INSERT IGNORE INTO users (id, username, password_hash, role) VALUES
    (3, 'editor', '$2a$10$FPO6rumDMslpHYO8vMOrkeAJOmEZGCVvjx5LtskS39r8z6nP4wCLG', 'editor'),
    (4, 'viewer', '$2a$10$FPO6rumDMslpHYO8vMOrkeAJOmEZGCVvjx5LtskS39r8z6nP4wCLG', 'viewer')
  `);
};

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    await ensureSchema();
    console.log("MySQL connected");
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = {
  pool,
  connectDB,
};
