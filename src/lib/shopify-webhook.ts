import { createHmac, timingSafeEqual } from "node:crypto";

export const SHOPIFY_REVALIDATE_TOPICS = new Set([
  "products/create",
  "products/update",
  "products/delete",
  "collections/create",
  "collections/update",
  "collections/delete",
  "inventory_levels/update",
  "product_listings/add",
  "product_listings/update",
  "product_listings/remove",
]);

const HANDLE = /^[a-z0-9-]{1,120}$/;

export function verifyShopifyWebhook(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const left = Buffer.from(digest);
  const right = Buffer.from(header);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function shopifyWebhookHandle(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { handle?: unknown; product?: { handle?: unknown } };
  const candidates = [record.handle, record.product?.handle];
  for (const value of candidates) {
    if (typeof value === "string" && HANDLE.test(value)) return value;
  }
  return null;
}
