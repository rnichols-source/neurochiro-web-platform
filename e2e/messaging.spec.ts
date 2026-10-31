import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const base = process.env.E2E_BASE_URL || '';
const host = base.replace(/^https?:\/\//, '').split('/')[0];
const production = !base || host === 'neurochiro.co' || host === 'www.neurochiro.co';
const ready = !production
  && process.env.E2E_ALLOW_WRITES === '1'
  && Boolean(process.env.E2E_DOCTOR_A_EMAIL && process.env.E2E_DOCTOR_A_PASSWORD)
  && Boolean(process.env.E2E_DOCTOR_B_EMAIL && process.env.E2E_DOCTOR_B_PASSWORD);

function creds(which: 'A' | 'B') {
  return {
    email: process.env[`E2E_DOCTOR_${which}_EMAIL`] || '',
    password: process.env[`E2E_DOCTOR_${which}_PASSWORD`] || '',
  };
}

async function signIn(page: Page, which: 'A' | 'B') {
  const account = creds(which);
  await page.goto(`${base}/login`);
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/doctor\//);
}

test.describe('messaging', () => {
  test.skip(!ready, 'skipped: waiting on step 18');
  let contextA: BrowserContext;
  let contextB: BrowserContext;
  let pageA: Page;
  let pageB: Page;
  const runId = `e2e ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    contextA = await browser.newContext();
    contextB = await browser.newContext();
    pageA = await contextA.newPage();
    pageB = await contextB.newPage();
    await signIn(pageA, 'A');
    await signIn(pageB, 'B');
  });

  test.afterAll(async () => {
    await contextA?.close();
    await contextB?.close();
  });

  test('A sends and B sees one unread that the bell does not also count', async () => {
    await pageA.goto(`${base}/doctor/messages`);
    await pageA.getByLabel('New conversation').click();
    await pageA.getByPlaceholder('Search by name').fill('e2e');
    await pageA.getByRole('button', { name: /e2e/i }).first().click();
    await pageA.locator('[data-composer] textarea').fill(`[${runId}] hello`);
    await pageA.locator('[data-send]').click();
    await expect(pageB.locator('[data-message-body]').filter({ hasText: `[${runId}] hello` })).toBeVisible({ timeout: 5000 });
    await expect(pageB.locator('[data-messages-badge]').first()).toHaveAttribute('data-messages-badge', '1');
    await expect(pageB.locator('[data-inbox-total]')).toHaveAttribute('data-inbox-total', '1');
    await expect(pageB.locator('[data-portal-bell]')).toHaveAttribute('data-portal-bell', '0');
  });

  test('opening the thread clears both badges and shows Seen', async () => {
    await pageB.goto(`${base}/doctor/messages`);
    await pageB.locator('[data-inbox-total] button').first().click();
    await expect(pageB.locator('[data-messages-badge]').first()).toHaveAttribute('data-messages-badge', '0');
    await expect(pageA.locator('[data-seen]')).toBeVisible();
  });

  test('a double click sends one bubble', async () => {
    const box = pageA.locator('[data-composer] textarea');
    await box.fill(`[${runId}] once`);
    await pageA.locator('[data-send]').dblclick();
    await expect(pageA.locator('[data-message-body]').filter({ hasText: `[${runId}] once` })).toHaveCount(1);
    await expect(pageB.locator('[data-message-body]').filter({ hasText: `[${runId}] once` })).toHaveCount(1);
  });

  test('messages sent while offline arrive in order', async () => {
    await contextB.setOffline(true);
    await pageA.locator('[data-composer] textarea').fill(`[${runId}] one`);
    await pageA.locator('[data-send]').click();
    await pageA.locator('[data-composer] textarea').fill(`[${runId}] two`);
    await pageA.locator('[data-send]').click();
    await contextB.setOffline(false);
    await expect(pageB.locator('[data-message-body]').filter({ hasText: `[${runId}] two` })).toBeVisible({ timeout: 10000 });
  });

  test('the sixth message in a minute shows the rate limit', async () => {
    for (let n = 1; n <= 6; n += 1) {
      await pageA.locator('[data-composer] textarea').fill(`[${runId}] rate ${n}`);
      await pageA.locator('[data-send]').click();
    }
    await expect(pageA.locator('[data-send-error]')).toContainText('Not sent');
    await expect(pageA.locator('[data-send-error]')).toContainText('Slow down');
  });

  test('a block refuses the send and unblock cleans up', async () => {
    await pageB.getByLabel('Conversation actions').click();
    await pageB.getByRole('button', { name: 'Block' }).click();
    await pageB.getByRole('button', { name: 'Block' }).last().click();
    await pageA.locator('[data-composer] textarea').fill(`[${runId}] blocked`);
    await pageA.locator('[data-send]').click();
    await expect(pageA.locator('[data-send-error]')).toContainText("This person isn't available for messages.");
    await pageB.goto(`${base}/doctor/settings`);
    await pageB.getByRole('button', { name: 'Unblock' }).click();
  });

  test('mobile back returns to the list', async () => {
    await pageA.setViewportSize({ width: 390, height: 844 });
    await pageA.goto(`${base}/doctor/messages`);
    await pageA.locator('[data-inbox-total] button').first().click();
    await expect(pageA.locator('[data-composer] textarea')).toBeVisible();
    await pageA.getByLabel('Back to conversations').click();
    await expect(pageA.locator('[data-inbox-total]')).toBeVisible();
  });

  test('a foreign conversation id does not deliver', async () => {
    const foreign = '99999999-9999-4999-8999-999999999999';
    await pageA.goto(`${base}/doctor/messages?c=${foreign}`);
    await pageA.locator('[data-composer] textarea').fill(`[${runId}] foreign`);
    await pageA.locator('[data-send]').click();
    await expect(pageA.locator('[data-send-error]')).toBeVisible();
    await expect(pageB.locator('[data-message-body]').filter({ hasText: `[${runId}] foreign` })).toHaveCount(0);
  });
});
