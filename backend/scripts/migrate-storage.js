const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = require('../src/config/db');
const { uploadFile, uploadDir, getStorageDriver } = require('../src/utils/storage');

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

async function migrateStorage() {
  console.log(`[Storage Migration] Starting migration using driver: ${getStorageDriver()}`);

  try {
    const result = await pool.query('SELECT id, photo_url FROM field_photos ORDER BY id ASC');
    const photos = result.rows;

    let migrated = 0;
    let skipped = 0;
    let missingFiles = 0;

    for (const photo of photos) {
      const url = photo.photo_url || '';

      // Skip external seeds (e.g. Unsplash)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        skipped++;
        continue;
      }

      // Already migrated to object key format
      if (url.startsWith('photos/')) {
        skipped++;
        continue;
      }

      // Legacy path format, e.g. /uploads/1730000-photo.jpg or photo.jpg
      const cleanName = url.replace(/^\/uploads\//, '');
      const localFilePath = path.join(uploadDir, cleanName);

      if (!fs.existsSync(localFilePath)) {
        console.warn(`[Storage Migration] Photo #${photo.id} file not found locally: ${localFilePath}`);
        missingFiles++;
        continue;
      }

      const objectKey = `photos/${path.basename(cleanName)}`;
      const contentType = getMimeType(cleanName);

      try {
        await uploadFile({
          key: objectKey,
          filePath: localFilePath,
          contentType,
        });

        await pool.query('UPDATE field_photos SET photo_url = ? WHERE id = ?', [objectKey, photo.id]);
        migrated++;
        console.log(`[Storage Migration] Photo #${photo.id} migrated: ${url} -> ${objectKey}`);
      } catch (err) {
        console.error(`[Storage Migration] Failed migrating photo #${photo.id}:`, err.message);
      }
    }

    console.log(`[Storage Migration] Completed: ${migrated} migrated, ${skipped} skipped, ${missingFiles} missing.`);
  } catch (err) {
    console.error('[Storage Migration] Error during migration:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  migrateStorage()
    .then(() => {
      console.log('[Storage Migration] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { migrateStorage };
