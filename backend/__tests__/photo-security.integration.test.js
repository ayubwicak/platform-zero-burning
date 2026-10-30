const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const SECURITY_TEST_EMAILS = [
  'sec-farmer-a@test.com',
  'sec-farmer-b@test.com',
  'sec-admin@test.com',
];

// Valid minimal 1x1 JPEG buffer with correct magic bytes (FF D8 FF ...)
const VALID_JPEG_BUFFER = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07,
  0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 0x13, 0x0F,
  0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C,
  0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D,
  0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01,
  0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01,
  0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
  0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xBF,
  0x00, 0xFF, 0xD9,
]);

async function cleanupSecurityTestData() {
  await pool.query(
    `DELETE FROM field_photos
     WHERE field_id IN (
       SELECT f.id FROM fields f
       JOIN users u ON u.id = f.id_user
       WHERE u.email IN (?, ?, ?)
     )`,
    SECURITY_TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM fields
     WHERE id_user IN (SELECT id FROM users WHERE email IN (?, ?, ?))`,
    SECURITY_TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM farmers
     WHERE id_user IN (SELECT id FROM users WHERE email IN (?, ?, ?))`,
    SECURITY_TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM audit_logs
     WHERE actor_id IN (SELECT id FROM users WHERE email IN (?, ?, ?))`,
    SECURITY_TEST_EMAILS
  );
  await pool.query('DELETE FROM email_verifications WHERE email IN (?, ?, ?)', SECURITY_TEST_EMAILS);
  await pool.query('DELETE FROM users WHERE email IN (?, ?, ?)', SECURITY_TEST_EMAILS);
}

describe('Pengujian Keamanan Foto, Geofencing, dan Otorisasi', () => {
  let tokenFarmerA;
  let tokenFarmerB;
  let tokenAdmin;
  let fieldAId;
  let fieldBId;

  // Titik pusat Lahan A: Monas Jakarta (-6.175392, 106.827153)
  const CENTER_LAT_A = -6.175392;
  const CENTER_LNG_A = 106.827153;

  beforeAll(async () => {
    // Nonaktifkan rate limit ketat selama test ini agar tidak mengganggu test security
    process.env.UPLOAD_RATE_LIMIT = '1000';

    await cleanupSecurityTestData();

    // 1. Registrasi & Login Petani A
    await request(app)
      .post('/api/auth/register')
      .send({
        nama: 'Farmer Security A',
        email: 'sec-farmer-a@test.com',
        nik: '7111111111111111',
        phone: '+6281111111111',
        address: 'Jl. Merdeka Barat No. 1',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    const resLoginA = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sec-farmer-a@test.com', password: 'Password123!' });
    tokenFarmerA = resLoginA.body.token;

    // Buat Lahan A
    const resFieldA = await request(app)
      .post('/api/fields')
      .set('Authorization', `Bearer ${tokenFarmerA}`)
      .send({
        name: 'Lahan Gambut A',
        area: 2.0,
        latitude: CENTER_LAT_A,
        longitude: CENTER_LNG_A,
        crop_type: 'Padi',
      });
    fieldAId = resFieldA.body.data.id;

    // 2. Registrasi & Login Petani B
    await request(app)
      .post('/api/auth/register')
      .send({
        nama: 'Farmer Security B',
        email: 'sec-farmer-b@test.com',
        nik: '7222222222222222',
        phone: '+6282222222222',
        address: 'Jl. Merdeka Timur No. 2',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    const resLoginB = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sec-farmer-b@test.com', password: 'Password123!' });
    tokenFarmerB = resLoginB.body.token;

    // Buat Lahan B
    const resFieldB = await request(app)
      .post('/api/fields')
      .set('Authorization', `Bearer ${tokenFarmerB}`)
      .send({
        name: 'Lahan Jagung B',
        area: 1.5,
        latitude: -6.2000,
        longitude: 106.8500,
        crop_type: 'Jagung',
      });
    fieldBId = resFieldB.body.data.id;

    // 3. Login sebagai Admin
    const resAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@zeroburning.id', password: 'admin123' });
    tokenAdmin = resAdmin.body.token;
  });

  afterAll(async () => {
    delete process.env.UPLOAD_RATE_LIMIT;
    await cleanupSecurityTestData();
  });

  describe('1. Validasi Radius Geofencing (Maksimal 50 Meter)', () => {
    it('Harus menerima foto jika jarak <= 50 meter dari titik pusat lahan', async () => {
      // Pergeseran sangat kecil (~10 meter dari titik lahan)
      const latWithin = CENTER_LAT_A + 0.00008;
      const lngWithin = CENTER_LNG_A + 0.00005;

      const res = await request(app)
        .post('/api/photos')
        .set('Authorization', `Bearer ${tokenFarmerA}`)
        .field('field_id', fieldAId)
        .field('latitude', latWithin)
        .field('longitude', lngWithin)
        .attach('foto', VALID_JPEG_BUFFER, 'valid-distance.jpg');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.distance_from_center).toBeLessThanOrEqual(50);
    });

    it('Harus menolak foto jika jarak > 50 meter dari titik pusat lahan (mis. jarak ~300m)', async () => {
      // Geser latitude sekitar 300 meter
      const latOutside = CENTER_LAT_A + 0.003;
      const lngOutside = CENTER_LNG_A;

      const buf = Buffer.concat([VALID_JPEG_BUFFER, Buffer.from('unique-outside-1')]);

      const res = await request(app)
        .post('/api/photos')
        .set('Authorization', `Bearer ${tokenFarmerA}`)
        .field('field_id', fieldAId)
        .field('latitude', latOutside)
        .field('longitude', lngOutside)
        .attach('foto', buf, 'outside.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('di luar radius lahan terdaftar');
      expect(res.body.distance).toBeGreaterThan(50);
    });

    it('Harus menolak koordinat GPS yang di luar rentang valid (spoofing / bad payload)', async () => {
      const res = await request(app)
        .post('/api/photos')
        .set('Authorization', `Bearer ${tokenFarmerA}`)
        .field('field_id', fieldAId)
        .field('latitude', 150) // Latitude > 90 invalid
        .field('longitude', 106.827153)
        .attach('foto', VALID_JPEG_BUFFER, 'invalid-coord.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Koordinat GPS tidak valid');
    });

    it('Harus menolak jika koordinat GPS kosong / tidak dikirim', async () => {
      const res = await request(app)
        .post('/api/photos')
        .set('Authorization', `Bearer ${tokenFarmerA}`)
        .field('field_id', fieldAId)
        .attach('foto', VALID_JPEG_BUFFER, 'missing-coord.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('latitude, dan longitude diperlukan');
    });
  });

  describe('2. Pencegahan Duplikasi Foto (SHA-256 Anti-Sybil / Anti-Duplicate)', () => {
    it('Harus menolak foto yang identik (SHA-256 sama) pada lahan yang sama dengan HTTP 409', async () => {
      // Siapkan buffer unik untuk uji duplikasi
      const uniqueBuf = Buffer.concat([VALID_JPEG_BUFFER, Buffer.from('unique-hash-check-123')]);

      // Unggahan pertama: Harus berhasil
      const res1 = await request(app)
        .post('/api/photos')
        .set('Authorization', `Bearer ${tokenFarmerA}`)
        .field('field_id', fieldAId)
        .field('latitude', CENTER_LAT_A)
        .field('longitude', CENTER_LNG_A)
        .attach('foto', uniqueBuf, 'asli.jpg');

      expect(res1.status).toBe(201);

      // Unggahan kedua: Menggunakan buffer dan file identik yang persis sama
      const res2 = await request(app)
        .post('/api/photos')
        .set('Authorization', `Bearer ${tokenFarmerA}`)
        .field('field_id', fieldAId)
        .field('latitude', CENTER_LAT_A)
        .field('longitude', CENTER_LNG_A)
        .attach('foto', uniqueBuf, 'duplikat-asli.jpg');

      expect(res2.status).toBe(409);
      expect(res2.body.error).toContain('sudah pernah diunggah');
    });
  });

  describe('3. Validasi Keaslian File (Magic Bytes Validation)', () => {
    it('Harus menolak script executable atau file teks yang disamarkan sebagai gambar (.jpg)', async () => {
      const fakeImageScript = Buffer.from('<?php echo "evil script execution"; ?>');

      const res = await request(app)
        .post('/api/photos')
        .set('Authorization', `Bearer ${tokenFarmerA}`)
        .field('field_id', fieldAId)
        .field('latitude', CENTER_LAT_A)
        .field('longitude', CENTER_LNG_A)
        .attach('foto', fakeImageScript, 'exploit.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('File bukan gambar valid');
    });
  });

  describe('4. Proteksi Otorisasi & Kepemilikan Lahan (BOLA / IDOR)', () => {
    it('Petani B TIDAK boleh mengunggah foto ke lahan milik Petani A', async () => {
      const buf = Buffer.concat([VALID_JPEG_BUFFER, Buffer.from('farmer-b-trying-lahan-a')]);

      const res = await request(app)
        .post('/api/photos')
        .set('Authorization', `Bearer ${tokenFarmerB}`)
        .field('field_id', fieldAId) // Mencoba field_id milik Petani A
        .field('latitude', CENTER_LAT_A)
        .field('longitude', CENTER_LNG_A)
        .attach('foto', buf, 'unauthorized-target.jpg');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Lahan tidak ditemukan');
    });

    it('Request tanpa token autentikasi harus ditolak dengan status 401', async () => {
      const res = await request(app)
        .post('/api/photos')
        .field('field_id', fieldAId)
        .field('latitude', CENTER_LAT_A)
        .field('longitude', CENTER_LNG_A)
        .attach('foto', VALID_JPEG_BUFFER, 'no-token.jpg');

      expect(res.status).toBe(401);
    });

    it('Akun Admin tidak boleh mengunggah foto di endpoint petani (Role Enforcement)', async () => {
      const res = await request(app)
        .post('/api/photos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .field('field_id', fieldAId)
        .field('latitude', CENTER_LAT_A)
        .field('longitude', CENTER_LNG_A)
        .attach('foto', VALID_JPEG_BUFFER, 'admin-upload.jpg');

      expect(res.status).toBe(403);
    });
  });
});
