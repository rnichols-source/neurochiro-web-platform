"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Check, Zap, Globe, Loader2 } from "lucide-react";
import { createConferenceCheckout } from "./actions";
import NetworkStats from "@/components/common/NetworkStats";

type Role = "doctor" | "student";
type Billing = "monthly" | "annual";

export default function ConferenceLandingPage() {
  const [role, setRole] = useState<Role>("doctor");
  const [billing, setBilling] = useState<Billing>("monthly");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const prices = {
    doctor: { monthly: 49, annual: 490 },
    student: { monthly: 12, annual: 120 },
  };

  const price = prices[role][billing];

  const doctorFeatures = [
    "Your own profile page in the global directory",
    "Found by patients searching for nervous system care",
    "AI-powered practice insights and optimization",
    "Patient lead pipeline with conversion tracking",
    "ChiroMatch — residency-style associate matching",
    "CE credit tracking with verified certificates",
    "Full ATS hiring system with ChiroScore ratings",
    "Salary transparency data and market benchmarks",
  ];

  const studentFeatures = [
    "ChiroScore — universal candidate rating (0-100)",
    "ChiroMatch — get matched with top practices",
    "Smart job matching with salary transparency",
    "CE credit tracking and verified certificates",
    "Academy courses and interview prep",
    "Contract Lab for reviewing offers",
    "Financial planner with salary benchmarks",
    "Direct messaging with doctors and mentors",
  ];

  const features = { doctor: doctorFeatures, student: studentFeatures };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");

    const result = await createConferenceCheckout({ name, email, password, role, billing });
    if (result.error) { setError(result.error); setLoading(false); return; }
    if (result.url) window.location.href = result.url;
  };

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-10 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-neuro-orange/15 border border-neuro-orange/30 rounded-full px-4 py-2 mb-6">
            <Calendar className="w-4 h-4 text-neuro-orange" />
            <span className="text-xs font-bold text-neuro-orange uppercase tracking-wider">
              New Beginnings 2026 &middot; Asbury Park, NJ
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight leading-tight mb-4 text-white">
            Get Found by Patients Looking for{" "}
            <span className="text-neuro-orange">Nervous System</span> Chiropractors
          </h1>

          <p className="text-gray-300 text-base mb-6 max-w-lg mx-auto">
            The only directory built exclusively for doctors like you.{" "}
            <NetworkStats format="doctors" /> verified chiropractors across 30+ states and 4 countries.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neuro-orange" />
              <span>Berkeley Oceanfront Hotel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neuro-orange" />
              <span>May 14-17, 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-neuro-navy-dark border-t border-white/5">
        <div className="max-w-2xl mx-auto flex justify-center divide-x divide-white/10">
          {[
            { number: "140+", label: "Doctors" },
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
            Create your account and start getting found by patients today.
          </p>

          {/* Role selector */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
            {(["doctor", "student"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${
                  role === r
                    ? "bg-neuro-navy text-white"
                    : "bg-white text-gray-400 hover:bg-gray-50"
                }`}
              >
                {r === "doctor" ? "🩺 Doctor" : "🎓 Student"}
              </button>
            ))}
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className={`text-sm font-bold ${billing === 'monthly' ? 'text-neuro-navy' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-14 h-7 bg-neuro-navy rounded-full transition-colors"
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-neuro-orange rounded-full transition-all ${billing === 'annual' ? 'left-7' : 'left-0.5'}`} />
            </button>
            <span className={`text-sm font-bold ${billing === 'annual' ? 'text-neuro-navy' : 'text-gray-400'}`}>
              Annual <span className="text-green-500 text-xs">(Save ${role === 'doctor' ? 98 : 24})</span>
            </span>
          </div>

          {/* Price + Form card */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-neuro-orange p-8 shadow-lg mb-6">
            <div className="text-center mb-6">
              <p className="text-xs font-black text-neuro-orange uppercase tracking-widest mb-2">
                {role === "doctor" ? "Doctor" : "Student"} Membership
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-lg text-gray-400">$</span>
                <span className="text-5xl font-black text-neuro-navy">{price}</span>
                <span className="text-gray-400 font-bold">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
            </div>

            {/* Account fields */}
            <div className="space-y-3 mb-6">
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
            </div>

            {/* Features */}
            <div className="space-y-2 mb-6">
              {features[role].slice(0, 5).map((feature, i) => (
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
              {loading ? "Setting up..." : `Join & Pay $${price}/${billing === 'monthly' ? 'mo' : 'yr'}`}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Secure checkout via Stripe. Cancel anytime.
            </p>
          </form>

          {/* Guarantee */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-6">
            <p className="text-green-700 font-bold text-sm">30-Day Money-Back Guarantee</p>
            <p className="text-green-600 text-xs mt-1">Not satisfied? Full refund within 30 days.</p>
          </div>

          {/* Free option */}
          <div className="bg-neuro-navy rounded-xl p-4 text-center">
            <p className="text-white font-bold text-sm mb-1">Not ready to pay?</p>
            <p className="text-gray-400 text-xs mb-3">Get a free listing and upgrade later.</p>
            <Link href="/get-started" className="text-neuro-orange font-bold text-sm hover:underline">
              Join Free →
            </Link>
          </div>

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
          neurochiro.co &middot; New Beginnings 2026 &middot; Asbury Park, NJ
        </p>
      </div>
    </div>
  );
}
