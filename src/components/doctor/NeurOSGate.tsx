"use client";

import { Lock, Cpu, ArrowRight, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface NeurOSGateProps {
  children: React.ReactNode;
  feature?: string;
}

export default function NeurOSGate({ children, feature }: NeurOSGateProps) {
  const [hasNeurOS, setHasNeurOS] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data: doctor } = await supabase
        .from("doctors")
        .select("neuros_tier")
        .eq("user_id", user.id)
        .single() as any;

      setHasNeurOS(
        doctor?.neuros_tier === "neuros" ||
        doctor?.neuros_tier === "neuros_founding"
      );
      setLoading(false);
    });
  }, []);

  if (loading) return <>{children}</>;
  if (hasNeurOS) return <>{children}</>;

  const handleCheckout = async (cycle: "monthly" | "annual") => {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/stripe/neuros-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setCheckingOut(false);
    }
  };

  const features = [
    "The Care Plan Closer (AI-powered, unlimited)",
    "The Profit Pulse (P&L tracking)",
    "The Daily Scorecard (KPIs + coaching alerts)",
    "The Patient Converter (scan reports)",
    "The Compliance Shield (CE tracking)",
    "The Revenue Maximizer (fee schedules)",
    "The Quarterly Playbook (90-day goals)",
    "The Command Center (mobile)",
    "White-label branding (your logo)",
    "NeuroChiro Pro included FREE",
    "All future tools forever",
  ];

  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred content */}
      <div className="blur-sm opacity-30 pointer-events-none select-none max-h-[70vh] overflow-hidden" aria-hidden="true">
        {children}
      </div>

      {/* NeurOS upgrade overlay */}
      <div className="absolute inset-0 flex items-start justify-center z-10 pt-8 md:pt-16">
        <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1E2D3B] to-[#2a3f52] px-8 py-6 text-center">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Cpu className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-black text-white">
              {feature || "NeurOS Practice Operating System"}
            </h3>
            <p className="text-blue-200/60 text-sm mt-1">
              Close more care plans. Collect more money. Run your practice in 10 minutes a day.
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <div className="space-y-2 mb-6">
              {features.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{f}</span>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="border border-gray-100 rounded-xl p-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-black text-[#1E2D3B]">$297<span className="text-sm font-normal text-gray-400">/mo</span></div>
                <div className="text-xs text-gray-400 mt-1">+ $497 one-time setup fee</div>
              </div>
            </div>

            {/* CTAs */}
            <button
              onClick={() => handleCheckout("monthly")}
              disabled={checkingOut}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {checkingOut ? "Redirecting..." : "Get NeurOS — $297/mo"}
            </button>

            <button
              onClick={() => handleCheckout("annual")}
              disabled={checkingOut}
              className="w-full mt-2 py-3 bg-white text-blue-600 border-2 border-blue-100 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-50 transition-all disabled:opacity-50"
            >
              Annual: $2,997/yr (setup fee waived, save $567)
            </button>

            {/* Guarantee */}
            <div className="mt-4 bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-green-800 font-semibold">60-Day Care Plan Guarantee</p>
              <p className="text-xs text-green-600 mt-0.5">Close 1 extra care plan or get a full refund.</p>
            </div>

            <a
              href="/neuros"
              className="mt-3 text-xs font-bold text-blue-500 hover:underline flex items-center justify-center gap-1"
            >
              Learn more about NeurOS <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
