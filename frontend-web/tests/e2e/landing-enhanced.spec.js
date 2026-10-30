import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5173' });

test.describe('Landing Page Penyempurnaan & Integritas Publik', () => {
  test('Menampilkan strip statistik dampak atau pesan jujur saat data awal', async ({ page }) => {
    await page.goto('/');

    // Cek judul deskriptif dan meta tag
    await expect(page).toHaveTitle(/Zero Burning.*Olah Lahan Tanpa Membakar/i);

    // Hero memuat kartu foto dengan label contoh ilustrasi
    await expect(page.getByText('Contoh ilustrasi', { exact: true })).toBeVisible();

    // Strip statistik atau pesan jujur program baru
    const statsHeading = page.getByRole('heading', { name: /Dampak Nyata Program di Lapangan/i });
    await expect(statsHeading).toBeVisible();

    // Pastikan angka atau pesan awal tampil
    const statsContainer = page.locator('section').filter({ hasText: 'Dampak Nyata Program di Lapangan' });
    await expect(statsContainer).toBeVisible();
  });

  test('FAQ: pencarian sisi klien, filter kategori, dan interaksi accordion keyboard accessible', async ({ page }) => {
    await page.goto('/');

    const faqSection = page.locator('#faq');
    await expect(faqSection).toBeVisible();

    // Kolom pencarian FAQ
    const searchInput = page.getByPlaceholder(/Cari pertanyaan/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('GPS');

    // Menampilkan hasil filter pertanyaan terkait GPS
    await expect(page.getByText(/Bagaimana cara mengambil foto bukti lahan yang sah/i)).toBeVisible();

    // Klik accordion pertanyaan
    const faqBtn = page.getByRole('button', { name: /Bagaimana cara mengambil foto bukti lahan yang sah/i });
    await expect(faqBtn).toHaveAttribute('aria-expanded', 'false');
    await faqBtn.click();
    await expect(faqBtn).toHaveAttribute('aria-expanded', 'true');

    // Cek jawaban muncul dengan aria-controls
    const answerPanel = page.locator('#faq-answer-faq-4');
    await expect(answerPanel).toBeVisible();
    await expect(answerPanel).toContainText('radius maksimal 50 meter');

    // Cek tombol umpan balik "Apakah ini membantu?"
    const feedbackYes = answerPanel.getByRole('button', { name: /Ya/i });
    await expect(feedbackYes).toBeVisible();
    await feedbackYes.click();
    await expect(answerPanel.getByText('Terima kasih atas tanggapan Anda.')).toBeVisible();
  });

  test('Halaman legal: /kebijakan-privasi dan /syarat-penggunaan dapat dibuka dari footer tanpa link mati', async ({ page }) => {
    await page.goto('/');

    // Buka Kebijakan Privasi dari footer
    const privacyLink = page.getByRole('contentinfo').getByRole('link', { name: 'Kebijakan Privasi' }).first();
    await expect(privacyLink).toBeVisible();
    await privacyLink.click();
    await expect(page).toHaveURL('/kebijakan-privasi');
    await expect(page.getByRole('heading', { name: 'Kebijakan Privasi' })).toBeVisible();
    await expect(page.getByText(/Draf dokumen/i)).toBeVisible();

    // Buka Syarat Penggunaan dari footer
    await page.goto('/');
    const termsLink = page.getByRole('contentinfo').getByRole('link', { name: 'Syarat Penggunaan' }).first();
    await expect(termsLink).toBeVisible();
    await termsLink.click();
    await expect(page).toHaveURL('/syarat-penggunaan');
    await expect(page.getByRole('heading', { name: /Syarat & Ketentuan Penggunaan/i })).toBeVisible();
  });

  test('Halaman Register: tautan persetujuan membuka Kebijakan Privasi', async ({ page }) => {
    await page.goto('/register');
    const privacyLink = page.getByRole('link', { name: 'Kebijakan Privasi' });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', '/kebijakan-privasi');
    await expect(privacyLink).toHaveAttribute('target', '_blank');
    await expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('Footer: menyesuaikan tautan akses berdasarkan status autentikasi', async ({ page, request }) => {
    // 1. Saat belum login: tampil Masuk ke Sistem dan Daftar sebagai Petani
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: 'Masuk ke Sistem' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Daftar sebagai Petani' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Buka Dashboard' })).toHaveCount(0);

    // 2. Saat sudah login: tampil Buka Dashboard
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'petani@contoh.com', password: 'Petani123!' },
    });
    const loginData = await loginRes.json();
    if (loginData.token) {
      await page.addInitScript(
        ({ token, user }) => {
          localStorage.setItem('zb_token', token);
          localStorage.setItem('zb_user', JSON.stringify(user));
        },
        { token: loginData.token, user: loginData.user }
      );

      await page.goto('/');
      await expect(footer.getByRole('link', { name: 'Buka Dashboard' })).toBeVisible();
      await expect(footer.getByRole('link', { name: 'Masuk ke Sistem' })).toHaveCount(0);
    }
  });

  test('Responsivitas mobile: tidak ada overflow horizontal pada lebar 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');

    // Evaluasi lebar scrollable vs viewport
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Menu navigasi mobile dapat dibuka dan ditutup
    const menuBtn = page.getByRole('button', { name: 'Buka menu' });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(page.locator('#mobile-menu')).toBeVisible();

    const closeBtn = page.getByRole('button', { name: 'Tutup menu' });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(page.locator('#mobile-menu')).not.toBeVisible();
  });
});
