const path = require('path');

// Konfigurasi environment sebelum modul aplikasi dimuat oleh test.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.DB_PATH = path.join(__dirname, '..', 'src', 'zero_burning.test.db');
process.env.UPLOAD_RATE_LIMIT = process.env.UPLOAD_RATE_LIMIT || '10000';
