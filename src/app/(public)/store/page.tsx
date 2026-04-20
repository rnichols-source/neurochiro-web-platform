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
  AUDIENCE_INFO,
  getProductsByCategory,
  getProductsByAudience,
  getCategoriesForAudience,
  getPopularProducts,
  getSavingsPercent,
  formatPrice,
  type StoreCategory,
  type StoreAudience,
  type StoreProduct,
} from "./store-data";
import { getUserPurchases } from "./purchase-check";
import { Stethoscope, GraduationCap as GradCap, Heart, Search } from "lucide-react";

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
  purchased,
}: {
  product: StoreProduct;
  onBuy: (p: StoreProduct) => void;
  buying: string | null;
  purchased?: boolean;
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

        {/* Buy button or purchased state */}
        {purchased ? (
          <div className="w-full py-3 rounded-xl font-bold text-sm bg-green-50 text-green-700 flex items-center justify-center gap-2 border border-green-200">
            <Check className="w-4 h-4" />
            You own this
          </div>
        ) : (
          <div className="space-y-2">
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
            <Link
              href={`/store/${product.id}`}
              className="block w-full py-2 text-center text-xs font-semibold text-gray-400 hover:text-neuro-navy transition-colors"
            >
              View Details
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audience Selector
// ---------------------------------------------------------------------------

const AUDIENCE_ICONS: Record<StoreAudience, React.ReactNode> = {
  doctor: <Stethoscope className="w-5 h-5" />,
  student: <GradCap className="w-5 h-5" />,
  patient: <Heart className="w-5 h-5" />,
};

function AudienceSelector({
  selected,
  onSelect,
}: {
  selected: StoreAudience | null;
  onSelect: (a: StoreAudience) => void;
}) {
  const audiences: StoreAudience[] = ["doctor", "student", "patient"];

  return (
    <div className="max-w-2xl mx-auto mb-10">
      <p className="text-center text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
        I&apos;m shopping as a...
      </p>
      <div className="grid grid-cols-3 gap-3">
        {audiences.map((a) => {
          const info = AUDIENCE_INFO[a];
          const isActive = selected === a;
          return (
            <button
              key={a}
              onClick={() => onSelect(a)}
              className={`flex flex-col items-center gap-2 p-4 md:p-5 rounded-2xl border-2 transition-all ${
                isActive
                  ? "border-neuro-orange bg-neuro-orange/5 shadow-md"
                  : "border-gray-200 bg-white hover:border-neuro-navy/30 hover:shadow-sm"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isActive
                    ? "bg-neuro-orange text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {AUDIENCE_ICONS[a]}
              </div>
              <span
                className={`font-bold text-sm ${
                  isActive ? "text-neuro-navy" : "text-gray-600"
                }`}
              >
                {info.cta}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member Savings Banner
// ---------------------------------------------------------------------------

function MemberBanner({ audience }: { audience: StoreAudience }) {
  const info = AUDIENCE_INFO[audience];
  const products = getProductsByAudience(audience);
  const totalRetail = products
    .filter((p) => !p.bundleIds && p.billing === "one_time")
    .reduce((s, p) => s + p.retailPrice, 0);
  const totalMember = products
    .filter((p) => !p.bundleIds && p.billing === "one_time")
    .reduce((s, p) => s + p.memberPrice, 0);
  const totalSaved = totalRetail - totalMember;

  if (totalSaved <= 0) return null;

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
            NeuroChiro platform.
          </p>
        </div>
        <Link
          href={info.memberLink}
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
  const [audience, setAudience] = useState<StoreAudience | null>(null);
  const [activeCategory, setActiveCategory] = useState<StoreCategory | "all">("all");
  const [buying, setBuying] = useState<string | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Load purchased products
  useEffect(() => {
    // From localStorage (guest purchases)
    const local = JSON.parse(localStorage.getItem("neurochiro-purchases") || "[]");
    setPurchasedIds(local);

    // From Supabase (logged-in user)
    getUserPurchases().then((ids) => {
      if (ids.length > 0) {
        setPurchasedIds((prev) => [...new Set([...prev, ...ids])]);
      }
    });
  }, []);

  // Reset category when audience changes
  const handleAudienceSelect = (a: StoreAudience) => {
    setAudience(a);
    setActiveCategory("all");
  };

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

  // Filter products by audience and search
  const audienceProducts = audience
    ? getProductsByAudience(audience)
    : STORE_PRODUCTS;

  const searchFiltered = searchQuery.trim()
    ? audienceProducts.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.features.some((f) => f.toLowerCase().includes(q))
        );
      })
    : audienceProducts;

  const availableCategories = audience
    ? getCategoriesForAudience(audience)
    : (Object.keys(CATEGORY_INFO) as StoreCategory[]);
  const popular = audience
    ? searchFiltered.filter((p) => p.popular)
    : getPopularProducts();

  const displayProducts =
    activeCategory === "all"
      ? searchFiltered
      : searchFiltered.filter((p) => p.category === activeCategory);

  const audienceInfo = audience ? AUDIENCE_INFO[audience] : null;

  return (
    <div className="min-h-dvh bg-[#fafbfc]">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-14 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-20 w-60 h-60 bg-neuro-orange rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">
            {audience ? AUDIENCE_INFO[audience].label : "Practice Growth Tools"}
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4">
            The NeuroChiro Store
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-6">
            {audienceInfo
              ? audienceInfo.tagline
              : "Courses, workshop kits, contract templates, and practice tools for chiropractors, students, and patients."}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400 flex-wrap">
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
        {/* Audience Selector */}
        <AudienceSelector selected={audience} onSelect={handleAudienceSelect} />

        {/* Search Bar */}
        {audience && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-sm text-neuro-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Member Savings Banner */}
        {audience && !searchQuery && <MemberBanner audience={audience} />}

        {/* Category Tabs (only when audience is selected) */}
        {audience && availableCategories.length > 1 && (
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
            {availableCategories.map((cat) => (
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
        )}

        {/* No audience selected yet */}
        {!audience && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-semibold text-neuro-navy mb-2">
              Select who you are above to see products curated for you
            </p>
            <p className="text-sm">
              Doctors, students, and patients each get a personalized store experience
            </p>
          </div>
        )}

        {/* No search results */}
        {audience && searchQuery && searchFiltered.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-neuro-navy mb-1">No products found</h3>
            <p className="text-sm text-gray-400 mb-4">
              Try a different search term or{" "}
              <button
                onClick={() => setSearchQuery("")}
                className="text-neuro-orange font-semibold hover:underline"
              >
                clear your search
              </button>
            </p>
          </div>
        )}

        {/* Popular Section (only on "all" with audience selected, no search) */}
        {audience && activeCategory === "all" && !searchQuery && popular.length > 0 && (
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
                  purchased={purchasedIds.includes(product.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category header for filtered view */}
        {audience && activeCategory !== "all" && (
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
        {audience && activeCategory === "all" ? (
          availableCategories.map((cat) => {
            const products = searchFiltered.filter((p) => p.category === cat);
            if (products.length === 0) return null;
            return (
              <div key={cat} className="mb-12">
                <div className="flex items-center gap-2 mb-5">
                  {CATEGORY_ICONS[cat]}
                  <h2 className="text-lg font-black text-neuro-navy">
                    {CATEGORY_INFO[cat].label}
                  </h2>
                  <span className="text-xs text-gray-400 ml-1 hidden md:inline">
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
        ) : audience ? (
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
        ) : null}

        {/* Bottom CTA */}
        {audience && (
          <div className="mt-16 mb-8 text-center bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
            <Crown className="w-10 h-10 text-neuro-orange mx-auto mb-4" />
            <h2 className="text-2xl font-black text-neuro-navy mb-2">
              Why pay retail?
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-6">
              NeuroChiro members get every product at the lowest price — plus
              the full platform, directory listing, and community.
              {audience === "doctor" && " Starting at $49/month."}
              {audience === "student" && " Starting at $9/month."}
              {audience === "patient" && " Starting at $9/month."}
            </p>
            <Link
              href={AUDIENCE_INFO[audience].memberLink}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors"
            >
              View Membership Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
