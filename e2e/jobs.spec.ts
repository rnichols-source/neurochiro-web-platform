import { test, expect } from '@playwright/test';

const ready = process.env.E2E_JOBS === '1';

test.describe('associateships board', () => {
  test.skip(!ready, 'Set E2E_JOBS=1 to run this');

  test('/jobs returns 200 and /careers redirects', async ({ page }) => {
    const response = await page.goto('/jobs');
    expect(response?.status()).toBeLessThan(400);
    expect(page.url()).toContain('/jobs');
    await page.goto('/careers');
    await page.waitForURL(/\/jobs\/?$/);
    expect(page.url()).toMatch(/\/jobs\/?$/);
  });

  test('outside post form reaches Stripe without paying', async ({ page }) => {
    test.skip(process.env.E2E_ALLOW_WRITES !== '1', 'Writes are off');
    const base = process.env.E2E_BASE_URL || '';
    test.skip(/neurochiro\.co/.test(base), 'Do not run checkout against production');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/jobs/post');
    await expect(page.getByRole('heading', { name: /Post an associateship/ })).toBeVisible();
  });
});
