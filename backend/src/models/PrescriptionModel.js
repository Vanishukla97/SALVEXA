const { pool } = require('../config/db');

async function createPrescription({
  userId,
  imagePath,
  extractedText,
  extractedMedicines,
  analysis,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO prescriptions (user_id, image_path, extracted_text, extracted_medicines, analysis_json)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        imagePath,
        extractedText,
        JSON.stringify(extractedMedicines || []),
        analysis ? JSON.stringify(analysis) : null,
      ]
    );

    for (const medicineName of extractedMedicines || []) {
      await connection.execute(
        `INSERT INTO prescription_medicines (prescription_id, medicine_name, confidence)
         VALUES (?, ?, ?)`,
        [result.insertId, medicineName, null]
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
    'SELECT * FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

async function getById(id, userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM prescriptions WHERE id = ? AND user_id = ? LIMIT 1',
    [id, userId]
  );
  return rows[0] || null;
}

module.exports = {
  createPrescription,
  listByUser,
  getById,
};
