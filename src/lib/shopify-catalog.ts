import type { ShopifyMoney, ShopifyOption, ShopifyVariant } from "./shopify-types";

export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] as const;

const SIZE_RANK = new Map<string, number>(SIZE_ORDER.map((size, index) => [size, index]));
const SIZE_ALIASES: Record<string, string> = {
  XXL: "2XL",
  XXXL: "3XL",
};

export type MerchCategory = "hats" | "crewnecks" | "hoodies" | "tees" | "sweatpants" | "other";
export type MerchSort = "featured" | "price-asc" | "price-desc" | "newest";
export type StoreCategoryFilter = "all" | "hats" | "crewnecks" | "hoodies" | "tees" | "sweatpants";

const CATEGORY_LABELS: Record<MerchCategory, string> = {
  hats: "Hats",
  crewnecks: "Crewnecks",
  hoodies: "Hoodies",
  tees: "Tees",
  sweatpants: "Sweatpants",
  other: "Other",
};

export function categoryLabel(category: MerchCategory): string {
  return CATEGORY_LABELS[category];
}

const COLOR_SWATCHES: Record<string, string> = {
  navy: "#1E2D3B",
  brown: "#6B4423",
  olive: "#556B2F",
  burgundy: "#6E2430",
  camel: "#C4A574",
  black: "#131313",
  white: "#F7F7F5",
  grey: "#9CA3AF",
  gray: "#9CA3AF",
  "heather grey": "#B8B8B8",
  "dark olive": "#3E4A2E",
};

export function sortOptionValues(optionName: string, values: string[]): string[] {
  if (!/size/i.test(optionName)) return [...values];
  return values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => {
      const rankA = sizeRank(a.value);
      const rankB = sizeRank(b.value);
      if (rankA == null && rankB == null) return a.index - b.index;
      if (rankA == null) return 1;
      if (rankB == null) return -1;
      return rankA - rankB;
    })
    .map((entry) => entry.value);
}

function sizeRank(value: string): number | undefined {
  const key = value.trim().toUpperCase();
  return SIZE_RANK.get(SIZE_ALIASES[key] ?? key);
}

export function isHiddenOption(option: ShopifyOption): boolean {
  return (
    option.name.trim().toLowerCase() === "title" &&
    option.values.every((value) => value.trim().toLowerCase() === "default title")
  );
}

export function isSingleVariant(options: ShopifyOption[], fetchedVariantCount: number): boolean {
  if (options.length > 0 && options.every(isHiddenOption)) return true;
  return fetchedVariantCount <= 1;
}

function normalizedType(productType: string): string {
  return productType.trim().toLowerCase().replace(/\s+/g, " ");
}

function categoryFromType(productType: string): MerchCategory | null {
  const type = normalizedType(productType);
  if (type === "hoodie" || type === "zip hoodie") return "hoodies";
  if (type === "sweatpants") return "sweatpants";
  if (type === "crewneck") return "crewnecks";
  if (type === "hat" || type === "cap" || type === "beanie" || type === "snapback") return "hats";
  return null;
}

function genericTeeType(productType: string): boolean {
  const type = normalizedType(productType);
  return type === "t-shirt" || type === "tee" || type === "crop tee";
}

function categoryFromTitleWords(title: string): MerchCategory | null {
  const value = title.toLowerCase();
  if (/\bsweatpants?\b|\bjoggers?\b/.test(value)) return "sweatpants";
  if (/hoodie/.test(value)) return "hoodies";
  const apparel = !/crewneck|sweatshirt/.test(value);
  if (apparel && /\btees?\b|\bt-?shirts?\b|\bshirts?\b/.test(value)) return "tees";
  if (/crewneck|\bcrews?\b|sweatshirt/.test(value)) return "crewnecks";
  if (/\b(?:hat|cap|snapback|beanie|visor)s?\b/.test(value)) return "hats";
  return null;
}

