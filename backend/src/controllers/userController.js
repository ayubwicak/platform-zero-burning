const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const ROLES = ['petani', 'petugas', 'admin'];

const USER_SELECT = `
  SELECT u.id, u.nama, u.email, u.role, u.created_at,
         f.nik, f.phone, f.address,
         o.nip, o.position, o.unit
  FROM users u
  LEFT JOIN farmers f ON f.id_user = u.id
  LEFT JOIN officers o ON o.id_user = u.id
`;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function findByEmail(client, email) {
  return client.query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
}

async function listUsers(req, res, next) {
  try {
    const result = await pool.query(`${USER_SELECT} ORDER BY u.created_at DESC, u.id DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  const { nama, email, password, role, nik, phone, address, nip, position, unit } = req.body;

  if (!nama || !email || !password || !role) {
    return res.status(400).json({ error: 'Nama, email, password, dan role wajib diisi' });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role tidak valid' });
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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await findByEmail(client, normalizeEmail(email));
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      `INSERT INTO users (nama, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nama, email, role, created_at`,
      [nama, normalizeEmail(email), hashed, role]
    );
    const userId = userRes.rows[0].id;

    if (role === 'petani') {
      await client.query(
        'INSERT INTO farmers (id_user, nik, phone, address) VALUES ($1, $2, $3, $4)',
        [userId, nik, phone || null, address || null]
      );
    } else if (role === 'petugas') {
      await client.query(
        'INSERT INTO officers (id_user, nip, position, unit) VALUES ($1, $2, $3, $4)',
        [userId, nip, position || null, unit || null]
      );
    }

    await client.query('COMMIT');

    const created = await pool.query(`${USER_SELECT} WHERE u.id = $1`, [userId]);
    res.status(201).json({ success: true, data: created.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email, NIK, atau NIP sudah digunakan' });
    }
    next(err);
  } finally {
    client.release();
  }
}

async function updateUserRole(req, res, next) {
  const { id } = req.params;
  const { role, nik, phone, address, nip, position, unit } = req.body;

  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role tidak valid' });
  }
  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: 'Anda tidak dapat mengubah hak akses akun sendiri' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT id, role FROM users WHERE id = $1 FOR UPDATE', [id]);
    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    if (role === 'petani') {
      const profile = await client.query('SELECT id FROM farmers WHERE id_user = $1', [id]);
      if (profile.rows.length === 0) {
        if (!nik) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'NIK wajib diisi untuk role petani' });
        }
        await client.query(
          'INSERT INTO farmers (id_user, nik, phone, address) VALUES ($1, $2, $3, $4)',
          [id, nik, phone || null, address || null]
        );
      }
    } else if (role === 'petugas') {
      const profile = await client.query('SELECT id FROM officers WHERE id_user = $1', [id]);
      if (profile.rows.length === 0) {
        if (!nip) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'NIP wajib diisi untuk role petugas' });
        }
        await client.query(
          'INSERT INTO officers (id_user, nip, position, unit) VALUES ($1, $2, $3, $4)',
          [id, nip, position || null, unit || null]
        );
      }
    }

    await client.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [role, id]
    );

    await client.query('COMMIT');

    const updated = await pool.query(`${USER_SELECT} WHERE u.id = $1`, [id]);
    res.json({ success: true, data: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(400).json({ error: 'NIK atau NIP sudah digunakan' });
    }
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { listUsers, createUser, updateUserRole };
