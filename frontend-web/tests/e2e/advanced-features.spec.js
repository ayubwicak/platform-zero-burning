import { test, expect } from '@playwright/test';

async function loginAsAdmin(page, request) {
  const res = await request.post('/api/auth/login', {
    data: {
      email: 'admin@zeroburning.id',
      password: 'admin123',
    },
  });
  const data = await res.json();
  if (!data.token) {
    throw new Error('Gagal login admin via API: ' + JSON.stringify(data));
  }
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('zb_token', token);
      localStorage.setItem('zb_user', JSON.stringify(user));
    },
    { token: data.token, user: data.user }
  );
}

test.describe('Fitur Lanjutan: Distribusi & Notifikasi UI', () => {
  test('Navbar harus menampilkan lonceng notifikasi dan menu dropdown interaktif', async ({ page }) => {
    await page.goto('/login');

    // Pastikan halaman login berfungsi
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Login sebagai admin
    await page.locator('input[type="email"]').fill('admin@zeroburning.id');
    await page.locator('input[type="password"]').fill('admin123');
    await page.getByRole('button', { name: /Masuk/i }).click();

    // Tunggu navigasi ke dashboard admin
    await expect(page).toHaveURL(/\/dashboard/);

    // Periksa Navbar lonceng notifikasi
    const notifButton = page.getByRole('button', { name: /Notifikasi/i });
    await expect(notifButton).toBeVisible();

    // Buka popover notifikasi
    await notifButton.click();
    await expect(page.getByRole('region', { name: 'Daftar Notifikasi' })).toBeVisible();

    // Tekan tombol Escape untuk menutup
    await page.keyboard.press('Escape');
    await expect(page.getByRole('region', { name: 'Daftar Notifikasi' })).not.toBeVisible();
  });

  test('Halaman Distribusi harus menampilkan filter status klaim dan tombol penolakan', async ({ page, request }) => {
    await loginAsAdmin(page, request);

    await page.goto('/distribusi');
    await expect(page.getByRole('heading', { name: 'Distribusi Insentif' })).toBeVisible();

    // Pastikan tabs filter status ada dengan exact name matching
    await expect(page.getByRole('button', { name: 'Menunggu', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ditolak', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dibatalkan', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Semua', exact: true })).toBeVisible();
  });

  test('Halaman Verifikasi harus menampilkan tombol Prioritas Warga dan info voting', async ({ page, request }) => {
    await loginAsAdmin(page, request);

    await page.goto('/verifikasi');
    await expect(page.getByRole('heading', { name: 'Verifikasi Foto' })).toBeVisible();

    // Filter prioritas warga
    const priorityBtn = page.getByRole('button', { name: /Prioritas Warga/i });
    await expect(priorityBtn).toBeVisible();
    await priorityBtn.click();
  });
});
