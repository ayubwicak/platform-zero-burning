const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

let customS3Client = null;

function getStorageDriver() {
  return (process.env.STORAGE_DRIVER || 'local').toLowerCase();
}

function getS3Client() {
  if (customS3Client) {
    return customS3Client;
  }

  const endpoint = process.env.S3_ENDPOINT || undefined;
  return new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || Boolean(endpoint),
  });
}

function setS3ClientForTesting(client) {
  customS3Client = client;
}

/**
 * Upload a file to storage (local disk or S3/R2)
 * @param {Object} options
 * @param {string} options.key - Object key, e.g. "photos/abc.jpg"
 * @param {string} [options.filePath] - Source file path on disk
 * @param {Buffer} [options.buffer] - Source file buffer
 * @param {string} [options.contentType] - MIME type, e.g. "image/jpeg"
 * @returns {Promise<{ key: string }>}
 */
async function uploadFile({ key, filePath, buffer, contentType = 'image/jpeg' }) {
  if (!key) {
    throw new Error('Storage key is required');
  }

  const driver = getStorageDriver();

  let bodyBuffer = buffer;
  if (!bodyBuffer && filePath) {
    bodyBuffer = fs.readFileSync(filePath);
  }

  if (!bodyBuffer) {
    throw new Error('Either filePath or buffer must be provided');
  }

  if (driver === 's3') {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      throw new Error('S3_BUCKET environment variable is not configured');
    }

    const s3 = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bodyBuffer,
      ContentType: contentType,
    });

    await s3.send(command);
    return { key };
  }

  // Local storage driver
  const targetPath = path.join(uploadDir, key);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (filePath && filePath !== targetPath) {
    fs.copyFileSync(filePath, targetPath);
  } else if (bodyBuffer) {
    fs.writeFileSync(targetPath, bodyBuffer);
  }

  return { key };
}

/**
 * Get a viewable URL for a photo key or legacy path
 * @param {string} keyOrUrl - Object key or existing URL/path
 * @param {number} [expiresInSeconds=600] - Presigned URL expiration (default 10 mins)
 * @returns {Promise<string>}
 */
async function getPhotoUrl(keyOrUrl, expiresInSeconds = 600) {
  if (!keyOrUrl) return '';

  // Return external URLs (e.g. Unsplash demo seeds) as-is
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    return keyOrUrl;
  }

  const driver = getStorageDriver();

  // S3 Driver
  if (driver === 's3') {
    // Fallback: If it's a legacy local path during transition (starts with /uploads/), return as-is
    if (keyOrUrl.startsWith('/uploads/')) {
      return keyOrUrl;
    }

    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      return `/uploads/${keyOrUrl}`;
    }

    try {
      const s3 = getS3Client();
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: keyOrUrl,
      });

      return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
    } catch (err) {
      console.error('Error generating presigned URL:', err.message);
      // Fallback if presigner fails
      return `/uploads/${keyOrUrl}`;
    }
  }

  // Local Driver
  if (keyOrUrl.startsWith('/uploads/')) {
    return keyOrUrl;
  }

  return `/uploads/${keyOrUrl.replace(/^\/+/, '')}`;
}

/**
 * Resolve photo_url for a single item or array of items
 */
async function resolvePhotoUrls(items, field = 'photo_url', expiresInSeconds = 600) {
  if (!items) return items;

  if (Array.isArray(items)) {
    return Promise.all(
      items.map(async (item) => {
        if (!item) return item;
        const resolvedUrl = await getPhotoUrl(item[field], expiresInSeconds);
        return {
          ...item,
          [field]: resolvedUrl,
        };
      })
    );
  }

  const resolvedUrl = await getPhotoUrl(items[field], expiresInSeconds);
  return {
    ...items,
    [field]: resolvedUrl,
  };
}

/**
 * Delete a file from storage
 * @param {string} keyOrUrl
 */
async function deleteFile(keyOrUrl) {
  if (!keyOrUrl) return;

  // External URLs are not stored in our storage
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    return;
  }

  const driver = getStorageDriver();

  if (driver === 's3' && !keyOrUrl.startsWith('/uploads/')) {
    const bucket = process.env.S3_BUCKET;
    if (bucket) {
      const s3 = getS3Client();
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: keyOrUrl,
      });
      await s3.send(command).catch((err) => {
        console.error('Failed to delete S3 object:', err.message);
      });
      return;
    }
  }

  // Local file cleanup (also handles legacy /uploads/... paths)
  const relativePath = keyOrUrl.startsWith('/uploads/')
    ? keyOrUrl.replace(/^\/uploads\//, '')
    : keyOrUrl;
  const fullPath = path.join(uploadDir, relativePath);

  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      // Ignore cleanup error if already removed
    }
  }
}

module.exports = {
  uploadDir,
  getStorageDriver,
  uploadFile,
  getPhotoUrl,
  resolvePhotoUrls,
  deleteFile,
  setS3ClientForTesting,
};
