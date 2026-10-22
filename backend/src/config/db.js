const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('Terhubung ke database PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Kesalahan koneksi database:', err);
});

module.exports = pool;