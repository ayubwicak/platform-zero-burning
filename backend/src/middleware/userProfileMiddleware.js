const pool = require('../config/db');

async function attachUserProfile(req, res, next) {
  try {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'petani') {
      const result = await pool.query(
        'SELECT id FROM farmers WHERE id_user = $1',
        [userId]
      );
      if (result.rows.length > 0) {
        req.user.farmerId = result.rows[0].id;
      }
    } else if (role === 'petugas') {
      const result = await pool.query(
        'SELECT id FROM officers WHERE id_user = $1',
        [userId]
      );
      if (result.rows.length > 0) {
        req.user.officerId = result.rows[0].id;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { attachUserProfile };