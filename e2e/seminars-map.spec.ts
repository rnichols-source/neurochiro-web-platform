import { expect, test } from "@playwright/test";

test("seminar map shows pins and opens the seminar", async ({ page }, testInfo) => {
  await page.goto("/seminars?view=map");
  await expect(page.locator("[data-nc-seminars='ready']")).toBeVisible();
  const iframe = page.frameLocator("iframe#network-map-iframe");
  await expect(page.locator("iframe#network-map-iframe")).toBeVisible();
  await page.waitForFunction(() => {
    const frame = document.querySelector("iframe#network-map-iframe") as HTMLIFrameElement | null;
    const win = frame?.contentWindow as { __ncMapFeatureCount?: number; __ncMap?: { isMoving: () => boolean } } | null;
    const count = win?.__ncMapFeatureCount ?? 0;
    return count >= 2 && Boolean(win?.__ncMap) && !win?.__ncMap?.isMoving();
  });
  if (testInfo.project.name.includes("mobile")) {
    await expect(page.getByRole("link", { name: "List" })).toBeVisible();
  }
  const target = await page.locator("iframe#network-map-iframe").evaluate((frame) => {
    const win = (frame as HTMLIFrameElement).contentWindow as unknown as {
      __ncMap?: { project: (coords: [number, number]) => { x: number; y: number } };
      __ncMapFeatures?: { geometry: { coordinates: [number, number] }; properties: { slug?: string; kind?: string } }[];
    } | null;
    const feature = win?.__ncMapFeatures?.find((item) => item.properties?.kind === "seminar" && item.properties.slug);
    if (!feature || !win?.__ncMap) return null;
    const point = win.__ncMap.project(feature.geometry.coordinates);
    return { x: point.x, y: point.y, slug: feature.properties.slug as string };
  });
  expect(target?.slug).toBeTruthy();
  await iframe.locator("canvas").first().click({ position: { x: target!.x, y: target!.y } });
  await iframe.getByRole("button", { name: "View seminar" }).click();
  await expect(page).toHaveURL(new RegExp(`/seminars/${target!.slug}`));
});

test("map toggle is visible before the map opens", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile toggle check");
  await page.goto("/seminars");
  await expect(page.getByRole("link", { name: "Map" })).toBeVisible();
});
