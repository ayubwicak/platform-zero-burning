const Database = require('better-sqlite3');
const path = require('path');
const bcryptjs = require('bcryptjs');

// Create/open database di src/ directory
const dbPath = path.join(__dirname, 'src', 'zero_burning.db');
const db = new Database(dbPath);

console.log('Setting up SQLite database at:', dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nik TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'petani',
    email_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS farmers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER UNIQUE NOT NULL,
    verification_status TEXT DEFAULT 'unverified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS officers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER UNIQUE NOT NULL,
    officer_type TEXT DEFAULT 'verifikator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    name TEXT NOT NULL,
    area INTEGER NOT NULL,
    category TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS field_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    photo_hash TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    distance_from_center REAL NOT NULL,
    verification_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (field_id) REFERENCES fields(id)
  );

  CREATE TABLE IF NOT EXISTS email_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id INTEGER,
    description TEXT,
    operasional_activity TEXT,
    changes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES users(id)
  );
`);

// Insert admin user
const adminPassword = bcryptjs.hashSync('admin123', 10);
try {
  db.prepare(`
    INSERT INTO users (nama, email, nik, phone, address, password, role, email_verified, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Administrator',
    'admin@zeroburning.id',
    '9999999999999999',
    '+628123456789',
    'Jl. Admin',
    adminPassword,
    'admin',
    1,
    1
  );
  console.log('✓ Admin user created');
} catch (err) {
  if (err.message.includes('UNIQUE')) {
    console.log('✓ Admin user already exists');
  } else {
    console.error('Admin user error:', err.message);
  }
}

// Insert test user
const testPassword = bcryptjs.hashSync('petani123', 10);
try {
  db.prepare(`
    INSERT INTO users (nama, email, nik, phone, address, password, role, email_verified, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Test OTP User',
    'otp-test@test.com',
    '1111111111111111',
    '+628987654321',
    'Jl. Test',
    testPassword,
    'petani',
    1,
    1
  );
  console.log('✓ Test user created');
} catch (err) {
  if (err.message.includes('UNIQUE')) {
    console.log('✓ Test user already exists');
  } else {
    console.error('Test user error:', err.message);
  }
}

console.log('✓ SQLite database setup complete');
console.log('Database: zero_burning.db');
console.log('');
console.log('Login credentials:');
console.log('  Admin: admin@zeroburning.id / admin123');
console.log('  Test:  otp-test@test.com / petani123');

db.close();
