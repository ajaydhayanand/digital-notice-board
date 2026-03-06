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
  role ENUM('admin', 'student') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(60) NOT NULL,
  created_by VARCHAR(120) NOT NULL,
  is_important TINYINT(1) NOT NULL DEFAULT 0,
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

CREATE INDEX idx_notices_created_at ON notices(created_at);
CREATE INDEX idx_notices_category ON notices(category);
CREATE INDEX idx_notices_title ON notices(title);
CREATE INDEX idx_notices_important ON notices(is_important);
CREATE INDEX idx_notice_reads_user ON notice_reads(user_id);
CREATE INDEX idx_notice_reads_notice ON notice_reads(notice_id);

-- Optional seed admin and student users (password: admin123 / student123)
INSERT IGNORE INTO admins (id, username, password_hash)
VALUES (1, 'admin', '$2a$10$FPO6rumDMslpHYO8vMOrkeAJOmEZGCVvjx5LtskS39r8z6nP4wCLG');

INSERT IGNORE INTO users (id, username, password_hash, role)
VALUES
  (1, 'admin', '$2a$10$FPO6rumDMslpHYO8vMOrkeAJOmEZGCVvjx5LtskS39r8z6nP4wCLG', 'admin'),
  (2, 'student', '$2a$10$.DnnnZ5oYSUz6bMcv8pNiONsLdQGHqejKhEmqrTXzUm28KwGLLg6u', 'student');
