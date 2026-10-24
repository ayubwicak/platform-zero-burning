-- Migration untuk menambahkan tabel yang hilang (SQLite) - Versi Aman
-- Hanya membuat tabel baru, tidak mengubah tabel yang sudah ada

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
  unit VARCHAR(50) DEFAULT 'paket',
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
CREATE INDEX IF NOT EXISTS idx_incentive_claims_farmer_id ON incentive_claims(farmer_id);
CREATE INDEX IF NOT EXISTS idx_incentive_claims_status ON incentive_claims(status);
CREATE INDEX IF NOT EXISTS idx_incentive_distributions_farmer_id ON incentive_distributions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_community_verifications_photo_id ON community_verifications(photo_id);
CREATE INDEX IF NOT EXISTS idx_official_verifications_photo_id ON official_verifications(photo_id);

-- Insert sample data untuk katalog insentif
INSERT OR IGNORE INTO incentive_categories (id, name, description, quantity, unit, requirements) VALUES
(1, 'Pupuk Organik', 'Pupuk kompos organik untuk lahan tanpa bakar', 100, 'karung 20kg', 'Lahan terverifikasi bebas pembakaran'),
(2, 'Bibit Unggul', 'Bibit padi unggul tahan hama', 50, 'paket', 'Minimal 2 foto progres terverifikasi'),
(3, 'Alat Semprot', 'Alat semprot hama manual', 30, 'unit', 'Lahan aktif minimal 1000 m²'),
(4, 'Bantuan Tunai', 'Bantuan tunai insentif zero burning', 20, 'voucher Rp500.000', 'Lahan terverifikasi dengan skor komunitas >80%');
