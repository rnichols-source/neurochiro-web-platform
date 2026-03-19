import { test, expect } from '@playwright/test';

test.describe('Doctor Dashboard Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    // Quick login as a Growth Doctor
    await page.goto('/login');
    const doctorLogin = page.locator('button:has-text("Doctor (Growth)")').first();
    await doctorLogin.click();
    await expect(page).toHaveURL(/\/doctor\/dashboard/);
  });

  test('Dashboard should display practice metrics', async ({ page }) => {
    // Check for metrics section
    const metricsHeading = page.getByRole('heading', { name: /Practice Status|Metrics|Analytics/i }).first();
    if (await metricsHeading.isVisible()) {
      await expect(metricsHeading).toBeVisible();
    }
    
    // Look for common dashboard elements like "Patient Flow" or "Referrals"
    const patientFlow = page.getByText(/Patient Flow/i).first();
    await expect(patientFlow).toBeVisible();
  });

  test('Hiring & Job Posting system should be accessible', async ({ page }) => {
    // Navigate to Hiring/Jobs tab or section
    const hiringLink = page.getByRole('link', { name: /Hiring|Jobs/i }).first();
    if (await hiringLink.isVisible()) {
      await hiringLink.click();
    } else {
      // Sometimes it's a button or section
      const hiringBtn = page.getByRole('button', { name: /Hiring|Jobs/i }).first();
      await hiringBtn.click();
    }
    
    // Verify we are in the jobs section
    await expect(page.locator('body')).toContainText(/Post a Job|Active Listings/i);
  });

  test('Vendor Marketplace should be accessible from dashboard', async ({ page }) => {
    // Click on Vendor/Partnerships
    const vendorLink = page.getByRole('link', { name: /Vendors|Marketplace/i }).first();
    await vendorLink.click();
    
    // Verify vendor listings appear
    await expect(page.locator('h1')).toContainText(/Marketplace|Vendors/i);
    // Should see vendor cards or discounts
    await expect(page.locator('body')).toContainText(/Exclusive Discounts|Partners/i);
  });
});
