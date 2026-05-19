"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Check, Loader2 } from "lucide-react";
import { createStudentCheckout } from "@/app/(auth)/actions/student-checkout";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function StudentSubscribePage() {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if already subscribed — redirect to dashboard if so
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        // Not logged in — redirect to login
        router.push('/login?redirect=/student/subscribe');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, stripe_customer_id')
        .eq('id', user.id)
        .single();
      const tier = (profile as any)?.tier;
      const hasStripe = !!(profile as any)?.stripe_customer_id;
      const isSubscribed = hasStripe || (tier && tier !== 'basic' && tier !== 'free');
      if (isSubscribed) {
        router.push('/student/dashboard');
        return;
      }
      setCheckingAuth(false);
    });
  }, [router]);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await createStudentCheckout(billing);
      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const price = billing === "monthly" ? "12" : "10";
  const features = [
    "Career Readiness Score & Pipeline",
    "All 6 Academy courses",
    "Technique Explorer & Quiz",
    "Interview Playbook (100+ questions)",
    "Job Board with match scoring",
    "Mentor Discovery",
    "Contract Lab (AI analysis)",
    "Financial Planner",
    "Student Network",
    "Direct messaging with doctors",
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#D66829]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-7 h-7 text-[#D66829]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h1>
          <p className="text-white/40 text-sm">
            One plan. Everything included. Cancel anytime.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className={`text-sm font-medium ${billing === "monthly" ? "text-white" : "text-white/30"}`}>Monthly</span>
          <button
            onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
            className="relative w-12 h-6 bg-white/[0.08] rounded-full transition-colors"
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-[#D66829] rounded-full transition-all ${billing === "annual" ? "left-[26px]" : "left-0.5"}`} />
          </button>
          <span className={`text-sm font-medium ${billing === "annual" ? "text-white" : "text-white/30"}`}>
            Annual <span className="text-green-400 text-xs font-bold">Save 17%</span>
          </span>
        </div>

        {/* Pricing card */}
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-[#D66829]/30 p-6 shadow-lg shadow-black/20 mb-6">
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-lg text-white/30">$</span>
              <span className="text-5xl font-bold text-white">{price}</span>
              <span className="text-white/30 font-medium">/mo</span>
            </div>
            {billing === "annual" && (
              <p className="text-xs text-white/30 mt-1">$120 billed annually</p>
            )}
          </div>

          <div className="space-y-2.5 mb-6">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#D66829] flex-shrink-0 mt-0.5" />
                <span className="text-[13px] text-white/60">{f}</span>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center mb-4">{error}</p>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-3.5 bg-[#D66829] text-white font-semibold rounded-lg hover:bg-[#e8834a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#D66829]/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to checkout...
              </>
            ) : (
              `Subscribe — $${price}/mo`
            )}
          </button>
        </div>

        <p className="text-center text-[11px] text-white/20">
          Secure checkout powered by Stripe. Cancel anytime from your billing page.
        </p>
      </div>
    </div>
  );
}
