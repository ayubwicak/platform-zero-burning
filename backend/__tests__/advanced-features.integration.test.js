const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const TEST_EMAILS = [
  'adv-admin@test.com',
  'adv-officer@test.com',
  'adv-farmer1@test.com',
  'adv-farmer2@test.com',
];

const VALID_JPEG = Buffer.from([
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

let photoCounter = 0;
function createUniqueValidJpeg() {
  photoCounter += 1;
  // Sisipkan payload counter sebelum EOI (0xFF, 0xD9) atau append byte counter deterministik
  // Magic bytes JPEG tetap valid karena diawali 0xFF 0xD8 0xFF
  return Buffer.concat([VALID_JPEG, Buffer.from(`_unique_photo_${photoCounter}_${Date.now()}`)]);
}

async function cleanupData() {
  await pool.query(
    `DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?, ?, ?))`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM incentive_distributions
     WHERE farmer_id IN (
       SELECT fa.id FROM farmers fa
       JOIN users u ON u.id = fa.id_user
       WHERE u.email IN (?, ?, ?, ?)
     )`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM incentive_claims
     WHERE farmer_id IN (
       SELECT fa.id FROM farmers fa
       JOIN users u ON u.id = fa.id_user
       WHERE u.email IN (?, ?, ?, ?)
     )`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM community_verifications
     WHERE photo_id IN (
       SELECT fp.id FROM field_photos fp
       JOIN fields f ON f.id = fp.field_id
       JOIN users u ON u.id = f.id_user
       WHERE u.email IN (?, ?, ?, ?)
     )`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM official_verifications
     WHERE photo_id IN (
       SELECT fp.id FROM field_photos fp
       JOIN fields f ON f.id = fp.field_id
       JOIN users u ON u.id = f.id_user
       WHERE u.email IN (?, ?, ?, ?)
     )`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM field_photos
     WHERE field_id IN (
       SELECT f.id FROM fields f
       JOIN users u ON u.id = f.id_user
       WHERE u.email IN (?, ?, ?, ?)
     )`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM fields WHERE id_user IN (SELECT id FROM users WHERE email IN (?, ?, ?, ?))`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM officers WHERE id_user IN (SELECT id FROM users WHERE email IN (?, ?, ?, ?))`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM farmers WHERE id_user IN (SELECT id FROM users WHERE email IN (?, ?, ?, ?))`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM audit_logs WHERE actor_id IN (SELECT id FROM users WHERE email IN (?, ?, ?, ?))`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM email_verifications WHERE email IN (?, ?, ?, ?)`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM users WHERE email IN (?, ?, ?, ?)`,
    TEST_EMAILS
  );
}

describe('Advanced Features A, B, C Integration Tests', () => {
  let adminToken;
  let officerToken;
  let farmer1Token;
  let farmer2Token;
  let farmer1UserId;
  let farmer2UserId;
  let categoryId;
  let field1Id;
  let photo1Id;

  beforeAll(async () => {
    await cleanupData();

    // 1. Buat Akun Petani 1
    await request(app).post('/api/auth/register').send({
      nama: 'Petani Satu',
      email: 'adv-farmer1@test.com',
      nik: '7111111111111111',
      phone: '+628111111111',
      address: 'Desa Satu',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    const logF1 = await request(app).post('/api/auth/login').send({
      email: 'adv-farmer1@test.com',
      password: 'Password123!',
    });
    farmer1Token = logF1.body.token;
    farmer1UserId = logF1.body.user.id;

    // 2. Buat Akun Petani 2
    await request(app).post('/api/auth/register').send({
      nama: 'Petani Dua',
      email: 'adv-farmer2@test.com',
      nik: '7222222222222222',
      phone: '+628222222222',
      address: 'Desa Dua',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    const logF2 = await request(app).post('/api/auth/login').send({
      email: 'adv-farmer2@test.com',
      password: 'Password123!',
    });
    farmer2Token = logF2.body.token;
    farmer2UserId = logF2.body.user.id;

    // Login default admin untuk buat officer & category
    const defaultAdminLog = await request(app).post('/api/auth/login').send({
      email: 'admin@zeroburning.id',
      password: 'admin123',
    });
    const defaultAdminToken = defaultAdminLog.body.token;

    // Buat admin test
    const userAdminRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${defaultAdminToken}`)
      .send({
        nama: 'Test Admin Adv',
        email: 'adv-admin@test.com',
        role: 'admin',
        password: 'Password123!',
      });
    adminToken = (await request(app).post('/api/auth/login').send({
      email: 'adv-admin@test.com',
      password: 'Password123!',
    })).body.token;

    // Buat petugas test
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${defaultAdminToken}`)
      .send({
        nama: 'Test Officer Adv',
        email: 'adv-officer@test.com',
        nip: '198701012015011001',
        role: 'petugas',
        password: 'Password123!',
      });
    officerToken = (await request(app).post('/api/auth/login').send({
      email: 'adv-officer@test.com',
      password: 'Password123!',
    })).body.token;

    // Buat kategori insentif dengan stok 10
    const catRes = await request(app)
      .post('/api/incentives/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bibit Jagung Hibrida Adv',
        quantity: 10,
        requirements: 'Lahan terverifikasi zero burning',
      });
    categoryId = catRes.body.data.id;

    // Petani 1 buat lahan
    const fRes = await request(app)
      .post('/api/fields')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .send({
        name: 'Lahan Adv 1',
        area: 2.0,
        latitude: -6.2088,
        longitude: 106.8456,
        crop_type: 'Jagung',
      });
    field1Id = fRes.body.data.id;

    // Petani 1 upload foto
    const pRes = await request(app)
      .post('/api/photos')
      .set('Authorization', `Bearer ${farmer1Token}`)
      .field('field_id', field1Id)
      .field('latitude', -6.2088)
      .field('longitude', 106.8456)
      .attach('foto', createUniqueValidJpeg(), 'adv-photo1.jpg');
    if (pRes.status !== 201) {
      throw new Error(`Upload foto gagal (status ${pRes.status}): ${JSON.stringify(pRes.body)}`);
    }
    expect(pRes.status).toBe(201);
    expect(pRes.body.data).toBeDefined();
    photo1Id = pRes.body.data.id;
  });

  afterAll(async () => {
    await cleanupData();
  });

  // ==========================================
  // FITUR A: Penolakan & Pembatalan Klaim
  // ==========================================
  describe('FITUR A: Penolakan / Pembatalan Klaim', () => {
    let claimId;

    beforeEach(async () => {
      // Pastikan foto terverifikasi agar bisa klaim
      await request(app)
        .post('/api/verifications/official')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ photo_id: photo1Id, status: 'lolos', note: 'Verifikasi valid' });

      // Ajukan klaim baru
      const cRes = await request(app)
        .post('/api/incentives/claims')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ field_id: field1Id, category_id: categoryId });
      claimId = cRes.body.data.id;
    });

    it('Petugas dapat menolak klaim berstatus "diajukan" dengan alasan valid', async () => {
      const res = await request(app)
        .post(`/api/claims/${claimId}/reject`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          reason: 'Data tidak sesuai',
          note: 'Koordinat lahan dan dokumen fisik tidak cocok',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ditolak');

      // Periksa status di DB
      const dbClaim = await pool.query('SELECT * FROM incentive_claims WHERE id = ?', [claimId]);
      expect(dbClaim.rows[0].status).toBe('ditolak');
      expect(dbClaim.rows[0].reason).toContain('Data tidak sesuai');

      // Petani harus menerima notifikasi
      const notifRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(notifRes.body.data.some((n) => n.type === 'claim.rejected')).toBe(true);
    });

    it('Menolak klaim yang bukan "diajukan" harus menghasilkan 409 Conflict', async () => {
      // Tolak klaim pertama kali
      await request(app)
        .post(`/api/claims/${claimId}/reject`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ reason: 'Petani tidak hadir', note: '' });

      // Coba tolak lagi
      const secondReject = await request(app)
        .post(`/api/claims/${claimId}/reject`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ reason: 'Petani tidak hadir', note: '' });

      expect(secondReject.status).toBe(409);
      expect(secondReject.body.error).toContain('tidak dapat ditolak');
    });

    it('Pembatalan klaim disetujui hanya boleh dilakukan admin dan mengembalikan stok atomik', async () => {
      // Dapatkan stok awal
      const catBefore = await pool.query('SELECT quantity FROM incentive_categories WHERE id = ?', [categoryId]);
      const initialStock = Number(catBefore.rows[0].quantity);

      // Distribusikan klaim (stok berkurang 1)
      await request(app)
        .post('/api/incentives/distributions')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ claim_id: claimId, receipt_proof: 'BA-TEST-001' });

      const catDistributed = await pool.query('SELECT quantity FROM incentive_categories WHERE id = ?', [categoryId]);
      expect(Number(catDistributed.rows[0].quantity)).toBe(initialStock - 1);

      // Petugas non-admin mencoba membatalkan klaim yang sudah didistribusikan -> 403 Forbidden
      const officerCancel = await request(app)
        .post(`/api/claims/${claimId}/cancel`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ reason: 'Lahan bermasalah kembali', note: 'Dibatalkan pasca distribusi' });
      expect(officerCancel.status).toBe(403);

      // Admin membatalkan klaim yang sudah didistribusikan -> Berhasil dan stok kembali
      const adminCancel = await request(app)
        .post(`/api/claims/${claimId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Lahan bermasalah kembali', note: 'Dibatalkan oleh admin' });

      expect(adminCancel.status).toBe(200);
      expect(adminCancel.body.data.status).toBe('dibatalkan');
      expect(adminCancel.body.data.stock_restored).toBe(true);

      const catRestored = await pool.query('SELECT quantity FROM incentive_categories WHERE id = ?', [categoryId]);
      expect(Number(catRestored.rows[0].quantity)).toBe(initialStock);
    });

    it('Petani dapat melihat alasan penolakan dan dapat mengajukan ulang', async () => {
      await request(app)
        .post(`/api/claims/${claimId}/reject`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ reason: 'Kekeliruan input', note: 'Nomor NIK perlu diperbarui' });

      const claimsList = await request(app)
        .get('/api/incentives/claims')
        .set('Authorization', `Bearer ${farmer1Token}`);

      const rejected = claimsList.body.data.find((c) => c.id === claimId);
      expect(rejected).toBeDefined();
      expect(rejected.status).toBe('ditolak');
      expect(rejected.reason).toContain('Kekeliruan input');

      // Petani mengajukan klaim baru
      const newClaimRes = await request(app)
        .post('/api/incentives/claims')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ field_id: field1Id, category_id: categoryId });

      expect(newClaimRes.status).toBe(201);
      expect(newClaimRes.body.data.status).toBe('diajukan');
    });
  });

  // ==========================================
  // FITUR B: Ambang Batas Verifikasi Warga
  // ==========================================
  describe('FITUR B: Ambang Batas Otomatis Verifikasi Warga', () => {
    let testPhotoId;

    beforeEach(async () => {
      const uniqueBuf = createUniqueValidJpeg();
      const pRes = await request(app)
        .post('/api/photos')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .field('field_id', field1Id)
        .field('latitude', -6.2088)
        .field('longitude', 106.8456)
        .attach('foto', uniqueBuf, 'sample-vote.jpg');

      if (pRes.status !== 201) {
        throw new Error(`Upload foto gagal (status ${pRes.status}): ${JSON.stringify(pRes.body)}`);
      }
      expect(pRes.status).toBe(201);
      expect(pRes.body.data).toBeDefined();
      testPhotoId = pRes.body.data.id;
    });

    it('Pemilik foto tidak boleh memverifikasi fotonya sendiri', async () => {
      const res = await request(app)
        .post('/api/verifications/community')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ photo_id: testPhotoId, status: 'setuju' });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('foto lahan Anda sendiri');
    });

    it('Suara ganda dari akun yang sama diupdate via UPSERT (1 suara/akun)', async () => {
      // Suara pertama: setuju
      const res1 = await request(app)
        .post('/api/verifications/community')
        .set('Authorization', `Bearer ${farmer2Token}`)
        .send({ photo_id: testPhotoId, status: 'setuju', note: 'Bagus' });
      expect(res1.status).toBe(200);
      expect(res1.body.setujuCount).toBe(1);

      // Suara kedua: ubah jadi tidak_setuju
      const res2 = await request(app)
        .post('/api/verifications/community')
        .set('Authorization', `Bearer ${farmer2Token}`)
        .send({ photo_id: testPhotoId, status: 'tidak_setuju', note: 'Terlihat ada abu' });
      expect(res2.status).toBe(200);
      expect(res2.body.setujuCount).toBe(0);
      expect(res2.body.tidakSetujuCount).toBe(1);
    });

    it('Mode "flag" (default) hanya memberi label prioritas tanpa mengubah status foto', async () => {
      process.env.VOTE_APPROVE_THRESHOLD = '1';
      process.env.VOTE_AUTO_MODE = 'flag';

      const res = await request(app)
        .post('/api/verifications/community')
        .set('Authorization', `Bearer ${farmer2Token}`)
        .send({ photo_id: testPhotoId, status: 'setuju' });

      expect(res.status).toBe(200);
      expect(res.body.recommendation).toBe('rekomendasi_setuju');
      expect(res.body.autoApproved).toBe(false);

      const dbPhoto = await pool.query('SELECT * FROM field_photos WHERE id = ?', [testPhotoId]);
      expect(dbPhoto.rows[0].verification_status).toBe('menunggu_verifikasi');
      expect(dbPhoto.rows[0].community_recommendation).toBe('rekomendasi_setuju');
    });

    it('Mode "auto" mengubah status menjadi terverifikasi dengan tanda sistem', async () => {
      process.env.VOTE_APPROVE_THRESHOLD = '1';
      process.env.VOTE_REJECT_THRESHOLD = '3';
      process.env.VOTE_AUTO_MODE = 'auto';

      const res = await request(app)
        .post('/api/verifications/community')
        .set('Authorization', `Bearer ${farmer2Token}`)
        .send({ photo_id: testPhotoId, status: 'setuju' });

      expect(res.status).toBe(200);
      expect(res.body.autoApproved).toBe(true);

      const dbPhoto = await pool.query('SELECT * FROM field_photos WHERE id = ?', [testPhotoId]);
      expect(dbPhoto.rows[0].verification_status).toBe('terverifikasi');
      expect(Boolean(dbPhoto.rows[0].verified_by_system)).toBe(true);

      // Pemilik foto harus mendapat notifikasi auto_verified
      const notifs = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(notifs.body.data.some((n) => n.type === 'photo.auto_verified')).toBe(true);
    });

    it('Petugas dapat menganulir (override) verifikasi otomatis dengan alasan wajib', async () => {
      // Pastikan foto diverifikasi otomatis
      await pool.query(
        "UPDATE field_photos SET verification_status = 'terverifikasi', verified_by_system = 1 WHERE id = ?",
        [testPhotoId]
      );

      // Coba anulir tanpa alasan (note kosong) -> 400 Bad Request
      const failOverride = await request(app)
        .post('/api/verifications/override')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ photo_id: testPhotoId, status: 'tidak_lolos', note: '' });
      expect(failOverride.status).toBe(400);
      expect(failOverride.body.error).toContain('Alasan (catatan) wajib diisi');

      // Anulir dengan alasan memadai
      const okOverride = await request(app)
        .post('/api/verifications/override')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          photo_id: testPhotoId,
          status: 'tidak_lolos',
          note: 'Ditemukan sisa pembakaran pada tepi lahan setelah pengecekan satelit',
        });

      expect(okOverride.status).toBe(200);
      expect(okOverride.body.data.status).toBe('ditolak');

      const dbPhoto = await pool.query('SELECT * FROM field_photos WHERE id = ?', [testPhotoId]);
      expect(dbPhoto.rows[0].verification_status).toBe('ditolak');
      expect(Boolean(dbPhoto.rows[0].verified_by_system)).toBe(false);
    });
  });

  // ==========================================
  // FITUR C: Notifikasi Berbasis Event & Endpoint
  // ==========================================
  describe('FITUR C: Notifikasi Berbasis Event', () => {
    it('Pengguna hanya bisa mengakses dan membaca notifikasi miliknya sendiri', async () => {
      // Bersihkan notifikasi petani 1 & 2
      await pool.query('DELETE FROM notifications WHERE user_id IN (?, ?)', [farmer1UserId, farmer2UserId]);

      // Buat notifikasi untuk Petani 1
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, created_at)
         VALUES (?, 'system.info', 'Judul F1', 'Pesan Petani 1', CURRENT_TIMESTAMP)`,
        [farmer1UserId]
      );
      const inserted = await pool.query('SELECT id FROM notifications WHERE user_id = ?', [farmer1UserId]);
      const notifIdF1 = inserted.rows[0].id;

      // Petani 2 membaca daftar notifikasinya -> tidak ada notifikasi milik Petani 1
      const listF2 = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${farmer2Token}`);
      expect(listF2.body.data.length).toBe(0);

      // Petani 2 mencoba membaca notifikasi milik Petani 1 -> 403 Forbidden
      const unauthorizedRead = await request(app)
        .patch(`/api/notifications/${notifIdF1}/read`)
        .set('Authorization', `Bearer ${farmer2Token}`);
      expect(unauthorizedRead.status).toBe(403);

      // Petani 1 menandai notifikasinya dibaca -> 200 OK
      const authorizedRead = await request(app)
        .patch(`/api/notifications/${notifIdF1}/read`)
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(authorizedRead.status).toBe(200);

      // Hitung unread count Petani 1 harus 0
      const unreadCount = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(unreadCount.body.count).toBe(0);
    });

    it('Tandai semua dibaca (read-all) menandai seluruh notifikasi user', async () => {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, created_at)
         VALUES (?, 'test.1', 'Notif 1', 'M1', CURRENT_TIMESTAMP),
                (?, 'test.2', 'Notif 2', 'M2', CURRENT_TIMESTAMP)`,
        [farmer1UserId, farmer1UserId]
      );

      const countBefore = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(countBefore.body.count).toBeGreaterThanOrEqual(2);

      const readAllRes = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(readAllRes.status).toBe(200);

      const countAfter = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(countAfter.body.count).toBe(0);
    });
  });
});
