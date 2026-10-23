/**
 * Unit tests untuk utility functions
 */

describe('Audit Log Helper', () => {
  const { recordAudit } = require('../src/utils/auditLog');

  it('recordAudit function exists', () => {
    expect(typeof recordAudit).toBe('function');
  });
});

describe('Geofencing Middleware', () => {
  // Test Haversine distance calculation
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  it('should calculate distance correctly', () => {
    // Same point
    const dist1 = calculateDistance(-6.1751, 106.8650, -6.1751, 106.8650);
    expect(dist1).toBeLessThan(1);

    // ~2 meters away (small difference in decimal degrees)
    const dist2 = calculateDistance(-6.1751, 106.8650, -6.17511, 106.86501);
    expect(dist2).toBeGreaterThan(1);
    expect(dist2).toBeLessThan(50);

    // ~10km away (should be rejected by 50m radius)
    const dist3 = calculateDistance(-6.1751, 106.8650, -6.2, 106.95);
    expect(dist3).toBeGreaterThan(50);
  });

  it('should validate radius 50m', () => {
    const lat = -6.1751;
    const lon = 106.8650;
    const maxRadius = 50;

    // Valid: 10 meters
    const validDist = calculateDistance(lat, lon, -6.17511, 106.86501);
    expect(validDist <= maxRadius).toBe(true);

    // Invalid: 10km
    const invalidDist = calculateDistance(lat, lon, -6.2, 106.95);
    expect(invalidDist <= maxRadius).toBe(false);
  });
});

describe('Input Validation', () => {
  it('should validate NIK format', () => {
    const validateNIK = (nik) => {
      const str = String(nik || '').trim();
      return /^\d{16}$/.test(str);
    };

    expect(validateNIK('1234567890123456')).toBe(true);
    expect(validateNIK('123')).toBe(false);
    expect(validateNIK('123456789012345a')).toBe(false);
    expect(validateNIK('')).toBe(false);
  });

  it('should validate email format', () => {
    const validateEmail = (email) => {
      const str = String(email || '').trim().toLowerCase();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    };

    expect(validateEmail('test@test.com')).toBe(true);
    expect(validateEmail('invalid@')).toBe(false);
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('should validate password length', () => {
    const validatePassword = (pwd) => {
      const str = String(pwd || '');
      return str.length >= 6 && str.length <= 72;
    };

    expect(validatePassword('pass123')).toBe(true);
    expect(validatePassword('short')).toBe(false);
    expect(validatePassword('a'.repeat(73))).toBe(false);
  });

  it('should validate latitude/longitude', () => {
    const validateCoord = (lat, lon) => {
      const latitude = Number(lat);
      const longitude = Number(lon);
      return (
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180
      );
    };

    expect(validateCoord(-6.1751, 106.8650)).toBe(true);
    expect(validateCoord(200, 500)).toBe(false);
    expect(validateCoord(-91, 0)).toBe(false);
    expect(validateCoord(0, 181)).toBe(false);
  });
});

describe('CSV Export Helper', () => {
  function escapeCsv(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  it('should escape CSV values correctly', () => {
    expect(escapeCsv('simple')).toBe('simple');
    expect(escapeCsv('with,comma')).toBe('"with,comma"');
    expect(escapeCsv('with"quote')).toBe('"with""quote"');
    expect(escapeCsv('with\nnewline')).toBe('"with\nnewline"');
    expect(escapeCsv(null)).toBe('');
    expect(escapeCsv(undefined)).toBe('');
  });
});

describe('DateTime Formatting', () => {
  it('should format date correctly', () => {
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleDateString('id-ID');
    };

    const testDate = '2026-10-23T04:21:52.802Z';
    const formatted = formatDate(testDate);
    expect(formatted).toBeTruthy();
    expect(formatted).toContain('23');
    // Format bisa 23/10/2026 atau 23 Oktober 2026 tergantung locale
    expect(formatted).toMatch(/23.*10.*2026|23.*Oktober.*2026/);
  });
});
