import { expect, test } from "@playwright/test";

const braveId = "c60f0061-e73c-45a6-ab5e-90c2f80dfdcd";
const braveSlug = "the-brave-practice-event-fort-lauderdale-2026";

test("upcoming index hides finished seminars and past view has no register", async ({ page }) => {
  await page.goto("/seminars");
  await expect(page.locator("main[data-nc-seminars='ready']")).toBeVisible();
  const list = page.locator("[data-seminar-list]");
  await expect(list).toContainText("Brave Practice");
  await expect(list).toContainText("Davenport");
  await expect(list).not.toContainText("IN8");
  await expect(page.locator("[data-featured-rail]")).toBeVisible();
  await page.goto("/seminars?past=1");
  const past = page.locator("[data-seminar-list]");
  await expect(past).toContainText("IN8");
  await expect(past.getByText("Register", { exact: true })).toHaveCount(0);
  await expect(past).not.toContainText(/^Free$/);
});

test("filters survive a reload", async ({ page }) => {
  await page.goto("/seminars?country=US");
  await expect(page).toHaveURL(/country=US/);
  await page.reload();
  await expect(page).toHaveURL(/country=US/);
  await expect(page.locator("[data-seminar-list]")).toContainText("Davenport");
});

test("landing page has metadata, json-ld, calendar, and a sticky bar", async ({ page }) => {
  await page.goto(`/seminars/${braveSlug}`);
  await expect(page).toHaveTitle(/Brave Practice/);
  const canonical = page.locator("link[rel='canonical']");
  await expect(canonical).toHaveAttribute("href", new RegExp(`/seminars/${braveSlug}`));
  const og = page.locator("meta[property='og:image']");
  await expect(og).toHaveAttribute("content", new RegExp("/api/og/seminar/"));
  const json = (await page.locator("script[type='application/ld+json']").allTextContents()).join("\n");
  expect(json).toContain("\"@type\":\"Event\"");
  expect(json).toContain("2026-11-06");
  const cta = page.locator(".nc-seminar-cta");
  if ((page.viewportSize()?.width || 0) >= 1024) await expect(cta).toBeHidden();
  else await expect(cta).toBeVisible();
  await expect(page.getByText("Install NeuroChiro")).toHaveCount(0);
});

test("uuid redirects to the slug", async ({ page }) => {
  await page.goto(`/seminars/${braveId}`);
  await expect(page).toHaveURL(new RegExp(`/seminars/${braveSlug}$`));
});

test("calendar file and host redirect", async ({ request, page }) => {
  const ics = await request.get(`/seminars/${braveSlug}/calendar.ics`);
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  const body = await ics.text();
  expect(body).toContain("DTSTART;TZID=America/New_York:20261106T090000");
  await page.goto("/host-a-seminar");
  await expect(page).toHaveURL(/\/seminars\/host/);
  await expect(page.getByText("$199")).toBeVisible();
});

test("external register route appends utm", async ({ page, request }) => {
  await page.goto(`/seminars/${braveSlug}`);
  const register = page.locator("a[href*='/go/seminar/']").first();
  if ((await register.count()) === 0) {
    test.skip(true, "This seminar has no https registration link");
    return;
  }
  const href = await register.getAttribute("href");
  expect(href).toContain("/go/seminar/");
  const response = await request.get(href || "", { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  expect(response.headers().location || "").toContain("utm_source=neurochiro");
  expect(response.headers().location || "").toContain("utm_medium=seminar");
});
