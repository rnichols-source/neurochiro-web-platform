import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Read-only quiz checks against a local `next start` or a non-production preview.
 * Does not submit an appointment or a results email.
 * Rate limit runs only when QUIZ_E2E_LOCAL=1.
 * Writes run only when QUIZ_E2E_WRITES=1, the base is not neurochiro.co, and a verified is_test doctor id is already known.
 */

const OUT = path.join(process.cwd(), 'docs/pr/quiz-rebuild')
const zip = process.env.QUIZ_E2E_ZIP || '29601'
const axeLog: { viewport: string; step: string; serious: number; ids: string[] }[] = []
const meta: Record<string, unknown> = {}

test.describe.configure({ mode: 'serial' })
test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3460' })

test.beforeAll(() => {
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3460'
  if (/neurochiro\.co/i.test(base)) throw new Error('Quiz e2e refuses neurochiro.co')
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nc_cookie_consent', 'true')
    localStorage.setItem('nc_region', 'US')
  })
})

test.afterAll(() => {
  mkdirSync('/tmp', { recursive: true })
  writeFileSync('/tmp/quiz-e2e-meta.json', JSON.stringify({ axe: axeLog, ...meta }, null, 2))
})

async function shot(page: Page, name: string) {
  mkdirSync(OUT, { recursive: true })
  await page.screenshot({ path: path.join(OUT, name), fullPage: true })
}

async function seriousCount(page: Page, include: string) {
  const results = await new AxeBuilder({ page }).include(include).analyze()
  return results.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical')
}

async function checkAxe(page: Page, viewport: string, step: string, include = 'main') {
  const bad = await seriousCount(page, include)
  axeLog.push({ viewport, step, serious: bad.length, ids: bad.map((item) => item.id) })
  expect(bad, bad.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([])
}

async function bothSizes(page: Page, name: string, include = 'main') {
  await page.setViewportSize({ width: 1440, height: 900 })
  await shot(page, `1440-${name}.png`)
  await checkAxe(page, '1440', name, include)
  await page.setViewportSize({ width: 375, height: 812 })
  await shot(page, `375-${name}.png`)
  await checkAxe(page, '375', name, include)
}

async function expectFocusedHeading(page: Page, name: string) {
  const heading = page.getByRole('heading', { level: 1, name })
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()
}

async function openQuiz(page: Page) {
  await page.goto('/quiz?source=direct')
  await expect(page).toHaveURL(/step=concern/)
  await expect(page.getByText('4 quick questions, about a minute.')).toBeVisible()
  await expectFocusedHeading(page, 'What would you like help with?')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
}

async function answerUntilPriority(page: Page, code: string) {
  await page.getByRole('button', { name: /Back, neck or headaches/ }).click()
  await expectFocusedHeading(page, 'Where should we look?')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
  await page.getByLabel('ZIP code').fill(code)
  await page.getByRole('button', { name: 'Next' }).click()
  await expectFocusedHeading(page, 'Have you seen a chiropractor before?')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
  await page.getByRole('button', { name: /Yes, I see one now/ }).click()
  await expectFocusedHeading(page, 'What matters most to you?')
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4')
}

async function finish(page: Page) {
  await page.getByRole('button', { name: /Closest to me/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Your matches' })).toBeVisible()
  await expect(page.getByRole('progressbar')).toHaveCount(0)
}

test('happy path, reload, axe, and safe dialog states', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await openQuiz(page)
  await bothSizes(page, 'concern')

  await page.setViewportSize({ width: 390, height: 844 })
  const overflow = await page.evaluate(() => {
    const main = document.querySelector('main')
    const mainBox = main?.getBoundingClientRect()
    return {
      doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      mainRight: mainBox ? mainBox.right : 0,
      client: document.documentElement.clientWidth,
    }
  })
  meta.overflow390 = overflow
  expect(overflow.doc).toBeLessThanOrEqual(1)
  expect(overflow.mainRight).toBeLessThanOrEqual(overflow.client + 1)
  await shot(page, '390-concern.png')

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: /Back, neck or headaches/ }).click()
  await expectFocusedHeading(page, 'Where should we look?')
  await page.getByLabel('ZIP code').fill(zip)
  await bothSizes(page, 'location')
  await page.getByRole('button', { name: 'Next' }).click()
  await expectFocusedHeading(page, 'Have you seen a chiropractor before?')
  await page.reload()
  await expectFocusedHeading(page, 'Have you seen a chiropractor before?')
  expect(page.url()).toContain('step=experience')
  await page.goBack()
  await expectFocusedHeading(page, 'Where should we look?')
  expect(page.url()).toContain('step=location')
  await expect(page.getByLabel('ZIP code')).toHaveValue(zip)
  await page.getByRole('button', { name: 'Next' }).click()
  await expectFocusedHeading(page, 'Have you seen a chiropractor before?')
  await bothSizes(page, 'experience')
  await page.getByRole('button', { name: /Yes, I see one now/ }).click()
  await expectFocusedHeading(page, 'What matters most to you?')
  await bothSizes(page, 'priority')
  await finish(page)

  const headline = page.getByText(/within \d+ (miles|km) of/)
  await expect(headline).toBeVisible({ timeout: 30000 })
  meta.localHeadline = (await headline.first().innerText()).slice(0, 180)
  await expect(page.getByRole('button', { name: 'Request an appointment' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'View profile' }).first()).toBeVisible()
  const directory = page.getByRole('link', { name: /See all doctors near/ })
  await expect(directory).toHaveAttribute('href', /location=/)
  const cards = page.getByRole('article')
  const count = await cards.count()
  expect(count).toBeGreaterThan(0)
  for (let index = 0; index < count; index += 1) {
    await expect(cards.nth(index)).not.toContainText(/\bnear\b/i)
  }
  await bothSizes(page, 'results-local')
  await page.getByRole('heading', { name: 'Email me these results' }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('checkbox', { name: /Email me these results/ })).not.toBeChecked()
  await bothSizes(page, 'email-unchecked')

  await page.getByRole('button', { name: 'Request an appointment' }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: /Request an appointment with Dr\./ })).toBeVisible()
  await expect(dialog.getByRole('checkbox')).not.toBeChecked()
  await bothSizes(page, 'dialog-empty', '[role="dialog"]')
  await dialog.getByRole('button', { name: 'Request an appointment' }).click()
  await expect(dialog.getByText('Enter your name.')).toBeVisible()
  await bothSizes(page, 'dialog-error', '[role="dialog"]')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Request an appointment' }).first()).toBeFocused()
})

