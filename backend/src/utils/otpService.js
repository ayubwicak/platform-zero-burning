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

/**
 * Buat dan simpan OTP untuk user
 */
async function createOTP(userId, db = pool) {
  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    await db.query(
      `INSERT INTO email_verifications (user_id, otp_code, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET otp_code = $2, attempts = 0, created_at = CURRENT_TIMESTAMP, expires_at = $3`,
      [userId, otp, expiresAt]
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
async function verifyOTP(userId, otpCode, db = pool) {
  try {
    const verification = await db.query(
      `SELECT * FROM email_verifications 
       WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [userId]
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
    if (record.otp_code !== otpCode) {
      await db.query(
        'UPDATE email_verifications SET attempts = attempts + 1 WHERE user_id = $1',
        [userId]
      );
      return { success: false, error: 'Kode OTP salah' };
    }

    // Update user email_verified
    await db.query(
      `UPDATE users SET email_verified = TRUE, verified_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userId]
    );

    // Delete OTP record
    await db.query('DELETE FROM email_verifications WHERE user_id = $1', [userId]);

    return { success: true, message: 'Email berhasil diverifikasi' };
  } catch (err) {
    console.error('verifyOTP error:', err.message);
    throw err;
  }
}

/**
 * Resend OTP
 */
async function resendOTP(userId, db = pool) {
  try {
    // Delete old record
    await db.query('DELETE FROM email_verifications WHERE user_id = $1', [userId]);

    // Create new OTP
    const otp = await createOTP(userId, db);

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
