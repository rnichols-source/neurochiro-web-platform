"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Check, Shield, Users, BarChart3, MessageSquare, Briefcase, Calendar, Star, Zap } from "lucide-react";
import { createFreeAccount } from "./actions";
import { createClient } from "@/lib/supabase";

type Role = "doctor" | "student";

function GetStartedInner() {
  const searchParams = useSearchParams();
  const paramRole = searchParams.get("role") as Role | null;
  const paramChiroscore = searchParams.get("chiroscore");
  const paramCity = searchParams.get("city");
  const paramState = searchParams.get("state");

  const [role, setRole] = useState<Role>(paramRole === "student" ? "student" : "doctor");
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
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-black text-neuro-navy mb-2">Your 7-Day Trial Has Started!</h1>
            <p className="text-gray-500 mb-4">
              {role === "doctor"
                ? "You have full access to everything in NeuroChiro Pro for the next 7 days. Set up your profile and start getting found by patients."
                : "You have full access to Student Premium for 7 days. Explore jobs, the Academy, and start building your career."}
            </p>

            {role === "doctor" && (
              <div className="bg-neuro-cream rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-bold text-neuro-orange uppercase tracking-widest mb-3">What You Get During Your Trial</p>
                <div className="space-y-2">
                  {[
                    "Directory listing (patients find you immediately)",
                    "Full profile with analytics",
                    "Patient messaging",
                    "Job postings + ChiroMatch",
                    "Seminar hosting",
                    "Spotlight interview eligibility",
                    "Everything in NeuroChiro Pro",
                  ].map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/login"
              className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors"
            >
              Log In & Set Up Your Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const doctorFeatures = [
    { icon: Users, label: "Listed in global directory" },
    { icon: Shield, label: "Verified badge" },
    { icon: BarChart3, label: "Patient analytics" },
    { icon: MessageSquare, label: "Patient messaging" },
    { icon: Briefcase, label: "Job postings" },
    { icon: Calendar, label: "Seminar hosting" },
    { icon: Star, label: "Spotlight eligibility" },
    { icon: Zap, label: "Weekly growth report" },
  ];

  const studentFeatures = [
    { icon: Briefcase, label: "Browse & apply to jobs" },
    { icon: Star, label: "Full Academy access" },
    { icon: Users, label: "ChiroMatch matching" },
    { icon: Shield, label: "Interview Prep" },
    { icon: BarChart3, label: "Financial Planner" },
    { icon: Zap, label: "Techniques Library" },
  ];

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      <div className="max-w-md mx-auto px-6">
        {/* Contextual Banners */}
        {paramChiroscore && (
          <div className="bg-neuro-navy rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neuro-orange/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-black text-neuro-orange">{paramChiroscore}</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Your ChiroScore: {paramChiroscore}/100</p>
              <p className="text-gray-400 text-xs">Sign up to see your full breakdown and career tools.</p>
            </div>
          </div>
        )}
        {paramCity && paramState && (
          <div className="bg-neuro-navy rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Claim your spot in {paramCity}, {paramState}</p>
              <p className="text-gray-400 text-xs">Be found by patients searching your area.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-black text-neuro-navy mb-2">
            {role === "doctor" ? "Start Your 7-Day Pro Trial" : "Start Your Student Trial"}
          </h1>
          <p className="text-gray-500">
            {role === "doctor"
              ? "Full access to everything. No credit card required."
              : "Explore jobs, Academy, and career tools. No credit card required."}
          </p>
        </div>

        {/* What you get during trial */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <p className="text-xs font-bold text-neuro-orange uppercase tracking-widest mb-3">
            {role === "doctor" ? "Your 7-Day Trial Includes" : "Student Trial Includes"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(role === "doctor" ? doctorFeatures : studentFeatures).map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <f.icon className="w-4 h-4 text-neuro-orange shrink-0" />
                <span className="text-gray-600">{f.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {role === "doctor" ? "After 7 days: $49/mo or $490/yr. Cancel anytime." : "After 7 days: $12/mo or $120/yr. Cancel anytime."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-neuro-orange p-8 shadow-lg space-y-4">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setRole("doctor")}
              className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${role === "doctor" ? "bg-neuro-orange text-white border-neuro-orange" : "bg-white text-gray-500 border-gray-200"}`}>
              🩺 Doctor
            </button>
            <button type="button" onClick={() => setRole("student")}
              className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${role === "student" ? "bg-neuro-orange text-white border-neuro-orange" : "bg-white text-gray-500 border-gray-200"}`}>
              🎓 Student
            </button>
          </div>

          <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password (6+ characters)"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />

          {/* Honeypot */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <input type="text" name="website_url" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? "Creating account..." : "Start My Free Trial"}
          </button>

          <p className="text-center text-xs text-gray-400">
            No credit card required. Full {role === "doctor" ? "Pro" : "Premium"} access for 7 days.
          </p>
        </form>

        {/* Already a member */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Already a member?{" "}
          <Link href="/login" className="text-neuro-orange font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default function GetStartedPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-neuro-cream flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>}>
      <GetStartedInner />
    </Suspense>
  );
}
