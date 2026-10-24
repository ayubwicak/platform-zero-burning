const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Field Management Integration Tests', () => {
  let authToken;
  let userId;
  let fieldId;
  let testCoords = {
    latitude: -6.2088,
    longitude: 106.8456,
  };

  beforeAll(async () => {
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
    userId = loginRes.body.user.id;
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM field_photos WHERE field_id IN (SELECT id FROM fields WHERE id_user = $1)', [
      userId,
    ]);
    await pool.query('DELETE FROM fields WHERE id_user = $1', [userId]);
    await pool.query('DELETE FROM farmers WHERE id_user = $1', [userId]);
    await pool.query('DELETE FROM users WHERE email = $1', ['field-test@test.com']);
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
          category: 'padi',
          latitude: testCoords.latitude,
          longitude: testCoords.longitude,
          address: 'Jl. Test Area',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.field.name).toBe('Lahan Test 1');
      expect(res.body.field.area).toBe(5000);

      fieldId = res.body.field.id;
    });

    it('should reject field creation with invalid coordinates', async () => {
      const res = await request(app)
        .set('Authorization', `Bearer ${authToken}`)
        .post('/api/fields')
        .send({
          name: 'Invalid Coords',
          area: 5000,
          category: 'padi',
          latitude: 999,
          longitude: 999,
          address: 'Jl. Test',
        });

      expect(res.status).toBe(400);
    });

    it('should reject field creation with zero area', async () => {
      const res = await request(app)
        .set('Authorization', `Bearer ${authToken}`)
        .post('/api/fields')
        .send({
          name: 'Zero Area',
          area: 0,
          category: 'padi',
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
          category: 'padi',
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
      expect(Array.isArray(res.body.fields)).toBe(true);
      expect(res.body.fields.length).toBeGreaterThan(0);
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
      expect(res.body.field.id).toBe(fieldId);
      expect(res.body.field.name).toBe('Lahan Test 1');
    });

    it('should return 404 for non-existent field', async () => {
      const res = await request(app)
        .get('/api/fields/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/fields/:id', () => {
    it('should update field successfully', async () => {
      const res = await request(app)
        .put(`/api/fields/${fieldId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Lahan Test Updated',
          area: 6000,
          category: 'jagung',
        });

      expect(res.status).toBe(200);
      expect(res.body.field.name).toBe('Lahan Test Updated');
      expect(res.body.field.area).toBe(6000);
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
        .put(`/api/fields/${fieldId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          name: 'Hacked Field',
          area: 1000,
        });

      expect(res.status).toBe(403);
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
          category: 'padi',
          latitude: testCoords.latitude,
          longitude: testCoords.longitude,
          address: 'Jl. Test',
        });

      const idToDelete = createRes.body.field.id;

      const res = await request(app)
        .delete(`/api/fields/${idToDelete}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
