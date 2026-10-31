import { expect, test } from "@playwright/test";

test.describe("homepage", () => {
  test("shows one chiropractor heading and the search above the fold", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const headings = page.locator("h1");
    await expect(headings).toHaveCount(1);
    await expect(headings).toContainText(/chiropractor/i);
    const input = page.getByRole("searchbox");
    const button = page.getByRole("button", { name: "Find doctors near me" });
    await expect(input).toBeVisible();
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y || 0) + (box?.height || 0)).toBeLessThanOrEqual(844);
    const inputBox = await input.boundingBox();
    expect((inputBox?.y || 0) + (inputBox?.height || 0)).toBeLessThanOrEqual(844);
  });

  test("searches Austin from the hero", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await page.getByRole("searchbox").fill("Austin, TX");
    await page.getByRole("button", { name: "Find doctors near me" }).click();
    await page.waitForURL(/\/directory\?/);
    expect(decodeURIComponent(page.url())).toContain("Austin");
    await expect(page.getByRole("link", { name: "Request appointment" }).first()).toBeVisible({ timeout: 20_000 });
  });

  test("uses current location without filling the hero field", async ({ page, context }) => {
    test.setTimeout(60_000);
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 34.85, longitude: -82.39 });
    await page.goto("/");
    await page.getByRole("link", { name: "Use my current location" }).click();
    await page.waitForURL(/\/directory/);
    await expect(page.locator("body")).toContainText(/Greenville|Greer/, { timeout: 25_000 });
  });

  test("condition chips point at specialties or the quiz", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.getByRole("navigation", { name: "Popular searches:" }).locator("a").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") || ""),
    );
    expect(hrefs.length).toBeGreaterThanOrEqual(5);
    for (const href of hrefs) {
      expect(href).toMatch(/\/directory\?specialties=|\/quiz/);
    }
  });

  test("drops seminar blocks and keeps chiropractors last", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Upcoming seminars");
    expect(body).not.toContain("Upcoming Events");
    expect(body).not.toContain("Recently Joined");
    const last = page.locator("main > section").last();
    await expect(last).toContainText("For chiropractors");
    await expect(last).toContainText("Are you a nervous system chiropractor?");
  });

  test("patient menu links do not go to doctor signup", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click({ force: true });
    const find = page.getByRole("dialog").getByRole("link", { name: "Find a doctor", exact: true });
    await expect(find).toHaveCount(2);
    for (const link of await find.all()) {
      await expect(link).toHaveAttribute("href", "/directory");
    }
    const links = page.locator("a");
    const count = await links.count();
    for (let index = 0; index < count; index += 1) {
      const link = links.nth(index);
      const label = (await link.innerText()).toLowerCase();
      if (!label.includes("patient")) continue;
      const href = (await link.getAttribute("href")) || "";
      expect(href).not.toContain("/get-started");
    }
  });

  test("homepage links respond and the console stays quiet", async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("429")) errors.push(message.text());
    });
    const response = await page.goto("/");
    expect(response?.status() || 0).toBeLessThan(400);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) =>
      [...new Set(links.map((link) => (link.getAttribute("href") || "").split("#")[0]).filter(Boolean))],
    );
    for (const href of hrefs) {
      const result = await page.request.get(href, { maxRedirects: 0 });
      expect(result.status(), href).toBeLessThan(400);
    }
    expect(errors).toEqual([]);
  });

  test("demo doctor profile is not public", async ({ request }) => {
    const response = await request.get("/directory/dr-sophia-chen-demo");
    expect(response.status()).toBe(404);
  });
});
