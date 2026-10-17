const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'Va@260106',
    database: 'salvexa',
  });
  const [t] = await c.query(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='salvexa' AND TABLE_NAME='hospital_lookup_cache'"
  );
  console.log('hospital_lookup_cache exists:', t.length > 0);
  await c.end();
})().catch((e) => console.log('ERR', e.message));
