"use client";

import { Lock, Zap, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import UpgradeModal from "./UpgradeModal";

interface UpgradeGateProps {
  children: React.ReactNode;
  feature: string;
  requiredTier?: "pro" | "neuros";
  description?: string;
}

const TIER_LEVELS: Record<string, number> = {
  free: 0,
  basic: 0,
  starter: 0,
  standard: 0,
  growth: 1,
  pro: 1,
  neuros: 2,
};

export default function UpgradeGate({ children, feature, requiredTier, description }: UpgradeGateProps) {
  const [tier, setTier] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [isFounder, setIsFounder] = useState(false);
  const [inTrial, setInTrial] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: doctor } = await supabase
        .from("doctors")
        .select("membership_tier, is_founding_member, trial_ends_at, neuros_tier")
        .eq("user_id", user.id)
        .single() as any;

      // If user has NeurOS, set tier to neuros (highest level)
      if (doctor?.neuros_tier === 'neuros' || doctor?.neuros_tier === 'neuros_founding') {
        setTier("neuros");
      } else {
        setTier(doctor?.membership_tier || "free");
      }
      setIsFounder(doctor?.is_founding_member || false);

      // Check active trial
      if (doctor?.trial_ends_at && new Date(doctor.trial_ends_at) > new Date()) {
        setInTrial(true);
        setTrialDaysLeft(Math.ceil((new Date(doctor.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      }

      setLoading(false);
    });
  }, []);

  if (loading) return <>{children}</>;

  // Founding members get access to EVERYTHING
  if (isFounder) return <>{children}</>;

  // Active trial gets full access with a banner
  if (inTrial) return (
    <>
      <div className="bg-neuro-orange/10 border border-neuro-orange/20 rounded-xl px-4 py-2 mb-4 flex items-center justify-between">
        <p className="text-sm text-neuro-orange font-bold">Pro Trial: {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left</p>
        <a href="/doctor/billing" className="text-xs font-bold text-neuro-orange hover:underline">Keep access →</a>
      </div>
      {children}
    </>
  );

  const currentLevel = TIER_LEVELS[tier || "basic"] || 0;
  const requiredLevel = TIER_LEVELS[requiredTier || "pro"] || 1;
  const isLocked = currentLevel < requiredLevel;

  // If they have access, just render the children
  if (!isLocked) return <>{children}</>;

  // If locked, show the content with an overlay
  const tierLabel = "Pro";
  const tierPrice = "$49";

  return (
    <>
      <div className="relative min-h-[60vh]">
        {/* Blurred content underneath */}
        <div className="blur-sm opacity-40 pointer-events-none select-none max-h-[70vh] overflow-hidden" aria-hidden="true">
          {children}
        </div>

        {/* Upgrade overlay */}
        <div className="absolute inset-0 flex items-start justify-center z-10 pt-12 md:pt-20">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-10 max-w-md text-center mx-4">
            <div className="w-16 h-16 bg-neuro-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-neuro-orange" />
            </div>
            <h3 className="text-xl font-heading font-black text-neuro-navy mb-2">
              {feature}
            </h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {description || `This tool is available on the ${tierLabel} plan. Upgrade to unlock all practice tools and grow your patient base.`}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-4 bg-neuro-orange text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-neuro-orange/20 hover:bg-neuro-orange-light transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> Unlock for {tierPrice}/mo
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-xs font-bold text-neuro-orange hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              Learn more about Pro <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentTier={tier || "basic"}
        userId={userId || undefined}
        highlightFeature={feature}
      />
    </>
  );
}
