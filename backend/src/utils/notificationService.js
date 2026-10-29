const pool = require('../config/db');

/**
 * Membuat notifikasi baru untuk pengguna tertentu.
 * Bisa menerima client aktif (dalam transaksi) atau menggunakan pool default.
 *
 * @param {object} client - pg/sqlite pool atau client transaksi
 * @param {object} param1 - data notifikasi
 * @param {number} param1.userId - ID penerima notifikasi (users.id)
 * @param {string} param1.type - Tipe notifikasi ('claim.approved', 'claim.rejected', 'claim.cancelled', 'photo.verified', 'photo.rejected', 'photo.auto_verified', dll)
 * @param {string} param1.title - Judul ringkas
 * @param {string} param1.message - Pesan penjelasan
 * @param {object} [param1.data] - Data pelengkap (photo_id, claim_id, link, dll)
 * @returns {Promise<object>} Notifikasi yang berhasil dibuat
 */
async function createNotification(clientOrPool, { userId, type, title, message, data = {} }) {
  if (!userId || !type || !title || !message) {
    throw new Error('userId, type, title, dan message wajib diisi untuk membuat notifikasi');
  }

  const executor = clientOrPool || pool;
  const jsonData = typeof data === 'string' ? data : JSON.stringify(data);

  const result = await executor.query(
    `INSERT INTO notifications (user_id, type, title, message, data, created_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [userId, type, title, message, jsonData]
  );

  return result;
}

/**
 * Membersihkan notifikasi lama (> 90 hari) untuk menjaga performa database.
 */
async function cleanOldNotifications(executor = pool) {
  try {
    // Kompatibel dengan SQLite dan PostgreSQL
    await executor.query(
      `DELETE FROM notifications
       WHERE created_at < datetime('now', '-90 days')`
    );
  } catch (err) {
    // Jika sintaks SQLite gagal (misal di PostgreSQL), fallback ke INTERVAL
    try {
      await executor.query(
        `DELETE FROM notifications
         WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days'`
      );
    } catch (_ignore) {
      // Abaikan error cleanup agar tidak menghambat aliran utama
    }
  }
}

module.exports = {
  createNotification,
  cleanOldNotifications,
};
