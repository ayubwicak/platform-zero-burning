-- Tabel users (akun semua aktor)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('petani', 'petugas', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel farmers (data petani)
CREATE TABLE IF NOT EXISTS farmers (
  id SERIAL PRIMARY KEY,
  id_user INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  nik VARCHAR(20) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel officers (data petugas lapangan)
CREATE TABLE IF NOT EXISTS officers (
  id SERIAL PRIMARY KEY,
  id_user INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  nip VARCHAR(20) UNIQUE NOT NULL,
  position VARCHAR(50),
  unit VARCHAR(100)
);

-- Tabel fields (lahan petani)
CREATE TABLE IF NOT EXISTS fields (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  area DECIMAL(10,2),
  crop_type VARCHAR(50),
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel field_photos (foto progres lahan)
CREATE TABLE IF NOT EXISTS field_photos (
  id SERIAL PRIMARY KEY,
  field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  taken_at TIMESTAMP NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  timestamp VARCHAR(50),
  photo_hash VARCHAR(64) NOT NULL,
  geofencing_valid BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'menunggu_verifikasi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel community_verifications (verifikasi komunitas)
CREATE TABLE IF NOT EXISTS community_verifications (
  id SERIAL PRIMARY KEY,
  photo_id INTEGER REFERENCES field_photos(id) ON DELETE CASCADE,
  verifier_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('setuju', 'tidak_setuju')),
  note TEXT,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (photo_id, verifier_id)
);

-- Tabel official_verifications (verifikasi resmi petugas)
CREATE TABLE IF NOT EXISTS official_verifications (
  id SERIAL PRIMARY KEY,
  photo_id INTEGER UNIQUE REFERENCES field_photos(id) ON DELETE CASCADE,
  officer_id INTEGER REFERENCES officers(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('lolos', 'tidak_lolos')),
  note TEXT,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel incentive_categories (katalog insentif)
CREATE TABLE IF NOT EXISTS incentive_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 0,
  requirements TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel incentive_claims (klaim insentif petani)
CREATE TABLE IF NOT EXISTS incentive_claims (
  id SERIAL PRIMARY KEY,
  field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
  farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
  claim_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'diajukan',
  category_id INTEGER REFERENCES incentive_categories(id)
);

-- Tabel incentive_distributions (distribusi insentif)
CREATE TABLE IF NOT EXISTS incentive_distributions (
  id SERIAL PRIMARY KEY,
  claim_id INTEGER UNIQUE REFERENCES incentive_claims(id) ON DELETE CASCADE,
  officer_id INTEGER REFERENCES officers(id),
  category_id INTEGER REFERENCES incentive_categories(id),
  distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  receipt_proof TEXT
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_fields_farmer_id ON fields(farmer_id);
CREATE INDEX IF NOT EXISTS idx_field_photos_field_id ON field_photos(field_id);
CREATE INDEX IF NOT EXISTS idx_community_verifications_photo_id ON community_verifications(photo_id);
CREATE INDEX IF NOT EXISTS idx_incentive_claims_farmer_id ON incentive_claims(farmer_id);