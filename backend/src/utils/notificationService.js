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

  // 1. Ekstrak data untuk evaluasi idempotensi
  let payloadData = {};
  if (typeof data === 'string') {
    try {
      payloadData = JSON.parse(data);
    } catch (_) {
      payloadData = {};
    }
  } else if (data && typeof data === 'object') {
    payloadData = data;
  }

  const claimId = payloadData.claim_id;
  const photoId = payloadData.photo_id;
  const newStatus = payloadData.status;

  // 2. Cek idempotensi: cari notifikasi terbaru untuk user dan tipe event ini
  try {
    const recentCheck = await executor.query(
      `SELECT id, user_id, type, title, message, data, read_at, created_at
       FROM notifications
       WHERE user_id = ? AND type = ?
       ORDER BY id DESC
       LIMIT 10`,
      [userId, type]
    );

    for (const existing of recentCheck.rows) {
      let existingData = {};
      if (existing.data) {
        try {
          existingData = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;
        } catch (_) {
          existingData = {};
        }
      }

      // Kasus A: Idempotensi berdasarkan claim_id
      if (claimId !== undefined && claimId !== null && Number(existingData.claim_id) === Number(claimId)) {
        if (!newStatus || existingData.status === newStatus) {
          return { rows: [existing], rowCount: 1, deduplicated: true };
        }
      }

      // Kasus B: Idempotensi berdasarkan photo_id
      if (photoId !== undefined && photoId !== null && Number(existingData.photo_id) === Number(photoId)) {
        if (!newStatus || existingData.status === newStatus) {
          return { rows: [existing], rowCount: 1, deduplicated: true };
        }
      }

      // Kasus C: Window waktu singkat (30 detik) dengan title & message yang sama persis
      const existingTime = new Date(existing.created_at).getTime();
      const nowTime = Date.now();
      if (
        !Number.isNaN(existingTime) &&
        Math.abs(nowTime - existingTime) < 30000 &&
        existing.title === title &&
        existing.message === message
      ) {
        return { rows: [existing], rowCount: 1, deduplicated: true };
      }
    }
  } catch (_checkErr) {
    // Jika check query gagal (misal transaksi belum siap), abaikan dan lanjutkan insert
  }

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
