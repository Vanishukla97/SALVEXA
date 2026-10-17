const { pool } = require('../config/db');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    osm_id: row.hospital_osm_id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    speciality: row.speciality || null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    created_at: row.created_at,
  };
}

async function listByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT id, hospital_osm_id, name, address, phone, speciality, latitude, longitude, created_at
     FROM preferred_hospitals
     WHERE user_id = ?
     ORDER BY created_at ASC`,
    [userId]
  );
  return rows.map(mapRow);
}

async function replaceForUser(userId, hospitals = []) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM preferred_hospitals WHERE user_id = ?', [userId]);

    for (const hospital of hospitals) {
      const osmId = hospital.osm_id || hospital.hospital_osm_id;
      if (!osmId) continue;
      await connection.execute(
        `INSERT INTO preferred_hospitals
         (user_id, hospital_osm_id, name, address, phone, speciality, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          String(osmId),
          hospital.name || 'Unnamed hospital',
          hospital.address || null,
          hospital.phone || null,
          hospital.speciality || null,
          hospital.latitude != null ? Number(hospital.latitude) : null,
          hospital.longitude != null ? Number(hospital.longitude) : null,
        ]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return listByUser(userId);
}

async function deleteByUser(userId) {
  await pool.execute('DELETE FROM preferred_hospitals WHERE user_id = ?', [userId]);
}

module.exports = {
  listByUser,
  replaceForUser,
  deleteByUser,
};
