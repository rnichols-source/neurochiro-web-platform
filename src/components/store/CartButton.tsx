"use client";

import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useShopifyCart } from "./ShopifyCartProvider";

export function CartButton() {
  const pathname = usePathname();
  const { configured, cart, openCart } = useShopifyCart();
  if (!configured) return null;

  const quantity = cart?.totalQuantity ?? 0;
  const onStore = pathname === "/store" || pathname.startsWith("/store/");
  if (quantity === 0 && !onStore) return null;

  return (
    <button
      type="button"
      aria-label={`Open cart, ${quantity} items`}
      onClick={(event) => openCart(event.currentTarget)}
      className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-white hover:text-neuro-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange"
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {quantity > 0 ? (
        <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-neuro-orange px-1 text-[11px] font-bold leading-none text-white">
          {quantity}
        </span>
      ) : null}
    </button>
  );
}
