const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const TEST_DB_PATH = path.join(__dirname, '..', 'src', 'zero_burning.test.db');
const SETUP_SCRIPT = path.join(__dirname, '..', 'setup-sqlite.js');

module.exports = async () => {
  // Selalu mulai dari database test yang bersih agar hasil test deterministik.
  fs.rmSync(TEST_DB_PATH, { force: true });
  fs.rmSync(`${TEST_DB_PATH}-journal`, { force: true });
  fs.rmSync(`${TEST_DB_PATH}-wal`, { force: true });
  fs.rmSync(`${TEST_DB_PATH}-shm`, { force: true });

  try {
    execFileSync(process.execPath, [SETUP_SCRIPT], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DB_PATH: TEST_DB_PATH,
      },
      stdio: 'pipe',
    });
  } catch (error) {
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    throw error;
  }
};
