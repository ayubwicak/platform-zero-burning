const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const FARMER_EMAIL = 'report-farmer@test.com';

async function cleanupReportFarmer() {
  await pool.query(
    `DELETE FROM incentive_distributions
     WHERE farmer_id IN (
       SELECT fa.id FROM farmers fa
       JOIN users u ON u.id = fa.id_user
       WHERE u.email = ?
     )`,
    [FARMER_EMAIL]
  );
  await pool.query(
    `DELETE FROM incentive_claims
     WHERE farmer_id IN (
       SELECT fa.id FROM farmers fa
       JOIN users u ON u.id = fa.id_user
       WHERE u.email = ?
     )`,
    [FARMER_EMAIL]
  );
  await pool.query(
    `DELETE FROM field_photos
     WHERE field_id IN (
       SELECT f.id FROM fields f
       JOIN users u ON u.id = f.id_user
       WHERE u.email = ?
     )`,
    [FARMER_EMAIL]
  );
  await pool.query(
    `DELETE FROM fields
     WHERE id_user IN (SELECT id FROM users WHERE email = ?)`,
    [FARMER_EMAIL]
  );
  await pool.query(
    `DELETE FROM farmers
     WHERE id_user IN (SELECT id FROM users WHERE email = ?)`,
    [FARMER_EMAIL]
  );
  await pool.query(
    `DELETE FROM audit_logs
     WHERE actor_id IN (SELECT id FROM users WHERE email = ?)`,
    [FARMER_EMAIL]
  );
  await pool.query('DELETE FROM email_verifications WHERE email = ?', [FARMER_EMAIL]);
  await pool.query('DELETE FROM users WHERE email = ?', [FARMER_EMAIL]);
}

describe('Report & Statistics Integration Tests', () => {
  let adminToken;
  let farmerToken;

  beforeAll(async () => {
    await cleanupReportFarmer();

    // Get admin token
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@zeroburning.id',
        password: 'admin123',
      });

    adminToken = adminRes.body.token;

    // Create test farmer account
    await request(app)
      .post('/api/auth/register')
      .send({
        nama: 'Report Test Farmer',
        email: FARMER_EMAIL,
        nik: '4444444444444444',
        phone: '+628123456789',
        address: 'Jl. Test',
        password: 'ReportTest123!',
        confirmPassword: 'ReportTest123!',
      });

    const farmerRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: FARMER_EMAIL,
        password: 'ReportTest123!',
      });

    farmerToken = farmerRes.body.token;
  });

  afterAll(async () => {
    await cleanupReportFarmer();
  });

  describe('GET /api/reports', () => {
    it('should retrieve report summary for admin', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.total_fields).toBeDefined();
      expect(res.body.data.summary.total_photos).toBeDefined();
      expect(res.body.data.summary.total_claims).toBeDefined();
      expect(res.body.data.summary.total_farmers).toBeDefined();
    });

    it('should include rate calculations in summary', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.verification_rate).toBeDefined();
      expect(res.body.data.summary.approval_rate).toBeDefined();
    });

    it('should include category distribution', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.category_distribution).toBeDefined();
      expect(Array.isArray(res.body.data.category_distribution)).toBe(true);
    });

    it('should include top farmers', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.top_farmers).toBeDefined();
      expect(Array.isArray(res.body.data.top_farmers)).toBe(true);
    });

    it('should reject report access for non-admin', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated report access', async () => {
      const res = await request(app).get('/api/reports');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reports/export', () => {
    it('should export report as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.text).toContain('Laporan');
    });

    it('should export report as JSON', async () => {
      const res = await request(app)
        .get('/api/reports/export?format=json')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body.data.summary).toBeDefined();
    });

    it('should default to JSON when format not specified', async () => {
      const res = await request(app)
        .get('/api/reports/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeDefined();
    });

    it('should reject export for non-admin', async () => {
      const res = await request(app)
        .get('/api/reports/export?format=csv')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
    });

    it('should reject unauthenticated export access', async () => {
      const res = await request(app)
        .get('/api/reports/export?format=csv');

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('should include timestamp in CSV filename', async () => {
      const res = await request(app)
        .get('/api/reports/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const disposition = res.headers['content-disposition'];
      expect(disposition).toContain('laporan');
      expect(disposition).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format YYYY-MM-DD
    });
  });

  describe('GET /api/audit-logs', () => {
    it('should retrieve audit logs for admin', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support pagination in audit logs', async () => {
      const res = await request(app)
        .get('/api/audit-logs?limit=10&offset=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBeDefined();
      expect(res.body.limit).toBe(10);
    });

    it('should support filtering by action', async () => {
      const res = await request(app)
        .get('/api/audit-logs?action=CREATE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject audit log access for non-admin', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/audit-logs/export', () => {
    it('should export audit logs as CSV', async () => {
      const res = await request(app)
        .get('/api/audit-logs/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });

    it('should export audit logs as JSON', async () => {
      const res = await request(app)
        .get('/api/audit-logs/export?format=json')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
    });
  });
});
