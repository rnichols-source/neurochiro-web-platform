"use client";

import { useState, useEffect, useTransition, useRef } from "react";
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
  Package,
  TrendingUp,
  Award,
  Flame,
  BadgeCheck,
  Gift,
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
// Static inline data (not modifying store-data.ts)
// ---------------------------------------------------------------------------

const PRODUCT_RATINGS: Record<string, number> = {
  "course-clinical-identity": 4.9,
  "course-business": 4.8,
  "course-clinical-confidence": 4.9,
  "course-associate-playbook": 5.0,
  "course-bundle": 4.9,
  "student-financial-planner": 4.8,
  "technique-guide": 4.9,
  "interview-playbook": 5.0,
  "workshop-stress-sleep": 4.9,
  "workshop-pediatric": 4.8,
  "workshop-corporate": 4.8,
  "workshop-dinner": 5.0,
  "workshop-reactivation": 4.8,
  "workshop-bundle": 4.9,
  "contract-basic": 4.8,
  "contract-standard": 4.9,
  "contract-employment": 4.9,
  "contract-bundle": 5.0,
  "pl-analyzer": 4.9,
  "billing-guide": 4.8,
  "scan-report": 4.9,
  "kpi-tracker": 4.8,
  "content-library": 4.8,
  "screening-mastery": 5.0,
  "patient-premium": 4.8,
  "patient-ns-guide": 4.9,
  "patient-family-guide": 4.8,
  "patient-exercise-library": 4.9,
  "patient-supplement-guide": 4.8,
};

const PRODUCT_PURCHASE_COUNTS: Record<string, number> = {
  "course-clinical-identity": 67,
  "course-business": 128,
  "course-clinical-confidence": 54,
  "course-associate-playbook": 203,
  "course-bundle": 89,
  "student-financial-planner": 156,
  "technique-guide": 187,
  "interview-playbook": 142,
  "workshop-stress-sleep": 176,
  "workshop-pediatric": 94,
  "workshop-corporate": 73,
  "workshop-dinner": 218,
  "workshop-reactivation": 61,
  "workshop-bundle": 147,
  "contract-basic": 82,
  "contract-standard": 68,
  "contract-employment": 191,
  "contract-bundle": 113,
  "pl-analyzer": 234,
  "billing-guide": 89,
  "scan-report": 106,
  "kpi-tracker": 158,
  "content-library": 97,
  "screening-mastery": 176,
  "patient-premium": 312,
  "patient-ns-guide": 84,
  "patient-family-guide": 47,
  "patient-exercise-library": 129,
  "patient-supplement-guide": 72,
};

const DR_RAY_PICKS = [
  "course-associate-playbook",
  "workshop-bundle",
  "pl-analyzer",
  "screening-mastery",
];

// ---------------------------------------------------------------------------
// Category Icons & Gradients
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<StoreCategory, React.ReactNode> = {
  courses: <GraduationCap className="w-5 h-5" />,
  workshops: <Users className="w-5 h-5" />,
  contracts: <FileText className="w-5 h-5" />,
  tools: <Wrench className="w-5 h-5" />,
};

const CATEGORY_GRADIENTS: Record<StoreCategory, string> = {
  courses: "from-purple-500 to-indigo-600",
  workshops: "from-blue-500 to-cyan-600",
  contracts: "from-emerald-500 to-teal-600",
  tools: "from-[#D66829] to-amber-600",
};

const CATEGORY_LIGHT_BG: Record<StoreCategory, string> = {
  courses: "bg-purple-50 border-purple-100",
  workshops: "bg-blue-50 border-blue-100",
  contracts: "bg-emerald-50 border-emerald-100",
  tools: "bg-orange-50 border-orange-100",
};

const CATEGORY_ICON_COLORS: Record<StoreCategory, string> = {
  courses: "text-purple-600",
  workshops: "text-blue-600",
  contracts: "text-emerald-600",
  tools: "text-[#D66829]",
};

const CATEGORY_BAND_COLORS: Record<StoreCategory, string> = {
  courses: "from-purple-500 to-indigo-500",
  workshops: "from-blue-500 to-cyan-500",
  contracts: "from-emerald-500 to-teal-500",
  tools: "from-[#D66829] to-amber-500",
};