test('no-local copy uses a far ZIP', async ({ page }) => {
  const preferred = process.env.QUIZ_E2E_FAR_ZIP
  const candidates = preferred ? [preferred] : ['99950', '96720']
  let used = ''
  let headline = ''
  for (const code of candidates) {
    await page.context().clearCookies()
    await page.goto('/quiz?source=direct')
    await page.evaluate(() => sessionStorage.removeItem('nc_quiz_v2'))
    await page.goto('/quiz?source=direct')
    await expectFocusedHeading(page, 'What would you like help with?')
    await answerUntilPriority(page, code)
    await finish(page)
    await expect(page.getByText(/No NeuroChiro doctors within \d+ (miles|km)|within \d+ (miles|km) of|We don't have doctors|couldn't find that ZIP|Too many tries/).first()).toBeVisible({ timeout: 30000 })
    const text = await page.locator('main').innerText()
    if (/No NeuroChiro doctors within \d+ (miles|km)/.test(text) && /starting \d+ (miles|km) away/.test(text)) {
      used = code
      headline = text.match(/No NeuroChiro doctors[^\n]+/)?.[0] || ''
      break
    }
    headline = text.split('\n').find((line) => /within|don't have doctors|couldn't find/.test(line)) || text.slice(0, 240)
  }
  meta.farZip = used || candidates.join(',')
  meta.farHeadline = headline
  expect(used, `no far ZIP produced no-local copy. Last text: ${headline}`).not.toEqual('')
  await bothSizes(page, 'results-nolocal')
})

test('fewer-than-3 local results when a sparse ZIP exists', async ({ page }) => {
  const candidates = (process.env.QUIZ_E2E_FEW_ZIP || '58102').split(',')
  let used = ''
  let headline = ''
  for (const code of candidates) {
    await page.goto('/quiz?source=direct')
    await page.evaluate(() => sessionStorage.removeItem('nc_quiz_v2'))
    await page.reload()
    await expectFocusedHeading(page, 'What would you like help with?')
    await answerUntilPriority(page, code.trim())
    await finish(page)
    await expect(page.getByText(/No NeuroChiro doctors within \d+ (miles|km)|within \d+ (miles|km) of|We don't have doctors|couldn't find that ZIP|Too many tries/).first()).toBeVisible({ timeout: 30000 })
    const text = await page.locator('main').innerText()
    const match = text.match(/^[12] nervous system chiropractor/)
    const line = text.split('\n').find((item) => /nervous system chiropractor|No NeuroChiro|don't have doctors|couldn't find/.test(item)) || ''
    if (match || /^[12] nervous system/.test(line)) {
      used = code.trim()
      headline = line
      break
    }
    headline = line
  }
  meta.fewZip = used
  meta.fewHeadline = headline
  test.skip(!used, `No sparse ZIP in the candidate list. Last headline: ${headline}`)
  await bothSizes(page, 'results-few')
})

test('request and email writes stay off unless a preview test doctor is named', async () => {
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3460'
  const allowed = process.env.QUIZ_E2E_WRITES === '1'
    && !/neurochiro\.co/i.test(base)
    && !!process.env.LEADS_E2E_DOCTOR_ID
    && !!process.env.LEADS_TEST_REDIRECT_EMAIL
  test.skip(!allowed, 'skipped: QUIZ_E2E_WRITES is off, or this is production, or no verified is_test doctor id is already known')
})

test('local match rate limit shows the friendly message', async ({ page }) => {
  test.skip(process.env.QUIZ_E2E_LOCAL !== '1', 'Set QUIZ_E2E_LOCAL=1 to run the in-memory limiter against next start')
  test.setTimeout(180000)
  // Let the earlier read-only matches fall out of the one-minute window.
  await page.waitForTimeout(61000)
  await page.goto('/quiz?source=direct')
  await expectFocusedHeading(page, 'What would you like help with?')
  await page.evaluate((code) => {
    sessionStorage.setItem('nc_quiz_v2', JSON.stringify({
      v: 2,
      concern: 'pain',
      country: 'US',
      postal: code,
      city: '',
      region: '',
      experience: 'regular',
      priority: 'closest',
      source: 'direct',
      sessionId: crypto.randomUUID(),
      startedAt: Date.now() - 5000,
    }))
  }, zip)
  let seenAt = 0
  for (let attempt = 1; attempt <= 11; attempt += 1) {
    await page.goto(`/quiz?step=results&n=${attempt}`)
    const limited = page.getByRole('alert').filter({ hasText: 'Too many tries in a short time' })
    const headline = page.locator('p').filter({ hasText: /within \d+ (miles|km) of|No NeuroChiro doctors within/ })
    await expect(limited.or(headline).first()).toBeVisible({ timeout: 30000 })
    if (await limited.isVisible()) {
      seenAt = attempt
      break
    }
  }
  meta.rateLimitAttempt = seenAt
  expect(seenAt).toBe(11)
})
