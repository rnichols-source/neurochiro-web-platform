"use client";

import { X, Check, Star, Zap, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  userId?: string;
  highlightFeature?: string;
}

const tiers = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Basic directory listing",
    icon: Star,
    color: "text-gray-400",
    bg: "bg-white/5",
    border: "border-white/10",
    features: [
      { name: "Directory listing", included: true },
      { name: "Profile page", included: true },
      { name: "Profile views count", included: true },
      { name: "Patient messaging", included: false },
      { name: "Analytics dashboard", included: false },
      { name: "KPI Tracker", included: false },
      { name: "AI Bio Generator", included: false },
      { name: "Job posting", included: false },
      { name: "Care Plan Builder", included: false },
      { name: "Scan Reports", included: false },
      { name: "P&L Analyzer", included: false },
      { name: "Verified badge", included: false },
      { name: "Priority search", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$69",
    period: "/mo",
    description: "Everything to grow your practice",
    icon: Zap,
    color: "text-neuro-orange",
    bg: "bg-neuro-orange/5",
    border: "border-neuro-orange/30",
    popular: true,
    features: [
      { name: "Directory listing", included: true },
      { name: "Profile page", included: true },
      { name: "Profile views count", included: true },
      { name: "Patient messaging", included: true },
      { name: "Analytics dashboard", included: true },
      { name: "KPI Tracker", included: true },
      { name: "AI Bio Generator", included: true },
      { name: "Job posting", included: true },
      { name: "Care Plan Builder", included: false },
      { name: "Scan Reports", included: false },
      { name: "P&L Analyzer", included: false },
      { name: "Verified badge", included: true },
      { name: "Priority search", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$129",
    period: "/mo",
    description: "Full suite — every tool unlocked",
    icon: Crown,
    color: "text-yellow-400",
    bg: "bg-yellow-400/5",
    border: "border-yellow-400/30",
    features: [
      { name: "Directory listing", included: true },
      { name: "Profile page", included: true },
      { name: "Profile views count", included: true },
      { name: "Patient messaging", included: true },
      { name: "Analytics dashboard", included: true },
      { name: "KPI Tracker", included: true },
      { name: "AI Bio Generator", included: true },
      { name: "Job posting", included: true },
      { name: "Care Plan Builder", included: true },
      { name: "Scan Reports", included: true },
      { name: "P&L Analyzer", included: true },
      { name: "Verified badge", included: true },
      { name: "Priority search", included: true },
    ],
  },
];

// Map Stripe price IDs — update these with your actual Stripe price IDs
const PRICE_IDS: Record<string, string> = {
  growth: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID || "",
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "",
};

export default function UpgradeModal({ isOpen, onClose, currentTier = "free", userId, highlightFeature }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (tierId: string) => {
    if (!userId || !PRICE_IDS[tierId]) return;
    setLoading(tierId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: PRICE_IDS[tierId], userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
    setLoading(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-4xl bg-[#0F172A] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-start justify-between">
              <div>
                <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.2em] mb-2">Upgrade Your Practice</p>
                <h2 className="text-2xl font-black text-white">Choose Your Plan</h2>
                <p className="text-gray-500 text-sm mt-1">Founding member pricing is no longer available. These are the current rates.</p>
              </div>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tiers */}
            <div className="p-8 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers.map((tier) => {
                const isCurrent = tier.id === currentTier;
                const isUpgrade = !isCurrent && tier.id !== "free";
                return (
                  <div
                    key={tier.id}
                    className={`rounded-2xl border p-6 relative ${
                      tier.popular ? `${tier.border} ${tier.bg}` : "border-white/10 bg-white/[0.02]"
                    } ${isCurrent ? "ring-2 ring-neuro-orange" : ""}`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-neuro-orange rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                        Most Popular
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                        Current Plan
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3 mt-1">
                      <tier.icon className={`w-5 h-5 ${tier.color}`} />
                      <h3 className="text-lg font-black text-white">{tier.name}</h3>
                    </div>

                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-black text-white">{tier.price}</span>
                      <span className="text-sm text-gray-500">{tier.period}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-5">{tier.description}</p>

                    {/* Features */}
                    <div className="space-y-2.5 mb-6">
                      {tier.features.map((feature) => (
                        <div
                          key={feature.name}
                          className={`flex items-center gap-2 text-xs ${
                            feature.included ? "text-gray-300" : "text-gray-600"
                          } ${highlightFeature === feature.name && !feature.included ? "text-red-400 font-bold" : ""}`}
                        >
                          {feature.included ? (
                            <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
                          )}
                          {feature.name}
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    {isCurrent ? (
                      <div className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Your Plan
                      </div>
                    ) : isUpgrade ? (
                      <button
                        onClick={() => handleUpgrade(tier.id)}
                        disabled={loading === tier.id}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                          tier.popular
                            ? "bg-neuro-orange text-white hover:bg-neuro-orange-light shadow-lg shadow-neuro-orange/20"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {loading === tier.id ? "Redirecting..." : `Upgrade to ${tier.name}`}
                      </button>
                    ) : (
                      <div className="py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-widest">
                        Free Forever
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
