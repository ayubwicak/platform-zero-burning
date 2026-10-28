const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const TEST_EMAILS = ['photo-user1@test.com', 'photo-user2@test.com'];

// Valid minimal 1x1 JPEG buffer with correct magic bytes
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

async function cleanupTestData() {
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
    `DELETE FROM audit_logs
     WHERE actor_id IN (SELECT id FROM users WHERE email IN (?, ?))`,
    TEST_EMAILS
  );
  await pool.query('DELETE FROM email_verifications WHERE email IN (?, ?)', TEST_EMAILS);
  await pool.query('DELETE FROM users WHERE email IN (?, ?)', TEST_EMAILS);
}

describe('Photo Upload & Rate Limiting Integration Tests', () => {
  let user1Token;
  let user2Token;
  let field1Id;
  let field2Id;

  beforeAll(async () => {
    // Set low limit for testing
    process.env.UPLOAD_RATE_LIMIT = '2';

    await cleanupTestData();

    // Register User 1
    await request(app)
      .post('/api/auth/register')
      .send({
        nama: 'Photo User 1',
        email: 'photo-user1@test.com',
        nik: '5555555555555555',
        phone: '+628123456781',
        address: 'Jl. Test 1',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    const login1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'photo-user1@test.com', password: 'Password123!' });
    user1Token = login1.body.token;

    // Create field for User 1
    const f1 = await request(app)
      .post('/api/fields')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Lahan User 1',
        area: 1.5,
        latitude: -6.2088,
        longitude: 106.8456,
        crop_type: 'Padi',
      });
    field1Id = f1.body.data.id;

    // Register User 2
    await request(app)
      .post('/api/auth/register')
      .send({
        nama: 'Photo User 2',
        email: 'photo-user2@test.com',
        nik: '6666666666666666',
        phone: '+628123456782',
        address: 'Jl. Test 2',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'photo-user2@test.com', password: 'Password123!' });
    user2Token = login2.body.token;

    // Create field for User 2
    const f2 = await request(app)
      .post('/api/fields')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        name: 'Lahan User 2',
        area: 2.0,
        latitude: -6.2088,
        longitude: 106.8456,
        crop_type: 'Jagung',
      });
    field2Id = f2.body.data.id;
  });

  afterAll(async () => {
    delete process.env.UPLOAD_RATE_LIMIT;
    await cleanupTestData();
  });

  it('should allow uploads within the rate limit for User 1', async () => {
    // Request 1
    const res1 = await request(app)
      .post('/api/photos')
      .set('Authorization', `Bearer ${user1Token}`)
      .field('field_id', field1Id)
      .field('latitude', -6.2088)
      .field('longitude', 106.8456)
      .attach('foto', VALID_JPEG_BUFFER, 'sample1.jpg');

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);

    // Request 2 (different buffer content so hash differs)
    const buf2 = Buffer.concat([VALID_JPEG_BUFFER, Buffer.from([0x01])]);
    const res2 = await request(app)
      .post('/api/photos')
      .set('Authorization', `Bearer ${user1Token}`)
      .field('field_id', field1Id)
      .field('latitude', -6.2088)
      .field('longitude', 106.8456)
      .attach('foto', buf2, 'sample2.jpg');

    expect(res2.status).toBe(201);
    expect(res2.body.success).toBe(true);
  });

  it('should return 429 when User 1 exceeds upload rate limit', async () => {
    const buf3 = Buffer.concat([VALID_JPEG_BUFFER, Buffer.from([0x02])]);
    const res3 = await request(app)
      .post('/api/photos')
      .set('Authorization', `Bearer ${user1Token}`)
      .field('field_id', field1Id)
      .field('latitude', -6.2088)
      .field('longitude', 106.8456)
      .attach('foto', buf3, 'sample3.jpg');

    expect(res3.status).toBe(429);
    expect(res3.body.success).toBe(false);
    expect(res3.body.error).toContain('Terlalu banyak unggahan');
  });

  it('should not block User 2 when User 1 is rate-limited', async () => {
    const resUser2 = await request(app)
      .post('/api/photos')
      .set('Authorization', `Bearer ${user2Token}`)
      .field('field_id', field2Id)
      .field('latitude', -6.2088)
      .field('longitude', 106.8456)
      .attach('foto', VALID_JPEG_BUFFER, 'sample-user2.jpg');

    expect(resUser2.status).toBe(201);
    expect(resUser2.body.success).toBe(true);
  });
});
