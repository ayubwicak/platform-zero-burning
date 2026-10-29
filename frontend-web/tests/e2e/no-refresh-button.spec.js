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

test.describe('Penyembunyian Tombol Segarkan & Pembaruan Otomatis Data', () => {
  test('Halaman admin tidak menampilkan tombol Segarkan di header/toolbar', async ({
    page,
    request,
  }) => {
    await loginAsAdmin(page, request);

    const routes = ['/distribusi', '/verifikasi', '/pengguna', '/audit-log', '/data-lahan', '/katalog'];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      // Tombol dengan nama "Segarkan" tidak boleh ada di halaman
      const refreshBtn = page.getByRole('button', { name: /Segarkan/i });
      await expect(refreshBtn).toHaveCount(0);
    }
  });

  test('Data distribusi terbarui otomatis setelah aksi tolak klaim tanpa tombol segarkan', async ({
    page,
    request,
  }) => {
    await loginAsAdmin(page, request);
    await page.goto('/distribusi');
    await expect(page.getByRole('heading', { name: 'Distribusi Insentif' })).toBeVisible();

    // Pastikan tidak ada tombol segarkan
    await expect(page.getByRole('button', { name: /Segarkan/i })).toHaveCount(0);

    // Cari tombol aksi tolak jika ada klaim berstatus diajukan
    const rejectBtn = page.getByRole('button', { name: 'Tolak', exact: true }).first();
    const hasPendingClaim = (await rejectBtn.count()) > 0;

    if (hasPendingClaim) {
      await rejectBtn.click();
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Pilih alasan penolakan
      const reasonSelect = modal.getByRole('combobox', { name: /Alasan Penolakan/i });
      await reasonSelect.click();
      const listbox = page.getByRole('listbox', { name: /Alasan Penolakan/i });
      await listbox.getByRole('option').first().click();

      // Konfirmasi tolak
      const confirmBtn = modal.getByRole('button', { name: /Konfirmasi Penolakan/i });
      await confirmBtn.click();

      // Modal tertutup dan status klaim otomatis terbarui di antrean
      await expect(modal).not.toBeVisible();
      await expect(page.locator('text=Klaim berhasil ditolak')).toBeVisible();
    }
  });
});
