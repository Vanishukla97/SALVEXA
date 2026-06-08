const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  ssl: {},
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}

async function ensureTermsColumns() {
  const [tables] = await pool.execute(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [env.db.name]
  );
  if (!tables.length) {
    return;
  }

  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('terms_accepted_at', 'terms_version')`,
    [env.db.name]
  );
  const existing = new Set(rows.map((row) => row.COLUMN_NAME));
  if (!existing.has('terms_accepted_at')) {
    await pool.execute('ALTER TABLE users ADD COLUMN terms_accepted_at DATETIME NULL AFTER password_hash');
  }
  if (!existing.has('terms_version')) {
    await pool.execute('ALTER TABLE users ADD COLUMN terms_version VARCHAR(32) NULL AFTER terms_accepted_at');
  }
}

async function ensureNotificationsTable() {
  const [tables] = await pool.execute(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [env.db.name]
  );
  if (!tables.length) {
    return;
  }

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(64) NOT NULL,
      priority ENUM('critical', 'important', 'info') NOT NULL DEFAULT 'info',
      title VARCHAR(180) NOT NULL,
      message VARCHAR(500) NOT NULL,
      deep_link VARCHAR(255) NULL,
      meta_json JSON NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      is_hidden TINYINT(1) NOT NULL DEFAULT 0,
      scheduled_for DATETIME NULL,
      delivered_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_notifications_user_created (user_id, created_at),
      KEY idx_notifications_user_unread (user_id, is_read, is_hidden),
      KEY idx_notifications_schedule (scheduled_for, delivered_at),
      CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  );
}

async function ensurePrescriptionAnalysisColumn() {
  const [tables] = await pool.execute(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'prescriptions'`,
    [env.db.name]
  );
  if (!tables.length) {
    return;
  }

  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'prescriptions' AND COLUMN_NAME = 'analysis_json'`,
    [env.db.name]
  );
  if (!rows.length) {
    await pool.execute(
      'ALTER TABLE prescriptions ADD COLUMN analysis_json JSON NULL AFTER extracted_medicines'
    );
  }
}

async function ensureProfileAvatarColumn() {
  const [tables] = await pool.execute(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'health_profile'`,
    [env.db.name]
  );
  if (!tables.length) {
    return;
  }

  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'health_profile' AND COLUMN_NAME = 'avatar_path'`,
    [env.db.name]
  );
  if (!rows.length) {
    await pool.execute(
      'ALTER TABLE health_profile ADD COLUMN avatar_path VARCHAR(255) NULL AFTER current_medicines'
    );
  }
}

async function ensureUserSettingsTable() {
  const [tables] = await pool.execute(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [env.db.name]
  );
  if (!tables.length) {
    return;
  }

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS user_settings (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      interface_language VARCHAR(32) NOT NULL DEFAULT 'en-US',
      medication_reminders TINYINT(1) NOT NULL DEFAULT 1,
      symptom_tracking_alerts TINYINT(1) NOT NULL DEFAULT 1,
      weekly_health_reports TINYINT(1) NOT NULL DEFAULT 0,
      clinic_sharing_enabled TINYINT(1) NOT NULL DEFAULT 0,
      animations_enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  );
}

async function runDbMigrations() {
  await ensureTermsColumns();
  await ensureNotificationsTable();
  await ensurePrescriptionAnalysisColumn();
  await ensureUserSettingsTable();
  await ensureProfileAvatarColumn();
}

module.exports = { pool, testConnection, runDbMigrations };
