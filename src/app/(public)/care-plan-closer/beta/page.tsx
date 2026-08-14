"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";

const VALUE_STACK = [
  { item: "Care Plan Closer built for YOUR practice", detail: "2 x 45-min calls with Dr. Ray", value: "$997" },
  { item: "Ongoing access + unlimited edits", detail: "Change pricing, add services, update plans anytime", value: "$197/mo" },
  { item: "Direct access to Dr. Ray for 90 days", detail: "Text or voice, not just email. Real support.", value: "$2,000" },
  { item: "Dr. Ray's personal ROF scripts and word tracks", detail: "The exact words he uses to close cases", value: "$500" },
  { item: "Recordings of your build calls", detail: "Rewatch, train your CA, onboard new associates", value: "$250" },
  { item: "Beta Founding Member status", detail: "Locked at this price forever. Never goes up.", value: "Priceless" },
];

const FULL_PRICE_SETUP = 997;
const FULL_PRICE_MONTHLY = 197;
const BETA_PRICE_SETUP = 497;
const BETA_PRICE_MONTHLY = 97;
const TOTAL_SPOTS = 10;

export default function CarePlanCloserBetaPage() {
  const [loading, setLoading] = useState(false);
  const [spotsLeft] = useState(TOTAL_SPOTS);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/care-plan-closer-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "beta" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      window.location.href = "https://calendly.com/neurochiro/care-plan-closer";
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh bg-[#0F1A24]">
      {/* Urgency Bar */}
      <div className="bg-neuro-orange py-2.5 px-6 text-center">
        <p className="text-white text-sm font-black">
          BETA FOUNDING MEMBER — Only {spotsLeft} of {TOTAL_SPOTS} spots remaining
        </p>
      </div>

      {/* Hero */}
      <div className="text-center px-6 pt-16 pb-12 max-w-3xl mx-auto">
        <p className="text-neuro-orange text-[11px] font-black uppercase tracking-[0.2em] mb-4">Beta Founding Member Offer</p>
        <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-6">
          Your Care Plans.<br />Built by Dr. Ray.<br />
          <span className="text-neuro-orange">Ready This Week.</span>
        </h1>
        <p className="text-white/45 text-lg leading-relaxed max-w-xl mx-auto">
          Stop winging your report of findings. Dr. Ray personally builds your care plans, pricing, and presentation scripts in two 45-minute calls. You use it with patients immediately.
        </p>
      </div>

      {/* Two-Column: Value Stack + Pricing */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Value Stack */}
          <div className="bg-[#1a2e40] rounded-2xl border border-white/[0.08] p-8">
            <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-6">What You Get</p>
            <div className="space-y-5">
              {VALUE_STACK.map((item, i) => (
                <div key={i} className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/80 text-sm font-bold">{item.item}</p>
                      <p className="text-white/30 text-xs mt-1">{item.detail}</p>
                    </div>
                  </div>
                  <span className={`text-white/20 text-sm font-bold whitespace-nowrap ${item.value !== "Priceless" ? "line-through" : ""}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.08] mt-6 pt-5 text-center">
              <p className="text-white/30 text-xs mb-1">Total value in year one:</p>
              <p className="text-white/15 text-3xl font-black line-through">$3,747+</p>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-neuro-orange/15 to-neuro-orange/5 rounded-2xl border-2 border-neuro-orange p-8 text-center flex-1" style={{ boxShadow: "0 20px 60px rgba(214,104,41,0.15)" }}>
              <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-2">Beta Founding Member Price</p>
              <p className="text-white/20 text-base line-through mb-2">${FULL_PRICE_SETUP} setup + ${FULL_PRICE_MONTHLY}/mo</p>
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-5xl font-black text-white">${BETA_PRICE_SETUP}</span>
                <span className="text-white/40 font-bold text-lg">setup</span>
              </div>
              <p className="text-white/50 text-base font-bold mb-1">+ ${BETA_PRICE_MONTHLY}/mo ongoing</p>
              <p className="text-green-400 text-xs font-black mb-8">Locked at this price forever. Never increases.</p>

              <button
                onClick={handleCheckout}
                disabled={loading || spotsLeft === 0}
                className="w-full py-4 bg-neuro-orange text-white font-black rounded-xl text-base flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-all disabled:opacity-50 shadow-lg shadow-neuro-orange/20"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? "Redirecting to checkout..." : spotsLeft === 0 ? "Beta is Full" : `Claim Your Spot — ${spotsLeft} Left`}
              </button>
              <p className="text-white/20 text-[11px] mt-3">Secure checkout via Stripe. Monthly billing starts after your build calls.</p>
            </div>

            {/* The Math */}
            <div className="bg-[#1a2e40] rounded-2xl border border-white/[0.08] p-6 text-center">
              <p className="text-white font-black text-lg mb-3">Do the math.</p>
              <p className="text-white/45 text-sm leading-relaxed">
                The average care plan is worth $2,000-4,000.
                One extra closed case per month = <strong className="text-white">$24,000-48,000/year</strong> in additional revenue.
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-neuro-orange font-black text-sm">Your investment: ${BETA_PRICE_SETUP} + ${BETA_PRICE_MONTHLY}/mo = ${BETA_PRICE_SETUP + (BETA_PRICE_MONTHLY * 12)}/yr</p>
                <p className="text-green-400 font-black text-sm mt-1">That's a 15-30x return</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works — Full Width */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-5">How It Works</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Pay the $497 setup fee today", detail: "Secures your beta spot and locks your price forever." },
            { step: "2", title: "Book your two 45-minute build calls", detail: "Dr. Ray builds your care plans, pricing, and scripts live on the call." },
            { step: "3", title: "Start using it with patients", detail: "Pull it up during your next ROF. Your $97/mo billing starts after the calls." },
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.03] rounded-xl p-5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neuro-orange/20 flex items-center justify-center text-neuro-orange font-black text-sm flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-white/80 text-sm font-bold">{item.title}</p>
                <p className="text-white/35 text-xs mt-1">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who This Is For */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-neuro-orange/[0.08] border border-neuro-orange/15 rounded-2xl p-8 text-center">
          <p className="text-white font-black text-lg mb-4">This is for chiropractors who:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
            {[
              "Know they're losing cases they should be closing",
              "Wing their report of findings every time",
              "Struggle with the money conversation",
              "Want a system, not another technique",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <ArrowRight className="w-3 h-3 text-neuro-orange flex-shrink-0" />
                <span className="text-white/50 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-xl mx-auto px-6 pb-16 text-center">
        <button
          onClick={handleCheckout}
          disabled={loading || spotsLeft === 0}
          className="w-full py-5 bg-neuro-orange text-white font-black rounded-xl text-lg flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-all disabled:opacity-50 shadow-lg shadow-neuro-orange/20 mb-4"
        >
          {loading ? "Redirecting..." : `Claim Your Beta Spot — $${BETA_PRICE_SETUP} Today`}
        </button>
        <p className="text-white/20 text-xs">Questions? Email support@neurochiro.co</p>
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-white/[0.05]">
        <p className="text-white/15 text-xs">NeuroChiro — neurochiro.co</p>
      </div>
    </div>
  );
}
