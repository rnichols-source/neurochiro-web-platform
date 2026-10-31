import { expect, test } from "@playwright/test";

async function expectWhiteHeading(page: import("@playwright/test").Page) {
  const color = await page.locator("h1").first().evaluate((element) => getComputedStyle(element).color);
  expect(color).toBe("rgb(255, 255, 255)");
}

test("seminars index heading is white on the navy hero", async ({ page }) => {
  await page.goto("/seminars");
  await expect(page.locator("[data-nc-seminars='ready']")).toBeVisible();
  await expectWhiteHeading(page);
});

test("seminar detail heading is white on the navy hero", async ({ page }) => {
  await page.goto("/seminars");
  const href = await page.locator("[data-seminar-card] a").first().getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expectWhiteHeading(page);
});
