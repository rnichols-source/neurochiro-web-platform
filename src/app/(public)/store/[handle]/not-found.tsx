import Link from "next/link";
import Footer from "@/components/landing/Footer";
import { ProductCard } from "@/components/store/ProductCard";
import { getProducts } from "@/lib/shopify";
import type { ShopifyProductCard } from "@/lib/shopify-types";

export default async function StoreProductNotFound() {
  let products: ShopifyProductCard[] = [];
  try {
    const catalog = await getProducts({ first: 8 });
    if (catalog.ok) products = catalog.products.slice(0, 4);
  } catch {
    products = [];
  }

  return (
    <div className="bg-neuro-cream text-neuro-black">
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-32 md:px-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neuro-orange">NeuroChiro merch</p>
        <h1 className="mt-4 max-w-xl font-heading text-4xl font-black text-neuro-navy md:text-5xl">
          This item isn&apos;t available right now.
        </h1>
        <Link
          href="/store"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-neuro-orange px-6 text-base font-bold text-white hover:bg-[#B8551F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-navy focus-visible:ring-offset-2"
        >
          Back to the store
        </Link>
        {products.length > 0 ? (
          <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Footer />
    </div>
  );
}
