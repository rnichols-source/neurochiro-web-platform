"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Loader2, ShieldCheck, Users, BarChart3, Briefcase, Award, Zap } from "lucide-react";
import { createFreeAccount } from "./actions";
import { createClient } from "@/lib/supabase";

type Role = "doctor" | "student";

export default function GetStartedPage() {
  const [role, setRole] = useState<Role>("doctor");
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

    // Auto-login with the credentials they just created
    const supabase = createClient();
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });

    if (loginErr) {
      // Fallback — show success with login link
      setSuccess(true);
      setLoading(false);
      return;
    }

    // Redirect straight to onboarding (doctors) or dashboard (students)
    if (role === "doctor") {
      window.location.href = "/doctor/onboarding";
    } else {
      window.location.href = "/student/dashboard";
    }
  };

  if (success) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-black text-neuro-navy mb-2">You&apos;re In!</h1>
            <p className="text-gray-500 mb-6">Your account is ready. Log in to {role === "doctor" ? "set up your profile and start getting found by patients" : "explore jobs and start building your career"}.</p>
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
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      <div className="max-w-md mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-black text-neuro-navy mb-2">Get Listed Free</h1>
          <p className="text-gray-500">Join 140+ nervous system chiropractors. Your profile is live in 60 seconds.</p>
        </div>

        {/* What you get */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Free includes</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: ShieldCheck, label: "Directory listing" },
              { icon: Users, label: "Public profile" },
              { icon: BarChart3, label: "View count" },
              { icon: Briefcase, label: "Post 1 job" },
              { icon: Award, label: "Verified badge" },
              { icon: Zap, label: "Instagram highlights" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <f.icon className="w-4 h-4 text-neuro-orange shrink-0" />
                <span className="text-gray-600">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-neuro-orange p-8 shadow-lg space-y-4">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("doctor")}
              className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                role === "doctor" ? "bg-neuro-orange text-white border-neuro-orange" : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              🩺 Doctor
            </button>
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                role === "student" ? "bg-neuro-orange text-white border-neuro-orange" : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              🎓 Student
            </button>
          </div>

          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange"
          />
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange"
          />
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password (6+ characters)"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange"
          />

          {/* Honeypot */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <input type="text" name="website_url" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? "Creating account..." : "Get Started — Free"}
          </button>

          <p className="text-center text-xs text-gray-400">
            No credit card required. Upgrade anytime.
          </p>
        </form>

        {/* Already a member */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Already a member?{" "}
          <Link href="/login" className="text-neuro-orange font-bold hover:underline">Log in</Link>
        </p>

        {/* Upgrade later */}
        <div className="mt-6 bg-neuro-navy rounded-2xl p-5 text-center">
          <p className="text-white font-bold text-sm mb-1">Want more features?</p>
          <p className="text-gray-400 text-xs mb-3">Upgrade to Growth ($69/mo) or Pro ($129/mo) anytime from your dashboard.</p>
          <Link href="/pricing" className="text-neuro-orange text-xs font-bold hover:underline">Compare Plans →</Link>
        </div>
      </div>
    </div>
  );
}
