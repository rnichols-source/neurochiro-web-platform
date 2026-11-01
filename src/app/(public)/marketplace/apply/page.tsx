"use client";

import { useState } from "react";
import Link from "next/link";
import { SYNAPSE_COUNTRIES, COUNTRY_LABELS } from "@/lib/synapse/config";
import { SYNAPSE_CATEGORIES } from "@/lib/synapse/categories";
import { submitSynapseApplication } from "./actions";

export default function ApplyPage() {
  const [tier, setTier] = useState<"anchor" | "ally">("anchor");
  const [pledged, setPledged] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const result = await submitSynapseApplication({
      companyName: String(form.get("company") || ""),
      contactName: String(form.get("contact") || ""),
      email: String(form.get("email") || ""),
      website: String(form.get("website") || ""),
      category: String(form.get("category") || ""),
      country: String(form.get("country") || ""),
      description: String(form.get("description") || ""),
      tier,
      pledged,
    });
    setPending(false);
    setMessage(result.error || "Application received. There is no charge until an admin approves a seat.");
  }

  return (
    <div className="min-h-dvh bg-[#F5F3EF] px-4 py-24">
      <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="font-heading text-3xl font-black text-[#1E2D3B]">Apply to Synapse</h1>
        <p className="text-sm text-gray-600">No payment now. An admin reviews the application and sends a checkout link only after approval.</p>
        <div className="grid grid-cols-2 gap-2">
          {(["anchor", "ally"] as const).map((choice) => (
            <button key={choice} type="button" onClick={() => setTier(choice)} className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${tier === choice ? "border-[#D66829] bg-[#D66829] text-white" : "border-gray-200"}`}>
              {choice === "anchor" ? "Anchor interest" : "Ally interest"}
            </button>
          ))}
        </div>
        <input name="company" required placeholder="Company name" className="min-h-11 w-full rounded-xl border border-gray-200 px-3" />
        <input name="contact" required placeholder="Your name" className="min-h-11 w-full rounded-xl border border-gray-200 px-3" />
        <input name="email" type="email" required placeholder="Email" className="min-h-11 w-full rounded-xl border border-gray-200 px-3" />
        <input name="website" type="url" placeholder="Website" className="min-h-11 w-full rounded-xl border border-gray-200 px-3" />
        <select name="category" required className="min-h-11 w-full rounded-xl border border-gray-200 px-3" defaultValue="">
          <option value="" disabled>Category</option>
          {SYNAPSE_CATEGORIES.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
        </select>
        <select name="country" required className="min-h-11 w-full rounded-xl border border-gray-200 px-3" defaultValue="US">
          {SYNAPSE_COUNTRIES.map((country) => <option key={country} value={country}>{COUNTRY_LABELS[country]}</option>)}
        </select>
        <textarea name="description" required rows={4} placeholder="What you sell and who it is for" className="w-full rounded-xl border border-gray-200 px-3 py-3" />
        <label className="flex min-h-11 items-start gap-2 text-sm text-[#1E2D3B]">
          <input type="checkbox" checked={pledged} onChange={(event) => setPledged(event.target.checked)} className="mt-1" />
          We pledge a best member price for NeuroChiro doctors.
        </label>
        {message ? <p className="text-sm text-[#1E2D3B]">{message}</p> : null}
        <button type="submit" disabled={pending} className="min-h-11 w-full rounded-xl bg-[#D66829] font-bold text-white disabled:opacity-60">
          {pending ? "Sending…" : "Submit application"}
        </button>
        <Link href="/marketplace/pricing" className="block text-center text-sm font-bold text-[#B4501A]">Read the seat terms</Link>
      </form>
    </div>
  );
}
