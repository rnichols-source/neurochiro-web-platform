"use client";

import { useEffect, useRef } from "react";
import { ShoppingCart, Trash2, X, ArrowRight, Sparkles } from "lucide-react";
import { useCart, getBundleSuggestions, type CartItem } from "./cart-context";
import { STORE_PRODUCTS } from "./store-data";
import { createCartCheckout } from "./cart-actions";

function formatPrice(cents: number): string {
  return "$" + (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    addItem,
    clearCart,
    subtotal,
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);
  const suggestions = getBundleSuggestions(items);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, closeCart]);

  function handleApplyBundle(suggestion: (typeof suggestions)[0]) {
    const bundle = STORE_PRODUCTS.find((p) => p.id === suggestion.bundleId);
    if (!bundle) return;

    // Remove individual items that are part of the bundle
    for (const id of suggestion.matchingItemIds) {
      removeItem(id);
    }

    // Add the bundle
    addItem({
      productId: bundle.id,
      name: bundle.name,
      retailPrice: bundle.retailPrice,
      billing: bundle.billing,
    });
  }

  async function handleCheckout() {
    if (items.length === 0) return;

    const result = await createCartCheckout(
      items.map((i) => ({
        productId: i.productId,
        name: i.name,
        retailPrice: i.retailPrice,
        billing: i.billing,
      }))
    );

    if (result.url) {
      window.location.href = result.url;
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-[#1a2744]" />
            <h2 className="text-lg font-black text-[#1a2744]">Your Cart</h2>
            {items.length > 0 && (
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#e97325] text-white text-xs font-bold">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <ShoppingCart className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500 text-lg font-semibold">
                Your cart is empty
              </p>
              <a
                href="/store"
                onClick={closeCart}
                className="inline-flex items-center gap-2 text-[#e97325] font-semibold hover:underline"
              >
                Browse the store
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Item list */}
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-start justify-between gap-3 bg-gray-50 rounded-2xl p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a2744] text-sm leading-tight truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatPrice(item.retailPrice)}
                      {item.billing === "monthly" && (
                        <span className="text-xs text-gray-400"> /mo</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Bundle suggestions */}
              {suggestions.map((s) => (
                <div
                  key={s.bundleId}
                  className="bg-[#e97325]/10 border border-[#e97325]/30 rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#e97325]" />
                    <p className="text-sm font-bold text-[#e97325]">
                      Save {formatPrice(s.savings)}
                    </p>
                  </div>
                  <p className="text-sm text-[#1a2744]">
                    Switch to the{" "}
                    <span className="font-semibold">{s.bundleName}</span> and
                    pay {formatPrice(s.bundlePrice)} instead of{" "}
                    {formatPrice(s.currentTotal)}.
                  </p>
                  <button
                    onClick={() => handleApplyBundle(s)}
                    className="w-full mt-1 py-2 px-4 rounded-xl bg-[#e97325] text-white text-sm font-bold hover:bg-[#d4651e] transition-colors"
                  >
                    Switch to the bundle
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-lg font-black text-[#1a2744]">
                {formatPrice(subtotal)}
              </span>
            </div>

            {/* Checkout */}
            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#e97325] text-white font-bold text-base hover:bg-[#d4651e] transition-colors"
            >
              Checkout
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Continue Shopping */}
            <button
              onClick={closeCart}
              className="w-full text-center text-sm text-gray-500 hover:text-[#1a2744] transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// Cart Toggle Button — drop this into the store header / nav
// ============================================================================

export function CartToggleButton() {
  const { toggleCart, items } = useCart();

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-5 w-5 text-[#1a2744]" />
      {items.length > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#e97325] text-white text-[10px] font-bold">
          {items.length}
        </span>
      )}
    </button>
  );
}
