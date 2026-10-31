"use server";

import { cookies } from "next/headers";
import { clampQuantity } from "@/lib/shopify-catalog";
import { addToCart, createCart, getCart, isShopifyConfigured, removeFromCart, updateCartLines } from "@/lib/shopify";
import type { CartActionResult } from "@/lib/shopify-types";

const CART_COOKIE = "nc_cart";
const HINT_COOKIE = "nc_cart_hint";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function cookieBase() {
  return {
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  };
}

async function rememberCart(id: string) {
  const jar = await cookies();
  jar.set(CART_COOKIE, id, { ...cookieBase(), httpOnly: true });
  jar.set(HINT_COOKIE, "1", { ...cookieBase(), httpOnly: false });
}

async function forgetCart() {
  const jar = await cookies();
  jar.delete({ name: CART_COOKIE, path: "/" });
  jar.delete({ name: HINT_COOKIE, path: "/" });
}

export async function getCartAction(): Promise<CartActionResult> {
  if (!isShopifyConfigured()) return { ok: true, cart: null };
  const jar = await cookies();
  const id = jar.get(CART_COOKIE)?.value;
  if (!id) return { ok: true, cart: null };
  const result = await getCart(id);
  if (!result.ok) return { ok: false, cart: null, error: "The cart is taking a moment. Try again." };
  if (!result.cart) {
    await forgetCart();
    return { ok: true, cart: null };
  }
  return { ok: true, cart: result.cart };
}

export async function addLine(merchandiseId: string, quantity: number): Promise<CartActionResult> {
  if (!isShopifyConfigured()) {
    return { ok: false, cart: null, error: "The NeuroChiro merch store is restocking. Check back soon." };
  }
  if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(merchandiseId)) {
    return { ok: false, cart: null, error: "Choose a product option first." };
  }
  const qty = clampQuantity(quantity);
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;

  if (existing) {
    const updated = await addToCart(existing, [{ merchandiseId, quantity: qty }]);
    if (updated.ok && updated.userErrors.length === 0 && updated.cart) {
      await rememberCart(updated.cart.id);
      return { ok: true, cart: updated.cart };
    }
    if (updated.ok && updated.userErrors.length > 0) {
      return { ok: false, cart: updated.cart, error: updated.userErrors.join(" ") };
    }
    if (updated.ok && !updated.cart) await forgetCart();
    else if (!updated.ok) return { ok: false, cart: null, error: "Could not add that item. Try again." };
  }

  const created = await createCart([{ merchandiseId, quantity: qty }]);
  if (!created.ok) return { ok: false, cart: null, error: "Could not add that item. Try again." };
  if (created.userErrors.length > 0 || !created.cart) {
    return {
      ok: false,
      cart: created.cart,
      error: created.userErrors.join(" ") || "Could not add that item. Try again.",
    };
  }
  await rememberCart(created.cart.id);
  return { ok: true, cart: created.cart };
}

export async function updateLine(lineId: string, quantity: number): Promise<CartActionResult> {
  if (!isShopifyConfigured()) return { ok: false, cart: null, error: "The cart is unavailable." };
  if (!lineId.startsWith("gid://shopify/CartLine/")) {
    return { ok: false, cart: null, error: "That cart item is no longer available." };
  }
  const jar = await cookies();
  const id = jar.get(CART_COOKIE)?.value;
  if (!id) return { ok: true, cart: null };
  const qty = clampQuantity(quantity);
  const updated = await updateCartLines(id, [{ id: lineId, quantity: qty }]);
  if (!updated.ok) return { ok: false, cart: null, error: "Could not update the cart. Try again." };
  if (updated.userErrors.length > 0) return { ok: false, cart: updated.cart, error: updated.userErrors.join(" ") };
  if (!updated.cart) {
    await forgetCart();
    return { ok: true, cart: null };
  }
  await rememberCart(updated.cart.id);
  return { ok: true, cart: updated.cart };
}

export async function removeLine(lineId: string): Promise<CartActionResult> {
  if (!isShopifyConfigured()) return { ok: false, cart: null, error: "The cart is unavailable." };
  if (!lineId.startsWith("gid://shopify/CartLine/")) {
    return { ok: false, cart: null, error: "That cart item is no longer available." };
  }
  const jar = await cookies();
  const id = jar.get(CART_COOKIE)?.value;
  if (!id) return { ok: true, cart: null };
  const updated = await removeFromCart(id, [lineId]);
  if (!updated.ok) return { ok: false, cart: null, error: "Could not update the cart. Try again." };
  if (updated.userErrors.length > 0) return { ok: false, cart: updated.cart, error: updated.userErrors.join(" ") };
  if (!updated.cart) {
    await forgetCart();
    return { ok: true, cart: null };
  }
  await rememberCart(updated.cart.id);
  return { ok: true, cart: updated.cart };
}
