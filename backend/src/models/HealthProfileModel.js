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
         SET age = ?, weight = ?, height = ?, gender = ?, blood_group = ?,
             medical_history = ?, past_surgeries = ?, guardian_name = ?, guardian_relation = ?,
             guardian_phone = ?, allergies = ?, current_medicines = ?
         WHERE user_id = ?`,
        [
          payload.age ?? null,
          payload.weight ?? null,
          payload.height ?? null,
          payload.gender ?? null,
          payload.blood_group ?? null,
          payload.medical_history ?? null,
          payload.past_surgeries ?? null,
          payload.guardian_name ?? null,
          payload.guardian_relation ?? null,
          payload.guardian_phone ?? null,
          allergies,
          currentMedicines,
          userId,
        ]
      );
    } else {
      await connection.execute(
        `INSERT INTO health_profile
         (user_id, age, weight, height, gender, blood_group, medical_history, past_surgeries,
          guardian_name, guardian_relation, guardian_phone, allergies, current_medicines)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          payload.age ?? null,
          payload.weight ?? null,
          payload.height ?? null,
          payload.gender ?? null,
          payload.blood_group ?? null,
          payload.medical_history ?? null,
          payload.past_surgeries ?? null,
          payload.guardian_name ?? null,
          payload.guardian_relation ?? null,
          payload.guardian_phone ?? null,
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

async function setAvatarPath(userId, avatarPath) {
  await pool.execute(
    `UPDATE health_profile SET avatar_path = ? WHERE user_id = ?`,
    [avatarPath, userId]
  );
}

async function clearMedicalHistory(userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE health_profile SET weight = NULL, height = NULL, age = NULL, gender = NULL, blood_group = NULL, medical_history = NULL, past_surgeries = NULL, allergies = NULL, current_medicines = NULL WHERE user_id = ?`,
      [userId]
    );
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
  setAvatarPath,
  clearMedicalHistory,
};
