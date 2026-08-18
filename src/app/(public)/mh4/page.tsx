"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, GraduationCap, Stethoscope, Gift } from "lucide-react";
import Link from "next/link";
import { createFreeAccount } from "../get-started/actions";
import { createClient } from "@/lib/supabase";
import { DOCTOR_PRO_FEATURES_COMPACT, STUDENT_FEATURES_COMPACT } from "@/lib/membership-value";

type Role = "doctor" | "student";

export default function MH4Page() {
  const [role, setRole] = useState<Role>("doctor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const perks = role === "doctor" ? DOCTOR_PRO_FEATURES_COMPACT.slice(0, 8) : STUDENT_FEATURES_COMPACT;
  const price = role === "doctor" ? "$99" : "$33";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) { setError("Registration failed."); return; }
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");

    const result = await createFreeAccount({ name, email, password, role, phone });
    if (result.error) { setError(result.error); setLoading(false); return; }

    // Also save to leads with MH4 source for tracking
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, first_name: name, source: "mh4_swag_bag", role }),
      });
    } catch {}

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
      <div className="min-h-dvh bg-[#0F1A24] flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="bg-[#1a2e40] rounded-2xl p-12 border border-white/[0.08]">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-5" />
            <h1 className="text-2xl font-black text-white mb-3">You're In!</h1>
            <p className="text-white/50 text-sm mb-4 leading-relaxed">
              Your account is created. Log in to {role === "doctor" ? "complete your profile and book your onboarding call with Dr. Ray. After the call, activate Pro to unlock everything." : "book your onboarding call with Dr. Ray and explore your career tools."}
            </p>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <p className="text-green-400 font-bold text-sm">MH4 access granted</p>
              <p className="text-white/30 text-xs mt-1">Start with a free account. Activate {role === "doctor" ? "Pro ($99/mo)" : "your membership ($33/mo)"} after your onboarding call.</p>
            </div>
            <Link
              href="/login"
              className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors"
            >
              Log In Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0F1A24]">
      {/* Hero */}
      <div className="text-center px-6 pt-16 pb-8 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-full px-4 py-2 mb-6">
          <Gift className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[11px] font-black text-green-400 uppercase tracking-[0.15em]">
            Mile High Virtual Swag Bag
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-6">
          Get Started<br />
          <span className="text-neuro-orange">Free.</span>
        </h1>

        <p className="text-white/45 text-lg leading-relaxed max-w-xl mx-auto mb-2">
          As a Mile High attendee, create your NeuroChiro account free and book a personal onboarding call with Dr. Ray.
          {role === "doctor" ? " He'll walk you through the directory, weekly promotion, patient leads, and every tool included in Pro." : " He'll walk you through the career tools, job matching, Academy, and everything included in your membership."}
        </p>

        <div className="inline-flex items-center gap-2 bg-neuro-orange/15 border border-neuro-orange/30 rounded-full px-4 py-2 mt-4">
          <span className="text-neuro-orange text-sm font-black">Exclusive MH4 Access</span>
          <span className="text-white/30 text-sm">|</span>
          <span className="text-white/40 text-sm">Free account + personal onboarding</span>
        </div>
      </div>

      {/* Two-Column: Form + Perks */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-[#1a2e40] rounded-2xl p-8 border-2 border-neuro-orange" style={{ boxShadow: "0 20px 60px rgba(214,104,41,0.15)" }}>
            <h2 className="text-lg font-black text-white mb-6">Claim Your Free Month</h2>

            {/* Role Toggle */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button type="button" onClick={() => setRole("doctor")}
                className={`py-3 rounded-xl text-sm font-bold transition-all border-2 flex items-center justify-center gap-1.5 ${role === "doctor" ? "bg-neuro-orange text-white border-neuro-orange" : "bg-transparent text-white/40 border-white/10 hover:border-white/20"}`}>
                <Stethoscope className="w-4 h-4" /> Doctor
              </button>
              <button type="button" onClick={() => setRole("student")}
                className={`py-3 rounded-xl text-sm font-bold transition-all border-2 flex items-center justify-center gap-1.5 ${role === "student" ? "bg-neuro-orange text-white border-neuro-orange" : "bg-transparent text-white/40 border-white/10 hover:border-white/20"}`}>
                <GraduationCap className="w-4 h-4" /> Student
              </button>
            </div>

            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white mb-3 outline-none focus:border-neuro-orange placeholder:text-white/25"
            />
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              inputMode="email" autoComplete="email"
              placeholder="Email address"
              className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white mb-3 outline-none focus:border-neuro-orange placeholder:text-white/25"
            />
            <input
              type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
              inputMode="tel" autoComplete="tel"
              placeholder="Phone number"
              className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white mb-3 outline-none focus:border-neuro-orange placeholder:text-white/25"
            />
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password (6+ characters)"
              className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white mb-5 outline-none focus:border-neuro-orange placeholder:text-white/25"
            />

            {/* Honeypot */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <input type="text" name="company_url" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-neuro-orange text-white font-black rounded-xl text-base flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-all disabled:opacity-50 shadow-lg shadow-neuro-orange/20"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? "Creating account..." : "Create Free Account"}
            </button>

            <p className="text-center text-[11px] text-white/25 mt-3">
              Free account. Book your onboarding call. Activate {role === "doctor" ? "Pro ($99/mo)" : "membership ($33/mo)"} when you're ready.
            </p>
          </form>

          {/* What You Get */}
          <div className="space-y-6">
            <div className="bg-[#1a2e40] rounded-2xl border border-white/[0.08] p-8">
              <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-5">
                {role === "doctor" ? "What Doctors Get Every Month" : "What Students Get Every Month"}
              </p>
              <div className="space-y-4">
                {perks.map((perk, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white/60 text-sm leading-relaxed">{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
              <p className="text-green-400 font-black text-base mb-1">Exclusive access for MH4 attendees</p>
              <p className="text-white/30 text-xs">
                {role === "doctor"
                  ? "Free account + personal onboarding. Pro is $99/mo or $990/yr when you're ready."
                  : "Free account + personal onboarding. Membership is $33/mo when you're ready."}
              </p>
            </div>

            <div className="text-center">
              <p className="text-white/20 text-xs">
                Already a member?{" "}
                <Link href="/login" className="text-neuro-orange font-bold hover:underline">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-white/[0.05]">
        <p className="text-white/15 text-xs">NeuroChiro — neurochiro.co</p>
      </div>
    </div>
  );
}
