const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function register(req, res, next) {
  const { nama, email, password, role, nik, phone, address, nip, position, unit } = req.body;

  if (!nama || !email || !password || !role) {
    return res.status(400).json({ error: 'Nama, email, password, dan role wajib diisi' });
  }
  if (!['petani', 'petugas'].includes(role)) {
    return res.status(403).json({
      error: 'Registrasi publik hanya untuk petani atau petugas. Akun admin dibuat oleh administrator.',
    });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }
  if (role === 'petani' && !nik) {
    return res.status(400).json({ error: 'NIK wajib diisi untuk role petani' });
  }
  if (role === 'petugas' && !nip) {
    return res.status(400).json({ error: 'NIP wajib diisi untuk role petugas' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const userRes = await client.query(
        'INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [nama, normalizedEmail, hashed, role]
      );
      const userId = userRes.rows[0].id;

      if (role === 'petani') {
        await client.query(
          'INSERT INTO farmers (id_user, nik, phone, address) VALUES ($1, $2, $3, $4)',
          [userId, nik, phone, address]
        );
      } else if (role === 'petugas') {
        await client.query(
          'INSERT INTO officers (id_user, nip, position, unit) VALUES ($1, $2, $3, $4)',
          [userId, nip, position, unit]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, message: 'Registrasi berhasil' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [
      String(email || '').trim().toLowerCase(),
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };