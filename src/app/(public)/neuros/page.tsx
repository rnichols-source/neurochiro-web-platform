"use client";

import { Check, ArrowRight, Cpu, Calculator, DollarSign, TrendingUp, Activity, Award, Receipt, Target, Smartphone } from "lucide-react";
import Link from "next/link";

const TOOLS = [
  { name: "The Care Plan Closer", desc: "AI-powered care plans with insurance billing intelligence. Build professional, printable care plans in 5 minutes.", icon: Calculator, color: "#D66829" },
  { name: "The Profit Pulse", desc: "Monthly P&L tracking built for chiropractic. Know your real profit margin.", icon: DollarSign, color: "#22c55e" },
  { name: "The Daily Scorecard", desc: "Log visits, collections, new patients in 60 seconds. Streak tracking + coaching alerts.", icon: TrendingUp, color: "#3b82f6" },
  { name: "The Patient Converter", desc: "Scan reports patients understand. Color-coded spine charts. Progress comparison.", icon: Activity, color: "#a855f7" },
  { name: "The Compliance Shield", desc: "CE tracking by state. Renewal reminders. Never scramble before a license renewal.", icon: Award, color: "#eab308" },
  { name: "The Revenue Maximizer", desc: "Insurance fee schedules, CPT code lookup, cash discount calculator, PI case modeling.", icon: Receipt, color: "#06b6d4" },
  { name: "The Quarterly Playbook", desc: "90-day goal setting with 3-phase milestones. Initiative tracking. Financial variance analysis.", icon: Target, color: "#D66829" },
  { name: "The Command Center", desc: "NeurOS in your pocket. Daily scorecard, P&L glance, cash position. Push notifications.", icon: Smartphone, color: "#3b82f6" },
];

const VALUE_STACK = [
  { name: "8 Practice Tools (unlimited use)", value: "$682/mo" },
  { name: "Care Plan Template Library (10 templates)", value: "$497" },
  { name: "The Scripts Vault (ROF, objection handling, recall)", value: "$497" },
  { name: "Exercise Prescription Library (200+ exercises)", value: "$297" },
  { name: "White-Label Branding (your logo on everything)", value: "$97/mo" },
  { name: "NeuroChiro Pro Directory Listing (included FREE)", value: "$49/mo" },
  { name: "All Future Tools (SOAP Notes, Intake Forms, more)", value: "Priceless" },
];

export default function NeurOSSalesPage() {
  const handleCheckout = async (cycle: "monthly" | "annual") => {
    const res = await fetch("/api/stripe/neuros-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cycle }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div style={{ background: "#06090f", minHeight: "100vh", color: "#cbd5e1" }}>
      {/* Hero */}
      <div style={{ padding: "100px 20px 80px", textAlign: "center", position: "relative" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "rgba(59,130,246,0.1)", borderRadius: 20, marginBottom: 24 }}>
            <Cpu style={{ width: 14, height: 14, color: "#3b82f6" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", letterSpacing: 2, textTransform: "uppercase" }}>Practice Operating System</span>
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: "#fff", letterSpacing: -2, lineHeight: 1.1, margin: "0 0 16px" }}>
            Close More Care Plans.<br />Collect More Money.<br />Run Your Practice in 10 Minutes a Day.
          </h1>
          <p style={{ fontSize: 18, color: "#64748b", maxWidth: 600, margin: "0 auto 32px" }}>
            NeurOS is the all-in-one practice operating system built by a chiropractor, for chiropractors. 8 tools. One login. One price.
          </p>
          <p style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>
            $297<span style={{ fontSize: 14, color: "#64748b", fontWeight: 400 }}>/mo</span>
            <span style={{ fontSize: 14, color: "#475569", margin: "0 12px" }}>|</span>
            <span style={{ fontSize: 14, color: "#22c55e", fontWeight: 700 }}>60-Day Care Plan Guarantee</span>
          </p>
        </div>
      </div>

      {/* One-liner */}
      <div style={{ padding: "48px 20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", maxWidth: 700, margin: "0 auto" }}>
          "One extra care plan per month pays for NeurOS for an entire year. Guaranteed."
        </p>
      </div>

      {/* 8 Tools */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>8 Tools. Everything Included.</h2>
          <p style={{ color: "#64748b", marginTop: 8 }}>No feature gating. No per-tool charges. One price, everything unlocked.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {TOOLS.map(tool => (
            <div key={tool.name} style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
              <tool.icon style={{ width: 28, height: 28, color: tool.color, marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{tool.name}</h3>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Value Stack */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px 80px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", textAlign: "center", marginBottom: 32, letterSpacing: -0.5 }}>The Value Stack</h2>
        <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" }}>
          {VALUE_STACK.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: i < VALUE_STACK.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <span style={{ fontSize: 14, color: i >= 3 ? "#eab308" : "#e2e8f0", fontWeight: i >= 3 ? 600 : 400 }}>{i >= 3 ? "BONUS: " : ""}{item.name}</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#475569", whiteSpace: "nowrap" }}>{item.value}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", background: "rgba(239,68,68,0.08)" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>What You Pay:</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, color: "#ef4444", textDecoration: "line-through" }}>$2,267+/mo</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#22c55e" }}>$297/mo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Guarantee */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px 80px", textAlign: "center" }}>
        <div style={{ background: "rgba(34,197,94,0.08)", border: "2px solid rgba(34,197,94,0.2)", borderRadius: 20, padding: 40 }}>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: "#22c55e", marginBottom: 12 }}>60-Day Care Plan Guarantee</h3>
          <p style={{ fontSize: 16, color: "#e2e8f0", lineHeight: 1.7 }}>
            Use NeurOS for 60 days. If you don't close at least ONE additional care plan using The Care Plan Closer, we'll refund every penny. No questions. No hassle. And you keep The Scripts Vault and Template Library.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "0 20px 80px", textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 24 }}>Ready to Transform Your Practice?</h2>

        <button onClick={() => handleCheckout("monthly")}
          style={{ width: "100%", padding: "18px 32px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>
          Get NeurOS - $297/mo + $497 Setup
        </button>

        <button onClick={() => handleCheckout("annual")}
          style={{ width: "100%", marginTop: 12, padding: "14px 32px", background: "transparent", color: "#3b82f6", border: "2px solid rgba(59,130,246,0.3)", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Annual: $2,997/yr (Setup Fee Waived, Save $567)
        </button>

        <p style={{ fontSize: 12, color: "#334155", marginTop: 16 }}>
          60-day guarantee. Cancel anytime. NeuroChiro Pro included free.
        </p>

        <Link href="/login" style={{ display: "block", marginTop: 12, fontSize: 13, color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>
          Already have an account? Log in
        </Link>
      </div>

      {/* Footer */}
      <div style={{ padding: "32px 20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p style={{ fontSize: 12, color: "#1e293b" }}>NeurOS by NeuroChiro. Built by Dr. Raymond Nichols.</p>
      </div>
    </div>
  );
}
