import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUploadFile, MAX_FILE_SIZE } from '../../src/lib/fileValidation.js';

test('File Validation Unit Tests', async (t) => {
  await t.test('harus menerima file gambar valid (JPEG, PNG, WebP) di bawah 5 MB', () => {
    const validJpg = { name: 'kebun.jpg', type: 'image/jpeg', size: 1024 * 500 };
    const validPng = { name: 'sawah.png', type: 'image/png', size: 1024 * 1024 };
    const validWebp = { name: 'tanaman.webp', type: 'image/webp', size: 2 * 1024 * 1024 };

    assert.equal(validateUploadFile(validJpg).valid, true);
    assert.equal(validateUploadFile(validPng).valid, true);
    assert.equal(validateUploadFile(validWebp).valid, true);
  });

  await t.test('harus menolak file dengan ekstensi atau format yang tidak didukung', () => {
    const gifFile = { name: 'animasi.gif', type: 'image/gif', size: 1000 };
    const pdfFile = { name: 'dokumen.pdf', type: 'application/pdf', size: 5000 };
    const exeFile = { name: 'program.exe', type: 'application/octet-stream', size: 2000 };

    const resGif = validateUploadFile(gifFile);
    assert.equal(resGif.valid, false);
    assert.match(resGif.error, /animasi\.gif: format tidak didukung/);

    const resPdf = validateUploadFile(pdfFile);
    assert.equal(resPdf.valid, false);
    assert.match(resPdf.error, /dokumen\.pdf: format tidak didukung/);

    const resExe = validateUploadFile(exeFile);
    assert.equal(resExe.valid, false);
    assert.match(resExe.error, /program\.exe: format tidak didukung/);
  });

  await t.test('harus menolak file gambar yang ukurannya melebihi 5 MB', () => {
    const largeFile = {
      name: 'foto_besar.jpg',
      type: 'image/jpeg',
      size: MAX_FILE_SIZE + 1024,
    };

    const res = validateUploadFile(largeFile);
    assert.equal(res.valid, false);
    assert.match(res.error, /foto_besar\.jpg: melebihi batas 5 MB/);
  });

  await t.test('harus menolak jika file kosong atau tidak terdefinisi', () => {
    const res = validateUploadFile(null);
    assert.equal(res.valid, false);
    assert.match(res.error, /File tidak ditemukan/);
  });
});
