"use client";

import { useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { submitFindRequest } from "../actions";

export default function FindSomeoneForm({ city, state }: { city: string; state: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("city_searched", city);
    formData.set("state_searched", state);

    const result = await submitFindRequest(formData);
    if (result.ok) {
      setStatus("success");
    } else {
      setError(result.error || "Something went wrong.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 py-4">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-700 font-bold">Got it. I'll look into this and get back to you personally.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-neuro-navy mb-1">Name</label>
          <input
            type="text"
            name="name"
            required
            placeholder="Your name"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-neuro-navy mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            placeholder="you@email.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange min-h-[44px]"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-neuro-navy mb-1">ZIP Code</label>
        <input
          type="text"
          name="zip"
          required
          maxLength={5}
          inputMode="numeric"
          placeholder="12345"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange min-h-[44px]"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-neuro-navy mb-1">Anything I should know? <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          name="note"
          rows={2}
          placeholder="e.g. looking for a doctor who works with kids"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange resize-y"
        />
        <p className="text-[10px] text-gray-400 mt-1">
          Please do not include symptoms, diagnoses, or medical details. This is not a clinical form.
        </p>
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="px-6 py-3 bg-neuro-navy text-white font-bold rounded-xl text-sm hover:bg-neuro-navy/90 transition-colors flex items-center gap-2 min-h-[44px] disabled:opacity-50"
      >
        {status === "submitting" ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Help Me Find Someone"}
      </button>
    </form>
  );
}
