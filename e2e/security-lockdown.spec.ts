import { expect, test } from '@playwright/test'

const base = process.env.E2E_BASE_URL
const production = !!base && /neurochiro\.co/i.test(base) && !/vercel\.app/i.test(base)

test.describe('security lockdown public pages', () => {
  test.skip(!base, 'E2E_BASE_URL is not set')
  test.skip(production, 'refusing production form and login checks')

  test.use({ baseURL: base })

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`logged out directory ${viewport.width}x${viewport.height}`, async ({ page }) => {
      const denied: string[] = []
      page.on('console', (msg) => {
        if (/permission denied/i.test(msg.text())) denied.push(msg.text())
      })
      await page.setViewportSize(viewport)
      await page.goto('/directory', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()
      expect(denied).toEqual([])
    })
  }

  for (const path of ['/quiz', '/jobs', '/students']) {
    test(`logged out ${path}`, async ({ page }) => {
      const denied: string[] = []
      page.on('console', (msg) => {
        if (/permission denied/i.test(msg.text())) denied.push(msg.text())
      })
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(denied).toEqual([])
    })
  }

  test('logged out doctor profile from the directory', async ({ page }) => {
    const denied: string[] = []
    page.on('console', (msg) => {
      if (/permission denied/i.test(msg.text())) denied.push(msg.text())
    })
    await page.goto('/directory', { waitUntil: 'domcontentloaded' })
    const link = page.locator('a[href*="/directory/"]').first()
    if (await link.count()) {
      await link.click()
      await page.waitForLoadState('domcontentloaded')
    }
    expect(denied).toEqual([])
  })

  test('doctor login smoke', async ({ page }) => {
    test.skip(!process.env.E2E_DOCTOR_EMAIL || !process.env.E2E_DOCTOR_PASSWORD, 'E2E_DOCTOR_EMAIL or password is not set')
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()
  })

  test('student login smoke', async ({ page }) => {
    test.skip(!process.env.E2E_STUDENT_EMAIL || !process.env.E2E_STUDENT_PASSWORD, 'E2E_STUDENT_EMAIL or password is not set')
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()
  })
})
