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

-- Akun admin awal (development)
-- Email: admin@zeroburning.id | Password: admin123
-- WAJIB ganti password setelah login pertama di lingkungan produksi.
INSERT INTO users (nama, email, password, role) VALUES
  ('Administrator', 'admin@zeroburning.id', '$2a$10$6qsCoYOBdBPrWxaG638U6OPHlK6N0odWLj0iZoumQF8UEsqAvzSNa', 'admin')
ON CONFLICT (email) DO NOTHING;
