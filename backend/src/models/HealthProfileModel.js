const { pool } = require('../config/db');

async function getByUserId(userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM health_profile WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

async function upsertByUserId(userId, payload) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      'SELECT id FROM health_profile WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const existing = existingRows[0] || null;

    const allergies = JSON.stringify(payload.allergies || []);
    const currentMedicines = JSON.stringify(payload.current_medicines || []);

    if (existing) {
      await connection.execute(
        `UPDATE health_profile
         SET age = ?, weight = ?, height = ?, gender = ?, medical_history = ?, allergies = ?, current_medicines = ?
         WHERE user_id = ?`,
        [
          payload.age ?? null,
          payload.weight ?? null,
          payload.height ?? null,
          payload.gender ?? null,
          payload.medical_history ?? null,
          allergies,
          currentMedicines,
          userId,
        ]
      );
    } else {
      await connection.execute(
        `INSERT INTO health_profile
         (user_id, age, weight, height, gender, medical_history, allergies, current_medicines)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          payload.age ?? null,
          payload.weight ?? null,
          payload.height ?? null,
          payload.gender ?? null,
          payload.medical_history ?? null,
          allergies,
          currentMedicines,
        ]
      );
    }

    await connection.execute('DELETE FROM profile_allergies WHERE user_id = ?', [userId]);
    for (const allergy of payload.allergies || []) {
      await connection.execute(
        'INSERT INTO profile_allergies (user_id, allergy_name) VALUES (?, ?)',
        [userId, allergy]
      );
    }

    await connection.execute('DELETE FROM profile_current_medicines WHERE user_id = ?', [userId]);
    for (const medicine of payload.current_medicines || []) {
      await connection.execute(
        'INSERT INTO profile_current_medicines (user_id, medicine_name) VALUES (?, ?)',
        [userId, medicine]
      );
    }

    await connection.commit();
    return getByUserId(userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteByUserId(userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM health_profile WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM profile_allergies WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM profile_current_medicines WHERE user_id = ?', [userId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getByUserId,
  upsertByUserId,
  deleteByUserId,
};
