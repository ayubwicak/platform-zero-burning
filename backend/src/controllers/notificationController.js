const pool = require('../config/db');
const { cleanOldNotifications } = require('../utils/notificationService');

/**
 * Mengambil daftar notifikasi milik pengguna yang sedang login.
 * Query params opsional:
 * - limit: number (default 20, max 50)
 * - cursor: ID notifikasi terakhir untuk cursor pagination
 * - unread: boolean ('true' / '1' untuk memfilter hanya yang belum dibaca)
 */
async function listNotifications(req, res, next) {
  const userId = req.user.id;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  const unreadOnly = req.query.unread === 'true' || req.query.unread === '1';
  const cursor = parseInt(req.query.cursor, 10);

  // Jalankan pembersihan notifikasi lama di background secara non-blocking
  cleanOldNotifications(pool).catch(() => {});

  try {
    const params = [userId];
    let queryStr = `
      SELECT id, user_id, type, title, message, data, read_at, created_at
      FROM notifications
      WHERE user_id = ?
    `;

    if (unreadOnly) {
      queryStr += ' AND read_at IS NULL';
    }

    if (cursor && !Number.isNaN(cursor)) {
      queryStr += ' AND id < ?';
      params.push(cursor);
    }

    queryStr += ' ORDER BY created_at DESC, id DESC LIMIT ?';
    params.push(limit);

    const result = await pool.query(queryStr, params);

    // Parsing data JSON jika tersimpan sebagai string
    const items = result.rows.map((row) => {
      let parsedData = {};
      if (row.data) {
        try {
          parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        } catch (_e) {
          parsedData = {};
        }
      }
      return {
        ...row,
        data: parsedData,
      };
    });

    res.json({
      success: true,
      data: items,
      has_more: items.length === limit,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mengambil jumlah notifikasi belum dibaca milik pengguna yang login.
 */
async function getUnreadCount(req, res, next) {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT CAST(COUNT(*) AS INTEGER) AS count
       FROM notifications
       WHERE user_id = ? AND read_at IS NULL`,
      [userId]
    );

    const count = parseInt(result.rows[0]?.count || 0, 10);

    res.json({
      success: true,
      count,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Menandai satu notifikasi sebagai sudah dibaca (read_at = CURRENT_TIMESTAMP).
 * Hanya pemilik notifikasi yang dapat menandainya.
 */
async function markAsRead(req, res, next) {
  const userId = req.user.id;
  const notifId = req.params.id;

  try {
    const check = await pool.query(
      'SELECT id, user_id, read_at FROM notifications WHERE id = ?',
      [notifId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
    }

    // Pastikan user hanya bisa menandai notifikasi miliknya sendiri
    if (check.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    if (!check.rows[0].read_at) {
      await pool.query(
        'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ?',
        [notifId]
      );
    }

    res.json({
      success: true,
      message: 'Notifikasi ditandai sudah dibaca',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Menandai semua notifikasi milik pengguna sebagai sudah dibaca.
 */
async function markAllAsRead(req, res, next) {
  const userId = req.user.id;

  try {
    await pool.query(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL',
      [userId]
    );

    res.json({
      success: true,
      message: 'Semua notifikasi ditandai sudah dibaca',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
