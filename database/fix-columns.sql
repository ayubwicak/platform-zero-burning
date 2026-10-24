-- Tambahkan kolom yang hilang ke tabel farmers
ALTER TABLE farmers ADD COLUMN nik VARCHAR(20);
ALTER TABLE farmers ADD COLUMN phone VARCHAR(20);
ALTER TABLE farmers ADD COLUMN address TEXT;
ALTER TABLE farmers ADD COLUMN registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Tambahkan kolom yang hilang ke tabel fields
ALTER TABLE fields ADD COLUMN id_farmer INTEGER REFERENCES farmers(id);
ALTER TABLE fields ADD COLUMN name VARCHAR(100);
ALTER TABLE fields ADD COLUMN area DECIMAL(10,2);
ALTER TABLE fields ADD COLUMN crop_type VARCHAR(50);
ALTER TABLE fields ADD COLUMN status VARCHAR(20) DEFAULT 'active';
ALTER TABLE fields ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Tambahkan kolom yang hilang ke tabel field_photos
ALTER TABLE field_photos ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending';

-- Tambahkan kolom yang hilang ke tabel audit_logs untuk kompatibilitas
ALTER TABLE audit_logs ADD COLUMN actor_name VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN actor_role VARCHAR(20);
ALTER TABLE audit_logs ADD COLUMN entity_type TEXT;
ALTER TABLE audit_logs ADD COLUMN summary TEXT;
ALTER TABLE audit_logs ADD COLUMN metadata TEXT;

-- Update entity_type dari entity yang sudah ada
UPDATE audit_logs SET entity_type = entity WHERE entity_type IS NULL;
UPDATE audit_logs SET summary = description WHERE summary IS NULL;
UPDATE audit_logs SET actor_name = 'Sistem' WHERE actor_name IS NULL;
UPDATE audit_logs SET actor_role = 'system' WHERE actor_role IS NULL;
