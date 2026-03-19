import { test, expect, Page } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:3000';

test.describe('NeuroChiro Role-Based Login Audit', () => {
  
  test('Admin Login -> Admin Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill credentials for Admin
    await page.fill('input[name="email"]', 'drray@neurochirodirectory.com');
    await page.fill('input[name="password"]', 'password123'); // Assuming test password
    await page.click('button[type="submit"]');
    
    // Expect redirect to Admin Dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
  });

  test('Doctor Login -> Doctor Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill credentials for Doctor
    await page.fill('input[name="email"]', 'doctor@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Expect redirect to Doctor Dashboard
    await page.waitForURL('**/doctor/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/doctor\/dashboard/);
  });

  test('Student Login -> Student Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill credentials for Student
    await page.fill('input[name="email"]', 'student@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Expect redirect to Student Dashboard
    await page.waitForURL('**/student/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/student\/dashboard/);
  });

  test('Public Site Home Page', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verify the page loaded by checking for the main 'Log In' navigation link
    const loginLink = page.locator('a[href="/login"]').first();
    await expect(loginLink).toBeVisible();
  });
});
