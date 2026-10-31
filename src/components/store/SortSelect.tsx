"use client";

import { useRouter } from "next/navigation";
import type { MerchSort, StoreCategoryFilter } from "@/lib/shopify-catalog";

export function SortSelect({ category, sort }: { category: StoreCategoryFilter; sort: MerchSort }) {
  const router = useRouter();
  return (
    <label className="block text-sm font-bold text-neuro-gray">
      <span className="sr-only">Sort products</span>
      <select
        value={sort}
        aria-label="Sort products"
        onChange={(event) => {
          const next = event.target.value;
          const params = new URLSearchParams();
          if (category !== "all") params.set("category", category);
          if (next !== "featured") params.set("sort", next);
          const query = params.toString();
          router.push(query ? `/store?${query}#shop` : "/store#shop");
        }}
        className="min-h-11 rounded-full border border-neuro-navy/15 bg-white px-4 text-base font-semibold text-neuro-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange"
      >
        <option value="featured">Featured</option>
        <option value="price-asc">Price: Low to high</option>
        <option value="price-desc">Price: High to low</option>
        <option value="newest">Newest</option>
      </select>
    </label>
  );
}
