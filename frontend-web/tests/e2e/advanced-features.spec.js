import { test, expect } from '@playwright/test';

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
    await expect(page.getByText('Notifikasi')).toBeVisible();

    // Tekan tombol Escape untuk menutup
    await page.keyboard.press('Escape');
    await expect(page.getByRole('region', { name: 'Daftar Notifikasi' })).not.toBeVisible();
  });

  test('Halaman Distribusi harus menampilkan filter status klaim dan tombol penolakan', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@zeroburning.id');
    await page.locator('input[type="password"]').fill('admin123');
    await page.getByRole('button', { name: /Masuk/i }).click();

    await page.goto('/distribusi');
    await expect(page.getByRole('heading', { name: 'Distribusi Insentif' })).toBeVisible();

    // Pastikan tabs filter status ada
    await expect(page.getByRole('button', { name: 'Menunggu' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ditolak' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dibatalkan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Semua' })).toBeVisible();
  });

  test('Halaman Verifikasi harus menampilkan tombol Prioritas Warga dan info voting', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@zeroburning.id');
    await page.locator('input[type="password"]').fill('admin123');
    await page.getByRole('button', { name: /Masuk/i }).click();

    await page.goto('/verifikasi');
    await expect(page.getByRole('heading', { name: 'Verifikasi Foto' })).toBeVisible();

    // Filter prioritas warga
    const priorityBtn = page.getByRole('button', { name: /Prioritas Warga/i });
    await expect(priorityBtn).toBeVisible();
    await priorityBtn.click();
  });
});