export function categoryOf(product: { title: string; productType: string }): MerchCategory {
  // A specific Shopify type wins. T-SHIRT is generic in this catalog (crewnecks,
  // hoodies, and sweatpants are often typed that way), so the title decides first.
  return categoryFromType(product.productType)
    ?? categoryFromTitleWords(product.title)
    ?? (genericTeeType(product.productType) ? "tees" : "other");
}

export function categoryFromTitle(title: string): MerchCategory {
  return categoryOf({ title, productType: "" });
}

export function parseCategory(value: string | undefined): StoreCategoryFilter {
  if (
    value === "hats" ||
    value === "crewnecks" ||
    value === "hoodies" ||
    value === "tees" ||
    value === "sweatpants"
  ) {
    return value;
  }
  return "all";
}

export function parseSort(value: string | undefined): MerchSort {
  if (value === "price-asc" || value === "price-desc" || value === "newest" || value === "featured") {
    return value;
  }
  return "featured";
}

export function formatMoney(amount: string, currencyCode: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  const whole = Number.isInteger(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function sameMoney(a: ShopifyMoney, b: ShopifyMoney): boolean {
  return a.currencyCode === b.currencyCode && Number(a.amount) === Number(b.amount);
}

export function formatPriceRange(min: ShopifyMoney, max: ShopifyMoney): string {
  if (!sameMoney(min, max)) return `From ${formatMoney(min.amount, min.currencyCode)}`;
  return formatMoney(min.amount, min.currencyCode);
}

export function variantNumericId(gid: string): string {
  const match = gid.match(/ProductVariant\/(\d+)/);
  return match?.[1] ?? gid;
}

export function imageAlt(title: string, index: number, color?: string | null): string {
  if (color && color.trim().toLowerCase() !== "default title") return `${title}, ${color}`;
  return `${title}, view ${index}`;
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, "")
    .replace(/\s(href|src)\s*=\s*javascript:[^\s>]*/gi, "");
}

export function plainText(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncate(value: string, max = 155): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

export function isNewProduct(createdAt: string, now = Date.now()): boolean {
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created)) return false;
  const age = now - created;
  return age >= 0 && age < 30 * 24 * 60 * 60 * 1000;
}

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(10, Math.max(1, Math.floor(quantity)));
}

export function findVariant<T extends { selectedOptions: { name: string; value: string }[] }>(
  variants: T[],
  selected: Record<string, string>,
): T | undefined {
  return variants.find((variant) =>
    variant.selectedOptions.every((option) => selected[option.name] === option.value),
  );
}

export function isOptionValueAvailable(
  variants: ShopifyVariant[],
  optionName: string,
  value: string,
  selected: Record<string, string>,
): boolean {
  return variants.some(
    (variant) =>
      variant.availableForSale &&
      variant.selectedOptions.every((option) => {
        if (option.name === optionName) return option.value === value;
        if (selected[option.name] == null) return true;
        return selected[option.name] === option.value;
      }),
  );
}

export function selectionPrompt(options: ShopifyOption[], selected: Record<string, string>): string | null {
  for (const option of options) {
    if (isHiddenOption(option)) continue;
    if (selected[option.name]) continue;
    if (/size/i.test(option.name)) return "Select a size";
    if (/colou?r/i.test(option.name)) return "Select a color";
    return `Select a ${option.name.toLowerCase()}`;
  }
  return null;
}

export function colorSwatch(value: string): string | null {
  const key = value.trim().toLowerCase();
  if (COLOR_SWATCHES[key]) return COLOR_SWATCHES[key];
  const first = key.split("/")[0]?.trim();
  if (first && COLOR_SWATCHES[first]) return COLOR_SWATCHES[first];
  return null;
}

export function isQuickAddProduct(options: ShopifyOption[], fetchedVariantCount: number, defaultVariantId: string | null): boolean {
  return Boolean(defaultVariantId) && isSingleVariant(options, fetchedVariantCount);
}
