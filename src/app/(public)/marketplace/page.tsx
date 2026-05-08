"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  Store,
  ArrowRight,
  ShoppingBag,
  Zap,
  Search,
  Package,
  ScanLine,
  Monitor,
  Megaphone,
  Pill,
  BookOpen,
  Receipt,
  Shield,
  Palette,
  Users,
  Banknote,
  Building2,
  Star,
  Award,
} from "lucide-react";
import Link from "next/link";
import { getVendors } from "./actions";
import Footer from "@/components/landing/Footer";

const MARKETPLACE_CATEGORIES = [
  { name: "Tables & Equipment", icon: Package },
  { name: "Imaging & Scans", icon: ScanLine },
  { name: "EHR & Software", icon: Monitor },
  { name: "Marketing", icon: Megaphone },
  { name: "Supplements", icon: Pill },
  { name: "Education & Coaching", icon: BookOpen },
  { name: "Billing & Collections", icon: Receipt },
  { name: "Legal & Compliance", icon: Shield },
  { name: "Office Supplies & Design", icon: Palette },
  { name: "Staffing & HR", icon: Users },
  { name: "Financial Services", icon: Banknote },
  { name: "Real Estate", icon: Building2 },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const INITIALS_COLORS = [
  "bg-[#1E2D3B]",
  "bg-[#D66829]",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-sky-600",
  "bg-pink-600",
];

function getTierBadge(tier: string) {
  switch (tier) {
    case "partner":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-200">
          <Award className="w-3 h-3" />
          NeuroChiro Recommended
        </span>
      );
    case "growth":
    case "featured":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#D66829]/10 text-[#D66829] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#D66829]/20">
          <Zap className="w-3 h-3" />
          Growth
        </span>
      );
    default:
      return null;
  }
}

