"use client";

import { X, Check, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  userId?: string;
  highlightFeature?: string;
}

const PRO_FEATURES = [
  "Full directory listing",
  "Contact info visible to patients",
  "Phone, website, booking link",
  "Social media links",
  "Verified badge",
  "Priority search ranking",
  "Analytics dashboard",
  "Patient leads & messaging",
  "KPI Tracker",
  "AI Bio Generator",
  "ChiroMatch hiring",
  "Care Plan Builder",
  "Scan Reports",
  "Content Library",
  "CE Tracker",
];

const STRIPE_PRICE_ID = "price_1TS56YQ4WJOENoxriuU4hW5Z";

export default function UpgradeModal({ isOpen, onClose, currentTier = "free", userId, highlightFeature }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: STRIPE_PRICE_ID, userId, tier: "pro" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
    setLoading(false);
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
            className="relative w-full max-w-md bg-[#0F172A] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-start justify-between">
              <div>
                <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.2em] mb-2">Upgrade Your Practice</p>
                <h2 className="text-2xl font-black text-white">Go Pro</h2>
                <p className="text-gray-500 text-sm mt-1">Everything unlocked. One simple price.</p>
              </div>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price */}
            <div className="px-8 pb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">$49</span>
                <span className="text-gray-500 font-bold">/mo</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">One new patient pays for a full year.</p>
            </div>

            {/* Features */}
            <div className="px-8 pb-6">
              <div className="grid grid-cols-1 gap-2">
                {PRO_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-neuro-orange flex-shrink-0" />
                    <span className={`text-sm ${feature === highlightFeature ? 'text-white font-bold' : 'text-gray-400'}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="p-8 pt-2">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-4 bg-neuro-orange text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-neuro-orange/20 hover:bg-neuro-orange/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Redirecting..." : <><Zap className="w-4 h-4" /> Upgrade to Pro — $49/mo</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
