const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isProduction = process.env.NODE_ENV === 'production';
const hasForceFlag = process.argv.includes('--force');

if (isProduction && !hasForceFlag) {
  console.error('⛔ [CLEAN ABORTED] Script pembersihan notifikasi diblokir pada environment production!');
  console.error('   Jika Anda sengaja ingin menjalankan skrip ini pada production, sertakan flag:');
  console.error('   node scripts/clean-duplicate-notifications.js --force');
  process.exit(1);
}

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'src', 'zero_burning.db');

console.log('🧹 [CLEAN NOTIFICATIONS] Menghubungkan ke database:', dbPath);

let db;
try {
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.error('❌ Gagal membuka database:', err.message);
  process.exit(1);
}

try {
  const allNotifs = db.prepare('SELECT id, user_id, type, title, message, data, created_at FROM notifications ORDER BY id DESC').all();
  console.log(`📊 Total notifikasi saat ini: ${allNotifs.length}`);

  if (allNotifs.length === 0) {
    console.log('✨ Tidak ada notifikasi yang perlu dibersihkan.');
    process.exit(0);
  }

  // 1. Cek duplikasi tepat berdasarkan (user_id, type, claim_id/photo_id)
  const seenExact = new Set();
  const toDelete = new Set();

  for (const notif of allNotifs) {
    let parsed = {};
    if (notif.data) {
      try {
        parsed = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
      } catch (_) {}
    }

    const claimId = parsed.claim_id;
    const photoId = parsed.photo_id;

    if (claimId !== undefined && claimId !== null) {
      const key = `${notif.user_id}:${notif.type}:claim:${claimId}`;
      if (seenExact.has(key)) {
        toDelete.add(notif.id);
      } else {
        seenExact.add(key);
      }
    } else if (photoId !== undefined && photoId !== null) {
      const key = `${notif.user_id}:${notif.type}:photo:${photoId}`;
      if (seenExact.has(key)) {
        toDelete.add(notif.id);
      } else {
        seenExact.add(key);
      }
    }
  }

  // 2. Bersihkan artefak data uji berulang (pesan identik pada lahan & kategori yang sama)
  // Menjaga maksimal 1 notifikasi terbaru per kategori insentif/lahan agar UI bersih
  const seenCategoryLahan = new Set();
  for (const notif of allNotifs) {
    if (toDelete.has(notif.id)) continue;

    let parsed = {};
    if (notif.data) {
      try {
        parsed = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
      } catch (_) {}
    }

    const fieldId = parsed.field_id || 0;
    const catName = parsed.category_name || '';
    const reason = parsed.reason || '';

    // Jika ini adalah event klaim berulang pada kategori dan lahan yang sama dengan alasan sama
    if (catName && notif.type.startsWith('claim.')) {
      const key = `${notif.user_id}:${notif.type}:${fieldId}:${catName}:${reason}`;
      if (seenCategoryLahan.has(key)) {
        toDelete.add(notif.id);
      } else {
        seenCategoryLahan.add(key);
      }
    }
  }

  if (toDelete.size === 0) {
    console.log('✨ Tidak ditemukan notifikasi duplikat atau artefak uji berulang.');
  } else {
    console.log(`🗑️  Menghapus ${toDelete.size} notifikasi duplikat / artefak uji berulang...`);
    const deleteStmt = db.prepare('DELETE FROM notifications WHERE id = ?');
    const deleteMany = db.transaction((ids) => {
      for (const id of ids) {
        deleteStmt.run(id);
      }
    });

    deleteMany(Array.from(toDelete));
    console.log(`✓ Berhasil membersihkan ID: ${Array.from(toDelete).sort((a, b) => a - b).join(', ')}`);
  }

  const remaining = db.prepare('SELECT count(*) as count FROM notifications').get();
  console.log(`✅ Notifikasi tersisa: ${remaining.count}`);
} catch (err) {
  console.error('❌ Terjadi kesalahan saat pembersihan:', err.message);
  process.exit(1);
} finally {
  db.close();
}
