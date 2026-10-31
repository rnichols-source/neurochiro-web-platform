import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Footer from "@/components/landing/Footer";
import { JsonLd } from "@/components/store/JsonLd";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductInteractive } from "@/components/store/ProductInteractive";
import { StoreFallback } from "@/components/store/StoreFallback";
import { categoryFromTitle, plainText, truncate } from "@/lib/shopify-catalog";
import { isLegacyStoreProductId } from "@/lib/legacy-store-ids";
import { getProductByHandle, getProductRecommendations, getProducts } from "@/lib/shopify";
import { publicStoreImage } from "@/lib/store-assets";
import type { ShopifyProduct, ShopifyProductCard } from "@/lib/shopify-types";

export const dynamicParams = true;
export const revalidate = 60;

const SITE = "https://www.neurochiro.co";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateStaticParams() {
  try {
    const catalog = await getProducts({ first: 50 });
    if (!catalog.ok) return [];
    return catalog.products.map((product) => ({ handle: product.handle }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const result = await getProductByHandle(handle);
  if (!result.ok || !result.product) {
    return { title: "NeuroChiro Merch Store" };
  }
  const product = result.product;
  const description = truncate(plainText(product.seoDescription || product.description || product.title));
  const title = `${product.title} | NeuroChiro Merch`;
  const image = product.images[0]?.url ?? publicStoreImage("heroDesktop") ?? "/og-default.png";
  const canonical = `${SITE}/store/${product.handle}`;
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
    other: {
      "product:price:amount": product.minPrice.amount,
      "product:price:currency": product.minPrice.currencyCode,
    },
  };
}

function productJsonLd(product: ShopifyProduct) {
  const category = categoryFromTitle(product.title);
  const description = plainText(product.description || product.title);
  const offers = product.variants.map((variant) => ({
    "@type": "Offer",
    sku: variant.sku || variant.numericId,
    price: variant.price.amount,
    priceCurrency: variant.price.currencyCode,
    availability: variant.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    url: `${SITE}/store/${product.handle}?variant=${variant.numericId}`,
  }));
  const prices = product.variants.map((variant) => Number(variant.price.amount)).filter((price) => Number.isFinite(price));
  const low = prices.length ? Math.min(...prices) : Number(product.minPrice.amount);
  const high = prices.length ? Math.max(...prices) : Number(product.maxPrice.amount);
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      image: product.images.map((image) => image.url),
      description,
      sku: product.variants.find((variant) => variant.sku)?.sku || product.id,
      brand: { "@type": "Brand", name: "NeuroChiro" },
      offers: {
        "@type": "AggregateOffer",
        lowPrice: low,
        highPrice: high,
        priceCurrency: product.minPrice.currencyCode,
        offerCount: product.variants.length,
        offers,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Store", item: `${SITE}/store` },
        ...(category === "other"
          ? []
          : [{
              "@type": "ListItem",
              position: 2,
              name: category === "hats" ? "Hats" : "Crewnecks",
              item: `${SITE}/store?category=${category}`,
            }]),
        {
          "@type": "ListItem",
          position: category === "other" ? 2 : 3,
          name: product.title,
          item: `${SITE}/store/${product.handle}`,
        },
      ],
    },
  ];
}

async function relatedProducts(product: ShopifyProduct): Promise<ShopifyProductCard[]> {
  const related: ShopifyProductCard[] = [];
  const recommendations = await getProductRecommendations(product.id);
  if (recommendations.ok) {
    for (const item of recommendations.products) {
      if (item.handle === product.handle) continue;
      related.push(item);
      if (related.length === 4) return related;
    }
  }
  const catalog = await getProducts({ first: 50 });
  if (catalog.ok) {
    for (const item of catalog.products) {
      if (item.handle === product.handle || related.some((entry) => entry.handle === item.handle)) continue;
      related.push(item);
      if (related.length === 4) break;
    }
  }
  return related;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const result = await getProductByHandle(handle);
  if (!result.ok) return <StoreFallback />;
  if (!result.product) {
    if (isLegacyStoreProductId(handle)) permanentRedirect("/store");
    notFound();
  }

  const product = result.product;
  const category = categoryFromTitle(product.title);
  const related = await relatedProducts(product);
  return (
    <div className="bg-neuro-cream pb-28 text-neuro-black md:pb-0">
      {productJsonLd(product).map((block) => (
        <JsonLd key={block["@type"]} data={block} />
      ))}
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-28 md:px-8">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm font-semibold text-neuro-gray">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/store" className="hover:text-neuro-orange">Store</Link>
            </li>
            {category !== "other" ? (
              <li className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                <Link href={`/store?category=${category}#shop`} className="hover:text-neuro-orange">
                  {category === "hats" ? "Hats" : "Crewnecks"}
                </Link>
              </li>
            ) : null}
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <span className="text-neuro-black" aria-current="page">{product.title}</span>
            </li>
          </ol>
        </nav>
        <ProductInteractive product={product} hatCopy={category === "hats"} />
        {related.length > 0 ? (
          <section className="mt-16">
            <h2 className="font-heading text-3xl font-black text-neuro-navy">You might also like</h2>
            <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <Footer />
    </div>
  );
}
