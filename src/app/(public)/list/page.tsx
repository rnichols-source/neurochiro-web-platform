"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, MapPin, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

export default function SubscribeListPage() {
  return (
    <Suspense>
      <SubscribeListContent />
    </Suspense>
  );
}

function SubscribeListContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const urlSource = searchParams.get("source") || "website";
  const urlZip = searchParams.get("zip") || "";

  const [email, setEmail] = useState("");
  const [zip, setZip] = useState(urlZip);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "coverage">("idle");
  const [serverError, setServerError] = useState("");
  const [nearbyDoctors, setNearbyDoctors] = useState<any[]>([]);
  const [coverageMessage, setCoverageMessage] = useState("");
  const tsRef = useRef(Date.now());

  useEffect(() => {
    tsRef.current = Date.now();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "Please enter a valid email address.";
    }
    if (!zip.trim() || !/^\d{5}$/.test(zip.trim())) {
      e.zip = "Please enter a valid 5-digit ZIP code.";
    }
    if (!consent) {
      e.consent = "You must agree to receive emails.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setServerError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          zip: zip.trim(),
          consent: true,
          source: urlSource,
          _hp: honeypot,
          _ts: tsRef.current,
        }),
      });

      const data = await res.json();

      if (data.coverage) {
        setNearbyDoctors(data.doctors || []);
        setCoverageMessage(data.message || "");
        setStatus("coverage");
        return;
      }

      if (!res.ok || !data.ok) {
        setServerError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setServerError("Connection error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "coverage") {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-heading font-black text-neuro-navy text-center mb-2">
            {coverageMessage || "Good news — there are doctors near you."}
          </h1>
          <p className="text-gray-500 text-center text-sm mb-8">
            You don't need to wait. These nervous system chiropractors are already taking patients in your area.
          </p>
          <div className="space-y-3">
            {nearbyDoctors.map((doc: any, i: number) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                <Link href={`/directory/${doc.slug}`} className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-neuro-navy/5 flex items-center justify-center shrink-0 overflow-hidden">
                    {doc.photo_url ? (
                      <img src={doc.photo_url} alt={doc.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-neuro-navy font-bold text-sm">{doc.name.replace('Dr. ', '').split(' ').map((n: string) => n[0]).join('')}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-neuro-navy text-sm">{doc.name}</p>
                    <p className="text-gray-500 text-xs">{doc.clinic}</p>
                    <p className="text-gray-400 text-xs">{doc.city}, {doc.state} · {doc.distance} mi</p>
                  </div>
                </Link>
                <div className="flex gap-2">
                  {doc.booking_url ? (
                    <a href={doc.booking_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-2.5 bg-neuro-orange text-white rounded-xl text-xs font-bold text-center hover:bg-neuro-orange/90 transition-colors min-h-[44px] flex items-center justify-center">
                      Book Online
                    </a>
                  ) : (
                    <Link href={`/directory/${doc.slug}`}
                      className="flex-1 py-2.5 bg-neuro-navy text-white rounded-xl text-xs font-bold text-center hover:bg-neuro-navy/90 transition-colors min-h-[44px] flex items-center justify-center">
                      View Profile
                    </Link>
                  )}
                  {doc.phone && (
                    <a href={`tel:${doc.phone}`}
                      className="py-2.5 px-4 bg-neuro-navy/10 text-neuro-navy rounded-xl text-xs font-bold text-center hover:bg-neuro-navy/20 transition-colors min-h-[44px] flex items-center justify-center">
                      Call
                    </a>
                  )}
                </div>
                <Link href={`/contact-request?doctor=${doc.slug}`}
                  className="block text-center text-xs text-gray-400 hover:text-neuro-orange mt-2 transition-colors">
                  Have their office reach out to me
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/directory" className="text-neuro-orange font-bold text-sm hover:underline">
              Browse all doctors in the directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-heading font-black text-neuro-navy mb-3">
            Check Your Inbox
          </h1>
          <p className="text-gray-500 leading-relaxed mb-6">
            We sent a confirmation link to <strong className="text-neuro-navy">{email}</strong>. Click it to complete your signup. The link expires in 24 hours.
          </p>
          <p className="text-sm text-gray-400">
            Don't see it? Check your spam or promotions folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-neuro-orange text-sm font-black uppercase tracking-[0.2em] mb-3">
            Patient List
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-white leading-tight mb-4">
            No Chiropractor in Your Area Yet?
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Join the list. We'll send you weekly nervous system health education, and the moment a NeuroChiro doctor joins near you, you'll be the first to know.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-md mx-auto px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 p-8">
          {urlError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                {urlError === "expired"
                  ? "That confirmation link has expired. Enter your email again to get a new one."
                  : urlError === "invalid"
                  ? "That confirmation link is invalid. Enter your email again to get a new one."
                  : "Something went wrong. Please try again."}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Honeypot — hidden from real users */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              style={{ position: "absolute", left: "-9999px", opacity: 0 }}
              aria-hidden="true"
            />

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-neuro-navy mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                  placeholder="you@email.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.email ? "border-red-400" : "border-gray-200"} text-neuro-navy text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange transition-colors`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* ZIP */}
            <div>
              <label className="block text-sm font-bold text-neuro-navy mb-1.5">
                ZIP Code
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zip}
                  onChange={(e) => { setZip(e.target.value.replace(/\D/g, "").slice(0, 5)); setErrors((p) => ({ ...p, zip: "" })); }}
                  placeholder="12345"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.zip ? "border-red-400" : "border-gray-200"} text-neuro-navy text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange transition-colors`}
                />
              </div>
              {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
            </div>

            {/* Consent */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => { setConsent(e.target.checked); setErrors((p) => ({ ...p, consent: "" })); }}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-neuro-orange focus:ring-neuro-orange"
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  I agree to receive weekly educational emails from NeuroChiro. I can unsubscribe anytime.
                </span>
              </label>
              {errors.consent && <p className="text-red-500 text-xs mt-1">{errors.consent}</p>}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full py-3.5 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "submitting" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</>
              ) : (
                <>Join the List <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* What to expect */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-xl font-heading font-black text-neuro-navy mb-8">
          What You'll Get
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-neuro-orange/10 flex items-center justify-center mb-4">
              <Mail className="w-5 h-5 text-neuro-orange" />
            </div>
            <h3 className="font-bold text-neuro-navy text-sm mb-1">Weekly Education</h3>
            <p className="text-gray-500 text-sm">Nervous system health tips you can actually use. No spam, no selling.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-neuro-orange/10 flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-neuro-orange" />
            </div>
            <h3 className="font-bold text-neuro-navy text-sm mb-1">Doctor Alerts</h3>
            <p className="text-gray-500 text-sm">When a NeuroChiro doctor joins near your ZIP code, you'll be the first to know.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-neuro-orange/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5 text-neuro-orange" />
            </div>
            <h3 className="font-bold text-neuro-navy text-sm mb-1">Cancel Anytime</h3>
            <p className="text-gray-500 text-sm">One-click unsubscribe in every email. No strings attached.</p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-2xl mx-auto px-6 pb-8">
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          NeuroChiro provides educational content only. Nothing on this site or in our emails constitutes medical advice, diagnosis, or treatment. No doctor-patient relationship is created by joining this list. Always consult a licensed healthcare provider for medical concerns.
        </p>
      </section>

      <Footer />
    </div>
  );
}
