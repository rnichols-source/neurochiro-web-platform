"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { captureAULead } from "./actions";

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("doctor");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    const result = await captureAULead(email, name, role);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <p className="text-xl font-black text-white mb-2">You&apos;re on the list.</p>
        <p className="text-gray-400 text-sm">We&apos;ll send you everything you need to get started on NeuroChiro.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
      <div className="flex items-center gap-2 justify-center mb-2">
        <Mail className="w-5 h-5 text-neuro-orange" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange">Not Ready Yet?</p>
      </div>
      <p className="text-white font-black text-xl text-center mb-1">Drop your email.</p>
      <p className="text-gray-500 text-sm text-center mb-6">We&apos;ll send you info on how NeuroChiro works in Australia. No spam.</p>

      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm mx-auto">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 focus:border-neuro-orange/40 focus:ring-1 focus:ring-neuro-orange/20 outline-none transition-colors"
        />
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email"
          className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 focus:border-neuro-orange/40 focus:ring-1 focus:ring-neuro-orange/20 outline-none transition-colors"
        />
        <div className="flex gap-2">
          <button type="button" onClick={() => setRole("doctor")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all border ${role === "doctor" ? "bg-neuro-orange/10 border-neuro-orange text-white" : "bg-white/[0.02] border-white/[0.08] text-white/40"}`}>
            Doctor
          </button>
          <button type="button" onClick={() => setRole("student")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all border ${role === "student" ? "bg-neuro-orange/10 border-neuro-orange text-white" : "bg-white/[0.02] border-white/[0.08] text-white/40"}`}>
            Student
          </button>
        </div>

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <button type="submit" disabled={loading || !email}
          className="w-full py-3.5 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors disabled:opacity-40">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {loading ? "Sending..." : "Keep Me Posted"}
        </button>
      </form>
    </div>
  );
}
