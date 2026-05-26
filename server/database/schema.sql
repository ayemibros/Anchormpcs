-- ============================================================
-- ANCHORMPCS Database Schema
-- Run: mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS anchormpcs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE anchormpcs;

-- ── Admin users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100),
  role          ENUM('superadmin','admin') DEFAULT 'admin',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Members ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id                  INT PRIMARY KEY AUTO_INCREMENT,

  -- A: Personal
  full_name           VARCHAR(150) NOT NULL,
  date_of_birth       DATE,
  gender              ENUM('Male','Female') NOT NULL,
  marital_status      ENUM('Single','Married','Divorced','Widowed'),
  occupation          VARCHAR(100),
  nationality         VARCHAR(50),
  id_number           VARCHAR(100),
  phone               VARCHAR(20) NOT NULL,
  rc_number           VARCHAR(50),
  email               VARCHAR(150),
  state_of_origin     VARCHAR(100),
  residential_address TEXT,
  passport_photo      VARCHAR(255),

  -- B: Employment
  employer_name       VARCHAR(150),
  work_address        TEXT,
  income_range        VARCHAR(60),

  -- C: Membership
  membership_type     ENUM('Full Member','Associate Member') NOT NULL,
  num_shares          INT DEFAULT 1,
  share_amount        DECIMAL(12,2),
  purpose             TEXT,

  -- D: Next of kin
  kin_name            VARCHAR(150),
  kin_relationship    VARCHAR(50),
  kin_phone           VARCHAR(20),
  kin_address         TEXT,

  -- Savings plan
  savings_plan        VARCHAR(50),

  -- Status & admin
  status              ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  member_number       VARCHAR(20),
  approved_by         INT,
  approved_at         TIMESTAMP NULL,
  rejection_reason    TEXT,

  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (approved_by) REFERENCES admin_users(id)
);

-- ── Payments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  member_id     INT NOT NULL,
  payment_type  ENUM('Membership Fee','Share Capital','Savings') NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  reference     VARCHAR(100),
  status        ENUM('Pending','Confirmed','Rejected') DEFAULT 'Pending',
  confirmed_by  INT,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (member_id)    REFERENCES members(id),
  FOREIGN KEY (confirmed_by) REFERENCES admin_users(id)
);

-- ── Default superadmin (password: Admin@1234) ────────────────
-- Change password immediately after first login!
INSERT IGNORE INTO admin_users (username, password_hash, full_name, role) VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2',
  'ANCHORMPCS Administrator',
  'superadmin'
);
