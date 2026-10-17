const { pool } = require('../config/db');

async function listMedicines() {
  const [rows] = await pool.execute('SELECT * FROM medicines ORDER BY name ASC');
  return rows;
}

async function getById(id) {
  const [rows] = await pool.execute('SELECT * FROM medicines WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function findByName(name) {
  const [rows] = await pool.execute(
    'SELECT * FROM medicines WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [name]
  );
  return rows[0] || null;
}

module.exports = {
  listMedicines,
  getById,
  findByName,
};
