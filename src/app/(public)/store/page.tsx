import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/landing/Footer";
import { JsonLd } from "@/components/store/JsonLd";
import { ProductCard } from "@/components/store/ProductCard";
import { SortSelect } from "@/components/store/SortSelect";
import { StoreFallback } from "@/components/store/StoreFallback";
import { categoryFromTitle, parseCategory, parseSort, type MerchSort, type StoreCategoryFilter } from "@/lib/shopify-catalog";
import { getCollectionProducts, getCollections, getProducts } from "@/lib/shopify";
import { publicStoreImage } from "@/lib/store-assets";
import type { ShopifyProductCard } from "@/lib/shopify-types";

export const revalidate = 60;

const SITE = "https://www.neurochiro.co";

type StorePageProps = {
  searchParams: Promise<{ category?: string; sort?: string }>;
};

export async function generateMetadata({ searchParams }: StorePageProps): Promise<Metadata> {
  const params = await searchParams;
  const category = parseCategory(params.category);
  const sortValue = params.sort;
  const canonical = sortValue
    ? `${SITE}/store`
    : category === "all"
      ? `${SITE}/store`
      : `${SITE}/store?category=${category}`;
  const hero = publicStoreImage("heroDesktop");
  const image = hero ?? "/og-default.png";
  const title = "NeuroChiro Merch Store | Hats & Crewnecks";
  const description = "Streetwear for nervous-system chiropractors and the people they keep in alignment. Hats, crewnecks, and more from neurochiro.co.";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

function chipHref(category: StoreCategoryFilter, sort: MerchSort): string {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (sort !== "featured") params.set("sort", sort);
  const query = params.toString();
  return query ? `/store?${query}#shop` : "/store#shop";
}

async function productsForCategory(all: ShopifyProductCard[], category: StoreCategoryFilter, sort: MerchSort) {
  if (category === "all") return all;
  const collections = await getCollections();
  const collectionReady = collections.ok && collections.collections.some((collection) => collection.handle === category && collection.hasProducts);
  if (collectionReady) {
    const collection = await getCollectionProducts(category, sort);
    if (collection.ok && !collection.missing) return collection.products;
  }
  return all.filter((product) => categoryFromTitle(product.title) === category);
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const params = await searchParams;
  const category = parseCategory(params.category);
  const sort = parseSort(params.sort);
  const catalog = await getProducts({ first: 50, sort });
  if (!catalog.ok || catalog.products.length === 0) return <StoreFallback />;

  const products = await productsForCategory(catalog.products, category, sort);
  const heroDesktop = publicStoreImage("heroDesktop");
  const heroMobile = publicStoreImage("heroMobile");
  const corduroyImage = publicStoreImage("corduroy");
  const flatlayImage = publicStoreImage("flatlay");
  const fallbackImage = catalog.products[0]?.images[0]?.url ?? null;
  const corduroyHref = catalog.products.some((product) => product.handle === "vintage-corduroy-cap")
    ? "/store/vintage-corduroy-cap"
    : "/store?category=hats#shop";

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: `${SITE}/store/${product.handle}`,
    })),
  };

  return (
    <div className="bg-neuro-cream text-neuro-black">
      <JsonLd data={itemList} />
      <section className="relative isolate min-h-[520px] overflow-hidden bg-neuro-navy md:min-h-[420px]">
        {heroMobile ? (
          <Image src={heroMobile} alt="" fill priority sizes="100vw" className="object-cover md:hidden" />
        ) : fallbackImage ? (
          <Image src={fallbackImage} alt="" fill priority sizes="100vw" className="object-cover md:hidden" />
        ) : null}
        {heroDesktop ? (
          <Image src={heroDesktop} alt="" fill priority sizes="100vw" className="hidden object-cover md:block" />
        ) : fallbackImage ? (
          <Image src={fallbackImage} alt="" fill priority sizes="100vw" className="hidden object-cover md:block" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-neuro-navy/85 via-neuro-navy/55 to-neuro-navy/25" />
        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-7xl flex-col justify-end px-6 pb-12 pt-32 md:min-h-[420px] md:justify-center md:px-8 md:pb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neuro-orange">NeuroChiro merch</p>
          <h1 className="mt-3 max-w-xl font-heading text-5xl font-black leading-none text-neuro-cream md:text-7xl">Spine to Win.</h1>
          <p className="mt-4 max-w-md text-base font-medium text-neuro-cream md:hidden">Merch for chiros and the patients who love them.</p>
          <p className="mt-4 hidden max-w-xl text-lg font-medium text-neuro-cream md:block">
            Streetwear for nervous-system chiropractors and the people they keep in alignment.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/store?category=hats#shop"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-neuro-orange px-6 text-base font-bold text-white hover:bg-[#B8551F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neuro-navy"
            >
              Shop the Hats
            </Link>
            <Link href="/store?category=crewnecks#shop" className="inline-flex min-h-12 items-center text-base font-bold text-neuro-cream underline-offset-4 hover:underline">
              Shop Crewnecks
            </Link>
          </div>
        </div>
      </section>

      <section id="shop" className="scroll-mt-28 mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2" role="navigation" aria-label="Product categories">
            {([
              ["all", "All"],
              ["hats", "Hats"],
              ["crewnecks", "Crewnecks"],
            ] as const).map(([id, label]) => {
              const active = category === id;
              return (
                <Link
                  key={id}
                  href={chipHref(id, sort)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full px-5 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange ${
                    active ? "bg-neuro-navy text-white" : "bg-white text-neuro-navy"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <SortSelect category={category} sort={sort} />
        </div>

        {products.length === 0 ? (
          <p className="mt-10 text-base text-neuro-gray">
            Nothing in this category yet.{" "}
            <Link href="/store#shop" className="font-bold text-neuro-navy underline-offset-4 hover:underline">
              View all merch
            </Link>
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-12 md:px-8 lg:grid-cols-2">
        <PromoBand
          image={corduroyImage}
          fallback={fallbackImage}
          eyebrow="Corduroy caps"
          title="Fall Into Alignment"
          body="Our brain-and-spine logo, embroidered on soft corduroy caps."
          href={corduroyHref}
          cta="Shop Corduroy"
        />
        <PromoBand
          image={flatlayImage}
          fallback={fallbackImage}
          eyebrow="The brand"
          title="Built on the Brain–Spine Connection"
          body="NeuroChiro is the global directory for nervous-system-based chiropractors. This merch is for those chiropractors and their patients. Wear it to the clinic, the gym, or anywhere else."
          href="/directory"
          cta="Find a NeuroChiro"
        />
      </section>

      <section className="border-y border-black/5 bg-white">
        <ul className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm font-semibold text-neuro-gray sm:flex-row sm:justify-center sm:gap-10 md:px-8">
          <li>Made to order. Ships in 3–7 business days.</li>
          <li>Secure checkout by Shopify.</li>
        </ul>
      </section>
      <Footer />
    </div>
  );
}

function PromoBand({
  image,
  fallback,
  eyebrow,
  title,
  body,
  href,
  cta,
}: {
  image: string | null;
  fallback: string | null;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  const src = image ?? fallback;
  return (
    <article className="relative isolate min-h-[420px] overflow-hidden rounded-2xl bg-neuro-navy">
      {src ? <Image src={src} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" /> : null}
      <div className="absolute inset-0 bg-neuro-navy/55" />
      <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-end p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neuro-orange">{eyebrow}</p>
        <h2 className="mt-3 font-heading text-3xl font-black text-neuro-cream md:text-4xl">{title}</h2>
        <p className="mt-3 max-w-md text-base leading-relaxed text-neuro-cream">{body}</p>
        <Link
          href={href}
          className="mt-6 inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-neuro-orange px-6 text-base font-bold text-white hover:bg-[#B8551F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}
