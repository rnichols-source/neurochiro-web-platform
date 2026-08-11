"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Check, GraduationCap, Stethoscope } from "lucide-react";
import { createFreeAccount } from "../get-started/actions";
import { createClient } from "@/lib/supabase";

type Role = "doctor" | "student";

const studentPerks = [
  "Personal onboarding call with Dr. Ray",
  "Monthly group call with Dr. Ray",
  "ChiroScore rating (0-100)",
  "ChiroMatch job matching",
  "Academy courses + interview prep",
  "Contract Lab for reviewing offers",
  "Financial planner with salary data",
  "Direct messaging with doctors",
];

const doctorPerks = [
  "Personal onboarding call with Dr. Ray",
  "Directory listing with SEO driving patients to you",
  "Patient leads forwarded directly to you",
  "Monthly branded content kit for your social",
  "Instagram Collab posts (185K followers)",
  "Weekly live promotion (IG + YouTube)",
  "Spotlight interview + video clips for your social",
  "Monthly growth report with stats + city ranking",
  "Full practice tools (analytics, jobs, ChiroMatch)",
];

export default function EventPage() {
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) { setError("Registration failed."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");

    const result = await createFreeAccount({ name, email, password, role });
    if (result.error) { setError(result.error); setLoading(false); return; }

    const supabase = createClient();
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });

    if (loginErr) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    if (role === "doctor") {
      window.location.href = "/doctor/onboarding";
    } else {
      window.location.href = "/student/dashboard";
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100dvh", background: "#1E2D3B", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 40, boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
            <CheckCircle2 style={{ width: 64, height: 64, color: "#22c55e", margin: "0 auto 16px" }} />
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1E2D3B", marginBottom: 8 }}>You're In!</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
              {role === "student"
                ? "Your student account is ready. Explore jobs, courses, and career tools."
                : "Your account is created. Log in to book your onboarding call with Dr. Ray and get started."}
            </p>
            <Link
              href="/login"
              style={{ display: "block", width: "100%", padding: "16px 0", background: "#D66829", color: "#fff", fontWeight: 800, borderRadius: 12, textDecoration: "none", fontSize: 14, textAlign: "center" }}
            >
              Log In Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const perks = role === "student" ? studentPerks : doctorPerks;

  return (
    <div style={{ minHeight: "100dvh", background: "#1E2D3B", padding: "0 0 60px" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "48px 24px 24px" }}>
        <img src="/logo-white.png" alt="NeuroChiro" style={{ width: 48, height: 48, margin: "0 auto 16px", objectFit: "contain" }} />
        <p style={{ color: "#D66829", fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
          SIFCO Triune  &middot;  Sherman College
        </p>
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>
          Join the Network
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: 340, margin: "0 auto" }}>
          The global platform for nervous system chiropractors. Free to sign up, takes 30 seconds.
        </p>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px" }}>
        <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
          {/* Role Toggle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <button type="button" onClick={() => setRole("student")}
              style={{
                padding: "14px 0", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "2px solid",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: role === "student" ? "#D66829" : "#fff",
                color: role === "student" ? "#fff" : "#6b7280",
                borderColor: role === "student" ? "#D66829" : "#e5e7eb",
              }}>
              <GraduationCap style={{ width: 16, height: 16 }} /> Student
            </button>
            <button type="button" onClick={() => setRole("doctor")}
              style={{
                padding: "14px 0", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "2px solid",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: role === "doctor" ? "#D66829" : "#fff",
                color: role === "doctor" ? "#fff" : "#6b7280",
                borderColor: role === "doctor" ? "#D66829" : "#e5e7eb",
              }}>
              <Stethoscope style={{ width: 16, height: 16 }} /> Doctor
            </button>
          </div>

          {/* Inputs */}
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            style={{ width: "100%", padding: "14px 16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }} />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            style={{ width: "100%", padding: "14px 16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }} />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password (6+ characters)"
            style={{ width: "100%", padding: "14px 16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, marginBottom: 16, outline: "none", boxSizing: "border-box" }} />

          {/* Honeypot */}
          <div style={{ position: "absolute", left: -9999 }} aria-hidden="true">
            <input type="text" name="website_url" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: "16px 0", background: "#D66829", color: "#fff", fontWeight: 900,
              borderRadius: 12, border: "none", fontSize: 15, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.6 : 1,
              boxShadow: "0 4px 14px rgba(214,104,41,0.4)",
            }}>
            {loading && <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />}
            {loading ? "Creating account..." : role === "student" ? "Join — $33/mo" : "Join — $99/mo"}
          </button>

          <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 12 }}>
            {role === "student"
              ? "$33/mo. Includes monthly group call with Dr. Ray."
              : "$99/mo or $990/yr. Personal onboarding call included."}
          </p>
        </form>

        {/* Perks */}
        <div style={{ marginTop: 24, padding: "0 4px" }}>
          <p style={{ color: "#D66829", fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>
            {role === "student" ? "What You Get" : "What You Get Every Month"}
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {perks.map((perk, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Check style={{ width: 14, height: 14, color: "#22c55e", flexShrink: 0 }} />
                <span style={{ color: "#cbd5e1", fontSize: 13 }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Already a member */}
        <p style={{ textAlign: "center", fontSize: 12, color: "#64748b", marginTop: 24 }}>
          Already a member?{" "}
          <Link href="/login" style={{ color: "#D66829", fontWeight: 700, textDecoration: "none" }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
