"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Phone, FileText, Shield, MessageSquare, Clock, Zap, Star, ArrowRight, X, Lock } from "lucide-react";
import Link from "next/link";

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
  const [spotsLeft] = useState(TOTAL_SPOTS); // Update this manually as spots fill

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Create a Stripe checkout session for the setup fee
      // Monthly billing starts after setup via separate subscription
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
      // Fallback: direct to contact
      window.location.href = "https://calendly.com/neurochiro/care-plan-closer";
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#0F1A24" }}>
      {/* Urgency Bar */}
      <div style={{ background: "#D66829", padding: "10px 24px", textAlign: "center" }}>
        <p style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>
          BETA FOUNDING MEMBER — Only {spotsLeft} of {TOTAL_SPOTS} spots remaining. This price disappears when they're gone.
        </p>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "48px 24px 24px", maxWidth: 640, margin: "0 auto" }}>
        <p style={{ color: "#D66829", fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>
          Beta Founding Member Offer
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: 16 }}>
          Your Care Plans.<br />Built by Dr. Ray.<br />
          <span style={{ color: "#D66829" }}>Ready This Week.</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
          Stop winging your report of findings. Dr. Ray personally builds your care plans, pricing, and presentation scripts in two 45-minute calls. You use it with patients immediately.
        </p>
      </div>

      {/* Value Stack */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 24px 32px" }}>
        <div style={{ background: "#1a2e40", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", padding: 32 }}>
          <p style={{ color: "#D66829", fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20 }}>
            What You Get
          </p>

          <div style={{ display: "grid", gap: 16 }}>
            {VALUE_STACK.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1 }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: "#22c55e", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 700 }}>{item.item}</p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 2 }}>{item.detail}</p>
                  </div>
                </div>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 700, textDecoration: item.value !== "Priceless" ? "line-through" : "none", whiteSpace: "nowrap" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Total Value */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 24, paddingTop: 20, textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginBottom: 4 }}>Total value in year one:</p>
            <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 28, fontWeight: 900, textDecoration: "line-through" }}>$3,747+</p>
          </div>
        </div>
      </div>

      {/* Pricing Card */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 24px 32px" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(214,104,41,0.15), rgba(214,104,41,0.05))", borderRadius: 24, border: "2px solid #D66829", padding: 32, textAlign: "center", boxShadow: "0 20px 60px rgba(214,104,41,0.15)" }}>
          <p style={{ color: "#D66829", fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>
            Beta Founding Member Price
          </p>

          {/* Full price crossed out */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 16, textDecoration: "line-through" }}>${FULL_PRICE_SETUP} setup + ${FULL_PRICE_MONTHLY}/mo</span>
          </div>

          {/* Beta price */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: "#fff" }}>${BETA_PRICE_SETUP}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>setup</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            + ${BETA_PRICE_MONTHLY}/mo ongoing
          </p>
          <p style={{ color: "#22c55e", fontSize: 12, fontWeight: 800, marginBottom: 24 }}>
            Locked at this price forever. Never increases.
          </p>

          <button
            onClick={handleCheckout}
            disabled={loading || spotsLeft === 0}
            style={{
              width: "100%", padding: "18px 0", background: "#D66829", color: "#fff", fontWeight: 900,
              borderRadius: 12, border: "none", fontSize: 16, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 10, opacity: loading ? 0.6 : 1,
              boxShadow: "0 4px 20px rgba(214,104,41,0.4)",
            }}
          >
            {loading && <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />}
            {loading ? "Redirecting to checkout..." : spotsLeft === 0 ? "Beta is Full" : `Claim Your Spot — ${spotsLeft} Left`}
          </button>

          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 12 }}>
            Secure checkout via Stripe. Setup fee charged today. Monthly billing starts after your build calls.
          </p>
        </div>
      </div>

      {/* The Math */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 24px 32px" }}>
        <div style={{ background: "#1a2e40", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", padding: 28, textAlign: "center" }}>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 12 }}>Do the math.</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7 }}>
            The average care plan is worth $2,000-4,000.
            If this tool helps you close just <strong style={{ color: "#fff" }}>one extra case per month</strong>,
            that's $24,000-48,000 in additional revenue per year.
          </p>
          <p style={{ color: "#D66829", fontWeight: 800, fontSize: 14, marginTop: 12 }}>
            Your investment: ${BETA_PRICE_SETUP} + ${BETA_PRICE_MONTHLY}/mo = ${BETA_PRICE_SETUP + (BETA_PRICE_MONTHLY * 12)}/yr
          </p>
          <p style={{ color: "#22c55e", fontWeight: 800, fontSize: 14, marginTop: 4 }}>
            ROI: 15-30x return on one extra closed case per month
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 24px 32px" }}>
        <p style={{ color: "#D66829", fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>
          How It Works
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            { step: "1", title: "You pay the $497 setup fee today", detail: "Secures your beta spot and locks your price forever." },
            { step: "2", title: "Book your two 45-minute build calls", detail: "Dr. Ray builds your care plans, pricing, and scripts live on the call." },
            { step: "3", title: "Start using it with patients", detail: "Pull it up during your next ROF. Your $97/mo billing starts after the calls." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(214,104,41,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#D66829", fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
                {item.step}
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 700 }}>{item.title}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 24px 48px", textAlign: "center" }}>
        <button
          onClick={handleCheckout}
          disabled={loading || spotsLeft === 0}
          style={{
            width: "100%", padding: "18px 0", background: "#D66829", color: "#fff", fontWeight: 900,
            borderRadius: 12, border: "none", fontSize: 16, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 10, opacity: loading ? 0.6 : 1,
            boxShadow: "0 4px 20px rgba(214,104,41,0.4)", marginBottom: 16,
          }}
        >
          {loading ? "Redirecting..." : `Claim Your Beta Spot — $${BETA_PRICE_SETUP} Today`}
        </button>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
          Questions? Email support@neurochiro.co
        </p>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: 24, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
          NeuroChiro — neurochiro.co
        </p>
      </div>
    </div>
  );
}
