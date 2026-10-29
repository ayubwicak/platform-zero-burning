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

test.describe('Kustom Select Dropdown UI & Accessibility', () => {
  test('Halaman Pengguna: filter status akun menggunakan Select kustom (klik, keyboard, Esc, outside click)', async ({
    page,
    request,
  }) => {
    await loginAsAdmin(page, request);
    await page.goto('/pengguna');
    await expect(page.getByRole('heading', { name: 'Kelola Pengguna' })).toBeVisible();

    const trigger = page.getByRole('combobox', { name: 'Filter status akun' });
    await expect(trigger).toBeVisible();

    // Pastikan touch target minimal 40px di desktop dan 44px di mobile
    const box = await trigger.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(40);

    // 1. Buka dropdown via klik
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Listbox opsi harus muncul di body via Portal
    const listbox = page.getByRole('listbox', { name: 'Filter status akun' });
    await expect(listbox).toBeVisible();

    // Periksa opsi aktif
    const optAktif = listbox.getByRole('option', { name: /^Aktif/i });
    await expect(optAktif).toBeVisible();

    // 2. Pilih via klik
    await optAktif.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toContainText('Aktif');

    // 3. Buka via keyboard (ArrowDown / Enter)
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(listbox).toBeVisible();

    // Pindah pilihan ke bawah lalu tekan Enter
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // 4. Buka lalu tekan Escape untuk menutup
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(listbox).not.toBeVisible();

    // 5. Outside click menutup dropdown
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('Halaman Upload: dropdown Pilih Lahan berfungsi dengan keyboard dan Escape', async ({
    page,
    request,
  }) => {
    await loginAsFarmer(page, request);
    await page.goto('/upload');
    await expect(page.getByRole('heading', { name: 'Unggah Foto Progres' })).toBeVisible();

    const trigger = page.getByRole('combobox', { name: 'Pilih Lahan' });
    await expect(trigger).toBeVisible();

    // Buka dropdown jika tidak disabled
    const isDisabled = await trigger.isDisabled();
    if (!isDisabled) {
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');

      const listbox = page.getByRole('listbox', { name: 'Pilih Lahan' });
      await expect(listbox).toBeVisible();

      // Tutup dengan Escape
      await page.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(listbox).not.toBeVisible();
    }
  });

  test('Modal Isolasi: Escape di dalam Select tidak boleh menutup modal induk', async ({
    page,
    request,
  }) => {
    await loginAsAdmin(page, request);
    await page.goto('/distribusi');
    await expect(page.getByRole('heading', { name: 'Distribusi Insentif' })).toBeVisible();

    // Cari tombol aksi untuk membuka modal tolak atau batalkan jika ada item klaim
    const actionBtn = page.getByRole('button', { name: /Tolak|Batalkan/i }).first();
    const hasAction = (await actionBtn.count()) > 0;

    if (hasAction) {
      await actionBtn.click();

      // Modal dialog terbuka
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Dropdown alasan di dalam modal
      const reasonTrigger = modal.getByRole('combobox', { name: /Alasan/i });
      await expect(reasonTrigger).toBeVisible();

      // Buka dropdown alasan
      await reasonTrigger.click();
      await expect(reasonTrigger).toHaveAttribute('aria-expanded', 'true');

      const listbox = page.getByRole('listbox', { name: /Alasan/i });
      await expect(listbox).toBeVisible();

      // Tekan Escape: HANYA dropdown yang boleh tertutup, modal harus tetap terbuka!
      await page.keyboard.press('Escape');
      await expect(reasonTrigger).toHaveAttribute('aria-expanded', 'false');
      await expect(modal).toBeVisible(); // MODAL TETAP TERBUKA

      // Tutup modal dengan tombol X atau Batal
      const cancelBtn = modal.getByRole('button', { name: /Batal/i });
      await cancelBtn.click();
      await expect(modal).not.toBeVisible();
    }
  });
});
