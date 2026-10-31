"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  colorSwatch,
  findVariant,
  formatMoney,
  formatPriceRange,
  isHiddenOption,
  isOptionValueAvailable,
  sanitizeHtml,
  selectionPrompt,
} from "@/lib/shopify-catalog";
import type { ShopifyProduct } from "@/lib/shopify-types";
import { useShopifyCart } from "./ShopifyCartProvider";

export function ProductInteractive({
  product,
  hatCopy,
}: {
  product: ShopifyProduct;
  hatCopy: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { addItem, isPending, error } = useShopifyCart();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(false);
  const scrollTimer = useRef<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial = product.variants.length === 1 ? product.variants[0] : undefined;
    if (!initial) return {};
    return Object.fromEntries(initial.selectedOptions.map((option) => [option.name, option.value]));
  });

  useEffect(() => {
    const variantId = new URL(window.location.href).searchParams.get("variant");
    if (!variantId) return;
    const match = product.variants.find((variant) => variant.numericId === variantId);
    if (!match) return;
    setSelected(Object.fromEntries(match.selectedOptions.map((option) => [option.name, option.value])));
  }, [product.variants]);

  const activeVariant = useMemo(() => {
    const visible = product.options.filter((option) => !isHiddenOption(option));
    if (visible.some((option) => !selected[option.name])) return product.variants.length === 1 ? product.variants[0] : null;
    return findVariant(product.variants, selected) ?? null;
  }, [product, selected]);

  const variantImageIndex = activeVariant?.imageId
    ? product.images.findIndex((image) => image.id === activeVariant.imageId)
    : -1;
  const imageIndex = manualIndex ?? (variantImageIndex >= 0 ? variantImageIndex : 0);
  const prompt = selectionPrompt(product.options, selected);
  const nothingToBuy = product.variants.length > 0 && product.variants.every((variant) => !variant.availableForSale);
  const soldOut = nothingToBuy || (activeVariant != null && !activeVariant.availableForSale);
  const label = soldOut ? "Sold out" : prompt ?? (isPending ? "Adding…" : "Add to cart");
  const disabled = soldOut || Boolean(prompt) || isPending;
  const price = activeVariant
    ? formatMoney(activeVariant.price.amount, activeVariant.price.currencyCode)
    : formatPriceRange(product.minPrice, product.maxPrice);
  const descriptionHtml = product.descriptionHtml.trim()
    ? sanitizeHtml(product.descriptionHtml)
    : "";

  function revealImage(index: number) {
    setManualIndex(index);
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const target = index * scroller.clientWidth;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (Math.abs(scroller.scrollLeft - target) < 2) return;
    programmaticScroll.current = true;
    scroller.scrollTo({ left: target, behavior: reduce ? "auto" : "smooth" });
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      programmaticScroll.current = false;
    }, reduce ? 0 : 450);
  }

  useEffect(() => {
    if (!activeVariant?.imageId) return;
    const index = product.images.findIndex((image) => image.id === activeVariant.imageId);
    if (index >= 0) revealImage(index);
  }, [activeVariant?.id, activeVariant?.imageId, product.images]);

  useEffect(() => {
    if (!activeVariant) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("variant") === activeVariant.numericId) return;
    url.searchParams.set("variant", activeVariant.numericId);
    router.replace(`${pathname}?${url.searchParams.toString()}`, { scroll: false });
  }, [activeVariant, pathname, router]);

  function choose(name: string, value: string) {
    setSelected((current) => {
      const next = { ...current, [name]: value };
      const matches = product.variants.some((variant) =>
        variant.selectedOptions.every((option) => next[option.name] == null || next[option.name] === option.value),
      );
      if (matches) return next;
      return { [name]: value };
    });
    const matched = product.variants.find((variant) =>
      variant.selectedOptions.every((option) => option.name !== name ? true : option.value === value) &&
      variant.imageId,
    );
    if (matched?.imageId) {
      const index = product.images.findIndex((image) => image.id === matched.imageId);
      if (index >= 0) revealImage(index);
    }
  }

  const addButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (activeVariant) addItem(activeVariant.id, quantity);
      }}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-neuro-orange px-6 text-base font-bold text-white hover:bg-[#B8551F] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-navy focus-visible:ring-offset-2"
    >
      {label}
    </button>
  );

  return (
    <div className="grid items-start gap-10 lg:grid-cols-2">
      <div>
        {product.images.length > 0 ? (
          <div
            ref={scrollerRef}
            role="region"
            aria-label="Product images"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") revealImage(Math.min(product.images.length - 1, imageIndex + 1));
              if (event.key === "ArrowLeft") revealImage(Math.max(0, imageIndex - 1));
            }}
            onScroll={(event) => {
              if (programmaticScroll.current) {
                const width = event.currentTarget.clientWidth;
                if (!width) return;
                const next = Math.round(event.currentTarget.scrollLeft / width);
                if (manualIndex != null && next === manualIndex) programmaticScroll.current = false;
                return;
              }
              const width = event.currentTarget.clientWidth;
              if (!width) return;
              const next = Math.round(event.currentTarget.scrollLeft / width);
              setManualIndex((current) => (current === next ? current : next));
            }}
            className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange"
          >
            {product.images.map((image, index) => (
              <div key={`${image.id ?? image.url}-${index}`} className="relative aspect-square w-full shrink-0 snap-center bg-white">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-2xl bg-neuro-navy p-8 text-center font-heading text-2xl font-black text-neuro-cream">
            {product.title}
          </div>
        )}
        {product.thumbs.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {product.thumbs.map((thumb, index) => (
              <button
                key={`${thumb.id ?? thumb.url}-${index}`}
                type="button"
                aria-label={product.images[index]?.alt ?? `Show image ${index + 1}`}
                aria-current={index === imageIndex}
                onClick={() => revealImage(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange ${
                  index === imageIndex ? "border-neuro-navy" : "border-transparent"
                }`}
              >
                <Image src={thumb.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <h1 className="font-heading text-3xl font-black leading-tight text-neuro-navy md:text-5xl">{product.title}</h1>
        <p className="mt-4 text-2xl font-bold text-neuro-black" aria-live="polite">
          {price}
        </p>

        <div className="mt-6 space-y-5">
          {product.options.filter((option) => !isHiddenOption(option)).map((option) => {
            const isColor = /colou?r/i.test(option.name);
            return (
              <fieldset key={option.name}>
                <legend className="text-sm font-bold uppercase tracking-wide text-neuro-gray">{option.name}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {option.values.map((value) => {
                    const available = isOptionValueAvailable(product.variants, option.name, value, selected);
                    const checked = selected[option.name] === value;
                    const swatch = isColor ? colorSwatch(value) : null;
                    return (
                      <label
                        key={value}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-base font-bold focus-within:ring-2 focus-within:ring-neuro-orange ${
                          checked ? "border-neuro-navy bg-neuro-navy text-white" : "border-neuro-navy/15 bg-white text-neuro-navy"
                        } ${available ? "cursor-pointer" : "cursor-not-allowed opacity-40 line-through"}`}
                      >
                        <input
                          type="radio"
                          name={option.name}
                          value={value}
                          checked={checked}
                          disabled={!available}
                          onChange={() => choose(option.name, value)}
                          className="sr-only"
                        />
                        {swatch ? (
                          <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: swatch }} aria-hidden="true" />
                        ) : null}
                        {value}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span className="text-sm font-bold uppercase tracking-wide text-neuro-gray">Quantity</span>
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="min-h-11 min-w-11 rounded-full border border-neuro-navy/15 text-lg font-bold disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-6 text-center font-bold" aria-live="polite">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= 10}
            onClick={() => setQuantity((current) => Math.min(10, current + 1))}
            className="min-h-11 min-w-11 rounded-full border border-neuro-navy/15 text-lg font-bold disabled:opacity-40"
          >
            +
          </button>
        </div>

        <div className="mt-6 hidden md:block">{addButton}</div>
        {error ? <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
        {hatCopy ? <p className="mt-4 text-sm leading-relaxed text-neuro-gray">One size, snap-adjustable. Fits most noggins.</p> : null}
        <p className="mt-2 text-sm leading-relaxed text-neuro-gray">Made to order just for you. Ships in 3–7 business days.</p>

        {descriptionHtml ? (
          <div
            className="mt-8 text-base leading-relaxed text-neuro-gray [&_a]:font-semibold [&_a]:text-neuro-navy [&_a]:underline [&_h2]:mb-2 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-neuro-navy [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_strong]:text-neuro-black"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        ) : product.description ? (
          <p className="mt-8 text-base leading-relaxed text-neuro-gray">{product.description}</p>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white px-4 py-3 md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <p className="min-w-20 text-base font-bold text-neuro-black">{price}</p>
          <div className="flex-1">{addButton}</div>
        </div>
      </div>
    </div>
  );
}
