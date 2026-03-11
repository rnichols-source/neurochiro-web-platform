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
    
    // Verify landing page content
    await expect(page.locator('h1')).toContainText(/NeuroChiro Command/i);
  });

  test('Doctor Login -> Doctor Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.locator('button:has-text("Doctor (Starter)")').click();
    
    // Expect redirect to Doctor Dashboard
    await page.waitForURL('**/doctor/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/doctor\/dashboard/);
    
    await expect(page.locator('h1')).toContainText(/Dashboard|Command Center/i);
  });

  test('Student Login -> Student Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.locator('button:has-text("Student (Free)")').click();
    
    // Expect redirect to Student Dashboard
    await page.waitForURL('**/student/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/student\/dashboard/);
    
    await expect(page.locator('h1')).toContainText(/Elevating your career/i);
  });

  test('Public Site Home Page', async ({ page }) => {
    await page.goto(BASE_URL);
    // Be specific about the first heading
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Verify "NeuroChiro" logo/text in navigation
    const logo = page.locator('nav').locator('text=NeuroChiro').first();
    await expect(logo).toBeVisible();
  });
});
