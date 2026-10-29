import { test, expect } from '@playwright/test';

// 1x1 valid sample jpeg buffer
const SAMPLE_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function loginAsFarmer(page, request) {
  const res = await request.post('/api/auth/login', {
    data: {
      email: 'petani@contoh.com',
      password: 'Petani123!',
    },
  });
  const data = await res.json();
  if (data.token) {
    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('zb_token', token);
        localStorage.setItem('zb_user', JSON.stringify(user));
      },
      { token: data.token, user: data.user }
    );
  }
}

test.describe('Fitur Unggah Foto: Tampilan Pratinjau, Metadata, Lightbox, dan Aksi', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAsFarmer(page, request);
    await page.goto('/upload');
    await expect(page.getByRole('heading', { name: 'Unggah Foto Progres', exact: true })).toBeVisible();
  });

  test('Input file biasa: pratinjau, metadata ukuran/format/resolusi, tombol ganti & hapus', async ({ page }) => {
    const fileInput = page.locator('#file-upload-input');
    await expect(fileInput).toHaveCount(1);

    // Unggah file valid via input
    await fileInput.setInputFiles({
      name: 'lahan-padi.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(SAMPLE_JPEG_BASE64, 'base64'),
    });

    // Pratinjau gambar harus muncul dengan alt text deskriptif
    const previewImg = page.getByAltText('Pratinjau foto progres lahan: lahan-padi.jpg', { exact: true });
    await expect(previewImg).toBeVisible();

    // Nama file dan metadata (ukuran · format · resolusi)
    await expect(page.locator('text=lahan-padi.jpg')).toBeVisible();
    await expect(page.locator('text=/JPG/')).toBeVisible();

    // Tombol aksi "Ganti foto" dan "Hapus" terlihat
    const replaceBtn = page.getByRole('button', { name: 'Ganti foto', exact: true });
    await expect(replaceBtn).toBeVisible();

    const deleteBtn = page.getByRole('button', { name: 'Hapus gambar lahan-padi.jpg', exact: true });
    await expect(deleteBtn).toBeVisible();

    // Klik tombol hapus
    await deleteBtn.click();

    // Pratinjau hilang dan area kembali ke dropzone awal
    await expect(previewImg).not.toBeVisible();
    await expect(page.locator('text=Klik untuk memilih foto')).toBeVisible();

    // Memilih file yang sama kembali setelah dihapus
    await fileInput.setInputFiles({
      name: 'lahan-padi.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(SAMPLE_JPEG_BASE64, 'base64'),
    });
    await expect(page.getByAltText('Pratinjau foto progres lahan: lahan-padi.jpg', { exact: true })).toBeVisible();
  });

  test('Lightbox: klik gambar membuka pratinjau besar dan tombol Esc menutupnya', async ({ page }) => {
    const fileInput = page.locator('#file-upload-input');

    await fileInput.setInputFiles({
      name: 'lahan-padi.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(SAMPLE_JPEG_BASE64, 'base64'),
    });

    // Klik container gambar pratinjau (berperan sebagai button dengan aria-label "Perbesar pratinjau")
    const zoomTrigger = page.getByRole('button', { name: 'Perbesar pratinjau', exact: true });
    await expect(zoomTrigger).toBeVisible();
    await zoomTrigger.click();

    // Modal dialog lightbox harus terbuka
    const lightboxDialog = page.getByRole('dialog', { name: 'Pratinjau besar: lahan-padi.jpg', exact: true });
    await expect(lightboxDialog).toBeVisible();

    // Tombol tutup X juga terlihat
    const closeBtn = page.getByRole('button', { name: 'Tutup pratinjau', exact: true });
    await expect(closeBtn).toBeVisible();

    // Tekan tombol Escape pada keyboard untuk menutup
    await page.keyboard.press('Escape');

    // Lightbox modal harus tertutup
    await expect(lightboxDialog).not.toBeVisible();
  });

  test('Nama file panjang tidak merusak layout (truncate)', async ({ page }) => {
    const fileInput = page.locator('#file-upload-input');
    const longFileName = 'lahan-pertanian-kabupaten-sleman-yogyakarta-blok-utara-musim-tanam-2026-super-panjang-sekali.jpg';

    await fileInput.setInputFiles({
      name: longFileName,
      mimeType: 'image/jpeg',
      buffer: Buffer.from(SAMPLE_JPEG_BASE64, 'base64'),
    });

    const previewImg = page.getByAltText(`Pratinjau foto progres lahan: ${longFileName}`, { exact: true });
    await expect(previewImg).toBeVisible();

    const fileNameEl = page.locator(`p[title="${longFileName}"]`);
    await expect(fileNameEl).toBeVisible();
    await expect(fileNameEl).toHaveClass(/truncate/);
  });

  test('Validasi file: file format salah dan file melebihi 5 MB ditolak', async ({ page }) => {
    const fileInput = page.locator('#file-upload-input');

    // 1. Format tidak didukung (.gif)
    await fileInput.setInputFiles({
      name: 'gambar-gerak.gif',
      mimeType: 'image/gif',
      buffer: Buffer.from('GIF89a'),
    });

    // Harus menampilkan pesan error format
    await expect(page.locator('text=gambar-gerak.gif: format tidak didukung')).toBeVisible();

    // 2. Ukuran melebihi 5 MB
    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024);
    await fileInput.setInputFiles({
      name: 'foto-raksasa.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer,
    });

    await expect(page.locator('text=foto-raksasa.jpg: melebihi batas 5 MB')).toBeVisible();
  });

  test('Drag and drop simulasi: drop file ke area dropzone', async ({ page }) => {
    const dropzone = page.locator('div[role="button"][aria-label*="Area unggah foto"]');
    await expect(dropzone).toBeVisible();

    // Simulasikan drop event menggunakan DataTransfer
    await dropzone.evaluate((el) => {
      const dt = new DataTransfer();
      const file = new File(['fake-jpg-content'], 'seret-lahan.png', { type: 'image/png' });
      dt.items.add(file);

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      });
      el.dispatchEvent(dropEvent);
    });

    // Pratinjau harus muncul
    await expect(page.getByAltText('Pratinjau foto progres lahan: seret-lahan.png', { exact: true })).toBeVisible();
    await expect(page.locator('text=seret-lahan.png')).toBeVisible();
  });

  test('Pembatalan upload yang sedang berjalan (AbortController)', async ({ page }) => {
    const fileInput = page.locator('#file-upload-input');

    await fileInput.setInputFiles({
      name: 'lahan-uji-batal.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(SAMPLE_JPEG_BASE64, 'base64'),
    });

    await expect(page.getByAltText('Pratinjau foto progres lahan: lahan-uji-batal.jpg', { exact: true })).toBeVisible();

    // Mock geolocation agar tombol submit dapat ditekan
    await page.evaluate(() => {
      window.navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: {
            latitude: -7.7156,
            longitude: 110.3556,
          },
        });
      };
    });

    await page.getByRole('button', { name: /Ambil lokasi saat ini/i }).click();
    await expect(page.locator('text=-7.71560, 110.35560')).toBeVisible();

    // Tunda respons endpoint POST /api/photos
    await page.route('**/api/photos', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    // Klik tombol Kirim Foto Progres
    const submitBtn = page.getByRole('button', { name: /Kirim Foto Progres/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Selama upload berlangsung, tombol "Batalkan" harus muncul
    const cancelBtn = page.getByRole('button', { name: 'Batalkan', exact: true });
    await expect(cancelBtn).toBeVisible();

    // Klik tombol Batalkan
    await cancelBtn.click();

    // Harus menampilkan notice "Unggahan dibatalkan" dan bukan error merah generik
    await expect(page.locator('text=Unggahan dibatalkan.')).toBeVisible();

    // File tetap berada di pratinjau sehingga pengguna bisa mencoba lagi atau menghapus
    await expect(page.getByAltText('Pratinjau foto progres lahan: lahan-uji-batal.jpg', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hapus gambar lahan-uji-batal.jpg', exact: true })).toBeVisible();
  });
});
