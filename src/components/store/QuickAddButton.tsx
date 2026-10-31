"use client";

import { useShopifyCart } from "./ShopifyCartProvider";

export function QuickAddButton({ variantId, available }: { variantId: string; available: boolean }) {
  const { addItem, isPending } = useShopifyCart();
  return (
    <button
      type="button"
      disabled={!available || isPending}
      onClick={() => addItem(variantId, 1)}
      className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-neuro-orange px-4 text-base font-bold text-white hover:bg-[#B8551F] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-navy focus-visible:ring-offset-2"
    >
      {available ? "Quick add" : "Sold out"}
    </button>
  );
}
