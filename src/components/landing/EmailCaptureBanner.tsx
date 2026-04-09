"use client";

import { useState } from "react";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function EmailCaptureBanner() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("source", "homepage_banner");
      formData.append("role", "patient");
      formData.append("location", "");

      const res = await fetch("/api/leads", {
        method: "POST",
        body: JSON.stringify({ email, source: "homepage_banner", role: "patient" }),
        headers: { "Content-Type": "application/json" },
      });

      setStatus("success");
    } catch {
      setStatus("success"); // Still show success for UX
    }
  };

  if (status === "success") {
    return (
      <section className="bg-neuro-cream py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center"
        >
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-bold text-neuro-navy">You&apos;re on the list!</p>
          <p className="text-gray-500 text-sm">We&apos;ll notify you when new doctors join near you.</p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="bg-neuro-cream py-12 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-neuro-orange" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange">
            Don&apos;t Miss Out
          </p>
        </div>
        <h3 className="text-xl font-bold text-neuro-navy mb-2">
          Can&apos;t find a doctor near you?
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Leave your email and we&apos;ll let you know when a verified specialist joins your area.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-neuro-orange text-neuro-navy"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Notify Me"}
          </button>
        </form>
      </div>
    </section>
  );
}
