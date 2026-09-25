"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Phone, User, MessageSquare, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

export default function ContactRequestPage() {
  return (
    <Suspense>
      <ContactRequestContent />
    </Suspense>
  );
}

function ContactRequestContent() {
  const searchParams = useSearchParams();
  const doctorSlug = searchParams.get("doctor");

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<{ doctorName: string; practiceName: string; withdrawUrl: string } | null>(null);

  // Load doctor info
  useEffect(() => {
    if (!doctorSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    async function loadDoctor() {
      try {
        const res = await fetch(`/api/directory/doctor?slug=${encodeURIComponent(doctorSlug!)}`);
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!data || !data.id) {
          setNotFound(true);
        } else {
          setDoctor(data);
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    }

    loadDoctor();
  }, [doctorSlug]);

  const practiceName = doctor?.clinic_name || `Dr. ${doctor?.first_name} ${doctor?.last_name}`.trim();
  const doctorDisplayName = doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}`.trim() : "";
  const consentText = `I am asking ${practiceName} to contact me by phone or text about becoming a patient.`;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please enter your name.";
    if (!phone.trim() || !/^\+?[\d\s\-().]{7,20}$/.test(phone.trim())) {
      e.phone = "Please enter a valid phone number.";
    }
    if (!consent) e.consent = "You must agree to be contacted.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !doctor) return;

    setStatus("submitting");
    setServerError("");

    try {
      const res = await fetch("/api/contact-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.id,
          name: name.trim(),
          phone: phone.trim(),
          note: note.trim() || undefined,
          consent: true,
          consentText,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setServerError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("success");
    } catch {
      setServerError("Connection error. Please try again.");
      setStatus("error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neuro-orange animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-heading font-black text-neuro-navy mb-2">Doctor Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">
            We couldn't find that doctor in our directory. They may have moved or the link may be outdated.
          </p>
          <Link href="/directory" className="text-neuro-orange font-bold text-sm hover:underline">
            Browse the directory
          </Link>
        </div>
      </div>
    );
  }

  if (status === "success" && result) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-heading font-black text-neuro-navy mb-3">
            Request Sent
          </h1>
          <p className="text-gray-500 leading-relaxed mb-2">
            We've let <strong className="text-neuro-navy">{result.practiceName}</strong> know you'd like them to reach out.
            Expect a call or text from their office.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            They have your name and phone number. No medical details were shared.
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left mb-6">
            <div className="flex items-start gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-neuro-navy flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-neuro-navy mb-1">Your consent is recorded</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  "{consentText}"
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Changed your mind? You can{" "}
              <a href={result.withdrawUrl} className="text-neuro-orange hover:underline font-medium">
                withdraw this request
              </a>{" "}
              at any time. The doctor's office will be notified.
            </p>
          </div>

          <Link
            href={`/directory/${doctorSlug}`}
            className="text-neuro-orange font-bold text-sm hover:underline"
          >
            Back to {doctorDisplayName}'s profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Header */}
      <section className="bg-neuro-navy pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-neuro-orange text-sm font-black uppercase tracking-[0.2em] mb-3">
            Contact Request
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-white leading-tight mb-4">
            Have {practiceName} Reach Out to You
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Share your name and phone number. Their office will contact you directly.
            No medical details needed here.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-md mx-auto px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 p-8">
          {/* Doctor info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-14 h-14 rounded-xl bg-neuro-navy/5 flex items-center justify-center shrink-0 overflow-hidden">
              {doctor.photo_url ? (
                <img src={doctor.photo_url} alt={doctorDisplayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-neuro-navy font-bold text-lg">
                  {(doctor.first_name?.[0] || "") + (doctor.last_name?.[0] || "")}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-neuro-navy">{doctorDisplayName}</p>
              {doctor.clinic_name && (
                <p className="text-gray-500 text-sm">{doctor.clinic_name}</p>
              )}
              <p className="text-gray-400 text-xs">{doctor.city}, {doctor.state}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-neuro-navy mb-1.5">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                  placeholder="First and last name"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.name ? "border-red-400" : "border-gray-200"} text-neuro-navy text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange transition-colors`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-neuro-navy mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: "" })); }}
                  placeholder="(555) 123-4567"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.phone ? "border-red-400" : "border-gray-200"} text-neuro-navy text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange transition-colors`}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-bold text-neuro-navy mb-1.5">
                Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Best time to call, how you heard about this doctor, etc."
                  rows={3}
                  maxLength={500}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-neuro-navy text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange transition-colors resize-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Do not include medical or health details. Share those directly with the doctor.
              </p>
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
                <span className="text-sm text-gray-600 leading-relaxed">
                  {consentText}
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                "Send Contact Request"
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Privacy note */}
      <section className="max-w-md mx-auto px-6 py-8">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your name and phone number will be shared only with {practiceName}.
              No medical information is collected or transmitted.
              Your consent is recorded and you can withdraw it at any time.
              No doctor-patient relationship is created by this request.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
