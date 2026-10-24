const pool = require('../config/db');

/**
 * Generate random 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via email (mock untuk development)
 * Di production, integrasikan dengan Nodemailer atau service email
 */
async function sendOTPEmail(email, otp) {
  console.log(`[EMAIL] Sending OTP to ${email}: ${otp}`);
  // TODO: Implementasi pengiriman email real
  return true;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Buat dan simpan OTP untuk email user
 */
async function createOTP(email, db = pool) {
  try {
    const otp = generateOTP();
    const normalizedEmail = normalizeEmail(email);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    await db.query('DELETE FROM email_verifications WHERE LOWER(email) = ?', [normalizedEmail]);
    await db.query(
      `INSERT INTO email_verifications (email, otp_code, expires_at)
       VALUES (?, ?, ?)`,
      [normalizedEmail, otp, expiresAt]
    );

    return otp;
  } catch (err) {
    console.error('createOTP error:', err.message);
    throw err;
  }
}

/**
 * Verifikasi OTP dan tandai email sebagai verified
 */
async function verifyOTP(email, otpCode, db = pool) {
  try {
    const normalizedEmail = normalizeEmail(email);
    const verification = await db.query(
      `SELECT * FROM email_verifications
       WHERE LOWER(email) = ? AND expires_at > CURRENT_TIMESTAMP
       ORDER BY id DESC
       LIMIT 1`,
      [normalizedEmail]
    );

    if (verification.rows.length === 0) {
      return { success: false, error: 'OTP sudah kadaluarsa atau tidak ditemukan' };
    }

    const record = verification.rows[0];

    // Cek max attempts
    if (record.attempts >= 5) {
      return { success: false, error: 'Terlalu banyak percobaan. Buat OTP baru.' };
    }

    // Validasi OTP
    if (String(record.otp_code) !== String(otpCode)) {
      await db.query(
        'UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?',
        [record.id]
      );
      return { success: false, error: 'Kode OTP salah' };
    }

    // Update user email_verified
    await db.query(
      `UPDATE users SET email_verified = TRUE, verified_at = CURRENT_TIMESTAMP
       WHERE LOWER(email) = ?`,
      [normalizedEmail]
    );

    // Delete OTP record
    await db.query('DELETE FROM email_verifications WHERE LOWER(email) = ?', [normalizedEmail]);

    return { success: true, message: 'Email berhasil diverifikasi' };
  } catch (err) {
    console.error('verifyOTP error:', err.message);
    throw err;
  }
}

/**
 * Resend OTP
 */
async function resendOTP(email, db = pool) {
  try {
    const otp = await createOTP(email, db);
    return { success: true, otp };
  } catch (err) {
    console.error('resendOTP error:', err.message);
    throw err;
  }
}

module.exports = {
  generateOTP,
  sendOTPEmail,
  createOTP,
  verifyOTP,
  resendOTP,
};
