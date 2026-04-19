"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Users,
  FileText,
  Wrench,
  ShoppingCart,
  Star,
  Check,
  Crown,
  ArrowRight,
  Sparkles,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Suspense } from "react";
import Footer from "@/components/landing/Footer";
import { createStoreCheckout } from "./actions";
import {
  STORE_PRODUCTS,
  CATEGORY_INFO,
  getProductsByCategory,
  getPopularProducts,
  getSavingsPercent,
  formatPrice,
  type StoreCategory,
  type StoreProduct,
} from "./store-data";

// ---------------------------------------------------------------------------
// Category Icons
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<StoreCategory, React.ReactNode> = {
  courses: <GraduationCap className="w-5 h-5" />,
  workshops: <Users className="w-5 h-5" />,
  contracts: <FileText className="w-5 h-5" />,
  tools: <Wrench className="w-5 h-5" />,
};

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------

function ProductCard({
  product,
  onBuy,
  buying,
}: {
  product: StoreProduct;
  onBuy: (p: StoreProduct) => void;
  buying: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const savings = getSavingsPercent(product);
  const isBuying = buying === product.id;

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all hover:shadow-lg ${
        product.popular
          ? "border-neuro-orange shadow-md ring-1 ring-neuro-orange/20"
          : "border-gray-100 shadow-sm"
      }`}
    >
      {/* Popular badge */}
      {product.popular && (
        <div className="bg-neuro-orange px-4 py-1.5 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-[10px] font-black uppercase tracking-widest">
            Best Seller
          </span>
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Bundle badge */}
        {product.badge && (
          <span className="inline-block bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full mb-3 w-fit">
            {product.badge}
          </span>
        )}

        {/* Name */}
        <h3 className="font-bold text-neuro-navy text-base leading-snug mb-1.5">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Features (expandable) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-400 font-semibold flex items-center gap-1 mb-3 hover:text-neuro-navy transition-colors"
        >
          What&apos;s included
          {expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        {expanded && (
          <ul className="space-y-1.5 mb-4">
            {product.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neuro-navy">
              ${formatPrice(product.retailPrice)}
            </span>
            {product.billing === "monthly" && (
              <span className="text-sm text-gray-400">/mo</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Crown className="w-3.5 h-3.5 text-neuro-orange" />
            <span className="text-sm">
              <span className="text-neuro-orange font-bold">
                Members pay ${formatPrice(product.memberPrice)}
              </span>
              <span className="text-gray-400 ml-1">({savings}% off)</span>
            </span>
          </div>
        </div>

        {/* Buy button */}
        <button
          onClick={() => onBuy(product)}
          disabled={isBuying}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            isBuying
              ? "bg-gray-200 text-gray-400 cursor-wait"
              : "bg-neuro-navy text-white hover:bg-neuro-navy/90 active:scale-[0.98]"
          }`}
        >
          {isBuying ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              Buy Now
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member Savings Banner
// ---------------------------------------------------------------------------

function MemberBanner() {
  const totalRetail = STORE_PRODUCTS.filter(
    (p) => !p.bundleIds && p.billing === "one_time",
  ).reduce((s, p) => s + p.retailPrice, 0);
  const totalMember = STORE_PRODUCTS.filter(
    (p) => !p.bundleIds && p.billing === "one_time",
  ).reduce((s, p) => s + p.memberPrice, 0);
  const totalSaved = totalRetail - totalMember;

  return (
    <div className="bg-gradient-to-r from-neuro-navy to-[#2d3f5e] rounded-2xl p-6 md:p-8 text-white mb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-neuro-orange" />
            <span className="text-xs font-black uppercase tracking-widest text-neuro-orange">
              Member Pricing
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black mb-1">
            Save up to ${formatPrice(totalSaved)} with a membership
          </h2>
          <p className="text-gray-400 text-sm">
            Members get every product at the lowest price — plus the full
            NeuroChiro platform, directory listing, job board, and more.
          </p>
        </div>
        <Link
          href="/pricing/doctors"
          className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange/90 transition-colors whitespace-nowrap flex-shrink-0"
        >
          See Membership Plans <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Purchase Success Toast
// ---------------------------------------------------------------------------

function SuccessToast({ productId, onClose }: { productId: string; onClose: () => void }) {
  const product = STORE_PRODUCTS.find((p) => p.id === productId);
  if (!product) return null;

  return (
    <div className="fixed top-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-green-200 p-5 max-w-sm animate-in slide-in-from-right">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-300 hover:text-gray-500"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h4 className="font-bold text-neuro-navy text-sm">
            Purchase Complete!
          </h4>
          <p className="text-gray-500 text-xs mt-0.5">{product.name}</p>
          <p className="text-xs text-gray-400 mt-2">
            You paid ${formatPrice(product.retailPrice)}.{" "}
            <Link
              href="/pricing/doctors"
              className="text-neuro-orange font-semibold hover:underline"
            >
              Members pay only ${formatPrice(product.memberPrice)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Store Page
// ---------------------------------------------------------------------------

export default function StorePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#fafbfc]" />}>
      <StoreContent />
    </Suspense>
  );
}

function StoreContent() {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<StoreCategory | "all">("all");
  const [buying, setBuying] = useState<string | null>(null);
  const [purchasedId, setPurchasedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Check for purchase success
  useEffect(() => {
    const purchased = searchParams.get("purchased");
    if (purchased) {
      setPurchasedId(purchased);
      // Clean URL
      window.history.replaceState({}, "", "/store");
    }
  }, [searchParams]);

  const handleBuy = (product: StoreProduct) => {
    setBuying(product.id);
    startTransition(async () => {
      const result = await createStoreCheckout(
        product.id,
        product.name,
        product.retailPrice,
        product.billing,
      );
      if (result.url) {
        window.location.href = result.url;
      } else {
        alert(result.error || "Something went wrong");
        setBuying(null);
      }
    });
  };

  const categories = Object.keys(CATEGORY_INFO) as StoreCategory[];
  const popular = getPopularProducts();

  const displayProducts =
    activeCategory === "all"
      ? STORE_PRODUCTS
      : getProductsByCategory(activeCategory);

  return (
    <div className="min-h-dvh bg-[#fafbfc]">
      {/* Success Toast */}
      {purchasedId && (
        <SuccessToast
          productId={purchasedId}
          onClose={() => setPurchasedId(null)}
        />
      )}

      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-14 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-20 w-60 h-60 bg-neuro-orange rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">
            Practice Growth Tools
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4">
            The NeuroChiro Store
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-6">
            Courses, workshop kits, contract templates, and practice tools — everything you need to grow a thriving chiropractic practice.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-neuro-orange" />
              Instant access
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-neuro-orange" />
              Built for chiropractors
            </span>
            <span className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-neuro-orange" />
              Members save up to 60%
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Member Savings Banner */}
        <MemberBanner />

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === "all"
                ? "bg-neuro-navy text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-neuro-navy/30"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeCategory === cat
                  ? "bg-neuro-navy text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-neuro-navy/30"
              }`}
            >
              {CATEGORY_ICONS[cat]}
              {CATEGORY_INFO[cat].label}
            </button>
          ))}
        </div>

        {/* Popular Section (only on "all") */}
        {activeCategory === "all" && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-neuro-orange" />
              <h2 className="text-xl font-black text-neuro-navy">
                Most Popular
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {popular.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onBuy={handleBuy}
                  buying={buying}
                />
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {activeCategory !== "all" && (
          <div className="mb-4">
            <h2 className="text-xl font-black text-neuro-navy mb-1">
              {CATEGORY_INFO[activeCategory].label}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {CATEGORY_INFO[activeCategory].tagline}
            </p>
          </div>
        )}

        {/* Category sections (all view) or filtered grid */}
        {activeCategory === "all" ? (
          categories.map((cat) => {
            const products = getProductsByCategory(cat);
            return (
              <div key={cat} className="mb-12">
                <div className="flex items-center gap-2 mb-5">
                  {CATEGORY_ICONS[cat]}
                  <h2 className="text-lg font-black text-neuro-navy">
                    {CATEGORY_INFO[cat].label}
                  </h2>
                  <span className="text-xs text-gray-400 ml-1">
                    {CATEGORY_INFO[cat].tagline}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onBuy={handleBuy}
                      buying={buying}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={handleBuy}
                buying={buying}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 mb-8 text-center bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
          <Crown className="w-10 h-10 text-neuro-orange mx-auto mb-4" />
          <h2 className="text-2xl font-black text-neuro-navy mb-2">
            Why pay retail?
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto mb-6">
            NeuroChiro members get every product at the lowest price — plus
            directory listing, job board, seminars, patient portal, and the full
            platform. Starting at $49/month.
          </p>
          <Link
            href="/pricing/doctors"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors"
          >
            View Membership Plans <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
