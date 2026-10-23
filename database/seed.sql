-- Kategori insentif awal (idempoten)
INSERT INTO incentive_categories (name, quantity, requirements)
SELECT v.name, v.quantity, v.requirements
FROM (VALUES
  ('Benih Padi', 100, 'Petani dengan lahan minimal 0.25 ha dan terverifikasi zero burning'),
  ('Pupuk Organik', 200, 'Petani dengan lahan terverifikasi zero burning minimal 1 periode'),
  ('Alat Pengolahan Lahan', 50, 'Petani kelompok tani dengan lahan terverifikasi zero burning')
) AS v(name, quantity, requirements)
WHERE NOT EXISTS (
  SELECT 1 FROM incentive_categories c WHERE c.name = v.name
);

-- Clear data lama (dev only)
DELETE FROM farmers WHERE nik = '1234567890123456';
DELETE FROM users WHERE email IN ('petani@test.com', 'admin@zeroburning.id');

-- Akun admin awal (development)
-- Email: admin@zeroburning.id | Password: admin123
INSERT INTO users (nama, email, password, role, email_verified) VALUES
  ('Administrator', 'admin@zeroburning.id', '$2a$10$dtypw91qmpATqv5RyGkIrO3FQNFGhuIqzwkY2vu/ZfIvmzC/XVrHG', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Akun petani test (development - pre-verified)
-- Email: petani@test.com | Password: petani123
INSERT INTO users (nama, email, password, role, email_verified) VALUES
  ('Petani Test', 'petani@test.com', '$2a$10$hFHZ12twC.A6Nu/0QHTdLOrfnxBQVTQtThLNIjUlwWAYrKMfAWYXq', 'petani', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Profil petani test
INSERT INTO farmers (id_user, nik, phone, address)
SELECT u.id, '1234567890123456', '081234567890', 'Jl. Test No. 123'
FROM users u WHERE u.email = 'petani@test.com'
ON CONFLICT (id_user) DO NOTHING;
