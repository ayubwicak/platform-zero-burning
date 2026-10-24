const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../zero_burning.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create a compatible Pool-like interface for better-sqlite3
class SQLitePool {
  query(sql, params) {
    return new Promise((resolve, reject) => {
      try {
        // Normalize SQL for SQLite
        let normalizedSql = sql
          .replace(/\$(\d+)/g, (match, num) => '?')
          .replace(/RETURNING \*/g, '')
          .replace(/ON CONFLICT[^;]*/gi, '');

        // Prepare and run query
        const stmt = db.prepare(normalizedSql);
        
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          // SELECT query
          const result = stmt.all(...(params || []));
          resolve({
            rows: result,
            command: 'SELECT',
            rowCount: result.length
          });
        } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
          // INSERT query
          const result = stmt.run(...(params || []));
          resolve({
            rows: [{ id: result.lastInsertRowid }],
            command: 'INSERT',
            rowCount: result.changes
          });
        } else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
          // UPDATE query
          const result = stmt.run(...(params || []));
          resolve({
            rows: [],
            command: 'UPDATE',
            rowCount: result.changes
          });
        } else if (sql.trim().toUpperCase().startsWith('DELETE')) {
          // DELETE query
          const result = stmt.run(...(params || []));
          resolve({
            rows: [],
            command: 'DELETE',
            rowCount: result.changes
          });
        } else {
          // Other commands
          db.exec(sql);
          resolve({
            rows: [],
            command: 'UNKNOWN',
            rowCount: 0
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  on(event, handler) {
    // Silently ignore event listeners
  }

  end() {
    try {
      db.close();
    } catch (err) {
      console.error('Error closing database:', err);
    }
  }
}

const pool = new SQLitePool();

console.log(`Connected to SQLite database: ${dbPath}`);

module.exports = pool;
