CREATE DATABASE IF NOT EXISTS digital_notice_board;
USE digital_notice_board;

CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'editor', 'viewer', 'student') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(60) NOT NULL,
  created_by VARCHAR(120) NOT NULL,
  is_important TINYINT(1) NOT NULL DEFAULT 0,
  attachment_url VARCHAR(500) NULL,
  publish_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  status ENUM('scheduled', 'published', 'archived') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notice_reads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  notice_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_notice (user_id, notice_id),
  CONSTRAINT fk_notice_reads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notice_reads_notice FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  channel ENUM('email', 'whatsapp', 'push') NOT NULL,
  destination VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by VARCHAR(80) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_channel_destination (channel, destination)
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  notice_id INT NOT NULL,
  channel ENUM('email', 'whatsapp', 'push') NOT NULL,
  destination VARCHAR(255) NOT NULL,
  payload TEXT NOT NULL,
  delivery_status ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_logs_notice FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE
);

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
);

CREATE INDEX idx_notices_created_at ON notices(created_at);
CREATE INDEX idx_notices_category ON notices(category);
CREATE INDEX idx_notices_title ON notices(title);
CREATE INDEX idx_notices_important ON notices(is_important);
CREATE INDEX idx_notices_publish_at ON notices(publish_at);
CREATE INDEX idx_notices_expires_at ON notices(expires_at);
CREATE INDEX idx_notices_status ON notices(status);
CREATE INDEX idx_notice_reads_user ON notice_reads(user_id);
CREATE INDEX idx_notice_reads_notice ON notice_reads(notice_id);
CREATE INDEX idx_notification_logs_notice ON notification_logs(notice_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Optional seed users (password: admin123 for admin/editor/viewer, student123 for student)
INSERT IGNORE INTO admins (id, username, password_hash)
VALUES (1, 'admin', '$2a$10$FPO6rumDMslpHYO8vMOrkeAJOmEZGCVvjx5LtskS39r8z6nP4wCLG');

INSERT IGNORE INTO users (id, username, password_hash, role)
VALUES
  (1, 'admin', '$2a$10$FPO6rumDMslpHYO8vMOrkeAJOmEZGCVvjx5LtskS39r8z6nP4wCLG', 'superadmin'),
  (2, 'student', '$2a$10$.DnnnZ5oYSUz6bMcv8pNiONsLdQGHqejKhEmqrTXzUm28KwGLLg6u', 'student'),
  (3, 'editor', '$2a$10$FPO6rumDMslpHYO8vMOrkeAJOmEZGCVvjx5LtskS39r8z6nP4wCLG', 'editor'),
  (4, 'viewer', '$2a$10$FPO6rumDMslpHYO8vMOrkeAJOmEZGCVvjx5LtskS39r8z6nP4wCLG', 'viewer');
