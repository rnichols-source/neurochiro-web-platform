"use client";

import { Mail, Check, Globe, Phone } from "lucide-react";
import { useState } from "react";
import { fill } from "@/i18n/config";
import { useDictionary } from "@/i18n/locale-context";

interface ContactGateCTAProps {
  variant: 'sidebar' | 'hero' | 'mobile';
  doctorId: string;
  doctorName?: string;
  isClaimed?: boolean;
  phone?: string | null;
  website?: string | null;
}

function maskPhone(phone: string): string {
  // "(903) 465-1881" → "(●●●) ●●●-1881"
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `(●●●) ●●●-${digits.slice(-4)}`;
  }
  return '●●●-●●●-●●●●';
}

function maskUrl(url: string): string {
  // "https://drknight.net/durant/" → "●●●●●●●●.net"
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    const parts = hostname.split('.');
    const ext = parts.pop();
    return `●●●●●●●●.${ext}`;
  } catch {
    return '●●●●●●●●.com';
  }
}

export default function ContactGateCTA({ variant, doctorId, doctorName, isClaimed = true, phone, website }: ContactGateCTAProps) {
  const t = useDictionary().gate;
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
      setSubmitted(true);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${variant === 'hero' ? 'px-6 py-3 bg-green-50 rounded-xl' : 'py-4 px-4 bg-green-50 rounded-xl text-center justify-center'}`}>
        <Check className="w-4 h-4" />
        <span className="text-sm font-bold">{fill(t.notify, { name: doctorName || t.thisDoctor })}</span>
      </div>
    );
  }

  // Masked contact preview
  const maskedContactJSX = (phone || website) && isClaimed ? (
    <div className="space-y-1.5 mb-3">
      {phone && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="blur-[3px] select-none">{maskPhone(phone)}</span>
        </div>
      )}
      {website && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="blur-[3px] select-none">{maskUrl(website)}</span>
        </div>
      )}
    </div>
  ) : null;

  if (variant === 'mobile') {
    return showForm ? (
      <form onSubmit={handleSubmit} className="flex-1 space-y-2">
        <p className="text-gray-500 text-xs">{fill(t.shareEmail, { name: doctorName || t.theDoctor })}</p>
        <input type="email" required placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
        <button type="submit" disabled={loading} className="w-full py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm">
          {loading ? t.sending : t.send}
        </button>
      </form>
    ) : (
      <button onClick={() => setShowForm(true)} className="flex-1 py-3.5 bg-neuro-navy text-white rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
        <Mail className="w-4 h-4" /> {t.requestInfo}
      </button>
    );
  }

  if (variant === 'hero') {
    return showForm ? (
      <form onSubmit={handleSubmit} className="space-y-2">
        <p className="text-white/60 text-xs">{fill(t.shareEmailHero, { name: doctorName || t.theDoctor })}</p>
        <div className="flex gap-2">
          <input type="email" required placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange placeholder:text-white/40" />
          <button type="submit" disabled={loading} className="px-5 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm whitespace-nowrap">
            {loading ? "..." : t.send}
          </button>
        </div>
      </form>
    ) : (
      <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-white/10 text-white/70 rounded-xl text-sm flex items-center gap-2 border border-white/20 hover:bg-white/15 transition-colors">
        <Mail className="w-4 h-4" />
        <span>{isClaimed ? t.requestTheirs : t.afterClaim}</span>
      </button>
    );
  }

  // sidebar
  return (
    <div className="w-full py-4 px-4 bg-gray-50 rounded-xl text-center space-y-2 border border-gray-100">
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <p className="text-xs text-gray-500 text-left">{fill(t.shareEmailSide, { name: doctorName || t.thisDoctor })}</p>
          <input type="text" placeholder={t.yourName} value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neuro-orange" />
          <input type="email" required placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neuro-orange" />
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-neuro-orange text-white font-bold rounded-lg text-xs">
            {loading ? t.sending : t.send}
          </button>
        </form>
      ) : (
        <>
          {maskedContactJSX}
          <p className="text-xs text-gray-500">
            {isClaimed
              ? fill(t.upgrade, { name: doctorName || t.thisDoctor })
              : fill(t.unclaimed, { name: doctorName || t.thisDoctor })}
          </p>
          <button onClick={() => setShowForm(true)} className="mt-1 px-5 py-2.5 bg-neuro-orange text-white font-bold rounded-lg text-xs hover:bg-neuro-orange/90 transition-colors">
            {isClaimed ? t.requestInfo : t.notified}
          </button>
        </>
      )}
    </div>
  );
}
