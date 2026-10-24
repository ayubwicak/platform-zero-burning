// Use SQLite for development (PostgreSQL not available)
const pool = require('./db-sqlite');

module.exports = pool;
