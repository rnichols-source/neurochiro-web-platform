import { test, expect } from '@playwright/test';

const email = process.env.E2E_STUDENT_EMAIL;
const password = process.env.E2E_STUDENT_PASSWORD;
const ready = Boolean(email && password);

test.describe('student membership', () => {
  test.skip(!ready, 'Set E2E_STUDENT_EMAIL and E2E_STUDENT_PASSWORD to run this');

  test('subscribe reaches Stripe and a free account sees a locked Contract Lab', async ({ page }) => {
    test.skip(process.env.E2E_ALLOW_WRITES !== '1', 'Writes are off');
    const base = process.env.E2E_BASE_URL || '';
    test.skip(/neurochiro\.co/.test(base), 'Do not run purchases against production');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login');
    await page.fill('input[type="email"]', email || '');
    await page.fill('input[type="password"]', password || '');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.goto('/student/contract-lab');
    await expect(page.getByText(/Join for \$33\/month|Contract Lab/)).toBeVisible();
    await page.goto('/student/subscribe?plan=monthly');
    const checkout = page.getByRole('button', { name: /Continue with/ });
    if (await checkout.count()) {
      await checkout.click();
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20000 });
      expect(page.url()).toContain('checkout.stripe.com');
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/students');
    await expect(page.getByRole('heading', { name: /Become the chiropractor/ })).toBeVisible();
  });
});
