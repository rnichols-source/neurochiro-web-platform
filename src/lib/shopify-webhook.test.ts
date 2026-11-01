import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { SHOPIFY_REVALIDATE_TOPICS, shopifyWebhookHandle, verifyShopifyWebhook } from "./shopify-webhook.ts";

const SECRET = "dummy-webhook-secret";

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body, "utf8").digest("base64");
}

test("hmac accepts a correctly signed body and rejects a bad one", () => {
  const body = JSON.stringify({ handle: "regulated-ish-boxy-tee" });
  assert.equal(verifyShopifyWebhook(body, sign(body), SECRET), true);
  assert.equal(verifyShopifyWebhook(body, sign(`${body} `), SECRET), false);
  assert.equal(verifyShopifyWebhook(body, "short", SECRET), false);
  assert.equal(verifyShopifyWebhook(body, null, SECRET), false);
});

test("catalog topics revalidate and a handle must be a store slug", () => {
  assert.equal(SHOPIFY_REVALIDATE_TOPICS.has("products/update"), true);
  assert.equal(SHOPIFY_REVALIDATE_TOPICS.has("inventory_levels/update"), true);
  assert.equal(SHOPIFY_REVALIDATE_TOPICS.has("orders/create"), false);
  assert.equal(shopifyWebhookHandle({ handle: "natural-raw-zip-hoodie" }), "natural-raw-zip-hoodie");
  assert.equal(shopifyWebhookHandle({ product: { handle: "vintage-corduroy-cap" } }), "vintage-corduroy-cap");
  assert.equal(shopifyWebhookHandle({ handle: "../admin" }), null);
  assert.equal(shopifyWebhookHandle({ handle: "Has Spaces" }), null);
  assert.equal(shopifyWebhookHandle(null), null);
});
