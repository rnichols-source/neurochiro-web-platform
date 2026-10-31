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
    { width: 375, height: 812 },
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

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`message box, notifications, and seminar copy at ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/doctor/messages');
      const thread = page.locator('button.border-l-4').first();
      await expect(thread).toBeVisible();
      await thread.click();
      const composer = page.locator('[data-composer]');
      await expect(composer).toBeVisible();
      const box = await composer.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
      const covered = await composer.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return element.contains(hit);
      });
      expect(covered).toBe(true);

      await page.goto('/doctor/dashboard');
      await page.locator('[data-portal-bell]').first().click();
      await page.getByRole('link', { name: 'View all notifications' }).click();
      await expect(page).toHaveURL(/\/doctor\/notifications/);

      await page.goto('/doctor/seminars');
      await expect(page.getByText('% match')).toHaveCount(0);
    });
  }

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
  ]) {
    test(`composer sits on the nav at ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/doctor/messages');
      const thread = page.locator('button.border-l-4').first();
      await expect(thread).toBeVisible();
      await thread.click();
      const composer = page.locator('[data-composer]');
      await expect(composer).toBeVisible();
      const gap = await page.evaluate(() => {
        const box = document.querySelector('[data-composer]');
        const bar = document.querySelector('nav');
        if (!box || !bar) return null;
        const composerBox = box.getBoundingClientRect();
        const navBox = bar.getBoundingClientRect();
        return navBox.top - (composerBox.top + composerBox.height);
      });
      expect(gap).not.toBeNull();
      expect(Math.abs(gap as number)).toBeLessThanOrEqual(1);
    });
  }

  test('care plan has no placeholder doctor name', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/doctor/care-plan');
    await expect(page.getByText('[DOCTOR NAME]')).toHaveCount(0);
  });

  test('marketplace chip count matches the cards', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/doctor/marketplace');
    const all = page.getByRole('link', { name: /All · \d+/ });
    await expect(all).toBeVisible();
    const label = await all.innerText();
    const count = Number(label.split('·')[1]?.trim());
    await expect(page.locator('[data-marketplace-cards] > li')).toHaveCount(count);
    const chip = page.locator('[data-marketplace-chips] a').nth(1);
    if (await chip.count()) {
      const chipLabel = await chip.innerText();
      const chipCount = Number(chipLabel.split('·')[1]?.trim());
      await chip.click();
      await expect(page.locator('[data-marketplace-cards] > li')).toHaveCount(chipCount);
    }
  });

  test('notifications page renders', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/doctor/notifications');
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  });
});
