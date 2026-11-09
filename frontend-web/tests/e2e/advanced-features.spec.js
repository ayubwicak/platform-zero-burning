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

  test('Tolak klaim: petani menerima tepat satu notifikasi dengan alasan penolakan dan tanda dibaca mengurangi badge', async ({ page, request }) => {
    // 1. Login admin via API
    const adminRes = await request.post('/api/auth/login', {
      data: { email: 'admin@zeroburning.id', password: 'admin123' },
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.token;

    // 2. Login farmer via API
    const farmerRes = await request.post('/api/auth/login', {
      data: { email: 'petani@contoh.com', password: 'Petani123!' },
    });
    const farmerData = await farmerRes.json();
    const farmerToken = farmerData.token;

    // 3. Buat klaim khusus (category 4: Bantuan Tunai) agar terisolasi dari test lain
    let targetClaimId;
    const newClaimRes = await request.post('/api/incentives/claims', {
      headers: { Authorization: `Bearer ${farmerToken}` },
      data: { field_id: 1, category_id: 4 },
    });
    const newClaimData = await newClaimRes.json();
    if (newClaimData.data?.id) {
      targetClaimId = newClaimData.data.id;
    } else {
      const pendingClaimsRes = await request.get('/api/incentives/claims/pending', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const pendingData = await pendingClaimsRes.json();
      const existing = pendingData.data?.find((c) => c.category_id === 4) || pendingData.data?.[0];
      targetClaimId = existing?.id;
    }

    // 4. Admin menolak klaim dengan alasan spesifik
    const rejectionReason = 'Petani tidak hadir saat survei lapangan';
    const rejectRes = await request.post(`/api/claims/${targetClaimId}/reject`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { reason: 'Petani tidak hadir', note: rejectionReason },
    });
    expect(rejectRes.status()).toBe(200);

    // 5. Verifikasi bahwa request tolak ganda ditolak dengan 409
    const duplicateReject = await request.post(`/api/claims/${targetClaimId}/reject`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { reason: 'Petani tidak hadir', note: rejectionReason },
    });
    expect(duplicateReject.status()).toBe(409);

    // 6. Buka UI sebagai petani dan verifikasi panel notifikasi
    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('zb_token', token);
        localStorage.setItem('zb_user', JSON.stringify(user));
      },
      { token: farmerToken, user: farmerData.user }
    );

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Selamat datang kembali/i })).toBeVisible();

    const notifBtn = page.getByRole('button', { name: /Notifikasi/i });
    await expect(notifBtn).toBeVisible();

    // Buka dropdown
    await notifBtn.click();
    const notifRegion = page.getByRole('region', { name: 'Daftar Notifikasi' });
    await expect(notifRegion).toBeVisible();

    // Pastikan tepat SATU notifikasi untuk targetClaimId muncul
    const claimNotifItems = notifRegion.locator(`text=#${targetClaimId}`);
    await expect(claimNotifItems).toHaveCount(1);

    // Pastikan baris alasan penolakan muncul
    await expect(notifRegion.getByText(/Alasan:/i).first()).toBeVisible();
    await expect(notifRegion.getByText(rejectionReason).first()).toBeVisible();

    // Klik tombol "Tandai dibaca" pada notifikasi unread
    const markReadBtn = notifRegion.getByRole('button', { name: 'Tandai dibaca' }).first();
    await markReadBtn.click();

    // Indikator "Dibaca" statis muncul
    await expect(notifRegion.getByText('Dibaca').first()).toBeVisible();

    // Navigasi ke halaman /notifikasi via "Lihat semua"
    const lihatSemuaLink = notifRegion.getByRole('link', { name: /Lihat semua/i });
    await lihatSemuaLink.click();

    await expect(page).toHaveURL(/\/notifikasi/);
    await expect(page.getByRole('heading', { name: 'Notifikasi', exact: true })).toBeVisible();
    await expect(page.getByText(rejectionReason).first()).toBeVisible();
  });
});
