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
  console.error('   node scripts/seed-farmer.js --force');
  process.exit(1);
}

// Lokasi database SQLite
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'src', 'zero_burning.db');

console.log('🌱 [SEED FARMER] Menghubungkan ke database:', dbPath);

let db;
try {
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.error('❌ Gagal membuka database:', err.message);
  process.exit(1);
}

// Data akun petani untuk development / demo
const farmerAccount = {
  nama: 'Budi Santoso',
  email: 'petani@contoh.com',
  nik: '3404010101900001',
  phone: '081234567890',
  address: 'Sleman, Yogyakarta',
  role: 'petani',
  // Ambil password dari env SEED_FARMER_PASSWORD atau default development
  passwordPlain: process.env.SEED_FARMER_PASSWORD || 'Petani123!',
};

// Data lahan contoh di wilayah Sleman, D.I. Yogyakarta (opsional untuk demo upload GPS)
const sampleField = {
  name: 'Sawah Berkah Sleman',
  area: 2500,
  category: 'Padi',
  cropType: 'Padi Organik',
  latitude: -7.7156,
  longitude: 110.3556,
  address: 'Jl. Magelang KM 10, Tridadi, Sleman, D.I. Yogyakarta',
  status: 'active',
};

function seedFarmer() {
  const transaction = db.transaction(() => {
    // 1. Hash password dengan bcrypt salt round 10 (persis seperti authController)
    const hashedPassword = bcrypt.hashSync(farmerAccount.passwordPlain, 10);

    // 2. Cek apakah user sudah ada berdasarkan email
    const existingUser = db
      .prepare('SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)')
      .get(farmerAccount.email);

    let userId;

    if (existingUser) {
      console.log(`ℹ️ User "${farmerAccount.email}" sudah ada (User ID: ${existingUser.id}). Memperbarui data...`);
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
        farmerAccount.nama,
        farmerAccount.nik,
        farmerAccount.phone,
        farmerAccount.address,
        hashedPassword,
        farmerAccount.role,
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
        farmerAccount.nama,
        farmerAccount.email.toLowerCase(),
        farmerAccount.nik,
        farmerAccount.phone,
        farmerAccount.address,
        hashedPassword,
        farmerAccount.role
      );
      userId = insertUser.lastInsertRowid;
      console.log(`✓ User petani baru berhasil dibuat (User ID: ${userId}).`);
    }

    // 3. Pastikan record di tabel farmers tersedia
    const existingFarmer = db
      .prepare('SELECT id FROM farmers WHERE id_user = ?')
      .get(userId);

    let farmerId;
    if (existingFarmer) {
      db.prepare(`
        UPDATE farmers
        SET nik = ?,
            phone = ?,
            address = ?,
            verification_status = 'verified'
        WHERE id = ?
      `).run(
        farmerAccount.nik,
        farmerAccount.phone,
        farmerAccount.address,
        existingFarmer.id
      );
      farmerId = existingFarmer.id;
      console.log(`✓ Profil farmers diperbarui (Farmer ID: ${farmerId}).`);
    } else {
      const insertFarmer = db.prepare(`
        INSERT INTO farmers (
          id_user, nik, phone, address, verification_status
        ) VALUES (
          ?, ?, ?, ?, 'verified'
        )
      `).run(
        userId,
        farmerAccount.nik,
        farmerAccount.phone,
        farmerAccount.address
      );
      farmerId = insertFarmer.lastInsertRowid;
      console.log(`✓ Profil farmers baru berhasil dibuat (Farmer ID: ${farmerId}).`);
    }

    // 4. Buat / pastikan lahan contoh milik petani ini tersedia
    const existingField = db
      .prepare('SELECT id FROM fields WHERE id_farmer = ? AND name = ?')
      .get(farmerId, sampleField.name);

    if (existingField) {
      console.log(`ℹ️ Lahan contoh "${sampleField.name}" sudah ada (Field ID: ${existingField.id}).`);
    } else {
      const insertField = db.prepare(`
        INSERT INTO fields (
          id_user, id_farmer, name, area, category, crop_type, latitude, longitude, address, status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `).run(
        userId,
        farmerId,
        sampleField.name,
        sampleField.area,
        sampleField.category,
        sampleField.cropType,
        sampleField.latitude,
        sampleField.longitude,
        sampleField.address,
        sampleField.status
      );
      console.log(`✓ Lahan contoh "${sampleField.name}" dibuat (Field ID: ${insertField.lastInsertRowid}) di koordinat [${sampleField.latitude}, ${sampleField.longitude}].`);
    }

    return { userId, farmerId };
  });

  try {
    const result = transaction();
    console.log('\n========================================');
    console.log('🎉 SEED AKUN PETANI SELESAI');
    console.log('========================================');
    console.log('Nama:        ', farmerAccount.nama);
    console.log('Email:       ', farmerAccount.email);
    console.log('Password:    ', farmerAccount.passwordPlain);
    console.log('Role:        ', farmerAccount.role);
    console.log('NIK:         ', farmerAccount.nik);
    console.log('Telepon:     ', farmerAccount.phone);
    console.log('Alamat:      ', farmerAccount.address);
    console.log('Status:       Aktif & Email Terverifikasi (Siap Login)');
    console.log('User ID:     ', result.userId);
    console.log('Farmer ID:   ', result.farmerId);
    console.log('Lahan Demo:  ', `${sampleField.name} (${sampleField.cropType}, ${sampleField.area} m²)`);
    console.log('Koordinat:   ', `Lat: ${sampleField.latitude}, Long: ${sampleField.longitude}`);
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Gagal menjalankan seed:', err.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

seedFarmer();
