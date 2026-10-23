const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token akses diperlukan' });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token sudah kedaluwarsa. Silakan login kembali.',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (jwtErr.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Token tidak valid.',
          code: 'TOKEN_INVALID'
        });
      }
      throw jwtErr;
    }

    const result = await pool.query(
      `SELECT u.id, u.nama, u.email, u.role, u.is_active,
              f.id AS farmer_id, o.id AS officer_id
       FROM users u
       LEFT JOIN farmers f ON f.id_user = u.id
       LEFT JOIN officers o ON o.id_user = u.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Akun tidak ditemukan' });
    }

    const row = result.rows[0];
    if (!row.is_active) {
      return res.status(401).json({ error: 'Akun dinonaktifkan. Sesi Anda telah berakhir.' });
    }

    req.user = { id: row.id, nama: row.nama, email: row.email, role: row.role };
    if (row.farmer_id) req.user.farmerId = row.farmer_id;
    if (row.officer_id) req.user.officerId = row.officer_id;

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(500).json({ error: 'Terjadi kesalahan saat verifikasi token' });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak untuk role ini' });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };