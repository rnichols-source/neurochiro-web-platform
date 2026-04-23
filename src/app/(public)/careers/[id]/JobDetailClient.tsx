"use client";

import { useState } from "react";
import { MapPin, Briefcase, DollarSign, Clock, ExternalLink, CheckCircle } from "lucide-react";
import Link from "next/link";
import { applyToJob } from "../actions";

export default function JobDetailClient({ job }: { job: any }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const location = [job.city || job.clinic_city, job.state || job.clinic_state].filter(Boolean).join(", ");
  const salary =
    job.salary_min && job.salary_max
      ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
      : job.salary_min
      ? `From $${job.salary_min.toLocaleString()}`
      : job.salary_max
      ? `Up to $${job.salary_max.toLocaleString()}`
      : null;

  async function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await applyToJob(job.id, {
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        phone: (fd.get("phone") as string) || undefined,
        message: (fd.get("message") as string) || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message?.includes("already applied") ? "You've already applied for this position." : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6 space-y-8 pt-8">
        <Link href="/careers" className="text-sm text-neuro-orange font-bold hover:underline">&larr; Back to Careers</Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {job.category && <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{job.category}</span>}
              {job.employment_type && <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{job.employment_type}</span>}
            </div>
            <h1 className="text-3xl font-heading font-black text-neuro-navy">{job.title}</h1>
            <p className="text-gray-500 mt-1">{job.clinic_name}</p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-gray-500">
            {location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {location}</span>}
            {job.type && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.type}</span>}
            {salary && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {salary}</span>}
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Posted {new Date(job.created_at).toLocaleDateString()}</span>
          </div>

          {job.description && (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{job.description}</div>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <div>
              <h3 className="font-bold text-neuro-navy mb-2">Benefits</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {job.benefits.map((b: string, i: number) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="font-bold text-neuro-navy mb-2">Requirements</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {job.requirements.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Apply Section */}
        {job.apply_method === "external" && job.apply_url ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <h2 className="text-xl font-bold text-neuro-navy mb-3">Apply Externally</h2>
            <p className="text-sm text-gray-500 mb-4">This employer accepts applications through their own website.</p>
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange/90 transition-colors">
              Apply Now <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : submitted ? (
          <div className="bg-white rounded-2xl border border-green-200 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-neuro-navy mb-2">You&apos;re in the running!</h2>
            <p className="text-sm text-gray-500 mb-4">Your application has been sent directly to the clinic. They&apos;ll reach out if it&apos;s a fit.</p>
            <Link href="/careers" className="inline-flex items-center gap-2 px-6 py-2.5 bg-neuro-navy text-white font-bold rounded-xl text-xs hover:bg-neuro-navy/90 transition-colors">
              Browse More Positions
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-neuro-navy mb-1">Apply for this Position</h2>
            <p className="text-sm text-gray-400 mb-5">Takes less than 60 seconds. The clinic will be notified immediately.</p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input name="name" required placeholder="Dr. Jane Smith" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input name="email" type="email" required placeholder="jane@example.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <input name="phone" type="tel" placeholder="(555) 123-4567" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Why are you a great fit? <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea name="message" rows={3} placeholder="Share what excites you about this role..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange/40" />
              </div>
              <button type="submit" disabled={submitting} className="w-full py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange/90 transition-colors disabled:opacity-50 active:scale-[0.98]">
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
              <p className="text-[11px] text-gray-400 text-center">Your info is shared only with this clinic. No spam, ever.</p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
