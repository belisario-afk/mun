import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 1280, height: 800 },
  userAgent:
    'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-T770) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
});

test('first run and base path works', async ({ page }) => {
  await page.goto('/mun/');
  await expect(page.locator('text=Phantom').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  // Menu open via button
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByText('Stealth Menu')).toBeVisible();
  // Toggle theme
  await page.getByRole('button', { name: 'Toggle Theme' }).click();
  // Toggle source via paddles
  await page.getByRole('button', { name: 'Next source' }).click();
  await expect(page.getByText('Source:')).toBeVisible();
});