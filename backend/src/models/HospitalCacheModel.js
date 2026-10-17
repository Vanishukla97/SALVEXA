const { pool } = require('../config/db');

function parsePayload(row) {
  if (!row || row.payload == null) return [];
  const raw = typeof row.payload === 'string' ? row.payload : JSON.stringify(row.payload);
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function get(cacheKey) {
  const [rows] = await pool.execute(
    'SELECT payload, fetched_at FROM hospital_lookup_cache WHERE cache_key = ? LIMIT 1',
    [cacheKey]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    hospitals: parsePayload(row),
    storedAt: new Date(row.fetched_at).getTime(),
  };
}

async function set(cacheKey, hospitals) {
  await pool.execute(
    `INSERT INTO hospital_lookup_cache (cache_key, payload, fetched_at)
     VALUES (?, CAST(? AS JSON), NOW())
     ON DUPLICATE KEY UPDATE payload = VALUES(payload), fetched_at = VALUES(fetched_at)`,
    [cacheKey, JSON.stringify(hospitals)]
  );
}

module.exports = { get, set };
