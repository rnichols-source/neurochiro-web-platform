"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createVendorCheckout } from "./actions";
import { Star, CheckCircle2 } from "lucide-react";

const MARKETPLACE_CATEGORIES = [
  "Tables & Equipment",
  "Imaging & Scans",
  "EHR & Software",
  "Marketing",
  "Supplements",
  "Education & Coaching",
  "Billing & Collections",
  "Legal & Compliance",
  "Office Supplies & Design",
  "Staffing & HR",
  "Financial Services",
  "Real Estate",
];

const TIERS = [
  {
    key: "starter" as const,
    name: "Starter",
    price: 99,
    features: [
      "Listed in the marketplace directory",
      "Profile page with product showcase",
      "Discount code displayed to 140+ doctors",
      "Monthly views & click analytics",
      "Listed on NeuroChiro Instagram highlights",
    ],
  },
  {
    key: "growth" as const,
    name: "Growth",
    price: 249,
    popular: true,
    features: [
      "Everything in Starter",
      "Featured at top of your category",
      "Monthly email blast to matching doctors",
      "Lead capture — doctors contact you directly",
      "Monthly Instagram promotion (post + story)",
      "Vendor Spotlight interview on your page",
    ],
  },
  {
    key: "partner" as const,
    name: "Partner",
    price: 499,
    features: [
      "Everything in Growth",
      "Featured on the NeuroChiro homepage",
      "\"NeuroChiro Recommended\" badge",
      "Weekly Instagram promotion (4x/month)",
      "Sponsor a NeuroChiro Spotlight episode",
      "Personal intros to top practices",
    ],
  },
];

export default function VendorApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#F5F3EF] pt-24 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#D66829] border-t-transparent rounded-full animate-spin" /></div>}>
      <VendorApplyForm />
    </Suspense>
  );
}

function VendorApplyForm() {
  const searchParams = useSearchParams();
  const [selectedTier, setSelectedTier] = useState<"starter" | "growth" | "partner">("growth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const tierParam = searchParams.get("tier");
    if (tierParam === "starter" || tierParam === "growth" || tierParam === "partner") {
      setSelectedTier(tierParam);
    }
  }, [searchParams]);

  const currentTier = TIERS.find((t) => t.key === selectedTier)!;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await createVendorCheckout({
      companyName: fd.get("companyName") as string,
      email: fd.get("email") as string,
      website: fd.get("website") as string,
      category: fd.get("category") as string,
      description: fd.get("description") as string,
      tier: selectedTier,
    });
    if ("error" in result && result.error) {
      setError(result.error as string);
      setLoading(false);
      return;
    }
    if (result.url) window.location.href = result.url;
  };

  return (
    <div className="min-h-dvh bg-[#F5F3EF] pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10 space-y-3">
          <span className="text-[#D66829] font-black uppercase tracking-[0.4em] text-[10px]">
            Partnership
          </span>
          <h1 className="text-4xl font-heading font-black text-[#1E2D3B]">
            Join the Marketplace.
          </h1>
          <p className="text-gray-500">
            Select your tier and connect your product with high-volume,
            nervous-system-first clinics.
          </p>
        </div>

        {/* Tier Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {TIERS.map((tier) => (
            <button
              key={tier.key}
              type="button"
              onClick={() => setSelectedTier(tier.key)}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                selectedTier === tier.key
                  ? "border-[#D66829] bg-white shadow-lg shadow-[#D66829]/10"
                  : "border-gray-200 bg-white/60 hover:border-gray-300"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-0.5 bg-[#D66829] text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  <Star className="w-3 h-3 fill-white" />
                  Popular
                </span>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedTier === tier.key
                      ? "border-[#D66829]"
                      : "border-gray-300"
                  }`}
                >
                  {selectedTier === tier.key && (
                    <div className="w-2 h-2 rounded-full bg-[#D66829]" />
                  )}
                </div>
                <span className="font-bold text-[#1E2D3B]">{tier.name}</span>
              </div>
              <p className="text-2xl font-black text-[#1E2D3B] mb-2">
                ${tier.price}
                <span className="text-sm font-bold text-gray-400">/mo</span>
              </p>
              <div className="space-y-1">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span className="text-xs text-gray-500">{f}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl space-y-5"
        >
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Company Name
            </label>
            <input
              name="companyName"
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-[#D66829]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Contact Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-[#D66829]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Website
            </label>
            <input
              name="website"
              type="url"
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-[#D66829]"
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Category
            </label>
            <select
              name="category"
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-[#D66829]"
            >
              <option value="">Select a category</option>
              {MARKETPLACE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-[#D66829] resize-none"
              placeholder="How does your product serve chiropractors?"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#D66829] text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#c25a22] transition-all disabled:opacity-50"
          >
            {loading
              ? "Redirecting to checkout..."
              : `Apply & Pay $${currentTier.price}/month`}
          </button>
        </form>
      </div>
    </div>
  );
}
