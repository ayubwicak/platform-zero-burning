const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const TEST_EMAILS = ['field-test@test.com', 'other-field-user@test.com'];

async function cleanupTestData() {
  // Hapus turunan lebih dulu agar tidak melanggar FOREIGN KEY.
  await pool.query(
    `DELETE FROM community_verifications
     WHERE photo_id IN (
       SELECT fp.id FROM field_photos fp
       JOIN fields f ON f.id = fp.field_id
       JOIN users u ON u.id = f.id_user
       WHERE u.email IN (?, ?)
     )`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM official_verifications
     WHERE photo_id IN (
       SELECT fp.id FROM field_photos fp
       JOIN fields f ON f.id = fp.field_id
       JOIN users u ON u.id = f.id_user
       WHERE u.email IN (?, ?)
     )`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM incentive_distributions
     WHERE farmer_id IN (
       SELECT fa.id FROM farmers fa
       JOIN users u ON u.id = fa.id_user
       WHERE u.email IN (?, ?)
     )`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM incentive_claims
     WHERE farmer_id IN (
       SELECT fa.id FROM farmers fa
       JOIN users u ON u.id = fa.id_user
       WHERE u.email IN (?, ?)
     )`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM field_photos
     WHERE field_id IN (
       SELECT f.id FROM fields f
       JOIN users u ON u.id = f.id_user
       WHERE u.email IN (?, ?)
     )`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM fields
     WHERE id_user IN (SELECT id FROM users WHERE email IN (?, ?))`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM farmers
     WHERE id_user IN (SELECT id FROM users WHERE email IN (?, ?))`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM officers
     WHERE id_user IN (SELECT id FROM users WHERE email IN (?, ?))`,
    TEST_EMAILS
  );
  await pool.query(
    `DELETE FROM audit_logs
     WHERE actor_id IN (SELECT id FROM users WHERE email IN (?, ?))`,
    TEST_EMAILS
  );
  await pool.query('DELETE FROM email_verifications WHERE email IN (?, ?)', TEST_EMAILS);
  await pool.query('DELETE FROM users WHERE email IN (?, ?)', TEST_EMAILS);
}

describe('Field Management Integration Tests', () => {
  let authToken;
  let fieldId;
  const testCoords = {
    latitude: -6.2088,
    longitude: 106.8456,
  };

  beforeAll(async () => {
    await cleanupTestData();

    // Setup: Register & login test user
    await request(app)
      .post('/api/auth/register')
      .send({
        nama: 'Field Test User',
        email: 'field-test@test.com',
        nik: '2222222222222222',
        phone: '+628123456789',
        address: 'Jl. Test',
        password: 'FieldTest123!',
        confirmPassword: 'FieldTest123!',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'field-test@test.com',
        password: 'FieldTest123!',
      });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  describe('POST /api/fields', () => {
    it('should create a field successfully', async () => {
      const res = await request(app)
        .post('/api/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Lahan Test 1',
          area: 5000,
          crop_type: 'padi',
          latitude: testCoords.latitude,
          longitude: testCoords.longitude,
          address: 'Jl. Test Area',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Lahan Test 1');
      expect(res.body.data.area).toBe(5000);

      fieldId = res.body.data.id;
    });

    it('should reject field creation with invalid coordinates', async () => {
      const res = await request(app)
        .post('/api/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Coords',
          area: 5000,
          crop_type: 'padi',
          latitude: 999,
          longitude: 999,
          address: 'Jl. Test',
        });

      expect(res.status).toBe(400);
    });

    it('should reject field creation with zero area', async () => {
      const res = await request(app)
        .post('/api/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Zero Area',
          area: 0,
          crop_type: 'padi',
          latitude: testCoords.latitude,
          longitude: testCoords.longitude,
          address: 'Jl. Test',
        });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated field creation', async () => {
      const res = await request(app)
        .post('/api/fields')
        .send({
          name: 'Test',
          area: 5000,
          crop_type: 'padi',
          latitude: testCoords.latitude,
          longitude: testCoords.longitude,
          address: 'Jl. Test',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/fields', () => {
    it('should retrieve fields for authenticated user', async () => {
      const res = await request(app)
        .get('/api/fields')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should reject unauthenticated field retrieval', async () => {
      const res = await request(app).get('/api/fields');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/fields/:id', () => {
    it('should retrieve specific field details', async () => {
      const res = await request(app)
        .get(`/api/fields/${fieldId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(fieldId);
      expect(res.body.data.name).toBe('Lahan Test 1');
    });

    it('should return 404 for non-existent field', async () => {
      const res = await request(app)
        .get('/api/fields/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/fields/:id', () => {
    it('should update field successfully', async () => {
      const res = await request(app)
        .patch(`/api/fields/${fieldId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Lahan Test Updated',
          area: 6000,
          crop_type: 'jagung',
          latitude: testCoords.latitude,
          longitude: testCoords.longitude,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Lahan Test Updated');
      expect(res.body.data.area).toBe(6000);
    });

    it('should reject unauthorized field update', async () => {
      // Create another user
      await request(app)
        .post('/api/auth/register')
        .send({
          nama: 'Other User',
          email: 'other-field-user@test.com',
          nik: '3333333333333333',
          phone: '+628123456789',
          address: 'Jl. Test',
          password: 'OtherTest123!',
          confirmPassword: 'OtherTest123!',
        });

      const otherRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other-field-user@test.com',
          password: 'OtherTest123!',
        });

      const otherToken = otherRes.body.token;

      const res = await request(app)
        .patch(`/api/fields/${fieldId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          name: 'Hacked Field',
          area: 1000,
          crop_type: 'padi',
          latitude: testCoords.latitude,
          longitude: testCoords.longitude,
        });

      // 404 agar keberadaan lahan milik petani lain tidak terungkap.
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/fields/:id', () => {
    it('should delete field successfully', async () => {
      // Create field to delete
      const createRes = await request(app)
        .post('/api/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Field to Delete',
          area: 3000,
          crop_type: 'padi',
          latitude: testCoords.latitude,
          longitude: testCoords.longitude,
          address: 'Jl. Test',
        });

      const idToDelete = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/fields/${idToDelete}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
