import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 1280, height: 800 }
});

test('AI command set theme tactical', async ({ page }) => {
  await page.goto('/mun/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByLabel('AI command').fill('set theme tactical');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Comms')).toBeVisible();
});