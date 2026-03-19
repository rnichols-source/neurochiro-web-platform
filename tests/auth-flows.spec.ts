import { test, expect } from '@playwright/test';

test.describe('Authentication & User Flows', () => {
  
  test('Login redirection for different roles', async ({ page }) => {
    const roles = [
      { email: 'admin@neurochiro.com', expectedPath: '/admin/dashboard' },
      { email: 'doctor_pro@neurochiro.com', expectedPath: '/doctor/dashboard' },
      { email: 'student_paid@neurochiro.com', expectedPath: '/student/dashboard' },
      { email: 'vendor@neurochiro.com', expectedPath: '/marketplace/dashboard' },
      { email: 'patient@neurochiro.com', expectedPath: '/portal/dashboard' },
    ];

    for (const role of roles) {
      await page.goto('/login');
      
      // Use the Dev Sandbox quick login buttons if they exist, 
      // or just fill the form. The sandbox buttons are more reliable for mock logic.
      const quickLoginButton = page.locator(`button:has-text("${role.email.split('@')[0]}")`).first();
      
      if (await quickLoginButton.isVisible()) {
        await quickLoginButton.click();
      } else {
        await page.fill('input[type="email"]', role.email);
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
      }

      // Verify redirection
      await expect(page).toHaveURL(new RegExp(role.expectedPath));
      
      // Clear cookies for next iteration
      await page.context().clearCookies();
    }
  });

  test('Multi-step registration flow - Doctor', async ({ page }) => {
    await page.goto('/register');
    
    // Step 1: Select Role
    await expect(page.locator('h1')).toContainText('Welcome to NeuroChiro');
    await page.click('button:has-text("I am a Doctor")');
    
    // Step 2: Select Tier
    await expect(page.locator('h2')).toContainText('Choose your membership');
    // Select the "Growth" tier (featured)
    await page.click('div:has-text("Growth") >> text=Select Growth');
    
    // Step 3: Fill Form
    await expect(page.locator('h2')).toContainText('Create your account');
    await page.fill('input[placeholder="John Doe"]', 'Test Doctor');
    await page.fill('input[placeholder="john@example.com"]', 'test-doctor@example.com');
    await page.fill('input[placeholder="Neuro-Life Wellness"]', 'Playwright Clinic');
    await page.fill('input[placeholder="••••••••"]', 'password123');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to doctor dashboard
    await expect(page).toHaveURL(/\/doctor\/dashboard/);
  });

  test('Multi-step registration flow - Student', async ({ page }) => {
    await page.goto('/register');
    
    // Step 1: Select Role
    await page.click('button:has-text("I am a Student")');
    
    // Step 2: Select Tier
    await page.click('div:has-text("Professional") >> text=Select Professional');
    
    // Step 3: Fill Form
    await page.fill('input[placeholder="John Doe"]', 'Test Student');
    await page.fill('input[placeholder="john@example.com"]', 'test-student@example.com');
    await page.fill('input[placeholder="Life University"]', 'Test Chiropractic College');
    await page.fill('input[placeholder="2027"]', '2028');
    await page.fill('input[placeholder="••••••••"]', 'password123');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to student dashboard
    await expect(page).toHaveURL(/\/student\/dashboard/);
  });
});
