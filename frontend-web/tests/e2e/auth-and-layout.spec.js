import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5173' });

test.describe('Landing Page', () => {
  test('should load landing page with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Zero Burning/);
  });

  test('should navigate to login page from landing and fill form', async ({ page }) => {
    await openLoginFromLanding(page);
    await expect(page).toHaveURL('/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.getByRole('button', { name: /Masuk/ });
    const backToHome = page.getByTestId('back-to-home');

    // Inputs should be immediately visible and interactable without waiting
    await emailInput.fill('petani@contoh.com');
    await passwordInput.fill('password123');

    await expect(emailInput).toHaveValue('petani@contoh.com');
    await expect(passwordInput).toHaveValue('password123');
    await expect(submitButton).toBeVisible();
    await expect(backToHome).toBeVisible();
  });

  test('should navigate to register page from landing and fill form', async ({ page }) => {
    await openRegisterFromLanding(page);
    await expect(page).toHaveURL('/register');

    const namaInput = page.locator('input[name="nama"]');
    const emailInput = page.locator('input[name="email"]');
    const nikInput = page.locator('input[name="nik"]');
    const submitButton = page.getByRole('button', { name: /Daftar sebagai petani/ });
    const backToHome = page.getByTestId('back-to-home');

    // Inputs should be immediately fillable
    await namaInput.fill('Petani Uji');
    await emailInput.fill('petani.uji@contoh.com');
    await nikInput.fill('1234567890123456');

    await expect(namaInput).toHaveValue('Petani Uji');
    await expect(emailInput).toHaveValue('petani.uji@contoh.com');
    await expect(nikInput).toHaveValue('1234567890123456');
    await expect(submitButton).toBeVisible();
    await expect(backToHome).toBeVisible();
  });
});

test.describe('Auth Pages', () => {
  test('login page should show email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Masuk/ })).toBeVisible();
  });

  test('register page should show NIK and password fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[name="nik"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('should navigate smoothly between login and register without page errors', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();

    await page.getByRole('link', { name: /Daftar sebagai petani/ }).click();
    await expect(page).toHaveURL('/register');
    await expect(page.locator('input[name="nama"]')).toBeVisible();

    await page.getByRole('link', { name: /Masuk di sini/ }).click();
    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  for (const path of ['/login', '/register']) {
    test(`${path} back-to-home link should navigate to landing page`, async ({ page }) => {
      await page.goto(path);

      const backToHome = page.getByTestId('back-to-home');
      await expect(backToHome).toBeVisible();
      await expect(backToHome).toHaveAttribute('aria-label', 'Kembali ke beranda');

      const box = await backToHome.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(39.5);

      await backToHome.click();
      await expect(page).toHaveURL('/');
    });
  }

  test('back-to-home link stays clickable on a short mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 667 });

    for (const path of ['/login', '/register']) {
      await page.goto(path);

      const backToHome = page.getByTestId('back-to-home');
      await expect(backToHome).toBeVisible();

      const box = await backToHome.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(39.5);

      await backToHome.click();
      await expect(page).toHaveURL('/');
    }
  });

  for (const path of ['/login', '/register']) {
    test(`${path} hero brand panel image loads properly without 404`, async ({ page }) => {
      const failed404 = [];
      page.on('response', (response) => {
        if (response.status() === 404 && response.request().resourceType() === 'image') {
          failed404.push(response.url());
        }
      });

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);

      const brandPanel = page.locator('aside.auth-brand-panel');
      await expect(brandPanel).toBeVisible();

      const img = brandPanel.locator('img');
      await expect(img).toBeVisible();

      // Pastikan gambar berhasil dimuat sempurna (naturalWidth > 0)
      await expect.poll(async () => {
        return img.evaluate((el) => el.complete && el.naturalWidth > 0);
      }, { message: `Image in ${path} failed to load` }).toBe(true);

      // Pastikan tidak ada respons 404 untuk request gambar
      expect(failed404).toHaveLength(0);
    });
  }
});

test.describe('Auth Desktop Fit', () => {
  const desktopViewports = [
    { width: 1920, height: 920 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
  ];

  for (const path of ['/login', '/register']) {
    test(`${path} should fit and stay vertically centered`, async ({ page }) => {
      // Respect prefers-reduced-motion to avoid animation transform during strict metric measurement
      await page.emulateMedia({ reducedMotion: 'reduce' });

      for (const viewport of desktopViewports) {
        await page.setViewportSize(viewport);
        await page.goto(path);

        await page.evaluate(async () => {
          await document.fonts.ready;
          const anims = document.getAnimations();
          if (anims.length > 0) {
            await Promise.all(anims.map((a) => a.finished));
          }
        });

        const metrics = await page.evaluate(() => {
          const panel = document.querySelector('.auth-panel');
          const backToHome = document.querySelector('[data-testid="back-to-home"]');
          const note = document.querySelector('.auth-panel-note');
          const backRect = backToHome.getBoundingClientRect();
          const noteRect = note.getBoundingClientRect();

          return {
            pageOverflow: document.documentElement.scrollHeight - window.innerHeight,
            panelOverflow: panel.scrollHeight - panel.clientHeight,
            backPosition: getComputedStyle(backToHome).position,
            topGap: backRect.top,
            bottomGap: window.innerHeight - noteRect.bottom,
          };
        });

        expect(metrics.pageOverflow).toBeLessThanOrEqual(0);
        expect(metrics.panelOverflow).toBeLessThanOrEqual(0);
        expect(metrics.backPosition).toBe('static');
        expect(Math.abs(metrics.topGap - metrics.bottomGap)).toBeLessThanOrEqual(2);

        const note = page.locator('.auth-panel-note');
        await expect(note).toBeVisible();
        const noteBox = await note.boundingBox();
        expect(noteBox.y + noteBox.height).toBeLessThanOrEqual(viewport.height);
      }
    });
  }
});

test.describe('Responsive Layout', () => {
  test('should not have horizontal overflow at desktop resolution', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    const horizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(horizontalOverflow).toBe(false);
  });

  test('should not have horizontal overflow at tablet resolution', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    const horizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(horizontalOverflow).toBe(false);
  });

  test('should not have horizontal overflow at mobile resolution', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const horizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(horizontalOverflow).toBe(false);
  });
});

async function openLoginFromLanding(page) {
  await page.goto('/');

  // Below the md breakpoint the navbar login link is hidden; real users open
  // the hamburger menu and use the login link inside it.
  const mobileMenuButton = page.getByRole('button', { name: 'Buka menu' });
  if (await mobileMenuButton.isVisible()) {
    await mobileMenuButton.click();
    await page.getByTestId('nav-login-mobile').click();
    return;
  }

  await page.getByTestId('nav-login').click();
}

async function openRegisterFromLanding(page) {
  await page.goto('/');

  const mobileMenuButton = page.getByRole('button', { name: 'Buka menu' });
  if (await mobileMenuButton.isVisible()) {
    await mobileMenuButton.click();
    await page.getByTestId('nav-register-mobile').click();
    return;
  }

  await page.getByTestId('nav-register').click();
}
