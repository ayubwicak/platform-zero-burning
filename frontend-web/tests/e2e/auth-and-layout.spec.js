import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5173' });

test.describe('Landing Page', () => {
  test('should load landing page with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Zero Burning/);
  });

  test('should navigate to login page from landing', async ({ page }) => {
    await openLoginFromLanding(page);
    await expect(page).toHaveURL('/login');
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

  for (const path of ['/login', '/register']) {
    test(`${path} back-to-home link should navigate to landing page`, async ({ page }) => {
      await page.goto(path);

      const backToHome = page.getByTestId('back-to-home');
      await expect(backToHome).toBeVisible();
      await expect(backToHome).toHaveAttribute('aria-label', 'Kembali ke beranda');

      const box = await backToHome.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(40);

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
      expect(box.height).toBeGreaterThanOrEqual(40);

      await backToHome.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('Auth Desktop Fit', () => {
  const desktopViewports = [
    { width: 1920, height: 920 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
  ];

  for (const path of ['/login', '/register']) {
    test(`${path} should fit and stay vertically centered`, async ({ page }) => {
      for (const viewport of desktopViewports) {
        await page.setViewportSize(viewport);
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);

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
