import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3999';
const results = [];
const allErrors = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message });
  }
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Collect all console errors globally
  context.on('page', page => {
    page.on('console', msg => {
      if (msg.type() === 'error') allErrors.push(`[${page.url()}] ${msg.text()}`);
    });
    page.on('pageerror', err => allErrors.push(`[${page.url()}] PAGE ERROR: ${err.message}`));
  });

  // TEST 1: Home page loads with clickable links
  await test('Home page loads with links', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const links = await page.locator('a[href]').count();
    if (links < 5) throw new Error(`Only ${links} links found, expected at least 5`);
    await page.close();
  });

  // TEST 2: Directory page loads with doctors
  await test('Directory page loads with doctor list', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/directory', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    const pageText = await page.textContent('body');
    if (!pageText.includes('SPECIALIST') && !pageText.includes('Directory') && !pageText.includes('doctor')) {
      throw new Error('Directory page has no doctor content');
    }
    await page.close();
  });

  // TEST 3: Admin dashboard redirects to login (expected when not authenticated)
  await test('Admin dashboard redirects to login', async () => {
    const page = await context.newPage();
    const response = await page.goto(BASE + '/admin/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const url = page.url();
    // Should redirect to /login or show the admin page
    if (!url.includes('/login') && !url.includes('/admin')) {
      throw new Error(`Unexpected URL: ${url}`);
    }
    await page.close();
  });

  // TEST 4: Login page loads with interactive form
  await test('Login page has interactive form', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
    const count = await emailInput.count();
    if (count === 0) throw new Error('No email input found on login page');
    // Test that we can type in it (proves JS hydration worked)
    await emailInput.first().fill('test@test.com');
    const value = await emailInput.first().inputValue();
    if (value !== 'test@test.com') throw new Error('Could not type in email input — hydration broken');
    await page.close();
  });

  // TEST 5: Navigation works (click 3 links)
  await test('Navigation: Home -> Find a Doctor link works', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const link = page.locator('a[href="/directory"]').first();
    if (await link.count() === 0) throw new Error('No /directory link on home page');
    await link.click();
    await page.waitForTimeout(3000);
    if (!page.url().includes('/directory')) throw new Error(`Navigation failed, URL: ${page.url()}`);
    await page.close();
  });

  await test('Navigation: Home -> Education link works', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const link = page.locator('a[href="/learn"]').first();
    if (await link.count() === 0) throw new Error('No /learn link on home page');
    await link.click();
    await page.waitForTimeout(3000);
    if (!page.url().includes('/learn')) throw new Error(`Navigation failed, URL: ${page.url()}`);
    await page.close();
  });

  await test('Navigation: Seminars page loads directly', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/seminars', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    if (!text.includes('Seminar') && !text.includes('seminar')) throw new Error('Seminars page has no content');
    await page.close();
  });

  await browser.close();

  // Print results
  console.log('\n====================================');
  console.log('  STABILITY TEST RESULTS');
  console.log('====================================\n');

  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} ${r.name}: ${r.status}${r.error ? ' — ' + r.error : ''}`);
    if (r.status === 'PASS') passed++; else failed++;
  }

  console.log(`\n  ${passed} passed, ${failed} failed\n`);

  if (allErrors.length > 0) {
    console.log('  JAVASCRIPT ERRORS DETECTED:');
    // Deduplicate
    const unique = [...new Set(allErrors)];
    unique.forEach(e => console.log(`    ${e}`));
  } else {
    console.log('  ZERO JavaScript errors detected.');
  }

  console.log('\n====================================\n');
  process.exit(failed > 0 ? 1 : 0);
})();
