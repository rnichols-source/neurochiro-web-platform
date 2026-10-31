"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/shopify-catalog";
import { useShopifyCart } from "./ShopifyCartProvider";

export function CartDrawer() {
  const { configured, cart, isOpen, isPending, error, closeCart, updateItem, removeItem } = useShopifyCart();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCart();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeCart]);

  if (!configured || !isOpen) return null;

  const lines = cart?.lines ?? [];
  const subtotal = cart ? formatMoney(cart.subtotal.amount, cart.subtotal.currencyCode) : formatMoney("0", "USD");

  return (
    <div className="fixed inset-0 z-[250]">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-neuro-navy/50"
        onClick={closeCart}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2 id="cart-title" className="font-heading text-xl font-black text-neuro-navy">
            Your cart
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            className="min-h-11 min-w-11 rounded-full text-sm font-bold text-neuro-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-base text-neuro-gray">Your cart is empty.</p>
              <Link
                href="/store#shop"
                onClick={closeCart}
                className="mt-6 inline-flex min-h-11 items-center text-base font-bold text-neuro-orange underline-offset-4 hover:underline"
              >
                Shop the merch
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neuro-cream">
                    {line.imageUrl ? (
                      <Image src={line.imageUrl} alt={line.imageAlt} fill sizes="80px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/store/${line.handle}`} onClick={closeCart} className="font-heading text-sm font-bold text-neuro-navy hover:text-neuro-orange">
                      {line.title}
                    </Link>
                    {line.options.length > 0 ? (
                      <p className="mt-1 text-sm text-neuro-gray">
                        {line.options.map((option) => `${option.name}: ${option.value}`).join(" · ")}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm font-semibold text-neuro-black">
                      {formatMoney(line.lineTotal.amount, line.lineTotal.currencyCode)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${line.title}`}
                        disabled={isPending || line.quantity <= 1}
                        onClick={() => updateItem(line.id, line.quantity - 1)}
                        className="min-h-11 min-w-11 rounded-full border border-neuro-navy/15 text-lg font-bold text-neuro-navy disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm font-bold" aria-live="polite">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${line.title}`}
                        disabled={isPending || line.quantity >= 10}
                        onClick={() => updateItem(line.id, line.quantity + 1)}
                        className="min-h-11 min-w-11 rounded-full border border-neuro-navy/15 text-lg font-bold text-neuro-navy disabled:opacity-40"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(line.id)}
                        disabled={isPending}
                        className="ml-auto min-h-11 px-2 text-sm font-bold text-neuro-gray underline-offset-2 hover:text-neuro-navy hover:underline disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error ? (
            <p role="alert" className="mt-4 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="border-t border-black/10 px-5 py-5">
          <div className="flex items-center justify-between text-base">
            <span className="font-bold text-neuro-navy">Subtotal</span>
            <span className="font-bold text-neuro-black">{subtotal}</span>
          </div>
          <p className="mt-2 text-sm text-neuro-gray">Taxes and shipping calculated at checkout.</p>
          <button
            type="button"
            disabled={!cart?.checkoutUrl || lines.length === 0}
            onClick={() => {
              if (cart?.checkoutUrl) window.location.href = cart.checkoutUrl;
            }}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-neuro-orange px-6 text-base font-bold text-white hover:bg-[#B8551F] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-navy focus-visible:ring-offset-2"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
