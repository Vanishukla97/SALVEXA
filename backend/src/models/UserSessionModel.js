const { pool } = require('../config/db');

async function createSession({ userId, tokenHash, expiresAt }) {
  await pool.execute(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );
}

async function findActiveSession(tokenHash) {
  const [rows] = await pool.execute(
    `SELECT * FROM user_sessions
     WHERE token_hash = ? AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function deleteSession(tokenHash) {
  await pool.execute('DELETE FROM user_sessions WHERE token_hash = ?', [tokenHash]);
}

async function deleteSessionsByUserId(userId) {
  await pool.execute('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
}

module.exports = {
  createSession,
  findActiveSession,
  deleteSession,
  deleteSessionsByUserId,
};
