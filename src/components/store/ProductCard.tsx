import Image from "next/image";
import Link from "next/link";
import { formatPriceRange, isNewProduct, isQuickAddProduct } from "@/lib/shopify-catalog";
import type { ShopifyProductCard } from "@/lib/shopify-types";
import { QuickAddButton } from "./QuickAddButton";

export function ProductCard({ product }: { product: ShopifyProductCard }) {
  const primary = product.images[0];
  const secondary = product.images[1];
  const quickAdd = isQuickAddProduct(product.options, product.fetchedVariantCount, product.defaultVariantId);
  const isNew = isNewProduct(product.createdAt);

  return (
    <article className="flex h-full flex-col">
      <Link
        href={`/store/${product.handle}`}
        className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange focus-visible:ring-offset-2"
      >
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
          {primary ? (
            <Image
              src={primary.url}
              alt={primary.alt}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-neuro-navy" />
          )}
          {secondary ? (
            <Image
              src={secondary.url}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="hidden object-cover opacity-0 motion-reduce:transition-none md:block md:transition-opacity md:duration-300 md:group-hover:opacity-100"
            />
          ) : null}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {!product.availableForSale ? (
              <span className="rounded-full bg-neuro-navy px-3 py-1 text-xs font-bold text-white">Sold out</span>
            ) : null}
            {isNew ? (
              <span className="rounded-full bg-neuro-orange px-3 py-1 text-xs font-bold text-white">New</span>
            ) : null}
          </div>
        </div>
        <h2 className="mt-3 line-clamp-2 font-heading text-base font-bold text-neuro-navy group-hover:text-neuro-orange">
          {product.title}
        </h2>
        <p className="mt-1 text-sm font-semibold text-neuro-gray">
          {formatPriceRange(product.minPrice, product.maxPrice)}
        </p>
      </Link>
      {quickAdd && product.defaultVariantId ? (
        <QuickAddButton variantId={product.defaultVariantId} available={product.availableForSale} />
      ) : null}
    </article>
  );
}
