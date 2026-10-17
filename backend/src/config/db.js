const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  ...(env.db.ssl ? { ssl: {} } : {}),
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

async function ensureEmergencyColumns() {
  const [tables] = await pool.execute(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'health_profile'`,
    [env.db.name]
  );
  if (!tables.length) {
    return;
  }

  const columns = [
    ['blood_group', 'VARCHAR(8) NULL AFTER gender'],
    ['past_surgeries', 'TEXT NULL AFTER medical_history'],
    ['guardian_name', 'VARCHAR(120) NULL AFTER past_surgeries'],
    ['guardian_relation', 'VARCHAR(60) NULL AFTER guardian_name'],
    ['guardian_phone', 'VARCHAR(32) NULL AFTER guardian_relation'],
  ];

  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'health_profile'`,
    [env.db.name]
  );
  const existing = new Set(rows.map((row) => row.COLUMN_NAME));

  for (const [name, definition] of columns) {
    if (!existing.has(name)) {
      await pool.execute(`ALTER TABLE health_profile ADD COLUMN ${name} ${definition}`);
    }
  }
}

async function ensureEmergencyTables() {
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
    `CREATE TABLE IF NOT EXISTS preferred_hospitals (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      hospital_osm_id VARCHAR(64) NOT NULL,
      name VARCHAR(180) NOT NULL,
      address VARCHAR(500) NULL,
      phone VARCHAR(64) NULL,
      speciality VARCHAR(255) NULL,
      latitude DECIMAL(10,7) NULL,
      longitude DECIMAL(10,7) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_preferred_hospital_user_osm (user_id, hospital_osm_id),
      KEY idx_preferred_hospital_user (user_id),
      CONSTRAINT fk_preferred_hospital_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  );

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS emergency_dispatches (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      hospital_osm_id VARCHAR(64) NULL,
      hospital_name VARCHAR(180) NULL,
      hospital_phone VARCHAR(64) NULL,
      guardian_phone VARCHAR(32) NULL,
      patient_snapshot JSON NULL,
      message_body TEXT NULL,
      location_lat DECIMAL(10,7) NULL,
      location_lng DECIMAL(10,7) NULL,
      status ENUM('queued', 'sent', 'failed', 'mock', 'skipped') NOT NULL DEFAULT 'mock',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_emergency_dispatch_user (user_id, created_at),
      CONSTRAINT fk_emergency_dispatch_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  );

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS sms_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      dispatch_id BIGINT NULL,
      recipient_type ENUM('hospital', 'guardian', 'other') NOT NULL DEFAULT 'other',
      recipient_phone VARCHAR(32) NOT NULL,
      message TEXT NOT NULL,
      provider VARCHAR(32) NOT NULL DEFAULT 'mock',
      status ENUM('queued', 'sent', 'failed', 'mock', 'skipped') NOT NULL DEFAULT 'mock',
      error_message VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_sms_log_dispatch (dispatch_id),
      KEY idx_sms_log_user (user_id, created_at),
      CONSTRAINT fk_sms_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_sms_log_dispatch FOREIGN KEY (dispatch_id) REFERENCES emergency_dispatches(id) ON DELETE CASCADE
    )`
  );
}

async function ensureHospitalCacheTable() {
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
    `CREATE TABLE IF NOT EXISTS hospital_lookup_cache (
      cache_key VARCHAR(80) PRIMARY KEY,
      payload JSON NOT NULL,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_hospital_cache_fetched (fetched_at)
    )`
  );
}

async function ensureHospitalsTable() {
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
    `CREATE TABLE IF NOT EXISTS hospitals (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      osm_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      address TEXT NULL,
      phone VARCHAR(255) NULL,
      speciality VARCHAR(255) NULL,
      latitude DECIMAL(10,7) NOT NULL,
      longitude DECIMAL(10,7) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_hospitals_osm (osm_id),
      KEY idx_hospitals_lat (latitude),
      KEY idx_hospitals_lng (longitude)
    )`
  );

  const [phoneCols] = await pool.execute(
    `SELECT COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'hospitals' AND COLUMN_NAME = 'phone'`,
    [env.db.name]
  );
  if (phoneCols.length && phoneCols[0].COLUMN_TYPE === 'varchar(64)') {
    await pool.execute('ALTER TABLE hospitals MODIFY phone VARCHAR(255) NULL');
  }
}

async function ensureHospitalSpecialityColumns() {
  const [tables] = await pool.execute(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [env.db.name]
  );
  if (!tables.length) {
    return;
  }

  const targets = [
    { table: 'hospitals', after: 'phone' },
    { table: 'preferred_hospitals', after: 'phone' },
  ];

  for (const target of targets) {
    const [tableRows] = await pool.execute(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [env.db.name, target.table]
    );
    if (!tableRows.length) {
      continue;
    }

    const [cols] = await pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'speciality'`,
      [env.db.name, target.table]
    );
    if (!cols.length) {
      await pool.execute(
        `ALTER TABLE ${target.table} ADD COLUMN speciality VARCHAR(255) NULL AFTER ${target.after}`
      );
    }
  }
}

async function runDbMigrations() {
  await ensureTermsColumns();
  await ensureNotificationsTable();
  await ensurePrescriptionAnalysisColumn();
  await ensureUserSettingsTable();
  await ensureProfileAvatarColumn();
  await ensureEmergencyColumns();
  await ensureEmergencyTables();
  await ensureHospitalCacheTable();
  await ensureHospitalsTable();
  await ensureHospitalSpecialityColumns();
}

module.exports = { pool, testConnection, runDbMigrations };
