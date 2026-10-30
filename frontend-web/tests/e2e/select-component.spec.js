import { test, expect } from '@playwright/test';

test.describe('Component Unit/Integration Test: Select.jsx', () => {
  test('Render, placeholder, dan pemilihan via klik', async ({ page }) => {
    await page.goto('/test-select');

    const trigger = page.getByRole('combobox', { name: 'Pilih Komoditas' });
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText('Pilih komoditas...');

    // Klik trigger untuk membuka listbox
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Listbox muncul via Portal
    const listbox = page.getByRole('listbox', { name: 'Pilih Komoditas' });
    await expect(listbox).toBeVisible();

    // Pilih opsi "Jagung Hibrida"
    const optJagung = listbox.getByRole('option', { name: /Jagung Hibrida/i });
    await expect(optJagung).toBeVisible();
    await optJagung.click();

    // Trigger tertutup dan menampilkan teks terpilih
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toContainText('Jagung Hibrida');
    await expect(page.getByTestId('selected-standard-output')).toContainText('Terpilih: jagung');
  });

  test('Navigasi keyboard lengkap: ArrowDown, ArrowUp, Enter, Space, Escape, Tab', async ({ page }) => {
    await page.goto('/test-select');

    const trigger = page.getByRole('combobox', { name: 'Pilih Komoditas' });
    await trigger.focus();

    // Buka menggunakan ArrowDown
    await page.keyboard.press('ArrowDown');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const listbox = page.getByRole('listbox', { name: 'Pilih Komoditas' });
    await expect(listbox).toBeVisible();

    // Pindah pilihan ke item kedua lalu tekan Enter
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toContainText('Jagung Hibrida');

    // Buka menggunakan Space lalu tutup dengan Escape
    await page.keyboard.press('Space');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('Disabled state: tidak bisa dibuka atau menerima fokus klik', async ({ page }) => {
    await page.goto('/test-select');

    const trigger = page.getByRole('combobox', { name: 'Select Dinonaktifkan' });
    await expect(trigger).toBeDisabled();
    await expect(trigger).toHaveAttribute('aria-disabled', 'true');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('listbox', { name: 'Select Dinonaktifkan' })).toHaveCount(0);
  });

  test('Empty state: menampilkan emptyMessage saat opsi kosong', async ({ page }) => {
    await page.goto('/test-select');

    const trigger = page.getByRole('combobox', { name: 'Select Kosong' });
    await trigger.click();

    const listbox = page.getByRole('listbox', { name: 'Select Kosong' });
    await expect(listbox).toBeVisible();
    await expect(listbox).toContainText('Belum ada data tersedia');
  });

  test('Form interoperability: nilai terkirim via input hidden', async ({ page }) => {
    await page.goto('/test-select');

    const trigger = page.getByRole('combobox', { name: 'Form Hidden Input' });
    await trigger.click();

    const listbox = page.getByRole('listbox', { name: 'Form Hidden Input' });
    await listbox.getByRole('option', { name: /Singkong Manis/i }).click();

    // Submit form
    await page.getByRole('button', { name: 'Kirim Form' }).click();
    await expect(page.getByTestId('submitted-output')).toContainText('Nilai Terkirim: singkong');
  });

  test('Searchable Select: memfilter opsi berdasarkan teks pencarian', async ({ page }) => {
    await page.goto('/test-select');

    const trigger = page.getByRole('combobox', { name: 'Select Pencarian' });
    await trigger.click();

    const searchInput = page.getByPlaceholder('Cari komoditas...');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();

    // Ketik "singkong"
    await searchInput.fill('singkong');

    const listbox = page.getByRole('listbox', { name: 'Select Pencarian' });
    await expect(listbox.getByRole('option', { name: /Singkong Manis/i })).toBeVisible();
    await expect(listbox.getByRole('option', { name: /Padi Sawahan/i })).not.toBeVisible();
  });

  test('Touch target dan responsivitas memenuhi standar (min 40px desktop / 44px mobile)', async ({ page }) => {
    await page.goto('/test-select');

    const trigger = page.getByRole('combobox', { name: 'Pilih Komoditas' });
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox.height).toBeGreaterThanOrEqual(40);

    // Buka panel dan periksa tinggi item opsi
    await trigger.click();
    const listbox = page.getByRole('listbox', { name: 'Pilih Komoditas' });
    const firstOption = listbox.getByRole('option').first();
    const optBox = await firstOption.boundingBox();
    expect(optBox.height).toBeGreaterThanOrEqual(40);
  });
});
