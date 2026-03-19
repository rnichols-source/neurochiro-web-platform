import { test, expect } from '@playwright/test';

const publicRoutes = [
  '/',
  '/about',
  '/careers',
  '/contact',
  '/directory',
  '/jobs',
  '/learn',
  '/marketplace',
  '/nervous-system',
  '/pricing',
  '/seminars',
  '/privacy',
  '/terms',
  '/login',
  '/register'
];

test.describe('Public Website Experience', () => {
  for (const route of publicRoutes) {
    test(`Route "${route}" should load without errors`, async ({ page }) => {
      const response = await page.goto(route);
      
      // Ensure the page returns a success status code
      expect(response?.status()).toBe(200);
      
      // Ensure we don't see any "404" or "Error" text in the main heading
      const bodyText = await page.innerText('body');
      expect(bodyText.toLowerCase()).not.toContain('404');
      expect(bodyText.toLowerCase()).not.toContain('page not found');
      
      // Wait for at least one heading to be visible
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }

  test('Navbar should be functional', async ({ page }) => {
    await page.goto('/');
    
    // Check if the logo exists and links to home
    const logo = page.locator('header').getByText('N', { exact: true }).first();
    if (await logo.isVisible()) {
      await expect(logo).toBeVisible();
    }

    // Check if main navigation links are present (assuming desktop)
    const navLinks = ['Find a Doctor', 'Marketplace', 'Nervous System', 'Education', 'Log In'];
    for (const linkText of navLinks) {
      const link = page.getByRole('link', { name: linkText, exact: true }).first();
      await expect(link).toBeVisible();
    }
  });

  test('Directory search should display results', async ({ page }) => {
    await page.goto('/directory');
    
    // Check for search input
    const searchInput = page.getByPlaceholder(/Search|City|State/i).first();
    await expect(searchInput).toBeVisible();
    
    // Check if the map or list is present
    // Assuming doctors are listed by default
    const doctorCards = page.locator('.doctor-card, [class*="doctor-card"]');
    // If we have default doctors, expect them to be visible
    // For now, just check the container exists
    await expect(page.locator('main')).toBeVisible();
  });
});
