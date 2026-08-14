"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Calendar, Clock, Users, Zap, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

const DEMO_DATE = "August 28, 2026";
const DEMO_TIME = "7:00 PM EST";
const DEMO_DATETIME = new Date("2026-08-28T19:00:00-04:00");

const WHAT_YOULL_SEE = [
  "A live care plan built from scratch in real time",
  "How to present it during a report of findings so patients say yes",
  "The exact scripts and word tracks Dr. Ray uses in his own practice",
  "Real results: what changed in case acceptance after using this tool",
  "Q&A where you can ask anything",
];

export default function CarePlanCloserDemoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const daysUntil = Math.max(0, Math.ceil((DEMO_DATETIME.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (!name || !email) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: name,
          source: "care_plan_closer_demo",
          role: "doctor",
        }),
      });

      // Discord notification
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "notify@internal", source: "skip" }),
        }).catch(() => {});
      } catch {}

      setRegistered(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (registered) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0F1A24", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ background: "#1a2e40", borderRadius: 24, padding: 48, border: "1px solid rgba(255,255,255,0.08)" }}>
            <CheckCircle2 style={{ width: 64, height: 64, color: "#22c55e", margin: "0 auto 20px" }} />
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 8 }}>You're Registered!</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Mark your calendar: {DEMO_DATE} at {DEMO_TIME}. We'll send you the Zoom link before the demo.
            </p>
            <div style={{ background: "rgba(214,104,41,0.1)", border: "1px solid rgba(214,104,41,0.2)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <p style={{ color: "#D66829", fontWeight: 800, fontSize: 13 }}>What to expect:</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                60 minutes. Live demo. Real results. And an exclusive beta offer for the first 10 doctors only.
              </p>
            </div>
            <Link href="/" style={{ color: "#D66829", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              Back to NeuroChiro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0F1A24" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "64px 24px 32px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(214,104,41,0.15)", border: "1px solid rgba(214,104,41,0.3)", borderRadius: 100, padding: "8px 16px", marginBottom: 24 }}>
          <Calendar style={{ width: 14, height: 14, color: "#D66829" }} />
          <span style={{ fontSize: 11, fontWeight: 900, color: "#D66829", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Free Live Demo — {DEMO_DATE}
          </span>
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: 16 }}>
          Close More Care Plans.<br />
          <span style={{ color: "#D66829" }}>Stop Losing Cases.</span>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, lineHeight: 1.7, maxWidth: 500, margin: "0 auto 8px" }}>
          Watch Dr. Ray build a care plan live, present it the way he does with real patients, and show you exactly how this tool changed his case acceptance.
        </p>

        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, marginBottom: 32 }}>
          {daysUntil === 0 ? "Today" : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} away`} — {DEMO_TIME} on Zoom — Free
        </p>
      </div>

      {/* Registration Form */}
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 24px 32px" }}>
        <form onSubmit={handleSubmit} style={{ background: "#1a2e40", borderRadius: 24, padding: 32, border: "2px solid #D66829", boxShadow: "0 20px 60px rgba(214,104,41,0.15)" }}>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 14, color: "#fff", marginBottom: 12, outline: "none", boxSizing: "border-box" }}
          />
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 14, color: "#fff", marginBottom: 16, outline: "none", boxSizing: "border-box" }}
          />

          {/* Honeypot */}
          <div style={{ position: "absolute", left: -9999 }} aria-hidden="true">
            <input type="text" name="company_url" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "16px 0", background: "#D66829", color: "#fff", fontWeight: 900,
              borderRadius: 12, border: "none", fontSize: 15, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.6 : 1,
              boxShadow: "0 4px 20px rgba(214,104,41,0.4)",
            }}
          >
            {loading && <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />}
            {loading ? "Registering..." : "Save My Spot — Free"}
          </button>

          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 12 }}>
            Free. No credit card. Zoom link sent to your email.
          </p>
        </form>
      </div>

      {/* What You'll See */}
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 24px 32px" }}>
        <p style={{ color: "#D66829", fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>
          What You'll See in the Demo
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {WHAT_YOULL_SEE.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckCircle2 style={{ width: 16, height: 16, color: "#22c55e", flexShrink: 0, marginTop: 2 }} />
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats/Social Proof */}
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 24px 32px" }}>
        <div style={{ background: "#1a2e40", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center" }}>
          {[
            { value: "10", label: "Beta Spots" },
            { value: "60", label: "Minutes" },
            { value: "$0", label: "To Attend" },
          ].map((stat, i) => (
            <div key={i} style={{ padding: "20px 12px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#D66829" }}>{stat.value}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 4 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Who This Is For */}
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 24px 48px" }}>
        <div style={{ background: "rgba(214,104,41,0.08)", border: "1px solid rgba(214,104,41,0.15)", borderRadius: 16, padding: 24, textAlign: "center" }}>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, marginBottom: 8 }}>This is for chiropractors who:</p>
          <div style={{ display: "grid", gap: 8, textAlign: "left", maxWidth: 360, margin: "0 auto" }}>
            {[
              "Know they're losing cases they should be closing",
              "Wing their report of findings every time",
              "Struggle with the money conversation",
              "Want a system, not another technique",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ArrowRight style={{ width: 12, height: 12, color: "#D66829", flexShrink: 0 }} />
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
          NeuroChiro — neurochiro.co
        </p>
      </div>
    </div>
  );
}
