const fs = require('fs');
const path = require('path');
const {
  uploadDir,
  getStorageDriver,
  uploadFile,
  getPhotoUrl,
  resolvePhotoUrls,
  deleteFile,
  setS3ClientForTesting,
} = require('../src/utils/storage');

describe('Storage Abstraction (utils/storage.js)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    setS3ClientForTesting(null);
  });

  afterAll(() => {
    process.env = originalEnv;
    setS3ClientForTesting(null);
  });

  describe('Local Storage Driver (default)', () => {
    beforeEach(() => {
      delete process.env.STORAGE_DRIVER;
    });

    it('defaults to "local" driver when STORAGE_DRIVER is not set', () => {
      expect(getStorageDriver()).toBe('local');
    });

    it('successfully uploads buffer to local uploads directory', async () => {
      const testKey = `photos/test-${Date.now()}.jpg`;
      const testBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      const result = await uploadFile({
        key: testKey,
        buffer: testBuffer,
        contentType: 'image/jpeg',
      });

      expect(result.key).toBe(testKey);

      const targetPath = path.join(uploadDir, testKey);
      expect(fs.existsSync(targetPath)).toBe(true);

      // Clean up
      await deleteFile(testKey);
      expect(fs.existsSync(targetPath)).toBe(false);
    });

    it('returns local /uploads/ URL for keys', async () => {
      const url1 = await getPhotoUrl('photos/test-sample.jpg');
      expect(url1).toBe('/uploads/photos/test-sample.jpg');

      const url2 = await getPhotoUrl('/uploads/photos/test-sample.jpg');
      expect(url2).toBe('/uploads/photos/test-sample.jpg');
    });

    it('preserves external HTTP and HTTPS URLs as-is', async () => {
      const externalUrl = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef';
      const result = await getPhotoUrl(externalUrl);
      expect(result).toBe(externalUrl);
    });

    it('resolves photo_url for arrays and single objects', async () => {
      const items = [
        { id: 1, photo_url: 'photos/img1.jpg' },
        { id: 2, photo_url: 'https://images.unsplash.com/sample' },
      ];

      const resolved = await resolvePhotoUrls(items);
      expect(resolved[0].photo_url).toBe('/uploads/photos/img1.jpg');
      expect(resolved[1].photo_url).toBe('https://images.unsplash.com/sample');

      const single = await resolvePhotoUrls({ id: 3, photo_url: 'photos/img2.jpg' });
      expect(single.photo_url).toBe('/uploads/photos/img2.jpg');
    });
  });

  describe('S3 / Cloudflare R2 Driver (Mocked)', () => {
    let mockS3Client;
    let sentCommands;

    beforeEach(() => {
      process.env.STORAGE_DRIVER = 's3';
      process.env.S3_BUCKET = 'test-zero-burning-bucket';
      process.env.S3_REGION = 'auto';
      process.env.S3_ENDPOINT = 'https://example.r2.cloudflarestorage.com';
      process.env.S3_ACCESS_KEY_ID = 'test-key';
      process.env.S3_SECRET_ACCESS_KEY = 'test-secret';

      sentCommands = [];
      mockS3Client = {
        send: jest.fn().mockImplementation(async (command) => {
          sentCommands.push(command);
          return { $metadata: { httpStatusCode: 200 } };
        }),
      };
      setS3ClientForTesting(mockS3Client);
    });

    it('detects S3 driver when STORAGE_DRIVER is set', () => {
      expect(getStorageDriver()).toBe('s3');
    });

    it('uploads file by sending PutObjectCommand to S3', async () => {
      const testKey = 'photos/remote-test.jpg';
      const testBuffer = Buffer.from('mock-image-data');

      const result = await uploadFile({
        key: testKey,
        buffer: testBuffer,
        contentType: 'image/jpeg',
      });

      expect(result.key).toBe(testKey);
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);

      const command = sentCommands[0];
      expect(command.constructor.name).toBe('PutObjectCommand');
      expect(command.input.Bucket).toBe('test-zero-burning-bucket');
      expect(command.input.Key).toBe(testKey);
      expect(command.input.ContentType).toBe('image/jpeg');
    });

    it('throws error if S3_BUCKET is not set when driver is s3', async () => {
      delete process.env.S3_BUCKET;
      await expect(
        uploadFile({
          key: 'photos/test.jpg',
          buffer: Buffer.from('test'),
        })
      ).rejects.toThrow('S3_BUCKET');
    });

    it('falls back to returning legacy /uploads/ path as-is during transition', async () => {
      const legacyPath = '/uploads/legacy-file-123.jpg';
      const url = await getPhotoUrl(legacyPath);
      expect(url).toBe(legacyPath);
    });

    it('preserves external HTTP and HTTPS URLs as-is in S3 mode', async () => {
      const extUrl = 'https://external-cdn.com/photos/123.jpg';
      const url = await getPhotoUrl(extUrl);
      expect(url).toBe(extUrl);
    });

    it('deletes object by sending DeleteObjectCommand to S3', async () => {
      const testKey = 'photos/to-delete.jpg';
      await deleteFile(testKey);

      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      const command = sentCommands[0];
      expect(command.constructor.name).toBe('DeleteObjectCommand');
      expect(command.input.Bucket).toBe('test-zero-burning-bucket');
      expect(command.input.Key).toBe(testKey);
    });
  });
});
