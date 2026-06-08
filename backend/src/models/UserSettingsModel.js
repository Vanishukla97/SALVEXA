const { pool } = require('../config/db');

const DEFAULT_SETTINGS = {
  interface_language: 'en-US',
  medication_reminders: 1,
  symptom_tracking_alerts: 1,
  weekly_health_reports: 0,
  clinic_sharing_enabled: 0,
  animations_enabled: 1,
};

async function ensureRow(userId) {
  await pool.execute(
    `INSERT INTO user_settings
      (user_id, interface_language, medication_reminders, symptom_tracking_alerts, weekly_health_reports, clinic_sharing_enabled, animations_enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [
      userId,
      DEFAULT_SETTINGS.interface_language,
      DEFAULT_SETTINGS.medication_reminders,
      DEFAULT_SETTINGS.symptom_tracking_alerts,
      DEFAULT_SETTINGS.weekly_health_reports,
      DEFAULT_SETTINGS.clinic_sharing_enabled,
      DEFAULT_SETTINGS.animations_enabled,
    ]
  );
}

async function getByUserId(userId) {
  await ensureRow(userId);
  const [rows] = await pool.execute(
    'SELECT * FROM user_settings WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

async function updateByUserId(userId, settings = {}) {
  const allowed = {
    interface_language: settings.interface_language,
    medication_reminders: settings.medication_reminders,
    symptom_tracking_alerts: settings.symptom_tracking_alerts,
    weekly_health_reports: settings.weekly_health_reports,
    clinic_sharing_enabled: settings.clinic_sharing_enabled,
    animations_enabled: settings.animations_enabled,
  };

  const fields = [];
  const values = [];
  Object.entries(allowed).forEach(([key, value]) => {
    if (value === undefined) return;
    fields.push(`${key} = ?`);
    values.push(value);
  });

  if (fields.length) {
    await ensureRow(userId);
    values.push(userId);
    await pool.execute(
      `UPDATE user_settings
       SET ${fields.join(', ')}
       WHERE user_id = ?`,
      values
    );
  }

  return getByUserId(userId);
}

module.exports = {
  getByUserId,
  updateByUserId,
};
