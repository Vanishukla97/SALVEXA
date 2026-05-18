const { pool } = require('../config/db');

async function createSymptomRecord(userId, payload) {
  const symptomsList = JSON.stringify(payload.symptoms || []);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO symptoms
       (user_id, symptoms_list, symptom_text, duration, severity, frequency)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        symptomsList,
        payload.symptom_text || null,
        payload.duration || null,
        payload.severity || null,
        payload.frequency || null,
      ]
    );

    for (const symptomName of payload.symptoms || []) {
      await connection.execute(
        'INSERT INTO symptom_items (symptom_record_id, symptom_name) VALUES (?, ?)',
        [result.insertId, symptomName]
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

async function getById(recordId, userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM symptoms WHERE id = ? AND user_id = ? LIMIT 1',
    [recordId, userId]
  );
  return rows[0] || null;
}

async function updateById(recordId, userId, payload) {
  const symptomsList = JSON.stringify(payload.symptoms || []);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `UPDATE symptoms
       SET symptoms_list = ?, symptom_text = ?, duration = ?, severity = ?, frequency = ?
       WHERE id = ? AND user_id = ?`,
      [
        symptomsList,
        payload.symptom_text || null,
        payload.duration || null,
        payload.severity || null,
        payload.frequency || null,
        recordId,
        userId,
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return false;
    }

    await connection.execute('DELETE FROM symptom_items WHERE symptom_record_id = ?', [recordId]);
    for (const symptomName of payload.symptoms || []) {
      await connection.execute(
        'INSERT INTO symptom_items (symptom_record_id, symptom_name) VALUES (?, ?)',
        [recordId, symptomName]
      );
    }
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteById(recordId, userId) {
  const [result] = await pool.execute(
    'DELETE FROM symptoms WHERE id = ? AND user_id = ?',
    [recordId, userId]
  );
  return result.affectedRows > 0;
}

async function listByUser(userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM symptoms WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

module.exports = {
  createSymptomRecord,
  getById,
  updateById,
  deleteById,
  listByUser,
};
