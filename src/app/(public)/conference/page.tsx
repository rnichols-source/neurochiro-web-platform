"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Zap, Loader2, GraduationCap, Stethoscope, CheckCircle2 } from "lucide-react";
import { createFreeAccount } from "../get-started/actions";
import { createClient } from "@/lib/supabase";
import NetworkStats from "@/components/common/NetworkStats";
import { DOCTOR_PRO_FEATURES_COMPACT, STUDENT_FEATURES_FULL } from "@/lib/membership-value";

type Role = "doctor" | "student";

export default function ConferenceLandingPage() {
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const features = { doctor: DOCTOR_PRO_FEATURES_COMPACT, student: STUDENT_FEATURES_FULL };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) { setError("Registration failed."); return; }
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");

    const result = await createFreeAccount({ name, email, password, role, phone });
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
      <div className="min-h-dvh bg-neuro-navy flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-black text-neuro-navy mb-2">You're In!</h1>
            <p className="text-gray-500 mb-6">
              {role === "student"
                ? "Your student account is ready. Explore jobs, courses, and career tools."
                : "Your account is created. Log in to book your onboarding call with Dr. Ray and get started."}
            </p>
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
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-10 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-neuro-orange/15 border border-neuro-orange/30 rounded-full px-4 py-2 mb-6">
            <span className="text-xs font-bold text-neuro-orange uppercase tracking-wider">
              SIFCO Triune &middot; Sherman College
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight leading-tight mb-4 text-white">
            The Platform for{" "}
            <span className="text-neuro-orange">Nervous System</span> Chiropractors
          </h1>

          <p className="text-gray-300 text-base mb-4 max-w-lg mx-auto">
            The only network and career platform built exclusively for our profession.{" "}
            <NetworkStats format="doctors" /> verified chiropractors across 30+ states and 4 countries.
          </p>

          <p className="text-gray-500 text-sm">
            Free to join. Takes 30 seconds.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-neuro-navy-dark border-t border-white/5">
        <div className="max-w-2xl mx-auto flex justify-center divide-x divide-white/10">
          {[
            { number: "162+", label: "Doctors" },
            { number: "30+", label: "States" },
            { number: "4", label: "Countries" },
          ].map((stat) => (
            <div key={stat.label} className="flex-1 text-center py-4">
              <div className="text-xl font-black text-neuro-orange">{stat.number}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Signup Form */}
      <section className="px-6 py-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-heading font-black text-neuro-navy text-center mb-2">
            Join NeuroChiro
          </h2>
          <p className="text-sm text-gray-400 text-center mb-6">
            Create your account and get instant access.
          </p>

          {/* Role selector */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
            <button
              onClick={() => setRole("student")}
              className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${
                role === "student"
                  ? "bg-neuro-navy text-white"
                  : "bg-white text-gray-400 hover:bg-gray-50"
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Student
            </button>
            <button
              onClick={() => setRole("doctor")}
              className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${
                role === "doctor"
                  ? "bg-neuro-navy text-white"
                  : "bg-white text-gray-400 hover:bg-gray-50"
              }`}
            >
              <Stethoscope className="w-4 h-4" /> Doctor
            </button>
          </div>

          {/* Form card */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-neuro-orange p-8 shadow-lg mb-6">
            {/* Account fields */}
            <div className="space-y-3 mb-6">
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange"
              />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                inputMode="email" autoComplete="email"
                placeholder="Email address"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange"
              />
              <input
                type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                inputMode="tel" autoComplete="tel"
                placeholder="Phone number"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange"
              />
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Create password (6+ characters)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange"
              />
            </div>

            {/* Honeypot */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <input type="text" name="website_url" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            {/* Features */}
            <div className="space-y-2 mb-6">
              {features[role].slice(0, 6).map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{feature}</span>
                </div>
              ))}
            </div>

            {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors text-base disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {loading ? "Creating account..." : role === "student" ? "Join — $33/mo" : "Join — $99/mo"}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              {role === "student"
                ? "$33/mo. Includes monthly group call with Dr. Ray."
                : "$99/mo or $990/yr. Personal onboarding call included."}
            </p>
          </form>

          {/* Already a member */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Already a member?{" "}
            <Link href="/login" className="text-neuro-orange font-bold hover:underline">Log in</Link>
          </p>

          {/* Vendor CTA */}
          <div className="mt-6 bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-sm font-bold text-neuro-navy">Are you a vendor?</p>
            <p className="text-xs text-gray-500 mt-1 mb-3">Get your products in front of <NetworkStats format="doctors" /> nervous system chiropractors.</p>
            <Link href="/marketplace/apply" className="text-neuro-orange font-bold text-sm hover:underline">
              Apply for the Marketplace &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="bg-neuro-navy text-center py-8 px-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image src="/logo-white.png" alt="NeuroChiro" width={24} height={24} />
          <span className="text-sm font-heading font-bold text-white tracking-tight">
            NEURO<span className="text-neuro-orange">CHIRO</span>
          </span>
        </div>
        <p className="text-xs text-gray-500">
          neurochiro.co &middot; SIFCO Triune &middot; Sherman College
        </p>
      </div>
    </div>
  );
}
