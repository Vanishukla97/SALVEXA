const { pool } = require('../config/db');

async function createUser({ name, email, passwordHash, termsAcceptedAt, termsVersion }) {
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash, terms_accepted_at, terms_version)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, passwordHash, termsAcceptedAt || null, termsVersion || null]
  );
  return result.insertId;
}

async function findByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function findById(userId) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, terms_accepted_at, terms_version, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function updateTermsConsent({ userId, termsVersion }) {
  await pool.execute(
    `UPDATE users
     SET terms_accepted_at = NOW(), terms_version = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [termsVersion, userId]
  );
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateTermsConsent,
};
