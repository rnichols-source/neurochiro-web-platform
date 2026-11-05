"use client";

import { useState } from "react";
import { Mail, Clock, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import Footer from "@/components/landing/Footer";
import { useDictionary } from "@/i18n/locale-context";

export default function ContactPage() {
  const t = useDictionary();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          first_name: form.name,
          source: "contact_form",
          role: "contact",
          location: null,
          metadata: { subject: form.subject, message: form.message },
        }),
      });
    } catch {}
    setStatus("success");
  };

  return (
    <div className="min-h-dvh bg-neuro-cream">
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-black text-neuro-navy mb-4">{t.contact.title}</h1>
            <p className="text-gray-500 max-w-lg mx-auto">
              {t.contact.body}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <Mail className="w-5 h-5 text-neuro-orange mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.contact.email}</p>
              <a href="mailto:support@neurochirodirectory.com" className="text-sm font-bold text-neuro-navy hover:text-neuro-orange transition-colors">
                support@neurochirodirectory.com
              </a>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <Clock className="w-5 h-5 text-neuro-orange mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.contact.response}</p>
              <p className="text-sm font-bold text-neuro-navy">{t.contact.within}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <MessageSquare className="w-5 h-5 text-neuro-orange mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.contact.partnerships}</p>
              <a href="mailto:partners@neurochiro.com" className="text-sm font-bold text-neuro-navy hover:text-neuro-orange transition-colors">
                partners@neurochiro.com
              </a>
            </div>
          </div>

          {status === "success" ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-neuro-navy mb-2">{t.contact.received}</h2>
              <p className="text-gray-500">{t.contact.receivedBody}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.contact.name}</label>
                  <input
                    type="text" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t.contact.yourName}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-neuro-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.contact.emailLabel}</label>
                  <input
                    type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={t.contact.emailPlaceholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-neuro-orange"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.contact.subject}</label>
                <select
                  required value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-neuro-orange text-gray-700"
                >
                  <option value="">{t.contact.select}</option>
                  <option value="general">{t.contact.general}</option>
                  <option value="doctor-inquiry">{t.contact.doctor}</option>
                  <option value="student-inquiry">{t.contact.student}</option>
                  <option value="report-concern">{t.contact.report}</option>
                  <option value="billing">{t.contact.billing}</option>
                  <option value="partnership">{t.contact.partnership}</option>
                  <option value="feedback">{t.contact.feedback}</option>
                  <option value="bug">{t.contact.bug}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.contact.message}</label>
                <textarea
                  required value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={t.contact.messagePlaceholder}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-neuro-orange resize-none"
                />
              </div>
              <button
                type="submit" disabled={status === "loading"}
                className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "loading" ? <><Loader2 className="w-5 h-5 animate-spin" /> {t.contact.sending}</> : t.contact.send}
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
