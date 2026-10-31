import assert from "node:assert/strict";
import { test } from "node:test";
import { STORE_PRODUCTS } from "../app/(public)/store/store-data.ts";
import { LEGACY_STORE_PRODUCT_IDS } from "./legacy-store-ids.ts";
import {
  categoryFromTitle,
  clampQuantity,
  findVariant,
  formatPriceRange,
  isOptionValueAvailable,
  sanitizeHtml,
  selectionPrompt,
  sortOptionValues,
  variantNumericId,
} from "./shopify-catalog.ts";
import type { ShopifyVariant } from "./shopify-types.ts";

test("legacy store ids match the digital catalog", () => {
  assert.deepEqual(
    [...LEGACY_STORE_PRODUCT_IDS].sort(),
    STORE_PRODUCTS.map((product) => product.id).sort(),
  );
});

test("sizes sort from the Shopify option order into XS through 5XL", () => {
  assert.deepEqual(sortOptionValues("Size", ["M", "L", "XL", "2XL", "3XL", "S"]), [
    "S",
    "M",
    "L",
    "XL",
    "2XL",
    "3XL",
  ]);
  assert.deepEqual(sortOptionValues("Color", ["Navy", "Brown", "Olive"]), ["Navy", "Brown", "Olive"]);
});

test("title categories cover hats and crewnecks", () => {
  assert.equal(categoryFromTitle("Atlas Social Club Crewneck"), "crewnecks");
  assert.equal(categoryFromTitle("Wired Different 3D Puff Snapback"), "hats");
  assert.equal(categoryFromTitle("NeuroChiro Corduroy Logo Cap - Camel"), "hats");
  assert.equal(categoryFromTitle("Clinic Poster"), "other");
});

test("price range uses From when variant prices differ", () => {
  assert.equal(
    formatPriceRange({ amount: "45.0", currencyCode: "USD" }, { amount: "50.0", currencyCode: "USD" }),
    "From $45",
  );
  assert.equal(
    formatPriceRange({ amount: "40.0", currencyCode: "USD" }, { amount: "40.00", currencyCode: "USD" }),
    "$40",
  );
});

test("sanitizer strips scripts, frames, and event handlers", () => {
  const clean = sanitizeHtml(
    `<p onclick="alert(1)" onmouseover='x'>Hi</p><script>alert(1)</script><iframe src="https://evil.test"></iframe><a href="javascript:alert(1)">x</a>`,
  );
  assert.equal(clean.includes("script"), false);
  assert.equal(clean.includes("iframe"), false);
  assert.equal(clean.includes("onclick"), false);
  assert.equal(clean.includes("javascript:"), false);
  assert.equal(clean.includes("<p>Hi</p>"), true);
});

test("variant selection and sold-out combinations", () => {
  const variants: ShopifyVariant[] = [
    variant("1", "S", "45.0", true),
    variant("2", "2XL", "50.0", true),
    variant("3", "3XL", "50.0", false),
  ];
  assert.equal(findVariant(variants, { Size: "2XL" })?.numericId, "2");
  assert.equal(isOptionValueAvailable(variants, "Size", "S", {}), true);
  assert.equal(isOptionValueAvailable(variants, "Size", "3XL", {}), false);
  assert.equal(selectionPrompt([{ name: "Size", values: ["S", "M"] }], {}), "Select a size");
  assert.equal(selectionPrompt([{ name: "Size", values: ["S"] }], { Size: "S" }), null);
  assert.equal(variantNumericId("gid://shopify/ProductVariant/99"), "99");
  assert.equal(clampQuantity(0), 1);
  assert.equal(clampQuantity(12), 10);
});

function variant(id: string, size: string, amount: string, availableForSale: boolean): ShopifyVariant {
  return {
    id: `gid://shopify/ProductVariant/${id}`,
    numericId: id,
    title: size,
    availableForSale,
    sku: null,
    price: { amount, currencyCode: "USD" },
    selectedOptions: [{ name: "Size", value: size }],
    imageId: null,
    imageUrl: null,
  };
}
