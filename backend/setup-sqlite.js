const Database = require('better-sqlite3');
const path = require('path');
const bcryptjs = require('bcryptjs');

// Create/open database di src/ directory (bisa dioverride lewat DB_PATH untuk test/CI)
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'src', 'zero_burning.db');
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
    nik VARCHAR(20),
    phone VARCHAR(20),
    address TEXT,
    verification_status TEXT DEFAULT 'unverified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS officers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER UNIQUE NOT NULL,
    officer_type TEXT DEFAULT 'verifikator',
    nip TEXT,
    position TEXT,
    unit TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    id_farmer INTEGER REFERENCES farmers(id),
    name TEXT NOT NULL,
    area INTEGER NOT NULL,
    category TEXT NOT NULL,
    crop_type VARCHAR(50),
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
    verification_status TEXT DEFAULT 'menunggu_verifikasi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (field_id) REFERENCES fields(id)
  );

  CREATE TABLE IF NOT EXISTS email_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    user_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    actor_name VARCHAR(100),
    actor_role VARCHAR(20),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    description TEXT,
    summary TEXT,
    metadata TEXT,
    operasional_activity TEXT,
    changes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS incentive_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'paket',
    requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS incentive_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES incentive_categories(id),
    claim_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'diajukan',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS incentive_distributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id INTEGER UNIQUE REFERENCES incentive_claims(id) ON DELETE CASCADE,
    officer_id INTEGER REFERENCES officers(id),
    category_id INTEGER REFERENCES incentive_categories(id),
    farmer_id INTEGER REFERENCES farmers(id),
    quantity INTEGER DEFAULT 1,
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receipt_proof TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS community_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id INTEGER REFERENCES field_photos(id) ON DELETE CASCADE,
    verifier_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('setuju', 'tidak_setuju')),
    note TEXT,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (photo_id, verifier_id)
  );

  CREATE TABLE IF NOT EXISTS official_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id INTEGER UNIQUE REFERENCES field_photos(id) ON DELETE CASCADE,
    officer_id INTEGER REFERENCES officers(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('lolos', 'tidak_lolos')),
    note TEXT,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_fields_farmer ON fields(id_farmer);
  CREATE INDEX IF NOT EXISTS idx_field_photos_field ON field_photos(field_id);
  CREATE INDEX IF NOT EXISTS idx_incentive_claims_farmer ON incentive_claims(farmer_id);
  CREATE INDEX IF NOT EXISTS idx_incentive_claims_status ON incentive_claims(status);
  CREATE INDEX IF NOT EXISTS idx_incentive_distributions_farmer ON incentive_distributions(farmer_id);
  CREATE INDEX IF NOT EXISTS idx_community_verifications_photo ON community_verifications(photo_id);
  CREATE INDEX IF NOT EXISTS idx_official_verifications_photo ON official_verifications(photo_id);

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at, created_at);
`);

// Migration helper: tambahkan kolom yang belum ada pada database lama
function ensureColumn(table, column, definition) {
  const columns = db.pragma(`table_info(${table})`).map((col) => col.name);
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`✓ Added ${table}.${column}`);
  }
}

ensureColumn('farmers', 'nik', 'VARCHAR(20)');
ensureColumn('farmers', 'phone', 'VARCHAR(20)');
ensureColumn('farmers', 'address', 'TEXT');
ensureColumn('officers', 'nip', 'TEXT');
ensureColumn('officers', 'position', 'TEXT');
ensureColumn('officers', 'unit', 'TEXT');
ensureColumn('fields', 'id_farmer', 'INTEGER REFERENCES farmers(id)');
ensureColumn('fields', 'crop_type', 'VARCHAR(50)');
ensureColumn('email_verifications', 'user_id', 'INTEGER');
ensureColumn('audit_logs', 'actor_name', 'VARCHAR(100)');
ensureColumn('audit_logs', 'actor_role', 'VARCHAR(20)');
ensureColumn('audit_logs', 'entity_type', 'TEXT');
ensureColumn('audit_logs', 'summary', 'TEXT');
ensureColumn('audit_logs', 'metadata', 'TEXT');

ensureColumn('incentive_claims', 'reason', 'TEXT');
ensureColumn('incentive_claims', 'processed_by', 'INTEGER REFERENCES users(id)');
ensureColumn('incentive_claims', 'processed_at', 'TIMESTAMP');

ensureColumn('field_photos', 'community_recommendation', 'VARCHAR(50)');
ensureColumn('field_photos', 'verified_by_system', 'BOOLEAN DEFAULT FALSE');

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

// Pastikan setiap user petani punya profil farmers
db.exec(`
  INSERT INTO farmers (id_user, nik, phone, address)
  SELECT u.id, u.nik, u.phone, u.address
  FROM users u
  WHERE u.role = 'petani'
    AND NOT EXISTS (SELECT 1 FROM farmers f WHERE f.id_user = u.id)
`);

// Sample kategori insentif (hanya jika belum ada)
const categoryCount = db.prepare('SELECT COUNT(*) AS total FROM incentive_categories').get().total;
if (categoryCount === 0) {
  const insertCategory = db.prepare(`
    INSERT INTO incentive_categories (name, description, quantity, unit, requirements)
    VALUES (?, ?, ?, ?, ?)
  `);
  const categories = [
    ['Pupuk Organik', 'Pupuk organik untuk lahan zero burning', 100, 'karung', 'Lahan aktif minimal 1000 m²'],
    ['Bibit Unggul', 'Bibit tanaman unggul', 50, 'paket', 'Lahan terverifikasi'],
    ['Alat Semprot', 'Alat semprot hama manual', 30, 'unit', 'Lahan aktif minimal 1000 m²'],
    ['Bantuan Tunai', 'Bantuan tunai insentif zero burning', 20, 'voucher Rp500.000', 'Lahan terverifikasi'],
  ];
  const insertMany = db.transaction((rows) => {
    rows.forEach((row) => insertCategory.run(...row));
  });
  insertMany(categories);
  console.log('✓ Sample incentive categories created');
}

console.log('✓ SQLite database setup complete');
console.log('Database: zero_burning.db');
console.log('');
console.log('Login credentials:');
console.log('  Admin: admin@zeroburning.id / admin123');
console.log('  Test:  otp-test@test.com / petani123');

db.close();
