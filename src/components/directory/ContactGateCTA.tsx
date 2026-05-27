"use client";

import { Lock, Mail, Check } from "lucide-react";
import { useState } from "react";

interface ContactGateCTAProps {
  variant: 'sidebar' | 'hero' | 'mobile';
  doctorId: string;
  doctorName?: string;
}

export default function ContactGateCTA({ variant, doctorId, doctorName }: ContactGateCTAProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/patient-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, patientEmail: email, patientName: name }),
      });
      setSubmitted(true);
    } catch {
      // Still show success to patient
      setSubmitted(true);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${variant === 'hero' ? 'px-6 py-3 bg-green-50 rounded-xl' : 'py-4 px-4 bg-green-50 rounded-xl text-center justify-center'}`}>
        <Check className="w-4 h-4" />
        <span className="text-sm font-bold">We&apos;ll notify {doctorName || 'this doctor'} you&apos;re looking for them!</span>
      </div>
    );
  }

  if (variant === 'mobile') {
    return showForm ? (
      <form onSubmit={handleSubmit} className="flex-1 space-y-2">
        <p className="text-gray-500 text-xs">We&apos;ll notify {doctorName || 'the doctor'} and share your email so they can reach out to you.</p>
        <input type="email" required placeholder="Enter your email..." value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
        <button type="submit" disabled={loading} className="w-full py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm">
          {loading ? "Sending..." : "Send Request"}
        </button>
      </form>
    ) : (
      <button onClick={() => setShowForm(true)} className="flex-1 py-3.5 bg-neuro-navy text-white rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
        <Mail className="w-4 h-4" /> Request Contact Info
      </button>
    );
  }

  if (variant === 'hero') {
    return showForm ? (
      <form onSubmit={handleSubmit} className="space-y-2">
        <p className="text-white/60 text-xs">We&apos;ll let {doctorName || 'the doctor'} know you&apos;re looking for them and share your email so they can reach out.</p>
        <div className="flex gap-2">
          <input type="email" required placeholder="Enter your email..." value={email} onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange placeholder:text-white/40" />
          <button type="submit" disabled={loading} className="px-5 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm whitespace-nowrap">
            {loading ? "..." : "Send Request"}
          </button>
        </div>
      </form>
    ) : (
      <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-white/10 text-white/70 rounded-xl text-sm flex items-center gap-2 border border-white/20 hover:bg-white/15 transition-colors">
        <Mail className="w-4 h-4" />
        <span>Request this doctor&apos;s contact info</span>
      </button>
    );
  }

  // sidebar
  return (
    <div className="w-full py-4 px-4 bg-gray-50 rounded-xl text-center space-y-2 border border-gray-100">
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <p className="text-xs text-gray-500 text-left">We&apos;ll notify {doctorName || 'this doctor'} and share your email so they can reach out.</p>
          <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neuro-orange" />
          <input type="email" required placeholder="Enter your email..." value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neuro-orange" />
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-neuro-orange text-white font-bold rounded-lg text-xs">
            {loading ? "Sending..." : "Send Request"}
          </button>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Contact Info Locked</span>
          </div>
          <p className="text-xs text-gray-500">Want to reach {doctorName || 'this doctor'}? We&apos;ll let them know.</p>
          <button onClick={() => setShowForm(true)} className="mt-1 px-5 py-2.5 bg-neuro-orange text-white font-bold rounded-lg text-xs hover:bg-neuro-orange/90 transition-colors">
            Request Contact Info
          </button>
        </>
      )}
    </div>
  );
}
