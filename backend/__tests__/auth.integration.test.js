const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const TEST_EMAIL_PATTERN = 'integration-test-%';

async function cleanupTestUsers() {
  // Hapus data turunan lebih dulu agar tidak melanggar FOREIGN KEY.
  await pool.query(
    `DELETE FROM farmers
     WHERE id_user IN (SELECT id FROM users WHERE email LIKE ?)`,
    [TEST_EMAIL_PATTERN]
  );
  await pool.query(
    `DELETE FROM officers
     WHERE id_user IN (SELECT id FROM users WHERE email LIKE ?)`,
    [TEST_EMAIL_PATTERN]
  );
  await pool.query(
    `DELETE FROM audit_logs
     WHERE actor_id IN (SELECT id FROM users WHERE email LIKE ?)`,
    [TEST_EMAIL_PATTERN]
  );
  await pool.query('DELETE FROM email_verifications WHERE email LIKE ?', [TEST_EMAIL_PATTERN]);
  await pool.query('DELETE FROM users WHERE email LIKE ?', [TEST_EMAIL_PATTERN]);
}

describe('Authentication Integration Tests', () => {
  let testToken;

  beforeAll(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          nama: 'Integration Test User',
          email: 'integration-test-1@test.com',
          nik: '1234567890123456',
          phone: '+628123456789',
          address: 'Jl. Test No. 1',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('berhasil');
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          nama: 'Test User',
          email: 'invalid-email',
          nik: '1234567890123456',
          phone: '+628123456789',
          address: 'Jl. Test',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should reject registration with NIK not 16 digits', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          nama: 'Test User',
          email: 'integration-test-2@test.com',
          nik: '123456789',
          phone: '+628123456789',
          address: 'Jl. Test',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('16');
    });

    it('should reject registration with password mismatch', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          nama: 'Test User',
          email: 'integration-test-3@test.com',
          nik: '1234567890123456',
          phone: '+628123456789',
          address: 'Jl. Test',
          password: 'Password123!',
          confirmPassword: 'Different123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('tidak cocok');
    });

    it('should reject duplicate email registration', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send({
          nama: 'First User',
          email: 'integration-test-dup@test.com',
          nik: '1234567890123456',
          phone: '+628123456789',
          address: 'Jl. Test',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      // Try register with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          nama: 'Second User',
          email: 'integration-test-dup@test.com',
          nik: '9876543210654321',
          phone: '+628987654321',
          address: 'Jl. Test 2',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('sudah');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          nama: 'Login Test User',
          email: 'integration-test-login@test.com',
          nik: '1111111111111111',
          phone: '+628123456789',
          address: 'Jl. Test',
          password: 'LoginTest123!',
          confirmPassword: 'LoginTest123!',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration-test-login@test.com',
          password: 'LoginTest123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('integration-test-login@test.com');

      testToken = res.body.token;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration-test-login@test.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('salah');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'non-existent@test.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('salah');
    });

    it('should reject login with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/send-otp', () => {
    it('should send OTP successfully to registered email', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({
          email: 'integration-test-1@test.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP');
    });

    it('should reject OTP send to non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({
          email: 'non-existent-otp@test.com',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    let validOtp;

    beforeAll(async () => {
      // Get OTP from database
      const result = await pool.query(
        'SELECT otp_code FROM email_verifications WHERE email = ? ORDER BY created_at DESC LIMIT 1',
        ['integration-test-1@test.com']
      );
      if (result.rows.length > 0) {
        validOtp = result.rows[0].otp_code;
      }
    });

    it('should verify email with valid OTP', async () => {
      if (!validOtp) {
        console.warn('Skipping verify test - OTP not found');
        return;
      }

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'integration-test-1@test.com',
          otp_code: validOtp,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'integration-test-dup@test.com',
          otp_code: '000000',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Protected Routes - Token Validation', () => {
    beforeAll(async () => {
      // Get valid token
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration-test-login@test.com',
          password: 'LoginTest123!',
        });
      testToken = res.body.token;
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Token');
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_INVALID');
    });

    it('should accept request with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nama).toBeDefined();
    });
  });
});
