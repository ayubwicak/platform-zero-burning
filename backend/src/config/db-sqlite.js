const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../zero_burning.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create a compatible Pool-like interface for better-sqlite3
class SQLitePool {
  constructor() {
    // better-sqlite3 memakai satu koneksi. Serialisasi transaksi agar dua
    // request bersamaan tidak saling menimpa BEGIN/COMMIT.
    this._transactionLock = Promise.resolve();
  }

  query(sql, params) {
    return new Promise((resolve, reject) => {
      try {
        // Normalize SQL for SQLite
        let normalizedSql = sql
          .replace(/\$\d+/g, '?')
          .replace(/RETURNING \*/g, '')
          .replace(/ON CONFLICT[^;]*/gi, '')
          .replace(/FOR UPDATE/gi, '');

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
          // Other commands (BEGIN, COMMIT, ROLLBACK)
          const upper = sql.trim().toUpperCase();
          try {
            db.exec(normalizedSql);
          } catch (error) {
            const noActiveTransaction = /no transaction is active/i.test(error.message || '');
            const isTransactionEnd = upper.startsWith('ROLLBACK') || upper.startsWith('COMMIT');
            if (!(isTransactionEnd && noActiveTransaction)) {
              throw error;
            }
          }
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

  // Add connect method for transaction support (serialized)
  connect() {
    let releaseLock;
    const lockAcquired = new Promise((resolve) => {
      releaseLock = resolve;
    });

    const previousLock = this._transactionLock;
    this._transactionLock = previousLock.then(() => lockAcquired);

    return previousLock.then(() => ({
      query: this.query.bind(this),
      release: () => releaseLock(),
    }));
  }

  on(_event, _handler) {
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
