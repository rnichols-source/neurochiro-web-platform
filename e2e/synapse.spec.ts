import { test, expect } from '@playwright/test'

const base = process.env.E2E_BASE_URL || ''
const preview = Boolean(base) && !/neurochiro\.co/.test(base)

test.describe('Synapse marketplace', () => {
  test.skip(!preview, 'Set E2E_BASE_URL to a Vercel preview. Production and SSO-blocked aliases are skipped.')

  test('empty marketplace does not promise discounts', async ({ page }) => {
    await page.goto('/marketplace')
    await expect(page.getByText('Founding partners coming soon')).toBeVisible()
    await expect(page.getByText('Exclusive member discounts on every listing')).toHaveCount(0)
  })
})
