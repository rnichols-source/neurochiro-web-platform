"use client";

import { useState } from "react";
import { createVendorCheckout } from "./actions";

const categories = ["Equipment", "Software", "Marketing", "Education", "Supplements", "Other"];

export default function VendorApplyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await createVendorCheckout({
      companyName: fd.get("companyName") as string,
      email: fd.get("email") as string,
      website: fd.get("website") as string,
      category: fd.get("category") as string,
      description: fd.get("description") as string,
    });
    if (result.error) { setError(result.error); setLoading(false); return; }
    if (result.url) window.location.href = result.url;
  };

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-10 space-y-3">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px]">Partnership</span>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Join the Marketplace.</h1>
          <p className="text-gray-500">$99/month &mdash; connect your product with high-volume, nervous-system-first clinics.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Company Name</label>
            <input name="companyName" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Email</label>
            <input name="email" type="email" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Website</label>
            <input name="website" type="url" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</label>
            <select name="category" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange">
              <option value="">Select a category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
            <textarea name="description" rows={3} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none" placeholder="How does your product serve chiropractors?" />
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-neuro-orange text-white font-black uppercase tracking-widest rounded-xl hover:bg-neuro-orange-dark transition-all disabled:opacity-50">
            {loading ? "Redirecting to checkout..." : "Apply & Pay $99/month"}
          </button>
        </form>
      </div>
    </div>
  );
}
