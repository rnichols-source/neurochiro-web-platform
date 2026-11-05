"use client";

import { useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { submitFindRequest } from "../actions";
import { useDictionary, useLocale } from "@/i18n/locale-context";

export default function FindSomeoneForm({ city, state }: { city: string; state: string }) {
  const t = useDictionary();
  const locale = useLocale();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("city_searched", city);
    formData.set("state_searched", state);
    formData.set("locale", locale);

    const result = await submitFindRequest(formData);
    if (result.ok) {
      setStatus("success");
    } else {
      setError(result.error || t.find.fallback);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 py-4">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-700 font-bold">{t.find.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-neuro-navy mb-1">{t.find.name}</label>
          <input
            type="text"
            name="name"
            required
            placeholder={t.find.yourName}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-neuro-navy mb-1">{t.find.email}</label>
          <input
            type="email"
            name="email"
            required
            placeholder={t.find.emailPlaceholder}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange min-h-[44px]"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-neuro-navy mb-1">{t.find.postal}</label>
        <input
          type="text"
          name="zip"
          required
          maxLength={16}
          placeholder={t.find.postalPlaceholder}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange min-h-[44px]"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-neuro-navy mb-1">{t.find.note} <span className="text-gray-400 font-normal">{t.find.optional}</span></label>
        <textarea
          name="note"
          rows={2}
          placeholder={t.find.notePlaceholder}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange resize-y"
        />
        <p className="text-[10px] text-gray-400 mt-1">
          {t.find.health}
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
        {status === "submitting" ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.find.sending}</> : t.find.submit}
      </button>
    </form>
  );
}
