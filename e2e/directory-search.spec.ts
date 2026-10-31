import { expect, test, type Page } from '@playwright/test';

function locationInput(page: Page) {
  return page.getByTestId('location-input').filter({ visible: true });
}

function cards(page: Page) {
  return page.getByTestId('doctor-card').filter({ visible: true });
}

async function waitForDirectory(page: Page) {
  await page.waitForFunction(() => document.documentElement.dataset.ncDirectory === 'ready');
}

async function typeAndSearch(page: Page, value: string) {
  await waitForDirectory(page);
  const input = locationInput(page);
  await expect(async () => {
    await input.fill(value);
    await expect(input).toHaveValue(value, { timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await input.press('Enter');
  await expect(page).toHaveURL(new RegExp(`location=${value.split(',')[0].trim()}`), { timeout: 15000 });
}

async function searchFor(page: Page, value: string) {
  await page.goto('/directory');
  await typeAndSearch(page, value);
}

async function openCountrySheet(page: Page) {
  await waitForDirectory(page);
  const chip = page.getByTestId('country-chip').filter({ visible: true });
  const dialog = page.getByRole('dialog', { name: 'Where are you looking?' });
  await expect(chip).toBeVisible();
  await expect(async () => {
    if (!(await dialog.isVisible())) await chip.click();
    await expect(dialog).toBeVisible();
  }).toPass({ timeout: 15000 });
  return dialog;
}

test('greenville shows nearby doctors', async ({ page }) => {
  await searchFor(page, 'Greenville, SC');
  await expect(cards(page).first()).toContainText('Greer', { timeout: 20000 });
  expect(await cards(page).count()).toBeGreaterThanOrEqual(3);
});

test('zip search', async ({ page }) => {
  await searchFor(page, '29601');
  await expect(cards(page).first()).toContainText('Greer', { timeout: 20000 });
  expect(await cards(page).count()).toBeGreaterThanOrEqual(3);
});

test('typed location beats stale gps', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nc_user_lat', '30.2672');
    localStorage.setItem('nc_user_lng', '-97.7431');
  });
  await searchFor(page, 'Greenville, SC');
  const first = cards(page).first();
  await expect(first).toContainText('Greer', { timeout: 20000 });
  await expect(first).not.toContainText('Austin');
});

test('view profile navigates', async ({ page }) => {
  await searchFor(page, 'Greenville, SC');
  await expect(cards(page).first()).toContainText('Greer', { timeout: 20000 });
  const searchUrl = page.url();
  const profile = cards(page).first().getByRole('link', { name: /View profile/ });
  await profile.scrollIntoViewIfNeeded();
  await Promise.all([
    page.waitForURL(/\/directory\/[a-z0-9-]+/, { timeout: 20000 }),
    profile.click(),
  ]);
  await page.goBack();
  await expect(page).toHaveURL(searchUrl, { timeout: 15000 });
  await expect(cards(page).first()).toBeVisible();
});

test('request appointment CTA', async ({ page }) => {
  await searchFor(page, 'Greenville, SC');
  await expect(cards(page).first()).toBeVisible({ timeout: 20000 });
  const appointment = page.getByRole('link', { name: 'Request appointment' }).filter({ visible: true }).first();
  await appointment.click();
  await expect(page).toHaveURL(/\/directory\/[a-z0-9-]+#appointment-form/, { timeout: 15000 });
  await expect(page.locator('#appointment-form')).toBeVisible();
});

test('country picker mobile', async ({ page }) => {
  await page.goto('/directory');
  const dialog = await openCountrySheet(page);
  await dialog.getByRole('button', { name: /Canada/ }).click();
  await typeAndSearch(page, 'Toronto');
  await expect(cards(page).first()).toContainText('km', { timeout: 20000 });
});

test('auto-switch', async ({ page }) => {
  await searchFor(page, 'London');
  await expect(page.getByTestId('country-chip').filter({ visible: true })).toContainText('UK', { timeout: 20000 });
  await expect(cards(page).first()).toBeVisible();
});

test('europe no us leak', async ({ page }) => {
  await page.goto('/directory');
  const dialog = await openCountrySheet(page);
  await dialog.getByRole('button', { name: /Europe/ }).click();
  await typeAndSearch(page, 'Berlin');
  await expect(cards(page).first().or(page.getByText(/couldn't find|No NeuroChiro/i).filter({ visible: true }).first())).toBeVisible({ timeout: 20000 });
  const count = await cards(page).count();
  for (let index = 0; index < count; index += 1) {
    await expect(cards(page).nth(index)).not.toContainText(/, (TX|SC)\b/);
  }
});

test('locations page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/directory/search') && response.ok());
  await page.goto('/directory/locations/ca');
  const body = await (await responsePromise).json();
  expect(body.doctors.length).toBeGreaterThan(0);
  for (const doctor of body.doctors as { country?: string }[]) {
    expect(String(doctor.country || '').toUpperCase()).toBe('CA');
  }
  await expect(cards(page).first()).toBeVisible();
  expect(errors.filter((line) => /Minified React error #418|Hydration failed/.test(line))).toEqual([]);
});

test('map empty clears pins', async ({ page }) => {
  await searchFor(page, 'Zzzzz');
  await expect(page.getByText(/couldn't find|No NeuroChiro|Something went wrong/i).filter({ visible: true }).first()).toBeVisible({ timeout: 20000 });
  const mapButton = page.getByRole('button', { name: 'Show map' });
  if (await mapButton.isVisible()) await mapButton.click();
  await expect.poll(async () => {
    const frames = page.frames().filter((frame) => frame.url().includes('network-map.html'));
    if (frames.length === 0) return 'missing';
    const counts = await Promise.all(frames.map((frame) => frame.evaluate(() => {
      return (window as Window & { __ncMapFeatureCount?: number }).__ncMapFeatureCount;
    })));
    return counts.length > 0 && counts.every((count) => count === 0) ? 'empty' : counts.join(',');
  }, { timeout: 20000 }).toBe('empty');
});

test('no tiny inputs', async ({ page }) => {
  await page.goto('/directory');
  const sizes = await page.locator('input:visible').evaluateAll((elements) => {
    return elements.map((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  });
  expect(sizes.length).toBeGreaterThan(0);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16);
});

test('tap targets', async ({ page }) => {
  await searchFor(page, 'Greenville, SC');
  await expect(cards(page).first()).toBeVisible({ timeout: 20000 });
  const shell = page.locator('div.fixed.inset-0').filter({ visible: true }).first();
  const boxes = await shell.locator('a:visible, button:visible').evaluateAll((elements) => {
    return elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        label: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 60),
      };
    });
  });
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(Math.round(box.height), box.label).toBeGreaterThanOrEqual(44);
    expect(Math.round(box.width), box.label).toBeGreaterThanOrEqual(44);
  }
});
