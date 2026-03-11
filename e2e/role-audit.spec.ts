import { test, expect, Page } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:3000';

test.describe('NeuroChiro Role-Based Login Audit', () => {
  
  test('Admin Login -> Admin Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Select role from sandbox - this now triggers immediate login
    await page.locator('button:has-text("Founder Login")').click();
    
    // Expect redirect to Admin Dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    
    // Verify landing page content - make sure it's fully loaded
    const heading = page.locator('h1', { hasText: /NeuroChiro Command/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('Doctor Login -> Doctor Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.locator('button:has-text("Doctor (Starter)")').click();
    
    // Expect redirect to Doctor Dashboard
    await page.waitForURL('**/doctor/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/doctor\/dashboard/);
    
    // DoctorDashboard has either "Practice Command Center" or "Doctor Dashboard" depending on tier
    const heading = page.locator('h1', { hasText: /(Practice Command Center|Doctor Dashboard)/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('Student Login -> Student Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.locator('button:has-text("Student (Free)")').click();
    
    // Expect redirect to Student Dashboard
    await page.waitForURL('**/student/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/student\/dashboard/);
    
    const heading = page.locator('h1', { hasText: /Elevating your career/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('Public Site Home Page', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verify the page loaded by checking for the main 'Log In' navigation link
    const loginLink = page.locator('a[href="/login"]').first();
    await expect(loginLink).toBeVisible();
  });
});