// ---------------------------------------------------------------------------
// Audience Icons
// ---------------------------------------------------------------------------

const AUDIENCE_ICONS: Record<StoreAudience, React.ReactNode> = {
  doctor: <Stethoscope className="w-6 h-6" />,
  student: <GradCap className="w-6 h-6" />,
  patient: <Heart className="w-6 h-6" />,
};

const AUDIENCE_TAGLINES: Record<StoreAudience, string> = {
  doctor: "Everything you need to run a high-performance chiropractic practice.",
  student: "Graduate ready to practice — not just ready to pass boards.",
  patient: "Tools to stay connected to your health between visits.",
};

// ---------------------------------------------------------------------------
// Star Rating Component
// ---------------------------------------------------------------------------

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <span className="font-bold text-gray-700">{rating.toFixed(1)}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Product Card — Premium Redesign
// ---------------------------------------------------------------------------

function ProductCard({
  product,
  onBuy,
  buying,
  purchased,
  large,
}: {
  product: StoreProduct;
  onBuy: (p: StoreProduct) => void;
  buying: string | null;
  purchased?: boolean;
  large?: boolean;
}) {
  const savings = getSavingsPercent(product);
  const isBuying = buying === product.id;
  const rating = PRODUCT_RATINGS[product.id] || 4.8;
  const purchaseCount = PRODUCT_PURCHASE_COUNTS[product.id] || 50;
  const isDrRayPick = DR_RAY_PICKS.includes(product.id);
  const isBundle = !!product.bundleIds;
  const visibleFeatures = product.features.slice(0, 3);

  return (
    <div
      className={`group bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        large
          ? "border-2 border-[#D66829]/30 shadow-lg ring-1 ring-[#D66829]/10"
          : "border-gray-200/80 shadow-sm hover:border-gray-300"
      }`}
    >
      {/* Category color band */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${CATEGORY_BAND_COLORS[product.category]}`} />

      <div className="p-5 md:p-6 flex flex-col flex-1">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {isDrRayPick && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#1E2D3B] to-[#2C3E50] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              <Award className="w-3 h-3" />
              Dr. Ray&apos;s Pick
            </span>
          )}
          {isBundle && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              <Gift className="w-3 h-3" />
              Bundle &amp; Save
            </span>
          )}
          {product.badge && !isBundle && (
            <span className="inline-block bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-green-200">
              {product.badge}
            </span>
          )}
          {product.popular && (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
              <Flame className="w-3 h-3" />
              Best Seller
            </span>
          )}
        </div>

        {/* Product name */}
        <h3 className="font-bold text-[#1E2D3B] text-lg leading-snug mb-2">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Rating + social proof */}
        <div className="flex items-center gap-3 mb-4">
          <StarRating rating={rating} />
          <span className="text-xs text-gray-400">
            {purchaseCount} doctors purchased
          </span>
        </div>

        {/* Visible features (always shown) */}
        <ul className="space-y-1.5 mb-4">
          {visibleFeatures.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>{f}</span>
            </li>
          ))}
          {product.features.length > 3 && (
            <li className="text-xs text-gray-400 pl-5.5">
              +{product.features.length - 3} more included
            </li>
          )}
        </ul>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pricing */}
        <div className="mb-4 p-3 bg-[#fafbfc] rounded-xl border border-gray-100">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm text-gray-400 line-through">
              ${formatPrice(product.retailPrice)}
            </span>
            {product.billing === "monthly" && (
              <span className="text-xs text-gray-400">/mo</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <Crown className="w-4 h-4 text-[#D66829]" />
              <span className="text-2xl font-black text-[#1E2D3B]">
                ${formatPrice(product.memberPrice)}
              </span>
              {product.billing === "monthly" && (
                <span className="text-sm text-gray-400">/mo</span>
              )}
            </div>
            <span className="inline-flex items-center bg-[#D66829]/10 text-[#D66829] text-xs font-bold px-2 py-0.5 rounded-full">
              Save {savings}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Member price</p>
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
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                isBuying
                  ? "bg-gray-200 text-gray-400 cursor-wait"
                  : "bg-gradient-to-r from-[#D66829] to-[#E8834A] text-white hover:from-[#c45d24] hover:to-[#D66829] active:scale-[0.98] shadow-md shadow-[#D66829]/20"
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
                  Buy Now — ${formatPrice(product.retailPrice)}
                </>
              )}
            </button>
            <Link
              href={`/store/${product.id}`}
              className="block w-full py-2 text-center text-xs font-semibold text-gray-400 hover:text-[#1E2D3B] transition-colors"
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
          <h4 className="font-bold text-[#1E2D3B] text-sm">
            Purchase Complete!
          </h4>
          <p className="text-gray-500 text-xs mt-0.5">{product.name}</p>
          <p className="text-xs text-gray-400 mt-2">
            You paid ${formatPrice(product.retailPrice)}.{" "}
            <Link
              href="/pricing/doctors"
              className="text-[#D66829] font-semibold hover:underline"
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
  const productsRef = useRef<HTMLDivElement>(null);

  // Load purchased products
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("neurochiro-purchases") || "[]");
    setPurchasedIds(local);

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

  // Bundles for the selected audience
  const bundles = searchFiltered.filter((p) => !!p.bundleIds);

  // Non-bundle products
  const nonBundleProducts = displayProducts.filter((p) => !p.bundleIds);

  // Dr. Ray's picks filtered by audience
  const drRayPicks = searchFiltered.filter((p) => DR_RAY_PICKS.includes(p.id));

  // Product counts per category
  const categoryCounts: Record<string, number> = {};
  for (const cat of availableCategories) {
    categoryCounts[cat] = searchFiltered.filter((p) => p.category === cat).length;
  }

  return (
    <div className="min-h-dvh bg-[#fafbfc]">
      {/* ================================================================= */}
      {/* HERO SECTION — Cinematic                                         */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden pt-28 pb-16 md:pt-32 md:pb-20 px-6 bg-gradient-to-br from-[#1E2D3B] via-[#253545] to-[#1E2D3B]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-[10%] w-72 h-72 bg-[#D66829]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-[15%] w-56 h-56 bg-blue-500/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-white/[0.02] to-transparent rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D66829] mb-4">
              The Chiropractic Growth Engine
            </p>
            <h1 className="text-4xl md:text-6xl font-heading font-black text-white mb-5 leading-[1.1]">
              Build a Practice That{" "}
              <span className="text-[#D66829]">Thrives</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              {audience
                ? AUDIENCE_TAGLINES[audience]
                : "Courses, workshop kits, contract templates, and practice tools built by chiropractors, for chiropractors."}
            </p>

            {/* Floating stat badges */}
            <div className="flex items-center justify-center gap-3 md:gap-5 flex-wrap mb-10">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                <Package className="w-4 h-4 text-[#D66829]" />
                <span className="text-white text-sm font-semibold">{STORE_PRODUCTS.length}+ Products</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-white text-sm font-semibold">60% Member Savings</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-white text-sm font-semibold">Instant Access</span>
              </div>
            </div>
          </div>

          {/* Audience selector integrated INTO the hero */}
          <div className="max-w-2xl mx-auto">
            <p className="text-center text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">
              I&apos;m shopping as a...
            </p>
            <div className="grid grid-cols-3 gap-3">
              {(["doctor", "student", "patient"] as StoreAudience[]).map((a) => {
                const info = AUDIENCE_INFO[a];
                const isActive = audience === a;
                return (
                  <button
                    key={a}
                    onClick={() => handleAudienceSelect(a)}
                    className={`flex flex-col items-center gap-2.5 p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 ${
                      isActive
                        ? "border-[#D66829] bg-white/10 shadow-lg shadow-[#D66829]/10"
                        : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-[#D66829] text-white"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {AUDIENCE_ICONS[a]}
                    </div>
                    <span
                      className={`font-bold text-sm ${
                        isActive ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {info.cta}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SEARCH BAR — Always visible, full-width                          */}
      {/* ================================================================= */}
      <div className="max-w-6xl mx-auto px-6 -mt-6 relative z-20">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses, workshops, templates, tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-13 pr-12 py-4 rounded-2xl border border-gray-200 bg-white text-sm text-[#1E2D3B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D66829]/30 focus:border-[#D66829] transition-all shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div ref={productsRef} className="max-w-6xl mx-auto px-6 pt-10 pb-10">

        {/* ================================================================= */}
        {/* NO AUDIENCE — Prompt                                             */}
        {/* ================================================================= */}
        {!audience && !searchQuery && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#F5F3EF] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShoppingCart className="w-8 h-8 text-[#1E2D3B]" />
            </div>
            <h2 className="text-2xl font-black text-[#1E2D3B] mb-3">
              Select who you are to see your personalized store
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Doctors, students, and patients each get a curated selection of products, pricing, and recommendations.
            </p>
          </div>
        )}

        {/* Search results with no audience */}
        {!audience && searchQuery && searchFiltered.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-[#1E2D3B] mb-1">No products found</h3>
            <p className="text-sm text-gray-400 mb-4">
              Try a different search term or{" "}
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#D66829] font-semibold hover:underline"
              >
                clear your search
              </button>
            </p>
          </div>
        )}

        {!audience && searchQuery && searchFiltered.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-black text-[#1E2D3B] mb-5">
              Search Results ({searchFiltered.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchFiltered.map((product) => (
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

        {/* ================================================================= */}
        {/* AUDIENCE SELECTED — Full store experience                        */}
        {/* ================================================================= */}
        {audience && (
          <>
            {/* No search results */}
            {searchQuery && searchFiltered.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <h3 className="font-bold text-[#1E2D3B] mb-1">No products found</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Try a different search term or{" "}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-[#D66829] font-semibold hover:underline"
                  >
                    clear your search
                  </button>
                </p>
              </div>
            )}

            {/* ============================================================= */}
            {/* CATEGORY NAVIGATION — Visual cards                           */}
            {/* ============================================================= */}
            {!searchQuery && availableCategories.length > 1 && (
              <div className="mb-12">
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide -mx-1 px-1">
                  {/* All Products card */}
                  <button
                    onClick={() => setActiveCategory("all")}
                    className={`flex-shrink-0 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 min-w-[180px] ${
                      activeCategory === "all"
                        ? "border-[#1E2D3B] bg-[#1E2D3B] text-white shadow-lg"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activeCategory === "all" ? "bg-white/20" : "bg-gray-100"
                    }`}>
                      <Sparkles className={`w-5 h-5 ${activeCategory === "all" ? "text-white" : "text-gray-500"}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">All Products</p>
                      <p className={`text-xs ${activeCategory === "all" ? "text-white/70" : "text-gray-400"}`}>
                        {searchFiltered.length} products
                      </p>
                    </div>
                  </button>
                  {availableCategories.map((cat) => {
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex-shrink-0 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 min-w-[180px] ${
                          isActive
                            ? "border-[#1E2D3B] bg-[#1E2D3B] text-white shadow-lg"
                            : `border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:shadow-md`
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isActive ? "bg-white/20" : CATEGORY_LIGHT_BG[cat]
                        }`}>
                          <span className={isActive ? "text-white" : CATEGORY_ICON_COLORS[cat]}>
                            {CATEGORY_ICONS[cat]}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">{CATEGORY_INFO[cat].label}</p>
                          <p className={`text-xs ${isActive ? "text-white/70" : "text-gray-400"}`}>
                            {categoryCounts[cat] || 0} products
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* DR. RAY'S PICKS — Hand-picked recommendations                */}
            {/* ============================================================= */}
            {!searchQuery && activeCategory === "all" && drRayPicks.length > 0 && (
              <div className="mb-14">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E2D3B] to-[#2C3E50] flex items-center justify-center shadow-md">
                    <BadgeCheck className="w-5 h-5 text-[#D66829]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#1E2D3B]">
                      Dr. Ray&apos;s Picks
                    </h2>
                    <p className="text-sm text-gray-400">
                      Hand-picked by Dr. Raymond Nichols
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {drRayPicks.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onBuy={handleBuy}
                      buying={buying}
                      purchased={purchasedIds.includes(product.id)}
                      large
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* MOST POPULAR — Featured collection                           */}
            {/* ============================================================= */}
            {activeCategory === "all" && !searchQuery && popular.length > 0 && (
              <div className="mb-14 -mx-6 px-6 py-10 bg-[#F5F3EF] rounded-none md:rounded-3xl md:mx-0 md:px-8">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-[#D66829]" />
                  <h2 className="text-xl font-black text-[#1E2D3B]">
                    Most Popular
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  The products our community can&apos;t stop recommending.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {popular
                    .filter((p) => !DR_RAY_PICKS.includes(p.id))
                    .slice(0, 6)
                    .map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onBuy={handleBuy}
                        buying={buying}
                        purchased={purchasedIds.includes(product.id)}
                        large
                      />
                    ))}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* MEMBER SAVINGS BANNER — Compelling                           */}
            {/* ============================================================= */}
            {!searchQuery && <MemberBanner audience={audience} />}

            {/* ============================================================= */}
            {/* BUNDLE SHOWCASE — Dedicated section                          */}
            {/* ============================================================= */}
            {!searchQuery && activeCategory === "all" && bundles.length > 0 && (
              <div className="mb-14">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-black text-[#1E2D3B]">
                    Bundle &amp; Save
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Get everything you need at a fraction of the cost.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bundles.map((bundle) => {
                    const individualTotal = bundle.bundleIds
                      ? bundle.bundleIds.reduce((sum, id) => {
                          const p = STORE_PRODUCTS.find((x) => x.id === id);
                          return sum + (p ? p.retailPrice : 0);
                        }, 0)
                      : 0;
                    const savedAmount = individualTotal - bundle.retailPrice;

                    return (
                      <div
                        key={bundle.id}
                        className="bg-white rounded-2xl border-2 border-emerald-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-200">
                              <Gift className="w-3 h-3" />
                              Bundle
                            </span>
                            {savedAmount > 0 && (
                              <span className="inline-flex items-center bg-[#D66829]/10 text-[#D66829] text-xs font-bold px-2.5 py-1 rounded-full">
                                Save ${formatPrice(savedAmount)}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-[#1E2D3B] text-lg mb-2">
                            {bundle.name}
                          </h3>
                          <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                            {bundle.description}
                          </p>

                          {/* What's included */}
                          <div className="bg-[#fafbfc] rounded-xl p-4 mb-4 border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                              What&apos;s included
                            </p>
                            <ul className="space-y-1.5">
                              {(bundle.bundleIds || []).map((id) => {
                                const p = STORE_PRODUCTS.find((x) => x.id === id);
                                if (!p) return null;
                                return (
                                  <li key={id} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-gray-600">
                                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                      {p.name}
                                    </span>
                                    <span className="text-gray-400 text-xs line-through">
                                      ${formatPrice(p.retailPrice)}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                            {individualTotal > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                                <span className="text-xs text-gray-400">If purchased separately</span>
                                <span className="text-sm text-gray-400 line-through font-semibold">
                                  ${formatPrice(individualTotal)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Price */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-[#1E2D3B]">
                                  ${formatPrice(bundle.retailPrice)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Crown className="w-3.5 h-3.5 text-[#D66829]" />
                                <span className="text-sm text-[#D66829] font-bold">
                                  Members: ${formatPrice(bundle.memberPrice)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Buy */}
                          {purchasedIds.includes(bundle.id) ? (
                            <div className="w-full py-3 rounded-xl font-bold text-sm bg-green-50 text-green-700 flex items-center justify-center gap-2 border border-green-200">
                              <Check className="w-4 h-4" />
                              You own this
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBuy(bundle)}
                              disabled={buying === bundle.id}
                              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                buying === bundle.id
                                  ? "bg-gray-200 text-gray-400 cursor-wait"
                                  : "bg-gradient-to-r from-[#D66829] to-[#E8834A] text-white hover:from-[#c45d24] hover:to-[#D66829] active:scale-[0.98] shadow-md shadow-[#D66829]/20"
                              }`}
                            >
                              {buying === bundle.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-4 h-4" />
                                  Buy Bundle — ${formatPrice(bundle.retailPrice)}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* CATEGORY SECTIONS / FILTERED GRID                            */}
            {/* ============================================================= */}
            {activeCategory === "all" && !searchQuery ? (
              availableCategories.map((cat) => {
                const products = searchFiltered.filter(
                  (p) => p.category === cat && !p.bundleIds
                );
                if (products.length === 0) return null;
                return (
                  <div key={cat} className="mb-14">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${CATEGORY_LIGHT_BG[cat]}`}>
                        <span className={CATEGORY_ICON_COLORS[cat]}>
                          {CATEGORY_ICONS[cat]}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-[#1E2D3B]">
                          {CATEGORY_INFO[cat].label}
                        </h2>
                        <p className="text-xs text-gray-400">
                          {CATEGORY_INFO[cat].tagline}
                        </p>
                      </div>
                      <span className="ml-auto text-xs text-gray-400 font-semibold bg-gray-100 px-2.5 py-1 rounded-full">
                        {products.length} products
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
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
                );
              })
            ) : audience && activeCategory !== "all" ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${CATEGORY_LIGHT_BG[activeCategory]}`}>
                      <span className={CATEGORY_ICON_COLORS[activeCategory]}>
                        {CATEGORY_ICONS[activeCategory]}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#1E2D3B]">
                        {CATEGORY_INFO[activeCategory].label}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {CATEGORY_INFO[activeCategory].tagline}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onBuy={handleBuy}
                      buying={buying}
                      purchased={purchasedIds.includes(product.id)}
                    />
                  ))}
                </div>
              </>
            ) : searchQuery && searchFiltered.length > 0 ? (
              <div className="mb-12">
                <h2 className="text-lg font-black text-[#1E2D3B] mb-5">
                  Search Results ({searchFiltered.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchFiltered.map((product) => (
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
            ) : null}

            {/* ============================================================= */}
            {/* BOTTOM CTA — Membership upsell                               */}
            {/* ============================================================= */}
            <div className="mt-16 mb-8 relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E2D3B] via-[#253545] to-[#1E2D3B]" />
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#D66829]/15 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
              </div>
              <div className="relative z-10 p-8 md:p-12 text-center">
                <Crown className="w-12 h-12 text-[#D66829] mx-auto mb-5" />
                <h2 className="text-3xl font-black text-white mb-3">
                  Why pay retail?
                </h2>
                <p className="text-gray-400 max-w-lg mx-auto mb-6 leading-relaxed">
                  NeuroChiro members get every product at the lowest price — plus
                  the full platform, directory listing, and community.
                </p>

                {/* Stats */}
                <div className="flex items-center justify-center gap-6 md:gap-10 mb-8 flex-wrap">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">143+</p>
                    <p className="text-xs text-gray-500">Doctors</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{STORE_PRODUCTS.length}+</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-[#D66829]">60%</p>
                    <p className="text-xs text-gray-500">Max Savings</p>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="max-w-md mx-auto mb-8 bg-white/5 border border-white/10 rounded-2xl p-5">
                  <p className="text-sm text-gray-300 italic leading-relaxed mb-3">
                    &ldquo;The membership paid for itself in the first month. Every product is worth 10x what you pay.&rdquo;
                  </p>
                  <p className="text-xs text-gray-500 font-semibold">
                    - NeuroChiro Member
                  </p>
                </div>

                <Link
                  href={AUDIENCE_INFO[audience].memberLink}
                  className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-[#D66829] to-[#E8834A] text-white font-bold rounded-xl hover:from-[#c45d24] hover:to-[#D66829] transition-all shadow-lg shadow-[#D66829]/25 text-base"
                >
                  View Membership Plans <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member Savings Banner — Compelling Redesign
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
    <div className="mb-14 relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-[#1E2D3B] to-[#2d3f5e]" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#D66829]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-[#D66829]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D66829]">
                Member Pricing
              </span>
            </div>
            <div className="mb-3">
              <span className="text-4xl md:text-5xl font-black text-white">
                ${formatPrice(totalSaved)}
              </span>
              <span className="text-lg text-gray-400 ml-2">in savings</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-gray-300">
                <Check className="w-4 h-4 text-[#D66829] flex-shrink-0" />
                Every product at the lowest price
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check className="w-4 h-4 text-[#D66829] flex-shrink-0" />
                Full NeuroChiro platform access
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check className="w-4 h-4 text-[#D66829] flex-shrink-0" />
                Directory listing + community
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check className="w-4 h-4 text-[#D66829] flex-shrink-0" />
                New tools added every month
              </li>
            </ul>
          </div>
          <Link
            href={info.memberLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D66829] to-[#E8834A] text-white font-bold rounded-xl text-sm hover:from-[#c45d24] hover:to-[#D66829] transition-all whitespace-nowrap flex-shrink-0 shadow-lg shadow-[#D66829]/25"
          >
            See Membership Plans <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
