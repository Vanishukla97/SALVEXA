const { pool } = require('../config/db');

async function createRecommendation({
  userId,
  symptomRecordId,
  medicineId,
  dosage,
  instructions,
  warnings,
  warningList,
  recommendationReason,
  isSafe,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO recommendations
       (user_id, symptom_record_id, medicine_id, dosage, instructions, warnings, is_safe, recommendation_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        symptomRecordId,
        medicineId,
        dosage || null,
        instructions || null,
        warnings || null,
        isSafe ? 1 : 0,
        recommendationReason || null,
      ]
    );

    for (const warningMessage of warningList || []) {
      await connection.execute(
        `INSERT INTO recommendation_safety_checks
         (recommendation_id, check_type, check_message, severity)
         VALUES (?, ?, ?, ?)`,
        [
          result.insertId,
          'other',
          warningMessage,
          isSafe ? 'info' : 'warning',
        ]
      );
    }

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT r.*, m.name AS medicine_name
     FROM recommendations r
     LEFT JOIN medicines m ON m.id = r.medicine_id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return rows;
}

async function getById(id, userId) {
  const [rows] = await pool.execute(
    `SELECT r.*, m.name AS medicine_name
     FROM recommendations r
     LEFT JOIN medicines m ON m.id = r.medicine_id
     WHERE r.id = ? AND r.user_id = ? LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
}

async function listSafetyChecks(recommendationId) {
  const [rows] = await pool.execute(
    `SELECT check_type, check_message, severity, created_at
     FROM recommendation_safety_checks
     WHERE recommendation_id = ?
     ORDER BY id ASC`,
    [recommendationId]
  );
  return rows;
}

module.exports = {
  createRecommendation,
  listByUser,
  getById,
  listSafetyChecks,
};
