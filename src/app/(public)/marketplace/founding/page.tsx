"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award, CheckCircle2, Users, Eye, ShoppingBag, Star, Zap,
  ArrowRight, Loader2, Globe, BarChart3, MessageSquare, Shield,
} from "lucide-react";
import { applyAsFoundingVendor } from "./actions";
import Footer from "@/components/landing/Footer";
import NetworkStats from "@/components/common/NetworkStats";

const CATEGORIES = [
  "Supplements & Nutrition",
  "Scanning Technology",
  "Practice Management Software",
  "Chiropractic Tables & Equipment",
  "Orthotics & Supports",
  "Education & Training",
  "Marketing & Branding",
  "Office Supplies & Décor",
  "Billing & Insurance",
  "Patient Engagement",
  "Apparel & Merchandise",
  "Other",
];

const BENEFITS = [
  { icon: Award, title: "Founding Vendor Badge", desc: "Permanent gold badge on your listing — forever." },
  { icon: ShoppingBag, title: "3 Months Free", desc: "Full marketplace listing. No credit card. No commitment." },
  { icon: Users, title: "140+ Doctor Network", desc: "Direct access to verified nervous system chiropractors." },
  { icon: Eye, title: "Profile Analytics", desc: "See who views your page, clicks your site, and uses your code." },
  { icon: Globe, title: "Full Vendor Page", desc: "Logo, description, products, team, video, reviews, FAQ — the works." },
  { icon: Star, title: "Discount Code Feature", desc: "Exclusive promo code for NeuroChiro members. We promote it for you." },
  { icon: BarChart3, title: "Lead Generation", desc: "Doctors can request demos and quotes directly through your page." },
  { icon: MessageSquare, title: "Content Hub", desc: "Publish blog posts, case studies, and webinars on your vendor page." },
];

export default function FoundingVendorPage() {
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    website: "",
    category: "",
    description: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.contactName || !form.email || !form.category) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await applyAsFoundingVendor(form);
    if (result.error) { setError(result.error); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  const updateForm = (key: string, value: string) => setForm({ ...form, [key]: value });

  if (success) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10">
            <div className="w-16 h-16 bg-yellow-50 border-2 border-yellow-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-heading font-black text-neuro-navy mb-2">You&apos;re In!</h1>
            <p className="text-gray-500 mb-6">Welcome to the NeuroChiro Founding Vendor program. We&apos;ll review your application and have your page live within 24 hours.</p>
            <p className="text-sm text-gray-400 mb-6">Check your email for next steps.</p>
            <Link href="/marketplace" className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors">
              Browse the Marketplace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-40 w-96 h-96 bg-yellow-500 rounded-full blur-[150px]" />
          <div className="absolute bottom-10 right-20 w-72 h-72 bg-neuro-orange rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/15 border border-yellow-500/30 rounded-full mb-6">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-black text-yellow-300 uppercase tracking-wider">Limited to 20 Vendors</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-6 leading-tight">
            Become a Founding Vendor
          </h1>
          <p className="text-xl text-gray-300 mb-4 max-w-xl mx-auto">
            3 months free. Permanent Founding Vendor badge. Direct access to <NetworkStats format="doctors" /> nervous system chiropractors.
          </p>
          <p className="text-gray-500">
            We&apos;re handpicking 20 vendors to launch the NeuroChiro Marketplace. No credit card required.
          </p>
        </div>
      </section>

      {/* Stats */}
      <div className="bg-neuro-navy border-t border-white/5">
        <div className="max-w-3xl mx-auto flex justify-center divide-x divide-white/10">
          {[
            { value: "140+", label: "Verified Doctors" },
            { value: "30+", label: "States" },
            { value: "20", label: "Founding Spots" },
            { value: "$0", label: "For 3 Months" },
          ].map((s) => (
            <div key={s.label} className="flex-1 text-center py-5">
              <div className="text-2xl font-black text-neuro-orange">{s.value}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Grid */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading font-black text-neuro-navy mb-3">What Founding Vendors Get</h2>
          <p className="text-gray-500">Everything below is included free for 3 months. After that, plans start at $99/mo.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFITS.map((b, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <b.icon className="w-6 h-6 text-neuro-orange mb-3" />
              <h3 className="font-bold text-neuro-navy mb-1 text-sm">{b.title}</h3>
              <p className="text-xs text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* After 3 Months */}
      <section className="max-w-3xl mx-auto px-6 pb-12">
        <div className="bg-neuro-navy rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-heading font-black text-white mb-4">After 3 Months</h2>
          <p className="text-gray-400 mb-6">Founding Vendors keep their permanent badge and get preferred pricing:</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: "Starter", price: "$99", desc: "Listing + discount code" },
              { name: "Growth", price: "$249", desc: "Featured placement + analytics", popular: true },
              { name: "Partner", price: "$499", desc: "Priority placement + content hub" },
            ].map((t) => (
              <div key={t.name} className={`rounded-xl p-5 ${t.popular ? 'bg-neuro-orange/10 border-2 border-neuro-orange/30' : 'bg-white/5 border border-white/10'}`}>
                <p className="text-xs font-bold text-neuro-orange uppercase tracking-wider mb-2">{t.name}</p>
                <p className="text-2xl font-black text-white">{t.price}<span className="text-sm text-gray-500">/mo</span></p>
                <p className="text-xs text-gray-400 mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-4">Cancel anytime. No long-term contracts.</p>
        </div>
      </section>

      {/* Application Form */}
      <section className="max-w-lg mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-heading font-black text-neuro-navy mb-2">Apply Now</h2>
          <p className="text-gray-500 text-sm">Takes 60 seconds. We review every application personally.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-neuro-orange p-8 shadow-lg space-y-4">
          <input type="text" required value={form.companyName} onChange={e => updateForm('companyName', e.target.value)}
            placeholder="Company name *"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
          <input type="text" required value={form.contactName} onChange={e => updateForm('contactName', e.target.value)}
            placeholder="Your name *"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
          <input type="email" required value={form.email} onChange={e => updateForm('email', e.target.value)}
            placeholder="Email address *"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
          <input type="tel" value={form.phone} onChange={e => updateForm('phone', e.target.value)}
            placeholder="Phone (optional)"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
          <input type="url" value={form.website} onChange={e => updateForm('website', e.target.value)}
            placeholder="Website URL"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
          <select required value={form.category} onChange={e => updateForm('category', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange text-gray-500">
            <option value="">Select category *</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea required value={form.description} onChange={e => updateForm('description', e.target.value)}
            placeholder="Tell us about your product — what do you sell, who is it for, and why chiropractors love it. *"
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange resize-none" />

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors disabled:opacity-50 text-lg">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
            {loading ? "Submitting..." : "Apply as Founding Vendor"}
          </button>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-2">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 3 months free</span>
            <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Founding badge</span>
          </div>
        </form>
      </section>

      {/* Social Proof */}
      <section className="bg-neuro-navy py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-heading font-black text-white mb-4">Join Vendors Already on NeuroChiro</h2>
          <p className="text-gray-400 mb-8">Trusted brands serving the nervous system chiropractic community.</p>
          <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
            {["Aceva", "INSiGHT CLA", "MojoFeet", "Lucro"].map((v) => (
              <span key={v} className="text-white font-heading font-bold text-lg">{v}</span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
