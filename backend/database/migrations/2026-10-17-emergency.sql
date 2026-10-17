USE salvexa;

ALTER TABLE health_profile
  ADD COLUMN IF NOT EXISTS blood_group VARCHAR(8) NULL AFTER gender,
  ADD COLUMN IF NOT EXISTS past_surgeries TEXT NULL AFTER medical_history,
  ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(120) NULL AFTER past_surgeries,
  ADD COLUMN IF NOT EXISTS guardian_relation VARCHAR(60) NULL AFTER guardian_name,
  ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(32) NULL AFTER guardian_relation;

CREATE TABLE IF NOT EXISTS preferred_hospitals (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  hospital_osm_id VARCHAR(64) NOT NULL,
  name VARCHAR(180) NOT NULL,
  address VARCHAR(500) NULL,
  phone VARCHAR(64) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_preferred_hospital_user_osm (user_id, hospital_osm_id),
  KEY idx_preferred_hospital_user (user_id),
  CONSTRAINT fk_preferred_hospital_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS emergency_dispatches (
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
);

CREATE TABLE IF NOT EXISTS sms_logs (
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
);
