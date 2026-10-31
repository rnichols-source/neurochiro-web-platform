import { test, expect } from '@playwright/test';

const email = process.env.E2E_DOCTOR_EMAIL;
const password = process.env.E2E_DOCTOR_PASSWORD;
const livePaths = [
  '/doctor/dashboard',
  '/doctor/leads',
  '/doctor/messages',
  '/doctor/profile',
  '/doctor/analytics',
  '/doctor/seminars',
  '/doctor/jobs',
  '/doctor/lives',
  '/doctor/marketplace',
  '/doctor/tools',
  '/doctor/billing',
  '/doctor/settings',
  '/doctor/help',
  '/doctor/coming-soon',
];

test.describe('doctor portal smoke', () => {
  test.skip(!email || !password, 'Set E2E_DOCTOR_EMAIL and E2E_DOCTOR_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', email || '');
    await page.fill('input[type="password"]', password || '');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/doctor/);
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`nav at ${viewport.width}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('response', (res) => {
        if (res.status() === 404 && res.url().includes('announcements')) errors.push(res.url());
      });
      await page.setViewportSize(viewport);
      for (const path of livePaths) {
        await page.goto(path);
        await expect(page.locator('h1').first()).toBeVisible();
        if (!path.includes('coming-soon') && !path.includes('chiromatch') && !path.includes('community')) {
          await expect(page.locator('main').getByRole('heading', { name: 'Coming soon' })).toHaveCount(0);
        }
      }
      const bell = await page.locator('[data-portal-bell]').first().getAttribute('data-portal-bell');
      const side = await page.locator('[data-portal-notifications]').first().getAttribute('data-portal-notifications');
      expect(bell).toBe(side);
      await page.goto('/doctor/dashboard');
      const dash = await page.locator('[data-patient-requests]').first().getAttribute('data-patient-requests');
      await page.goto('/doctor/leads');
      const leads = await page.locator('[data-patient-requests]').first().getAttribute('data-patient-requests');
      expect(dash).toBe(leads);
      expect(errors.join('\n')).not.toMatch(/announcements/i);
      expect(errors.filter((line) => !/favicon|404/.test(line))).toEqual([]);
    });
  }
});
