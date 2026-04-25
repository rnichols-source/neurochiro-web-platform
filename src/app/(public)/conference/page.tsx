"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users, ShieldCheck, Globe, Sparkles, MapPin, Calendar, CheckCircle } from "lucide-react";
import { createAccountAction } from "@/app/(auth)/actions/auth";

type Role = "doctor" | "student" | "vendor";

export default function ConferenceLandingPage() {
  const [role, setRole] = useState<Role>("doctor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      setPending(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setPending(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phone", phone);

    const signupRole = role === "vendor" ? "doctor" : role;
    const result = await createAccountAction(formData, signupRole, "starter", "monthly");

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setSuccess(true);
    setPending(false);
  };

  if (success) {
    return (
      <div className="min-h-dvh bg-neuro-navy flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-heading font-black text-white mb-4">
            Welcome to NeuroChiro!
          </h1>
          <p className="text-gray-400 mb-2">
            Your account has been created. Check your email to verify, then log in to complete your profile.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            We sent a confirmation to <span className="text-neuro-orange font-bold">{email}</span>
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors"
          >
            Go to Login <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-600 text-xs mt-6">
            Great meeting you at New Beginnings!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Event badge */}
          <div className="inline-flex items-center gap-2 bg-neuro-orange/15 border border-neuro-orange/30 rounded-full px-4 py-2 mb-8">
            <Calendar className="w-4 h-4 text-neuro-orange" />
            <span className="text-xs font-bold text-neuro-orange uppercase tracking-wider">
              Live at New Beginnings 2026
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight leading-tight mb-4 text-white">
            Get Found by Patients Looking for{" "}
            <span className="text-neuro-orange">Nervous System</span> Chiropractors
          </h1>

          <p className="text-gray-300 text-base mb-8 max-w-lg mx-auto">
            The only directory built exclusively for doctors like you.
            Join 120+ verified chiropractors across 30+ states.
          </p>

          {/* Event info */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neuro-orange" />
              <span>Asbury Park, NJ</span>
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
            { number: "120+", label: "Doctors" },
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
          <h2 className="text-xl font-heading font-black text-neuro-navy text-center mb-6">
            Create Your Account
          </h2>

          {/* Role selector */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
            {(["doctor", "student", "vendor"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-3 text-sm font-bold transition-colors capitalize ${
                  role === r
                    ? "bg-neuro-navy text-white"
                    : "bg-white text-gray-400 hover:bg-gray-50"
                }`}
              >
                {r === "vendor" ? "Vendor" : r === "doctor" ? "Doctor" : "Student"}
              </button>
            ))}
          </div>

          {/* Role-specific messaging */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
            {role === "doctor" && (
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-neuro-orange flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-neuro-navy">For Chiropractors</p>
                  <p className="text-xs text-gray-500 mt-1">Get listed in the directory, get found by patients, AI-powered bio, verified badge, analytics dashboard.</p>
                </div>
              </div>
            )}
            {role === "student" && (
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-neuro-navy">For Students</p>
                  <p className="text-xs text-gray-500 mt-1">Learn from top nervous system chiropractors, build your network, and get listed in the directory when you graduate.</p>
                </div>
              </div>
            )}
            {role === "vendor" && (
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-neuro-navy">For Vendors &amp; Partners</p>
                  <p className="text-xs text-gray-500 mt-1">Get in front of 120+ nervous system chiropractors. Sponsorship, newsletter features, and partnership opportunities.</p>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder={role === "vendor" ? "Company / Contact Name" : "Full Name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-neuro-orange text-sm bg-white"
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-neuro-orange text-sm bg-white"
              required
            />
            <input
              type="password"
              placeholder="Create Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-neuro-orange text-sm bg-white"
              required
              minLength={6}
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-neuro-orange text-sm bg-white"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors disabled:opacity-50 text-base"
            >
              {pending ? "Creating Account..." : (
                <>Join NeuroChiro <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-neuro-orange font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 pb-12">
        <div className="max-w-md mx-auto">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider text-center mb-6">What You Get</h3>
          <div className="space-y-3">
            {[
              { icon: ShieldCheck, text: "Verified profile in the NeuroChiro directory" },
              { icon: Globe, text: "Found by patients searching Google for nervous system chiropractors" },
              { icon: Sparkles, text: "AI-powered bio generator to make your profile stand out" },
              { icon: Users, text: "Part of a growing network of 120+ doctors across 4 countries" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4">
                <item.icon className="w-5 h-5 text-neuro-orange flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 font-medium">{item.text}</p>
              </div>
            ))}
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
