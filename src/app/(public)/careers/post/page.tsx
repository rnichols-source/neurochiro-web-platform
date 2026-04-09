"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { createJobListingCheckout } from "./actions";

const DURATIONS = [
  { value: "30", label: "30 Days", price: "$49" },
  { value: "60", label: "60 Days", price: "$79" },
  { value: "90", label: "90 Days", price: "$99" },
] as const;

export default function PostJobPage() {
  const [duration, setDuration] = useState<"30" | "60" | "90">("30");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const { url } = await createJobListingCheckout(
        {
          title: fd.get("title") as string,
          description: fd.get("description") as string,
          category: fd.get("category") as string,
          employment_type: fd.get("employment_type") as string,
          salary_min: Number(fd.get("salary_min")) || 0,
          salary_max: Number(fd.get("salary_max")) || 0,
          city: fd.get("city") as string,
          state: fd.get("state") as string,
          contact_email: fd.get("contact_email") as string,
        },
        duration
      );
      if (url) window.location.href = url;
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/20";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-6 space-y-8 pt-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-black text-neuro-navy">Post a Job Listing</h1>
          <p className="text-gray-500 text-sm">Not a member? Post a single listing and pay once.</p>
          <p className="text-xs text-gray-400">
            Already a member? <Link href="/doctor/jobs" className="text-neuro-orange font-bold hover:underline">Post for free from your dashboard</Link>
          </p>
        </div>

        {/* Duration picker */}
        <div className="grid grid-cols-3 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDuration(d.value)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                duration === d.value
                  ? "border-neuro-orange bg-neuro-orange/5"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="font-black text-neuro-navy text-lg">{d.price}</p>
              <p className="text-xs text-gray-500">{d.label}</p>
            </button>
          ))}
        </div>

        {/* Job form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className={labelCls}>Job Title *</label>
            <input name="title" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea name="description" rows={4} required className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <select name="category" className={inputCls + " bg-white"}>
                <option value="Clinical">Clinical</option>
                <option value="Support Staff">Support Staff</option>
                <option value="Technical">Technical</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Employment Type</label>
              <select name="employment_type" className={inputCls + " bg-white"}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Salary Min</label>
              <input name="salary_min" type="number" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Salary Max</label>
              <input name="salary_max" type="number" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>City *</label>
              <input name="city" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State *</label>
              <input name="state" required className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Contact Email *</label>
            <input name="contact_email" type="email" required className={inputCls} />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-neuro-navy text-white font-bold rounded-xl text-sm hover:bg-neuro-navy/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Pay & Post — ${DURATIONS.find((d) => d.value === duration)?.price}`}
          </button>
        </form>
      </div>
    </div>
  );
}
