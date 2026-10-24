const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createOTP, sendOTPEmail, verifyOTP, resendOTP } = require('../utils/otpService');

const PROFILE_SELECT = `
  SELECT u.id, u.nama, u.email, u.role, u.created_at,
         f.id AS farmer_id,
         o.id AS officer_id
  FROM users u
  LEFT JOIN farmers f ON f.id_user = u.id
  LEFT JOIN officers o ON o.id_user = u.id
`;

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function getProfileData(userId) {
  const result = await pool.query(`${PROFILE_SELECT} WHERE u.id = $1`, [userId]);
  return result.rows[0] || null;
}

async function register(req, res, next) {
  const nama = cleanText(req.body.nama);
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const role = cleanText(req.body.role) || 'petani';
  const nik = cleanText(req.body.nik);
  const phone = cleanText(req.body.phone);
  const address = cleanText(req.body.address);

  if (role !== 'petani') {
    return res.status(403).json({
      error: 'Registrasi publik hanya untuk petani. Akun petugas dan admin dibuat oleh administrator.',
    });
  }
  if (!nama || !email || !password) {
    return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
  }
  if (nama.length > 100) {
    return res.status(400).json({ error: 'Nama maksimal 100 karakter' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    return res.status(400).json({ error: 'Format email tidak valid' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }
  if (password.length > 72) {
    return res.status(400).json({ error: 'Password maksimal 72 karakter' });
  }
  if (!nik) {
    return res.status(400).json({ error: 'NIK wajib diisi' });
  }
  if (!/^\d{16}$/.test(nik)) {
    return res.status(400).json({ error: 'NIK harus terdiri dari 16 digit angka' });
  }
  if (phone.length > 20) {
    return res.status(400).json({ error: 'Nomor telepon maksimal 20 karakter' });
  }
  if (address.length > 500) {
    return res.status(400).json({ error: 'Alamat maksimal 500 karakter' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const userRes = await client.query(
        'INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [nama, email, hashed, role]
      );
      const userId = userRes.rows[0].id;

      await client.query(
        'INSERT INTO farmers (id_user, nik, phone, address) VALUES ($1, $2, $3, $4)',
        [userId, nik, phone || null, address || null]
      );

      // Auto-verify email di development mode
      if (process.env.NODE_ENV === 'development') {
        await client.query(
          'UPDATE users SET email_verified = TRUE WHERE id = $1',
          [userId]
        );
      } else {
        // Production: kirim OTP untuk verifikasi
        const otp = await createOTP(userId);
        await sendOTPEmail(email, otp);
      }

      await client.query('COMMIT');
      
      const isDevMode = process.env.NODE_ENV === 'development';
      res.status(201).json({
        success: true,
        message: isDevMode 
          ? 'Akun petani berhasil dibuat dan terverifikasi. Silakan masuk.'
          : 'Akun petani berhasil dibuat. Silakan verifikasi email dengan kode OTP yang telah dikirim.',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        const message =
          err.constraint === 'farmers_nik_key' ? 'NIK sudah terdaftar' : 'Email sudah terdaftar';
        return res.status(400).json({ error: message });
      }
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
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Akun dinonaktifkan. Hubungi administrator untuk mengaktifkan kembali.',
      });
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

async function getProfile(req, res, next) {
  try {
    const profile = await getProfileData(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profil pengguna tidak ditemukan' });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  const nama = cleanText(req.body.nama);
  const phone = cleanText(req.body.phone);
  const address = cleanText(req.body.address);
  const position = cleanText(req.body.position);
  const unit = cleanText(req.body.unit);

  if (!nama) {
    return res.status(400).json({ error: 'Nama wajib diisi' });
  }
  if (nama.length > 100) {
    return res.status(400).json({ error: 'Nama maksimal 100 karakter' });
  }
  if (phone.length > 20) {
    return res.status(400).json({ error: 'Nomor telepon maksimal 20 karakter' });
  }
  if (position.length > 50) {
    return res.status(400).json({ error: 'Jabatan maksimal 50 karakter' });
  }
  if (unit.length > 100) {
    return res.status(400).json({ error: 'Unit kerja maksimal 100 karakter' });
  }
  if (address.length > 500) {
    return res.status(400).json({ error: 'Alamat maksimal 500 karakter' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      'UPDATE users SET nama = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [nama, req.user.id]
    );
    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    if (req.user.role === 'petani') {
      await client.query(
        'UPDATE farmers SET phone = $1, address = $2 WHERE id_user = $3',
        [phone || null, address || null, req.user.id]
      );
    } else if (req.user.role === 'petugas') {
      await client.query(
        'UPDATE officers SET position = $1, unit = $2 WHERE id_user = $3',
        [position || null, unit || null, req.user.id]
      );
    }

    await client.query('COMMIT');

    const profile = await getProfileData(req.user.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function changePassword(req, res, next) {
  const currentPassword = typeof req.body.current_password === 'string' ? req.body.current_password : '';
  const newPassword = typeof req.body.new_password === 'string' ? req.body.new_password : '';

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Password saat ini dan password baru wajib diisi' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
  }
  if (newPassword.length > 72) {
    return res.status(400).json({ error: 'Password baru maksimal 72 karakter' });
  }

  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!valid) {
      return res.status(400).json({ error: 'Password saat ini salah' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashed, req.user.id]
    );

    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    next(err);
  }
}

async function sendOTPVerification(req, res, next) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email wajib diisi' });
  }

  try {
    const user = await pool.query(
      'SELECT id, nama FROM users WHERE LOWER(email) = $1 AND email_verified = FALSE',
      [String(email || '').trim().toLowerCase()]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan atau email sudah terverifikasi' });
    }

    const userId = user.rows[0].id;
    const otp = await createOTP(userId);

    // Send OTP via email (mock)
    await sendOTPEmail(email, otp);

    res.json({
      success: true,
      message: 'Kode OTP telah dikirim ke email Anda. Berlaku 15 menit.',
      email_masked: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });
  } catch (err) {
    next(err);
  }
}

async function verifyEmailWithOTP(req, res, next) {
  const { email, otp_code } = req.body;

  if (!email || !otp_code) {
    return res.status(400).json({ error: 'Email dan kode OTP wajib diisi' });
  }

  try {
    const user = await pool.query(
      'SELECT id, nama FROM users WHERE LOWER(email) = $1 AND email_verified = FALSE',
      [String(email || '').trim().toLowerCase()]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan atau email sudah terverifikasi' });
    }

    const userId = user.rows[0].id;
    const result = await verifyOTP(userId, String(otp_code).trim());

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Email berhasil diverifikasi. Anda sekarang dapat melakukan login.',
    });
  } catch (err) {
    next(err);
  }
}

async function resendOTPVerification(req, res, next) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email wajib diisi' });
  }

  try {
    const user = await pool.query(
      'SELECT id, nama FROM users WHERE LOWER(email) = $1 AND email_verified = FALSE',
      [String(email || '').trim().toLowerCase()]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan atau email sudah terverifikasi' });
    }

    const userId = user.rows[0].id;
    const result = await resendOTP(userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Send OTP
    await sendOTPEmail(email, result.otp);

    res.json({
      success: true,
      message: 'Kode OTP baru telah dikirim ke email Anda. Berlaku 15 menit.',
      email_masked: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  sendOTPVerification,
  verifyEmailWithOTP,
  resendOTPVerification,
};
