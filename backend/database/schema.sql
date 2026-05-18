CREATE DATABASE IF NOT EXISTS salvexa;
USE salvexa;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  terms_accepted_at DATETIME NULL,
  terms_version VARCHAR(32) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS health_profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  age INT NULL,
  weight DECIMAL(5,2) NULL,
  height DECIMAL(5,2) NULL,
  gender ENUM('male', 'female', 'other') NULL,
  medical_history TEXT NULL,
  allergies JSON NULL,
  current_medicines JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_health_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS symptoms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  symptoms_list JSON NOT NULL,
  symptom_text TEXT NULL,
  duration VARCHAR(100) NULL,
  severity INT NULL,
  frequency VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_symptom_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  default_dosage VARCHAR(120) NOT NULL,
  instructions VARCHAR(255) NOT NULL,
  allergy_tags VARCHAR(255) NULL,
  min_age INT NULL,
  max_age INT NULL,
  interactions JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  symptom_record_id INT NOT NULL,
  medicine_id INT NOT NULL,
  dosage VARCHAR(120) NULL,
  instructions VARCHAR(255) NULL,
  warnings TEXT NULL,
  is_safe TINYINT(1) DEFAULT 1,
  recommendation_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommend_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_recommend_symptom FOREIGN KEY (symptom_record_id) REFERENCES symptoms(id) ON DELETE CASCADE,
  CONSTRAINT fk_recommend_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  extracted_text LONGTEXT NULL,
  extracted_medicines JSON NULL,
  analysis_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prescription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
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
);

CREATE TABLE IF NOT EXISTS user_settings (
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
);

-- Optional normalized tables (for future analytics and cleaner querying) while keeping JSON columns intact.
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_allergies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  allergy_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_profile_allergy_user_name (user_id, allergy_name),
  CONSTRAINT fk_profile_allergy_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_current_medicines (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  medicine_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_profile_current_med_user_name (user_id, medicine_name),
  CONSTRAINT fk_profile_current_med_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS symptom_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  symptom_record_id INT NOT NULL,
  symptom_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_symptom_items_name (symptom_name),
  CONSTRAINT fk_symptom_item_record FOREIGN KEY (symptom_record_id) REFERENCES symptoms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prescription_medicines (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  prescription_id INT NOT NULL,
  medicine_name VARCHAR(120) NOT NULL,
  confidence DECIMAL(5,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_prescription_medicine_name (medicine_name),
  CONSTRAINT fk_prescription_medicine_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recommendation_safety_checks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recommendation_id INT NOT NULL,
  check_type ENUM('allergy', 'interaction', 'age_restriction', 'other') NOT NULL,
  check_message VARCHAR(500) NOT NULL,
  severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'warning',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_recommendation_checks_type (check_type),
  CONSTRAINT fk_recommendation_check_recommendation FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE
);

-- Performance indexes for APIs.
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_symptoms_user_created ON symptoms(user_id, created_at);
CREATE INDEX idx_recommendations_user_created ON recommendations(user_id, created_at);
CREATE INDEX idx_recommendations_symptom ON recommendations(symptom_record_id);
CREATE INDEX idx_prescriptions_user_created ON prescriptions(user_id, created_at);
CREATE INDEX idx_medicines_name ON medicines(name);

INSERT INTO medicines (name, default_dosage, instructions, allergy_tags, min_age, max_age, interactions)
VALUES
('Paracetamol', '500mg every 6-8 hours', 'Take after food with water', 'acetaminophen', 6, NULL, JSON_OBJECT('ibuprofen', 'Avoid combining high doses without doctor advice')),
('Ibuprofen', '400mg every 8 hours', 'Take after food', 'nsaid', 12, 65, JSON_OBJECT('aspirin', 'Increased bleeding risk')),
('Cetirizine', '10mg once daily', 'Can be taken with or without food', 'antihistamine', 6, NULL, JSON_OBJECT('dextromethorphan', 'Can increase drowsiness')),
('Dextromethorphan', '10-20mg every 4 hours', 'Follow label instructions', 'cough_suppressant', 6, NULL, JSON_OBJECT('cetirizine', 'Can increase drowsiness')),
('Ondansetron', '4mg every 8 hours', 'Take before meals if nausea is severe', 'serotonin_agent', 12, NULL, JSON_OBJECT()),
('Pantoprazole', '40mg once daily', 'Take 30 minutes before breakfast', 'ppi', 12, NULL, JSON_OBJECT())
ON DUPLICATE KEY UPDATE
  default_dosage = VALUES(default_dosage),
  instructions = VALUES(instructions),
  allergy_tags = VALUES(allergy_tags),
  min_age = VALUES(min_age),
  max_age = VALUES(max_age),
  interactions = VALUES(interactions);

-- Backfill normalized helper tables from existing JSON data.
INSERT IGNORE INTO profile_allergies (user_id, allergy_name)
SELECT hp.user_id, jt.allergy_name
FROM health_profile hp
JOIN JSON_TABLE(
  COALESCE(hp.allergies, JSON_ARRAY()),
  '$[*]' COLUMNS (allergy_name VARCHAR(120) PATH '$')
) jt;

INSERT IGNORE INTO profile_current_medicines (user_id, medicine_name)
SELECT hp.user_id, jt.medicine_name
FROM health_profile hp
JOIN JSON_TABLE(
  COALESCE(hp.current_medicines, JSON_ARRAY()),
  '$[*]' COLUMNS (medicine_name VARCHAR(120) PATH '$')
) jt;

INSERT IGNORE INTO symptom_items (symptom_record_id, symptom_name)
SELECT s.id, jt.symptom_name
FROM symptoms s
JOIN JSON_TABLE(
  COALESCE(s.symptoms_list, JSON_ARRAY()),
  '$[*]' COLUMNS (symptom_name VARCHAR(120) PATH '$')
) jt;

INSERT IGNORE INTO prescription_medicines (prescription_id, medicine_name)
SELECT p.id, jt.medicine_name
FROM prescriptions p
JOIN JSON_TABLE(
  COALESCE(p.extracted_medicines, JSON_ARRAY()),
  '$[*]' COLUMNS (medicine_name VARCHAR(120) PATH '$')
) jt;
