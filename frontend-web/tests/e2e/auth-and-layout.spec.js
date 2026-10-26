import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5173' });

test.describe('Landing Page', () => {
  test('should load landing page with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Zero Burning/);
  });

  test('should navigate to login page from landing', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Masuk');
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
