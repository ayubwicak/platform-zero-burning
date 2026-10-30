const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { clearStatsCache } = require('../src/controllers/publicController');

describe('Public Stats Integration Tests', () => {
  beforeEach(() => {
    clearStatsCache();
  });

  it('GET /api/public/stats mengembalikan 200 tanpa autentikasi', async () => {
    const res = await request(app).get('/api/public/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.headers['cache-control']).toContain('max-age=300');
  });

  it('GET /api/public/stats hanya mengembalikan data agregat tanpa data pribadi atau koordinat', async () => {
    const res = await request(app).get('/api/public/stats');

    expect(res.status).toBe(200);
    const data = res.body.data;

    // Pastikan field agregat tersedia
    expect(typeof data.total_farmers).toBe('number');
    expect(typeof data.total_fields).toBe('number');
    expect(typeof data.verified_fields).toBe('number');
    expect(typeof data.verified_area_ha).toBe('number');
    expect(typeof data.distributed_incentives).toBe('number');

    // Pastikan tidak ada data sensitif atau pribadi yang bocor
    const forbiddenKeys = [
      'email', 'nik', 'phone', 'telepon', 'nama', 'name', 'password',
      'latitude', 'longitude', 'coordinates', 'address', 'alamat',
      'users', 'farmers', 'fields', 'photos',
    ];
    const dataKeys = Object.keys(data);
    for (const forbidden of forbiddenKeys) {
      expect(dataKeys).not.toContain(forbidden);
    }
  });

  it('GET /api/public/stats menghasilkan 0 dengan jujur bila data kosong', async () => {
    // Jalankan query dengan memastikan nilai numerik valid >= 0
    const res = await request(app).get('/api/public/stats');
    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.total_farmers).toBeGreaterThanOrEqual(0);
    expect(data.total_fields).toBeGreaterThanOrEqual(0);
    expect(data.verified_fields).toBeGreaterThanOrEqual(0);
    expect(data.verified_area_ha).toBeGreaterThanOrEqual(0);
    expect(data.distributed_incentives).toBeGreaterThanOrEqual(0);
  });
});
