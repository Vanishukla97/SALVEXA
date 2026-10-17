const { pool } = require('../config/db');

function mapRow(row) {
  return {
    osm_id: row.osm_id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    speciality: row.speciality || null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

async function findByBounds({ minLat, maxLat, minLng, maxLng, limit = 800 }) {
  const safeLimit = Math.min(2000, Math.max(1, Number(limit) || 800));
  const [rows] = await pool.execute(
    `SELECT osm_id, name, address, phone, speciality, latitude, longitude
     FROM hospitals
     WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?
     LIMIT ${safeLimit}`,
    [minLat, maxLat, minLng, maxLng]
  );
  return rows.map(mapRow);
}

async function countNearby({ minLat, maxLat, minLng, maxLng }) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM hospitals
     WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?
     LIMIT 1`,
    [minLat, maxLat, minLng, maxLng]
  );
  return Number(rows[0]?.total || 0);
}

async function count() {
  const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM hospitals');
  return Number(rows[0]?.total || 0);
}

async function bulkInsert(hospitals) {
  if (!hospitals.length) return 0;
  const values = [];
  const params = [];
  for (const hospital of hospitals) {
    values.push('(?, ?, ?, ?, ?, ?, ?)');
    params.push(
      hospital.osm_id,
      hospital.name,
      hospital.address,
      hospital.phone,
      hospital.speciality || null,
      hospital.latitude,
      hospital.longitude
    );
  }
  const [result] = await pool.execute(
    `INSERT INTO hospitals (osm_id, name, address, phone, speciality, latitude, longitude)
     VALUES ${values.join(',')}
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       address = VALUES(address),
       phone = VALUES(phone),
       speciality = VALUES(speciality),
       latitude = VALUES(latitude),
       longitude = VALUES(longitude)`,
    params
  );
  return result.affectedRows;
}

module.exports = { findByBounds, countNearby, count, bulkInsert };