function VendorCard({ vendor, index }: { vendor: any; index: number }) {
  const colorClass = INITIALS_COLORS[index % INITIALS_COLORS.length];
  const isPartner = vendor.tier === "partner";
  const isGrowth = vendor.tier === "growth" || vendor.tier === "featured";

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col ${
        isPartner ? "border-amber-200" : isGrowth ? "border-[#D66829]/30" : "border-gray-100"
      }`}
    >
      <div className="p-6 flex flex-col flex-1">
        {/* Top row: logo + badges */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {vendor.logo_url ? (
              <img
                src={vendor.logo_url}
                alt={vendor.name}
                className="w-12 h-12 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100"
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center text-white font-black text-sm`}
              >
                {getInitials(vendor.name)}
              </div>
            )}
            <div>
              <h3 className="font-heading font-black text-[#1E2D3B] text-lg leading-tight">
                {vendor.name}
              </h3>
              {vendor.categories && vendor.categories.length > 0 && (
                <span className="text-xs text-gray-400 font-medium">
                  {vendor.categories[0]}
                </span>
              )}
            </div>
          </div>
          {getTierBadge(vendor.tier)}
        </div>

        {/* Description */}
        {(vendor.short_description || vendor.full_description) && (
          <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
            {vendor.short_description || vendor.full_description}
          </p>
        )}

        {/* Discount */}
        {vendor.discount_code && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-green-700">
                {vendor.discount_description || "Exclusive member discount"}
              </p>
              <p className="text-[10px] text-green-600">
                Code:{" "}
                <span className="font-mono font-bold">
                  {vendor.discount_code}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-2 mt-auto">
          {vendor.website_url && (
            <a
              href={vendor.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2.5 bg-[#D66829] text-white font-bold rounded-xl text-sm hover:bg-[#c25a22] transition-colors flex items-center justify-center gap-2"
            >
              Visit Website <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {vendor.slug && (
            <Link
              href={`/marketplace/${vendor.slug}`}
              className="px-4 py-2.5 bg-gray-100 text-[#1E2D3B] font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors"
            >
              Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadVendors() {
      const data = await getVendors();
      if (data && data.length > 0) {
        setVendors(data as any);
      }
      setLoading(false);
    }
    loadVendors();
  }, []);

  const filteredVendors = vendors.filter((v) => {
    const matchesCategory =
      !activeCategory ||
      (v.categories && v.categories.includes(activeCategory));
    const matchesSearch =
      !searchQuery ||
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const partnerVendors = filteredVendors.filter((v) => v.tier === "partner");
  const growthVendors = filteredVendors.filter(
    (v) => v.tier === "growth" || v.tier === "featured"
  );
  const starterVendors = filteredVendors.filter(
    (v) => v.tier !== "partner" && v.tier !== "growth" && v.tier !== "featured"
  );

  const totalVendors = vendors.length;

  return (
    <div className="min-h-dvh bg-[#F5F3EF]">
      {/* Hero */}
      <section className="bg-[#F5F3EF] pt-32 pb-16 px-6 border-b border-gray-200">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D66829] mb-4">
            Trusted by Nervous-System-First Clinics
          </p>
          <h1 className="text-4xl md:text-6xl font-heading font-black text-[#1E2D3B] mb-4">
            The Chiropractic Marketplace
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
            Curated products, tools, and services for chiropractors who put the
            nervous system first. Exclusive member discounts on every listing.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mb-10 flex-wrap">
            <div className="px-5 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl font-black text-[#1E2D3B]">
                {totalVendors || "0"}
              </span>
              <span className="text-xs text-gray-400 font-bold ml-2 uppercase tracking-widest">
                Vendors
              </span>
            </div>
            <div className="px-5 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl font-black text-[#1E2D3B]">12</span>
              <span className="text-xs text-gray-400 font-bold ml-2 uppercase tracking-widest">
                Categories
              </span>
            </div>
            <div className="px-5 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl font-black text-[#D66829]">
                Exclusive
              </span>
              <span className="text-xs text-gray-400 font-bold ml-2 uppercase tracking-widest">
                Discounts
              </span>
            </div>
          </div>

          <Link
            href="/marketplace/apply"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#D66829] text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#c25a22] transition-all shadow-lg shadow-[#D66829]/20 text-sm"
          >
            List Your Product <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-xl font-heading font-black text-[#1E2D3B] mb-6">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {MARKETPLACE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.name;
            const count = vendors.filter(
              (v) => v.categories && v.categories.includes(cat.name)
            ).length;
            return (
              <button
                key={cat.name}
                onClick={() =>
                  setActiveCategory(isActive ? null : cat.name)
                }
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
                  isActive
                    ? "bg-[#1E2D3B] border-[#1E2D3B] text-white shadow-lg"
                    : "bg-white border-gray-100 text-[#1E2D3B] hover:border-[#D66829]/30 hover:shadow-md"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-[#D66829]" : "text-[#D66829]"
                  }`}
                />
                <span className="text-xs font-bold leading-tight">
                  {cat.name}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    isActive ? "text-gray-300" : "text-gray-400"
                  }`}
                >
                  {count} vendor{count !== 1 ? "s" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Search */}
      <section className="max-w-6xl mx-auto px-6 pb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-[#D66829]"
          />
        </div>
        {activeCategory && (
          <button
            onClick={() => setActiveCategory(null)}
            className="mt-3 text-xs font-bold text-[#D66829] hover:underline"
          >
            Clear category filter: {activeCategory}
          </button>
        )}
      </section>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-[#D66829] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredVendors.length === 0 && vendors.length === 0 ? (
        /* Empty State - No vendors at all */
        <section className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Store className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h3 className="text-2xl font-heading font-black text-[#1E2D3B] mb-3">
              The marketplace is growing.
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Be one of the first vendors to join and connect your product with
              nervous-system-first chiropractic practices.
            </p>
            <Link
              href="/marketplace/apply"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#D66829] text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#c25a22] transition-all text-sm"
            >
              Apply to List <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Trusted Partners (Partner Tier) */}
          {partnerVendors.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 py-8">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-5 h-5 text-amber-600" />
                <h2 className="text-xl font-heading font-black text-[#1E2D3B]">
                  Trusted Partners
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {partnerVendors.map((vendor, i) => (
                  <VendorCard key={vendor.id} vendor={vendor} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Featured Vendors (Growth Tier) */}
          {growthVendors.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 py-8">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-[#D66829]" />
                <h2 className="text-xl font-heading font-black text-[#1E2D3B]">
                  Featured Vendors
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {growthVendors.map((vendor, i) => (
                  <VendorCard key={vendor.id} vendor={vendor} index={i + partnerVendors.length} />
                ))}
              </div>
            </section>
          )}

          {/* All Vendors / Starter */}
          {starterVendors.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 py-8">
              <h2 className="text-xl font-heading font-black text-[#1E2D3B] mb-6">
                All Vendors
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {starterVendors.map((vendor, i) => (
                  <VendorCard
                    key={vendor.id}
                    vendor={vendor}
                    index={i + partnerVendors.length + growthVendors.length}
                  />
                ))}
              </div>
            </section>
          )}

          {/* No results for filter */}
          {filteredVendors.length === 0 && vendors.length > 0 && (
            <section className="max-w-2xl mx-auto px-6 py-16 text-center">
              <Search className="w-10 h-10 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#1E2D3B] mb-2">
                No vendors found
              </h3>
              <p className="text-gray-400 text-sm">
                Try a different category or search term.
              </p>
            </section>
          )}
        </>
      )}

      {/* Bottom CTA */}
      <section className="bg-[#1E2D3B] py-20 px-6 mt-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-black text-white mb-4">
            List Your Product on NeuroChiro
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Reach nervous-system-first chiropractors with three flexible tiers
            designed to grow with your business.
          </p>
          <div className="flex items-center justify-center gap-6 mb-10 flex-wrap text-sm">
            <div className="text-white/70">
              <span className="font-black text-white">Starter</span> $99/mo
            </div>
            <div className="text-[#D66829] font-bold">
              <span className="font-black">Growth</span> $249/mo
              <Star className="w-3 h-3 inline ml-1 fill-[#D66829]" />
            </div>
            <div className="text-white/70">
              <span className="font-black text-white">Partner</span> $499/mo
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/marketplace/apply"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#D66829] text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#c25a22] transition-all shadow-lg shadow-[#D66829]/30 text-sm"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/marketplace/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-colors text-sm"
            >
              Compare Plans
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
