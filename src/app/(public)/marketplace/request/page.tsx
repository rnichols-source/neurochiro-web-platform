"use client";

import { useState } from "react";
import { Send, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { submitRFP } from "./actions";
import { VENDOR_CATEGORIES } from "@/types/vendor";

const budgetOptions = ["Under $5K", "$5K–$15K", "$15K–$50K", "$50K+", "Not sure"];
const timelineOptions = ["ASAP", "1–3 months", "3–6 months", "Flexible"];

export default function RequestQuotePage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await submitRFP({
      category: fd.get("category") as string,
      description: fd.get("description") as string,
      budget: fd.get("budget") as string,
      timeline: fd.get("timeline") as string,
    });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-dvh bg-neuro-cream pt-32 pb-20 px-6">
        <div className="max-w-md mx-auto text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-black text-neuro-navy mb-2">Request Submitted!</h1>
          <p className="text-gray-500 mb-8">Vendors in this category will be notified. You&apos;ll receive responses directly to your dashboard.</p>
          <Link href="/marketplace" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm inline-flex items-center gap-2">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      <div className="max-w-xl mx-auto px-6">
        <Link href="/marketplace" className="text-xs text-gray-400 hover:text-neuro-orange transition-colors mb-6 inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to Marketplace
        </Link>

        <div className="text-center mb-10 space-y-3">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px]">Get Quotes</span>
          <h1 className="text-3xl font-heading font-black text-neuro-navy">I Need a Quote</h1>
          <p className="text-gray-500">Tell us what you need and vendors will send you competitive quotes.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">What category?</label>
            <select name="category" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange">
              <option value="">Select a category</option>
              {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">What do you need?</label>
            <textarea
              name="description"
              rows={4}
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none"
              placeholder="Describe what you're looking for — be specific about features, quantities, or requirements..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Budget Range</label>
              <select name="budget" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange">
                <option value="">Select</option>
                {budgetOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Timeline</label>
              <select name="timeline" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange">
                <option value="">Select</option>
                {timelineOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-4 bg-neuro-orange text-white font-black uppercase tracking-widest rounded-xl hover:bg-neuro-orange-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? "Submitting..." : (
              <>Submit Request <Send className="w-4 h-4" /></>
            )}
          </button>

          <p className="text-[10px] text-gray-400 text-center">You must be a logged-in NeuroChiro doctor to submit a request.</p>
        </form>
      </div>
    </div>
  );
}
