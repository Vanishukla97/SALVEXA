const { pool } = require('../config/db');

async function createDispatch({
  userId,
  hospital = null,
  guardianPhone = null,
  patientSnapshot = null,
  messageBody = null,
  location = null,
  status = 'mock',
}) {
  const [result] = await pool.execute(
    `INSERT INTO emergency_dispatches
     (user_id, hospital_osm_id, hospital_name, hospital_phone, guardian_phone,
      patient_snapshot, message_body, location_lat, location_lng, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      hospital?.osm_id || null,
      hospital?.name || null,
      hospital?.phone || null,
      guardianPhone || null,
      patientSnapshot ? JSON.stringify(patientSnapshot) : null,
      messageBody || null,
      location?.lat != null ? Number(location.lat) : null,
      location?.lng != null ? Number(location.lng) : null,
      status,
    ]
  );
  return result.insertId;
}

async function createSmsLog({
  userId = null,
  dispatchId = null,
  recipientType = 'other',
  recipientPhone,
  message,
  provider = 'mock',
  status = 'mock',
  errorMessage = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO sms_logs
     (user_id, dispatch_id, recipient_type, recipient_phone, message, provider, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, dispatchId, recipientType, recipientPhone, message, provider, status, errorMessage]
  );
  return result.insertId;
}

async function listByUser(userId, limit = 20) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const [rows] = await pool.execute(
    `SELECT id, hospital_osm_id, hospital_name, hospital_phone, guardian_phone,
            location_lat, location_lng, status, created_at
     FROM emergency_dispatches
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ${safeLimit}`,
    [userId]
  );
  return rows;
}

module.exports = {
  createDispatch,
  createSmsLog,
  listByUser,
};
