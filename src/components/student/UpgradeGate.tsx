"use client";

import { Lock, Zap, ArrowRight, GraduationCap, X, Check, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface StudentUpgradeGateProps {
  children: React.ReactNode;
  feature: string;
  description?: string;
}

function StudentUpgradeModal({ isOpen, onClose, userId, currentTier, highlightFeature }: {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  currentTier: string;
  highlightFeature?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const PRICE_IDS: Record<string, string> = {
    monthly: "price_STUDENT_PRO_MONTHLY", // TODO: Add real Stripe price ID
    annual: "price_STUDENT_PRO_ANNUAL",   // TODO: Add real Stripe price ID
  };

  const handleUpgrade = async () => {
    if (!userId || !PRICE_IDS[billing]) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: PRICE_IDS[billing], userId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const features = [
    { name: "Profile + job applications", free: true, pro: true },
    { name: "Job board access", free: true, pro: true },
    { name: "Seminars browsing", free: true, pro: true },
    { name: "Academy (basic modules)", free: true, pro: true },
    { name: "Messages", free: true, pro: true },
    { name: "Interview Prep", free: false, pro: true },
    { name: "Contract Lab", free: false, pro: true },
    { name: "Financial Planner", free: false, pro: true },
    { name: "Techniques Library", free: false, pro: true },
    { name: "Command Center", free: false, pro: true },
    { name: "Priority in talent drops", free: false, pro: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-[#0F172A] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 pb-4 flex items-start justify-between">
              <div>
                <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.2em] mb-2">Level Up Your Career</p>
                <h2 className="text-2xl font-black text-white">Student Plans</h2>
              </div>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-8 flex items-center justify-center gap-3 mb-4">
              <button onClick={() => setBilling("monthly")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${billing === "monthly" ? "bg-white/10 text-white" : "text-gray-500"}`}>Monthly</button>
              <button onClick={() => setBilling("annual")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billing === "annual" ? "bg-white/10 text-white" : "text-gray-500"}`}>Annual <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Save 15%</span></button>
            </div>

            <div className="p-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Free */}
              <div className={`rounded-2xl border p-6 border-white/10 bg-white/[0.02] ${currentTier === "free" || currentTier === "starter" ? "ring-2 ring-neuro-orange" : ""}`}>
                {(currentTier === "free" || currentTier === "starter") && (
                  <div className="text-[10px] font-black text-neuro-orange uppercase tracking-widest mb-3">Current Plan</div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-black text-white">Free</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black text-white">$0</span>
                  <span className="text-sm text-gray-500">forever</span>
                </div>
                <p className="text-xs text-gray-500 mb-5">Get started on your career</p>
                <div className="space-y-2.5">
                  {features.map((f) => (
                    <div key={f.name} className={`flex items-center gap-2 text-xs ${f.free ? "text-gray-300" : "text-gray-600"} ${highlightFeature === f.name && !f.free ? "text-red-400 font-bold" : ""}`}>
                      {f.free ? <Check className="w-3.5 h-3.5 text-green-500" /> : <X className="w-3.5 h-3.5 text-gray-700" />}
                      {f.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro */}
              <div className="rounded-2xl border p-6 border-neuro-orange/30 bg-neuro-orange/5 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-neuro-orange rounded-full text-[10px] font-black text-white uppercase tracking-widest">Recommended</div>
                <div className="flex items-center gap-2 mb-3 mt-1">
                  <Crown className="w-5 h-5 text-neuro-orange" />
                  <h3 className="text-lg font-black text-white">Student Pro</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black text-white">{billing === "annual" ? "$25" : "$29"}</span>
                  <span className="text-sm text-gray-500">/mo</span>
                </div>
                {billing === "annual" && <p className="text-xs text-green-400 font-bold mb-2">Billed at $300/yr</p>}
                <p className="text-xs text-gray-500 mb-5">Everything to launch your career</p>
                <div className="space-y-2.5 mb-6">
                  {features.map((f) => (
                    <div key={f.name} className="flex items-center gap-2 text-xs text-gray-300">
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      {f.name}
                    </div>
                  ))}
                </div>
                <button onClick={handleUpgrade} disabled={loading} className="w-full py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange-light transition-all disabled:opacity-50 shadow-lg shadow-neuro-orange/20">
                  {loading ? "Redirecting..." : "Upgrade to Student Pro"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function StudentUpgradeGate({ children, feature, description }: StudentUpgradeGateProps) {
  const [tier, setTier] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data: profile } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
      setTier(profile?.tier || "starter");
      setLoading(false);
    });
  }, []);

  if (loading) return <>{children}</>;

  const isPaid = tier && !["free", "starter"].includes(tier);
  if (isPaid) return <>{children}</>;

  return (
    <>
      <div className="relative min-h-[60vh]">
        <div className="blur-sm opacity-40 pointer-events-none select-none" aria-hidden="true">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-10 max-w-md text-center mx-4">
            <div className="w-16 h-16 bg-neuro-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-neuro-orange" />
            </div>
            <h3 className="text-xl font-heading font-black text-neuro-navy mb-2">{feature}</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {description || `This tool is available on Student Pro. Upgrade to unlock all career tools and get ahead of your classmates.`}
            </p>
            <button onClick={() => setShowModal(true)} className="w-full py-4 bg-neuro-orange text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-neuro-orange/20 hover:bg-neuro-orange-light transition-all flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Unlock for $29/mo
            </button>
            <button onClick={() => setShowModal(true)} className="mt-3 text-xs font-bold text-neuro-orange hover:underline flex items-center justify-center gap-1 mx-auto">
              See plans <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <StudentUpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} currentTier={tier || "starter"} userId={userId || undefined} highlightFeature={feature} />
    </>
  );
}
