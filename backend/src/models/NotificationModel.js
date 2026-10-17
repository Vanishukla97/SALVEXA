const { pool } = require('../config/db');

async function createNotification({
  userId,
  type,
  priority = 'info',
  title,
  message,
  deepLink = null,
  meta = null,
  scheduledFor = null,
  deliveredAt = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO notifications
     (user_id, type, priority, title, message, deep_link, meta_json, scheduled_for, delivered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      type,
      priority,
      title,
      message,
      deepLink,
      meta ? JSON.stringify(meta) : null,
      scheduledFor,
      deliveredAt,
    ]
  );
  return result.insertId;
}

async function listByUser({
  userId,
  priority = null,
  type = null,
  unreadOnly = false,
  page = 1,
  limit = 20,
}) {
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (safePage - 1) * safeLimit;

  const where = ['user_id = ?', 'is_hidden = 0', 'delivered_at IS NOT NULL'];
  const params = [userId];

  if (priority) {
    where.push('priority = ?');
    params.push(priority);
  }
  if (type) {
    where.push('type = ?');
    params.push(type);
  }
  if (unreadOnly) {
    where.push('is_read = 0');
  }

  const [rows] = await pool.execute(
    `SELECT id, type, priority, title, message, deep_link, meta_json, is_read, created_at, delivered_at
     FROM notifications
     WHERE ${where.join(' AND ')}
     ORDER BY
       CASE priority
         WHEN 'critical' THEN 1
         WHEN 'important' THEN 2
         ELSE 3
       END ASC,
       created_at DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );
  return rows;
}

async function getUnreadCount(userId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM notifications
     WHERE user_id = ? AND is_hidden = 0 AND is_read = 0 AND delivered_at IS NOT NULL`,
    [userId]
  );
  return Number(rows[0]?.count || 0);
}

async function markRead(id, userId) {
  const [result] = await pool.execute(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}

async function markAllRead(userId) {
  const [result] = await pool.execute(
    `UPDATE notifications
     SET is_read = 1
     WHERE user_id = ? AND is_hidden = 0 AND delivered_at IS NOT NULL`,
    [userId]
  );
  return result.affectedRows;
}

async function getById(id, userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM notifications WHERE id = ? AND user_id = ? LIMIT 1',
    [id, userId]
  );
  return rows[0] || null;
}

async function hideById(id, userId) {
  const [result] = await pool.execute(
    'UPDATE notifications SET is_hidden = 1 WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}

async function deliverDueScheduled() {
  const [result] = await pool.execute(
    `UPDATE notifications
     SET delivered_at = NOW()
     WHERE delivered_at IS NULL AND scheduled_for IS NOT NULL AND scheduled_for <= NOW()`
  );
  return result.affectedRows;
}

async function hasRecentTypeNotification({ userId, type, hours = 24 }) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM notifications
     WHERE user_id = ? AND type = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
     LIMIT 1`,
    [userId, type, hours]
  );
  return Boolean(rows[0]);
}

module.exports = {
  createNotification,
  listByUser,
  getUnreadCount,
  markRead,
  markAllRead,
  getById,
  hideById,
  deliverDueScheduled,
  hasRecentTypeNotification,
};
