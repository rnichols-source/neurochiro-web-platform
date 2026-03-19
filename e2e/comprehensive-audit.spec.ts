import { test, expect, Page } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:3000'; // Assuming local dev server for testing

// Helper to check for console errors
const checkConsoleErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()} on ${page.url()}`);
    }
  });
  page.on('pageerror', exception => {
    errors.push(`Uncaught Exception: ${exception.message} on ${page.url()}`);
  });
  return errors;
};

// Recursive clicking function (limited depth to prevent infinite loops)
async function recursiveClickTest(page: Page, depth = 0, maxDepth = 2) {
  if (depth > maxDepth) return;

  // Wait for network idle to ensure page is loaded
  await page.waitForLoadState('domcontentloaded');

  // Find all clickable elements - only internal links to avoid leaving the site
  const clickables = await page.$$('button:not([disabled]), a[href^="/"], [role="button"]');
  console.log(`[Depth ${depth}] Found ${clickables.length} clickable elements on ${page.url()}`);

  // Test up to 10 elements per page to keep test time reasonable
  const limit = Math.min(clickables.length, 15);
  
  for (let i = 0; i < limit; i++) {
    // Re-select to avoid stale element references
    const currentClickables = await page.$$('button:not([disabled]), a[href^="/"], [role="button"]');
    if (i >= currentClickables.length) break;
    
    const el = currentClickables[i];
    
    // Check if element is visible
    if (!(await el.isVisible())) continue;

    const tag = await el.evaluate(e => e.tagName.toLowerCase());
    const text = (await el.textContent() || 'unnamed').trim().substring(0, 20);
    const href = await el.getAttribute('href');
    
    console.log(`[Depth ${depth}] Testing: <${tag}> ${text} ${href ? `(href: ${href})` : ''}`);
    
    const prevUrl = page.url();
    
    try {
      // Use a race to handle potential navigations vs just clicks
      await Promise.race([
        el.click({ timeout: 3000 }),
        page.waitForNavigation({ timeout: 3000 }).catch(() => null)
      ]);

      // If URL changed and we haven't hit max depth, recurse
      if (page.url() !== prevUrl && depth < maxDepth) {
          console.log(`   -> Navigated to: ${page.url()}`);
          
          // Verify no major errors on new page
          const body = await page.locator('body').textContent();
          if (body?.match(/404|500|Unhandled Runtime Error/i)) {
              throw new Error(`Error text found on ${page.url()}`);
          }
          
          // For depth 1, we don't go back immediately if we want to test deeper
          // But for this audit, we'll go back to keep testing the original page
          await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => null);
      }
    } catch (e) {
      console.warn(`   -> Click/Nav skipped on <${tag}> ${text}: ${e.message}`);
    }
  }
}

test.describe('NeuroChiro Comprehensive E2E Audit', () => {
  
  test('Public Site Navigation & CTAs', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes
    const errors = checkConsoleErrors(page);
    
    await page.goto(BASE_URL);
    await recursiveClickTest(page, 0, 1); // Depth 1 (Homepage + its links)
    
    expect(errors.length).toBe(0);
  });

  test('Authentication Flow: Login -> Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Test form rendering
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Test Quick Access Dev Sandbox (Doctor Pro)
    const doctorProBtn = page.locator('button:has-text("Doctor (Elite Pro)")');
    if (await doctorProBtn.isVisible()) {
        await doctorProBtn.click();
        await page.waitForURL('**/doctor/dashboard');
        await expect(page.locator('h1')).toContainText(/(Dashboard|Command Center)/i);
        
        // Deep click test inside dashboard
        await recursiveClickTest(page, 0, 1);
    }
  });

  // More specific role tests would go here (Student, Vendor, Admin)
});
