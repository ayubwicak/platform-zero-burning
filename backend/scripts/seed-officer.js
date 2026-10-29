const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Muat environment variables jika file .env ada
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Pengaman Production: menolak seeding akun demo jika NODE_ENV=production kecuali --force diberikan
const isProduction = process.env.NODE_ENV === 'production';
const hasForceFlag = process.argv.includes('--force');

if (isProduction && !hasForceFlag) {
  console.error('⛔ [SEED ABORTED] Script seed diblokir pada environment production!');
  console.error('   Jika Anda sengaja ingin menjalankan seed ini pada production, sertakan flag:');
  console.error('   node scripts/seed-officer.js --force');
  process.exit(1);
}

// Lokasi database SQLite
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'src', 'zero_burning.db');

console.log('🌱 [SEED OFFICER] Menghubungkan ke database:', dbPath);

let db;
try {
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.error('❌ Gagal membuka database:', err.message);
  process.exit(1);
}

// Data akun petugas verifikator untuk demo
const officerAccount = {
  nama: 'Bambang Wijaya, S.P.',
  email: 'petugas@contoh.com',
  nik: '3404010202850002',
  nip: '198502022010011005',
  phone: '081234567891',
  address: 'Dinas Pertanian dan Ketahanan Pangan D.I. Yogyakarta',
  position: 'Verifikator Lapangan',
  unit: 'Seksi Pengendalian Kebakaran Lahan',
  officerType: 'verifikator',
  role: 'petugas',
  passwordPlain: process.env.SEED_OFFICER_PASSWORD || 'Petugas123!',
};

function seedOfficer() {
  const transaction = db.transaction(() => {
    // 1. Hash password dengan bcrypt salt round 10
    const hashedPassword = bcrypt.hashSync(officerAccount.passwordPlain, 10);

    // 2. Cek apakah user sudah ada berdasarkan email
    const existingUser = db
      .prepare('SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)')
      .get(officerAccount.email);

    let userId;

    if (existingUser) {
      console.log(`ℹ️ User "${officerAccount.email}" sudah ada (User ID: ${existingUser.id}). Memperbarui data...`);
      db.prepare(`
        UPDATE users
        SET nama = ?,
            nik = ?,
            phone = ?,
            address = ?,
            password = ?,
            role = ?,
            email_verified = 1,
            verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP),
            is_active = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        officerAccount.nama,
        officerAccount.nik,
        officerAccount.phone,
        officerAccount.address,
        hashedPassword,
        officerAccount.role,
        existingUser.id
      );
      userId = existingUser.id;
    } else {
      const insertUser = db.prepare(`
        INSERT INTO users (
          nama, email, nik, phone, address, password, role, email_verified, verified_at, is_active
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, 1
        )
      `).run(
        officerAccount.nama,
        officerAccount.email.toLowerCase(),
        officerAccount.nik,
        officerAccount.phone,
        officerAccount.address,
        hashedPassword,
        officerAccount.role
      );
      userId = insertUser.lastInsertRowid;
      console.log(`✓ User petugas baru berhasil dibuat (User ID: ${userId}).`);
    }

    // 3. Pastikan record di tabel officers tersedia
    const existingOfficer = db
      .prepare('SELECT id FROM officers WHERE id_user = ?')
      .get(userId);

    let officerId;
    if (existingOfficer) {
      db.prepare(`
        UPDATE officers
        SET nip = ?,
            position = ?,
            unit = ?,
            officer_type = ?
        WHERE id = ?
      `).run(
        officerAccount.nip,
        officerAccount.position,
        officerAccount.unit,
        officerAccount.officerType,
        existingOfficer.id
      );
      officerId = existingOfficer.id;
      console.log(`✓ Profil officers diperbarui (Officer ID: ${officerId}).`);
    } else {
      const insertOfficer = db.prepare(`
        INSERT INTO officers (
          id_user, nip, position, unit, officer_type
        ) VALUES (
          ?, ?, ?, ?, ?
        )
      `).run(
        userId,
        officerAccount.nip,
        officerAccount.position,
        officerAccount.unit,
        officerAccount.officerType
      );
      officerId = insertOfficer.lastInsertRowid;
      console.log(`✓ Profil officers berhasil dibuat (Officer ID: ${officerId}).`);
    }

    return { userId, officerId };
  });

  try {
    const result = transaction();
    console.log('\n========================================');
    console.log('🎉 SEED AKUN PETUGAS BERHASIL!');
    console.log('========================================');
    console.log('Kredensial Login Petugas:');
    console.log(`  Nama     : ${officerAccount.nama}`);
    console.log(`  Role     : ${officerAccount.role}`);
    console.log(`  Email    : ${officerAccount.email}`);
    console.log(`  Password : ${officerAccount.passwordPlain}`);
    console.log(`  NIP      : ${officerAccount.nip}`);
    console.log(`  Jabatan  : ${officerAccount.position}`);
    console.log(`  Unit     : ${officerAccount.unit}`);
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Gagal menjalankan seed petugas:', err.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

seedOfficer();
