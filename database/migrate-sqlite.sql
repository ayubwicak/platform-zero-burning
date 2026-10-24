-- Migration untuk menambahkan tabel yang hilang (SQLite)
-- Jalankan: sqlite3 zero_burning.db < migrate-sqlite.sql

-- Tambah kolom yang hilang di farmers
ALTER TABLE farmers ADD COLUMN nik VARCHAR(20);
ALTER TABLE farmers ADD COLUMN phone VARCHAR(20);
ALTER TABLE farmers ADD COLUMN address TEXT;
ALTER TABLE farmers ADD COLUMN registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Tambah kolom di fields jika belum ada
ALTER TABLE fields ADD COLUMN id_farmer INTEGER REFERENCES farmers(id);
ALTER TABLE fields ADD COLUMN name VARCHAR(100);
ALTER TABLE fields ADD COLUMN area DECIMAL(10,2);
ALTER TABLE fields ADD COLUMN crop_type VARCHAR(50);
ALTER TABLE fields ADD COLUMN status VARCHAR(20) DEFAULT 'active';
ALTER TABLE fields ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Tambah kolom di field_photos jika belum ada
ALTER TABLE field_photos ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending';

-- Tabel officers (petugas lapangan)
CREATE TABLE IF NOT EXISTS officers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_user INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  nip VARCHAR(20) UNIQUE,
  position VARCHAR(50),
  unit VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel incentive_categories (katalog insentif)
CREATE TABLE IF NOT EXISTS incentive_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 0,
  unit VARCHAR(50),
  requirements TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel incentive_claims (klaim insentif petani)
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

-- Tabel incentive_distributions (distribusi insentif)
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

-- Tabel community_verifications (verifikasi komunitas)
CREATE TABLE IF NOT EXISTS community_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  photo_id INTEGER REFERENCES field_photos(id) ON DELETE CASCADE,
  verifier_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('setuju', 'tidak_setuju')),
  note TEXT,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (photo_id, verifier_id)
);

-- Tabel official_verifications (verifikasi resmi petugas)
CREATE TABLE IF NOT EXISTS official_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  photo_id INTEGER UNIQUE REFERENCES field_photos(id) ON DELETE CASCADE,
  officer_id INTEGER REFERENCES officers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('lolos', 'tidak_lolos')),
  note TEXT,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_fields_id_farmer ON fields(id_farmer);
CREATE INDEX IF NOT EXISTS idx_field_photos_verification_status ON field_photos(verification_status);
CREATE INDEX IF NOT EXISTS idx_incentive_claims_farmer_id ON incentive_claims(farmer_id);
CREATE INDEX IF NOT EXISTS idx_incentive_claims_status ON incentive_claims(status);
CREATE INDEX IF NOT EXISTS idx_incentive_distributions_farmer_id ON incentive_distributions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_community_verifications_photo_id ON community_verifications(photo_id);
CREATE INDEX IF NOT EXISTS idx_official_verifications_photo_id ON official_verifications(photo_id);
