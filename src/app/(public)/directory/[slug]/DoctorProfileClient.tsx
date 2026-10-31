"use client";

import { useState, useEffect } from "react";
import PublicBadges from "./public-badges";
import {
  MapPin, ShieldCheck, CheckCircle2, Mail, ExternalLink, MessageSquare,
  Loader2, Phone, Heart, Share2, Calendar, Send, Globe, Users, Star,
  Copy, Instagram, Facebook, Award, Clock, Stethoscope, GraduationCap,
  ArrowLeft, Play, TrendingUp, DollarSign,
} from "lucide-react";
import Link from "next/link";
import { priceLabel } from "@/lib/seminars/format";
import { createClient } from "@/lib/supabase";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { sendReferral } from "@/app/actions/referrals";
import { isProfileGated } from "@/lib/profile-gating";
import ContactGateCTA from "@/components/directory/ContactGateCTA";
import Image from "next/image";
import { getEpisodeByDoctorSlug } from "../../spotlight/spotlight-data";
import { displayAddress, nameInitials, uniqueLabels } from "@/lib/profile-display";
import { containsHealthWords } from "@/lib/leads/validate";

function parseContact(value: string): { email: string; phone: string; valid: boolean } {
  const trimmed = value.trim();
  if (!trimmed) return { email: "", phone: "", valid: false };
  if (trimmed.includes("@")) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    return { email: valid ? trimmed : "", phone: "", valid };
  }
  const digits = trimmed.replace(/\D/g, "");
  return { email: "", phone: trimmed, valid: digits.length >= 7 };
}

function formatUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION WRAPPER — alternating full-width backgrounds
   ═══════════════════════════════════════════════════════════════ */
function Section({ bg = "white", children, id, style: extra }: { bg?: "white" | "cream" | "navy" | "darknavy"; children: React.ReactNode; id?: string; style?: React.CSSProperties }) {
  const bgMap = { white: "#ffffff", cream: "#F5F3EF", navy: "#1E2D3B", darknavy: "#162230" };
  return (
    <section id={id} style={{ background: bgMap[bg], width: "100%", ...extra }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {children}
      </div>
    </section>
  );
}

export default function DoctorProfileClient({ doctor, slug, seminars = [], jobs = [], cityDoctorCount = 0, nearbyDoctors = [], citySearchVolume = 0, stories = [] }: { doctor: any; slug: string; seminars?: any[]; jobs?: any[]; cityDoctorCount?: number; nearbyDoctors?: any[]; citySearchVolume?: number; stories?: { id: string; patient_first_name?: string | null; condition_before?: string | null; outcome_after?: string | null; story_text?: string | null }[] }) {
  const { toggleSave, isSaved } = useUserPreferences();
  const [copied, setCopied] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storySubmitted, setStorySubmitted] = useState(false);
  const [storyForm, setStoryForm] = useState({ patientFirstName: '', conditionBefore: '', outcomeAfter: '', storyText: '' });
  const [submittingStory, setSubmittingStory] = useState(false);
  const [appointmentSubmitted, setAppointmentSubmitted] = useState(false);
  const [submittingAppointment, setSubmittingAppointment] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({ name: '', contact: '', bestTime: '', message: '' });
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralSent, setReferralSent] = useState(false);
  const [referring, setReferring] = useState(false);
  const [referralPatientName, setReferralPatientName] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const supabase = createClient();
  const [photoError, setPhotoError] = useState(false);

  const gated = isProfileGated(doctor);
  const saved = isSaved('doctors', doctor.id?.toString());
  const isPracticeProfile = (doctor as any).profile_style === 'practice';
  const doctorName = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  const name = isPracticeProfile ? (doctor.clinic_name || doctorName) : doctorName;
  const spotlightEpisode = getEpisodeByDoctorSlug(slug);
  const location = [doctor.city, doctor.state].filter(Boolean).join(", ");
  // Filter specialties: split concatenated entries, drop free-text sentences
  const specialties = uniqueLabels(
    (doctor.specialties || [])
      .flatMap((s: string) => s.split(/\n/).map((t: string) => t.trim()))
      .filter((s: string) => s.length > 0 && s.length <= 50)
  );
  const d = doctor as any;

  // Extended fields
  const bannerUrl = d.banner_url as string | null;
  const instagramUrl = d.instagram_url as string | null;
  const facebookUrl = d.facebook_url as string | null;
  const tiktokUrl = d.tiktok_url as string | null;
  const highlights = d.highlights as string[] | null;
  // Filter treatment tags: controlled vocabulary only, no free-text sentences
  const rawConditions = d.conditions_treated as string[] | null;
  const conditionsTreated = rawConditions
    ? uniqueLabels(rawConditions.filter((c: string) => c.length <= 50 && !/\b(any|every|all)\s+(condition|problem)/i.test(c)))
    : null;
  const education = d.education as string[] | null;
  const languages = d.languages as string[] | null;
  const hours = d.hours as string | null;
  const acceptedPayment = d.accepted_payment as string[] | null;
  const faq = d.faq as { question: string; answer: string }[] | null;
  const galleryImages = d.gallery_images as string[] | null;
  const bookingUrl = d.booking_url as string | null;
  const firstVisitInfo = d.first_visit_info as string | null;
  const parkingInfo = d.parking_info as string | null;
  const amenitiesList = d.amenities as string[] | null;
  const offersTelehealth = d.offers_telehealth as boolean;
  const acceptsWalkins = d.accepts_walkins as boolean;
  const acceptingNewPatients = d.accepting_new_patients as boolean;
  const yearsInPractice = d.years_in_practice as number | null;
  const insuranceNetworks = d.insurance_networks as string[] | null;
  const teamMembersList = d.team_members as { name: string; role: string; photo_url?: string }[] | null;
  // Certifications: dedupe and filter out marketing claims, awards, and sentences
  const certificationsList = d.certifications
    ? [...new Set(d.certifications as string[])].filter((c: string) =>
        !/\b(only one|fastest|one of the only|finalist|business person|business of the year)\b/i.test(c) &&
        !/\b(specialties in|specialize in)\b/i.test(c)
      )
    : null;
  const addressLine = displayAddress(doctor.address, doctor.city, doctor.state);
  const mapQuery = addressLine
    ? encodeURIComponent(addressLine)
    : doctor.city
      ? encodeURIComponent([doctor.city, doctor.state].filter(Boolean).join(", "))
      : null;
  const parsedContact = parseContact(appointmentForm.contact);
  const canSendRequest = Boolean(appointmentForm.name.trim()) && parsedContact.valid;
  const hasCostData = d.first_visit_price || d.payment_model || d.insurance_networks?.length > 0 || d.files_insurance || d.payment_plans || d.free_consultation;
  const hasAvailData = hours || d.accepts_walkins || d.offers_telehealth || d.has_evening_hours || d.has_weekend_hours;

  // Bio split for pull quote — find the first real sentence (60+ chars)
  const bioParts = doctor.bio?.split(/(?<=[.!?])\s+/) || [];
  let pullQuote = "";
  let pullEnd = 0;
  for (let i = 0; i < bioParts.length; i++) {
    pullQuote += (i > 0 ? " " : "") + bioParts[i];
    if (pullQuote.length >= 60 && /[.!?]$/.test(pullQuote.trim())) {
      pullEnd = pullQuote.length;
      break;
    }
  }
  const firstSentence = pullEnd > 0 ? pullQuote.trim() : "";
  const restOfBio = firstSentence ? doctor.bio?.slice(doctor.bio.indexOf(firstSentence) + firstSentence.length).trim() || "" : doctor.bio || "";

  const trackEvent = (eventType: string) => {
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doctorId: doctor.id, eventType }) }).catch(() => {});
  };

  // Conversion tracking for the conversion_events table
  const trackConversion = (eventType: string) => {
    const sessionId = typeof window !== 'undefined'
      ? (sessionStorage.getItem('nc_sid') || (() => { const id = crypto.randomUUID(); sessionStorage.setItem('nc_sid', id); return id; })())
      : '';
    navigator.sendBeacon?.('/api/conversion', JSON.stringify({
      doctor_id: doctor.id,
      event_type: eventType,
      source_page: '/directory/' + slug,
      session_id: sessionId,
    }));
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single();
        setUserRole(profile?.role || null);
      }
    };
    fetchSession();
  }, [supabase]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendAppointmentRequest = async () => {
    if (!canSendRequest || submittingAppointment) return;
    setSubmittingAppointment(true);
    try {
      const res = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: appointmentForm.name.trim(),
          patientEmail: parsedContact.email,
          patientPhone: parsedContact.phone,
          preferredDate: appointmentForm.bestTime,
          message: appointmentForm.message,
          doctorId: doctor.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setAppointmentSubmitted(true);
      trackConversion('inquiry');
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again or call the office directly.';
      alert(message);
    }
    setSubmittingAppointment(false);
  };

  const requestFields = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input type="text" placeholder="Your name *" autoComplete="name" value={appointmentForm.name} onChange={e => setAppointmentForm(f => ({ ...f, name: e.target.value }))} style={{ padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, outline: "none", width: "100%" }} />
      <input type="text" placeholder="Phone or email *" autoComplete="tel" value={appointmentForm.contact} onChange={e => setAppointmentForm(f => ({ ...f, contact: e.target.value }))} style={{ padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, outline: "none", width: "100%" }} />
      <input type="text" placeholder="Best time to reach you" value={appointmentForm.bestTime} onChange={e => setAppointmentForm(f => ({ ...f, bestTime: e.target.value }))} style={{ padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, outline: "none", width: "100%" }} />
      <textarea placeholder="Message (optional)" value={appointmentForm.message} onChange={e => setAppointmentForm(f => ({ ...f, message: e.target.value }))} style={{ padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, height: 72, resize: "none", outline: "none", width: "100%" }} />
      <p style={{ fontSize: 11, color: "#b0b8c4", margin: 0 }}>Please do not include symptoms, diagnoses, or medical details. This is not a clinical form.</p>
      {containsHealthWords(appointmentForm.message) ? <p style={{ fontSize: 12, color: "#b45309", margin: 0 }}>Please don&apos;t include medical details.</p> : null}
      <button type="button" disabled={submittingAppointment || !canSendRequest} onClick={sendAppointmentRequest} style={{ padding: "14px 18px", background: "#D66829", color: "white", borderRadius: 12, fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: submittingAppointment || !canSendRequest ? 0.5 : 1 }}>
        {submittingAppointment ? <><Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> Sending...</> : <><Send style={{ width: 16, height: 16 }} /> Send request</>}
      </button>
    </div>
  );

  const requestSuccess = () => (
    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: 20, textAlign: "center" }}>
      <CheckCircle2 style={{ width: 28, height: 28, color: "#22c55e", margin: "0 auto 8px" }} />
      <p style={{ fontWeight: 800, color: "#15803d", fontSize: 15, margin: 0 }}>Request sent</p>
      <p style={{ color: "#16a34a", fontSize: 13, marginTop: 4 }}>The office typically replies within 1 business day.</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "#F5F3EF" }}>

      {/* ═══════════════════════════════════════════
          1. CINEMATIC HERO
      ═══════════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", paddingTop: 80, paddingBottom: 80 }}>
        {/* Background */}
        {bannerUrl ? (
          <>
            <img src={bannerUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(30,45,59,0.85)" }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(165deg, #0f1922 0%, #1E2D3B 40%, #1a2744 70%, #0d1520 100%)" }} />
        )}
        {/* Ambient glows */}
        <div style={{ position: "absolute", top: -200, right: -150, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(214,104,41,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -200, left: -150, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 10 }}>
          {/* Back link */}
          <Link href="/directory" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 40, textDecoration: "none" }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Directory
          </Link>

          {/* Centered content */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            {/* Photo */}
            <div style={{
              width: isPracticeProfile ? 280 : 140,
              height: isPracticeProfile ? 180 : 140,
              borderRadius: isPracticeProfile ? 24 : "50%",
              border: "4px solid rgba(214,104,41,0.4)",
              overflow: "hidden", background: "#1E2D3B", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 25px 60px rgba(0,0,0,0.4)", marginBottom: 24
            }}>
              {doctor.photo_url && !photoError ? (
                <img src={doctor.photo_url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setPhotoError(true)} />
              ) : (
                <span style={{ fontSize: 48, fontWeight: 900, color: "#D66829" }}>{(doctor.first_name?.[0] || 'N').toUpperCase()}</span>
              )}
            </div>

            {/* Name */}
            <h1 style={{ fontSize: 42, fontWeight: 900, color: "white", fontFamily: "Lato, sans-serif", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 8 }}>{name}</h1>
            {seminars.length > 0 && <p style={{ display: "inline-block", marginBottom: 10, background: "rgba(214,104,41,0.15)", color: "#D66829", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 800 }}>Hosting</p>}

            {/* Clinic */}
            <p style={{ fontSize: 14, fontWeight: 800, color: "#D66829", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>
              {isPracticeProfile ? `Led by ${doctorName}` : (doctor.clinic_name || 'Private Practice')}
            </p>

            {/* Location */}
            {location && (
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", fontWeight: 500, display: "flex", alignItems: "center", gap: 5, marginBottom: 16 }}>
                <MapPin style={{ width: 14, height: 14, color: "#D66829" }} /> {location}
              </p>
            )}

            {/* Badges row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 20, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", fontSize: 11, fontWeight: 800, color: "#60a5fa" }}>
                <ShieldCheck style={{ width: 13, height: 13 }} /> Verified
              </span>
              {doctor.is_founding_member && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 14px", borderRadius: 20, background: "rgba(214,104,41,0.12)", border: "1px solid rgba(214,104,41,0.25)", fontSize: 11, fontWeight: 800, color: "#D66829" }}>
                  <Star style={{ width: 12, height: 12 }} /> Founding Member
                </span>
              )}
              {acceptingNewPatients && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 14px", borderRadius: 20, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", fontSize: 11, fontWeight: 800, color: "#4ade80" }}>
                  <Heart style={{ width: 12, height: 12 }} /> Accepting Patients
                </span>
              )}
              {offersTelehealth && (
                <span style={{ padding: "5px 14px", borderRadius: 20, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", fontSize: 11, fontWeight: 800, color: "#60a5fa" }}>Telehealth</span>
              )}
              {acceptsWalkins && (
                <span style={{ padding: "5px 14px", borderRadius: 20, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", fontSize: 11, fontWeight: 800, color: "#c084fc" }}>Walk-Ins</span>
              )}
              {d.accepts_student_messages && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 14px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", fontSize: 11, fontWeight: 800, color: "#34d399" }}>
                  <GraduationCap style={{ width: 12, height: 12 }} /> Open to Students
                </span>
              )}
              {spotlightEpisode && (
                <Link href="#spotlight" style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 20, background: "rgba(214,104,41,0.16)", border: "1px solid rgba(214,104,41,0.4)", fontSize: 11, fontWeight: 800, color: "#fdba74", textDecoration: "none" }}>
                  <Play style={{ width: 12, height: 12 }} /> Featured on NeuroChiro Spotlight
                </Link>
              )}
            </div>

            {/* Social links */}
            <div style={{ display: "flex", gap: 8, marginBottom: 28, justifyContent: "center" }}>
              {!gated && instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)" }}>
                  <Instagram style={{ width: 16, height: 16 }} />
                </a>
              )}
              {!gated && facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)" }}>
                  <Facebook style={{ width: 16, height: 16 }} />
                </a>
              )}
              {!gated && tiktokUrl && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.48a8.2 8.2 0 0 0 4.8 1.54V7.58a4.84 4.84 0 0 1-1.04-.89z"/></svg>
                </a>
              )}
              {!gated && formatUrl(doctor.website_url) && (
                <a href={formatUrl(doctor.website_url)!} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)" }}>
                  <Globe style={{ width: 16, height: 16 }} />
                </a>
              )}
              <button onClick={handleShare} style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
                {copied ? <CheckCircle2 style={{ width: 16, height: 16, color: "#4ade80" }} /> : <Share2 style={{ width: 16, height: 16 }} />}
              </button>
              <button onClick={() => toggleSave('doctors', doctor.id?.toString())} style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: saved ? "#f87171" : "rgba(255,255,255,0.6)" }}>
                <Heart style={{ width: 16, height: 16, fill: saved ? "#f87171" : "none" }} />
              </button>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {gated ? (
                <ContactGateCTA variant="hero" doctorId={doctor.id} doctorName={name} isClaimed={!!doctor.user_id} phone={doctor.phone} website={doctor.website_url} />
              ) : (
                <>
                  {bookingUrl ? (
                    <a href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => { trackEvent('booking_click'); trackConversion('book'); }} style={{ padding: "14px 28px", background: "#D66829", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", boxShadow: "0 8px 30px rgba(214,104,41,0.3)" }}>
                      <Calendar style={{ width: 16, height: 16 }} /> Book Online
                    </a>
                  ) : null}
                  <a href="#appointment-form" style={{ padding: "14px 28px", background: bookingUrl ? "rgba(255,255,255,0.1)" : "#D66829", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", boxShadow: bookingUrl ? "none" : "0 8px 30px rgba(214,104,41,0.3)", border: bookingUrl ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
                    <Calendar style={{ width: 16, height: 16 }} /> {bookingUrl ? "Request a time" : "Book Consultation"}
                  </a>
                  {doctor.phone && (
                    <a href={`tel:${doctor.phone}`} onClick={() => { trackEvent('phone_tap'); trackConversion('call'); }} style={{ padding: "14px 28px", background: "rgba(255,255,255,0.1)", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <Phone style={{ width: 16, height: 16 }} /> Call
                    </a>
                  )}
                  {doctor.email && (
                    <a href={`mailto:${doctor.email}`} onClick={() => trackEvent('contact_click')} style={{ padding: "14px 28px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", borderRadius: 14, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Mail style={{ width: 16, height: 16 }} /> Email
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .nc-profile-shell { display: flex; flex-direction: column; }
        .nc-profile-aside { order: -1; padding: 20px 16px 0; }
        .nc-profile-main { min-width: 0; }
        @media (min-width: 1024px) {
          .nc-profile-shell {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 380px;
            align-items: start;
            max-width: 1240px;
            margin: 0 auto;
            padding-right: 24px;
          }
          .nc-profile-aside {
            order: 0;
            position: sticky;
            top: 88px;
            padding: 28px 0 24px;
            max-height: calc(100vh - 104px);
            overflow: auto;
          }
        }
      `}</style>
      <div className="nc-profile-shell">
        <aside className="nc-profile-aside">
          <div id="appointment-form" style={{ background: "white", borderRadius: 20, padding: 20, border: "1px solid rgba(30,45,59,0.08)", boxShadow: "0 16px 40px rgba(30,45,59,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Calendar style={{ width: 18, height: 18, color: "#D66829" }} />
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1E2D3B", margin: 0 }}>Request an appointment</h2>
            </div>
            <p style={{ fontSize: 13, color: "#718096", margin: "0 0 14px" }}>
              Send a note to {doctor.clinic_name || name}. The office gets it by email and in their NeuroChiro portal.
            </p>
            {gated ? (
              <ContactGateCTA variant="sidebar" doctorId={doctor.id} doctorName={name} isClaimed={!!doctor.user_id} phone={doctor.phone} website={doctor.website_url} />
            ) : appointmentSubmitted ? requestSuccess() : (
              <>
                {acceptingNewPatients !== false && (
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#15803d", margin: "0 0 4px" }}>New patients welcome</p>
                )}
                <p style={{ fontSize: 13, color: "#4a5568", margin: "0 0 12px" }}>The office typically replies within 1 business day.</p>
                {requestFields()}
                {bookingUrl && (
                  <a href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => { trackEvent('booking_click'); trackConversion('book'); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, fontSize: 13, fontWeight: 800, color: "#1E2D3B", textDecoration: "none" }}>
                    <ExternalLink style={{ width: 14, height: 14 }} /> Or book on their website
                  </a>
                )}
                {doctor.phone && (
                  <a href={`tel:${doctor.phone}`} onClick={() => { trackEvent('phone_tap'); trackConversion('call'); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, padding: "12px 16px", borderRadius: 12, background: "#1E2D3B", color: "white", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
                    <Phone style={{ width: 16, height: 16 }} /> Call {doctor.phone}
                  </a>
                )}
              </>
            )}
          </div>
          <div style={{ marginTop: 16, background: "#fff", borderRadius: 20, padding: 20, border: "1px solid rgba(30,45,59,0.08)" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#D66829", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Your first visit</p>
            {firstVisitInfo && (
              <p style={{ fontSize: 14, color: "#4a5568", lineHeight: 1.6, whiteSpace: "pre-line", margin: "0 0 10px" }}>{firstVisitInfo}</p>
            )}
            <p style={{ fontSize: 14, fontWeight: 800, color: "#1E2D3B", margin: 0 }}>{d.first_visit_price || "Contact the office for pricing"}</p>
          </div>
        </aside>
        <div className="nc-profile-main">

      {/* ═══════════════════════════════════════════
          2. CLAIM / UPGRADE BANNERS
      ═══════════════════════════════════════════ */}
      {/* Show unclaimed banner only for sparse, un-approved profiles without a user account.
          A profile with a bio or that's been admin-approved is not "built from public info." */}
      {!doctor.user_id && !doctor.is_approved && !doctor.bio && (
        <Section bg="cream" style={{ paddingTop: 24, paddingBottom: 0 }}>
          <div style={{ background: "#f0f4f8", border: "1px solid #d1dce6", borderRadius: 16, padding: "20px 24px", fontSize: 13, color: "#5a6b7d", lineHeight: 1.6 }}>
            <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#1E2D3B", fontSize: 14 }}>This listing was created from public information</p>
            <p style={{ margin: 0 }}>
              This profile was built from publicly available practice details and has not been claimed or verified by the doctor.
              Some information may be incomplete or outdated.
            </p>
            <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href={`/register?claim_id=${doctor.id}&role=doctor`} style={{ fontSize: 13, fontWeight: 700, color: "#D66829", textDecoration: "none" }}>
                Are you this doctor? Claim this profile &rarr;
              </a>
              <a href="mailto:support@neurochirodirectory.com?subject=Listing%20removal%20request" style={{ fontSize: 13, fontWeight: 700, color: "#5a6b7d", textDecoration: "none" }}>
                Request removal
              </a>
            </div>
          </div>
        </Section>
      )}

      {gated && session?.user?.id && doctor.user_id === session.user.id && (
        <Section bg="cream" style={{ paddingTop: 32, paddingBottom: 0 }}>
          <div style={{ background: "linear-gradient(135deg, rgba(214,104,41,0.08) 0%, rgba(214,104,41,0.03) 100%)", border: "1px solid rgba(214,104,41,0.15)", borderRadius: 20, padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontWeight: 900, fontSize: 14, color: "#1E2D3B" }}>This is how patients see your profile</p>
              <p style={{ fontSize: 12, color: "#718096", marginTop: 4 }}>Your phone, website, and booking link are hidden. Upgrade to Pro so patients can reach you.</p>
            </div>
            <Link href="/doctor/billing" style={{ padding: "12px 24px", background: "#D66829", color: "white", borderRadius: 12, fontWeight: 800, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>Upgrade to Pro — $99/mo</Link>
          </div>
        </Section>
      )}

      <Section bg="cream" style={{ paddingTop: 28, paddingBottom: 8 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "22px 24px", border: "1px solid rgba(30,45,59,0.06)" }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#D66829", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>What is nervous-system chiropractic?</p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#374151", margin: 0 }}>
            This kind of care looks at how well your body is communicating, not only where it hurts. A visit usually includes a checkup of how your spine and nerves are working, then a gentle adjustment meant to help that communication.{" "}
            <Link href="/nervous-system" style={{ color: "#D66829", fontWeight: 800, textDecoration: "none" }}>Read the short explanation</Link>.
          </p>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          3. VIDEO / SPOTLIGHT — Cinematic
      ═══════════════════════════════════════════ */}
      {(spotlightEpisode || doctor.video_url) && (
        <section id="spotlight" style={{ background: "linear-gradient(180deg, #1E2D3B 0%, #162230 100%)", padding: "80px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            {spotlightEpisode ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>🎬</span>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: "white" }}>Featured on NeuroChiro Spotlight</h2>
                  <span style={{ background: "rgba(214,104,41,0.15)", color: "#D66829", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>EP {String(spotlightEpisode.episodeNumber).padStart(2, "0")}</span>
                </div>
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 15, fontStyle: "italic", marginBottom: 28, maxWidth: 600, margin: "0 auto 28px" }}>&ldquo;{spotlightEpisode.quote}&rdquo;</p>
                <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", aspectRatio: "16 / 9" }}>
                  <iframe src={spotlightEpisode.videoUrl} style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 8 }}>{spotlightEpisode.description}</p>
                  <Link href="/spotlight" style={{ color: "#D66829", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>Watch all Spotlight episodes →</Link>
                </div>
              </>
            ) : doctor.video_url && (
              <>
                <h2 style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: "#D66829", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Play style={{ width: 14, height: 14 }} /> Meet {isPracticeProfile ? 'the Team' : doctor.first_name}
                </h2>
                <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", aspectRatio: "16 / 9" }}>
                  <iframe src={doctor.video_url.replace('watch?v=', 'embed/').replace('vimeo.com/', 'player.vimeo.com/video/')} style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {(stories.length > 0 || d.google_reviews_url) && (
        <Section bg="white" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1E2D3B", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 28 }}>What patients say</h2>
          {stories.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800, margin: "0 auto" }}>
              {stories.map((story) => (
                <blockquote key={story.id} style={{ margin: 0, background: "#F5F3EF", borderRadius: 16, padding: "20px 22px" }}>
                  {story.story_text && <p style={{ fontSize: 16, lineHeight: 1.7, color: "#1E2D3B", margin: 0 }}>&ldquo;{story.story_text}&rdquo;</p>}
                  {story.patient_first_name && <p style={{ fontSize: 13, fontWeight: 800, color: "#D66829", margin: "12px 0 0" }}>{story.patient_first_name}</p>}
                  {story.condition_before && <p style={{ fontSize: 13, color: "#4a5568", margin: "8px 0 0" }}><strong>Before:</strong> {story.condition_before}</p>}
                  {story.outcome_after && <p style={{ fontSize: 13, color: "#4a5568", margin: "4px 0 0" }}><strong>After:</strong> {story.outcome_after}</p>}
                </blockquote>
              ))}
            </div>
          )}
          {d.google_reviews_url && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: stories.length > 0 ? 24 : 0 }}>
              <Star style={{ width: 16, height: 16, color: "#facc15", fill: "#facc15" }} />
              <a href={d.google_reviews_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 700, color: "#1E2D3B", textDecoration: "none" }}>
                Read patient reviews on Google &rarr;
              </a>
            </div>
          )}
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          4. WHO THEY ARE — structured intro with fallback to bio
      ═══════════════════════════════════════════ */}
      {(d.short_intro || doctor.bio) && (
        <Section bg="white" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1E2D3B", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20 }}>About {isPracticeProfile ? (doctor.clinic_name || doctor.first_name) : doctor.first_name}</h2>

            {/* Structured short_intro (preferred) or pull quote from bio (fallback) */}
            {d.short_intro ? (
              <p style={{ fontSize: 17, lineHeight: 1.75, color: "#374151" }}>{d.short_intro}</p>
            ) : firstSentence ? (
              <p style={{ fontSize: 22, fontWeight: 500, fontStyle: "italic", color: "#1E2D3B", lineHeight: 1.55, borderLeft: "4px solid #D66829", paddingLeft: 24, marginBottom: 20 }}>
                &ldquo;{firstSentence}&rdquo;
              </p>
            ) : null}

            {/* Philosophy (structured) or rest of bio (fallback) */}
            {d.philosophy ? (
              <p style={{ fontSize: 15, lineHeight: 1.75, color: "#4a5568", marginTop: 16 }}>{d.philosophy}</p>
            ) : restOfBio ? (
              <p style={{ fontSize: 15, lineHeight: 1.75, color: "#4a5568", marginTop: d.short_intro ? 16 : 0 }}>{restOfBio}</p>
            ) : null}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          5. SPECIALTIES + CONDITIONS (conditions first, then techniques)
      ═══════════════════════════════════════════ */}
      {(specialties.length > 0 || (conditionsTreated && conditionsTreated.length > 0)) && (
        <Section bg="cream" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1E2D3B", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 32 }}>Patients We Help</h2>
          {conditionsTreated && conditionsTreated.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: specialties.length > 0 ? 24 : 0 }}>
              {conditionsTreated.map((c: string, i: number) => (
                <span key={i} style={{ padding: "7px 16px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 50, fontSize: 13, fontWeight: 600, color: "#3b82f6" }}>{c}</span>
              ))}
            </div>
          )}
          {specialties.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {specialties.map((s: string, i: number) => (
                <span key={i} style={{ padding: "10px 22px", background: "rgba(214,104,41,0.08)", border: "1px solid rgba(214,104,41,0.15)", borderRadius: 50, fontSize: 14, fontWeight: 700, color: "#D66829" }}>{s}</span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          6. COST & AVAILABILITY
      ═══════════════════════════════════════════ */}
      {!hasCostData && !hasAvailData ? (
        <Section bg="white" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div style={{ padding: "20px 24px", background: "#f8f6f2", borderRadius: 12, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#718096", margin: 0 }}>Contact the office for pricing, insurance, and availability.</p>
            {doctor.phone && <p style={{ margin: "8px 0 0", fontWeight: 700, color: "#1E2D3B", fontSize: 16 }}><a href={'tel:' + doctor.phone} style={{ color: "#1E2D3B", textDecoration: "none" }}>{doctor.phone}</a></p>}
          </div>
        </Section>
      ) : (
      <Section bg="white" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
          {/* Cost */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <DollarSign style={{ width: 18, height: 18, color: "#D66829" }} />
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#1E2D3B" }}>Cost</h3>
            </div>
            {(d.first_visit_price || d.payment_model || d.insurance_networks?.length > 0 || d.files_insurance || d.payment_plans || d.free_consultation) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {d.first_visit_price && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#718096" }}>First visit</span>
                    <span style={{ fontWeight: 700, color: "#1E2D3B" }}>{d.first_visit_price}</span>
                  </div>
                )}
                {d.payment_model && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#718096" }}>Payment</span>
                    <span style={{ fontWeight: 700, color: "#1E2D3B" }}>
                      {d.payment_model === 'cash' ? 'Cash-based' : d.payment_model === 'insurance' ? 'Insurance accepted' : 'Cash & Insurance'}
                    </span>
                  </div>
                )}
                {d.insurance_networks && d.insurance_networks.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, alignItems: "flex-start" }}>
                    <span style={{ color: "#718096", flexShrink: 0 }}>Carriers</span>
                    <span style={{ fontWeight: 600, color: "#1E2D3B", textAlign: "right" }}>{d.insurance_networks.join(", ")}</span>
                  </div>
                )}
                {d.files_insurance && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#718096" }}>Files for you</span>
                    <span style={{ fontWeight: 700, color: "#22c55e" }}>Yes</span>
                  </div>
                )}
                {d.accepted_payment && d.accepted_payment.includes("HSA/FSA") && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#718096" }}>HSA/FSA</span>
                    <span style={{ fontWeight: 700, color: "#22c55e" }}>Accepted</span>
                  </div>
                )}
                {d.payment_plans && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#718096" }}>Payment plans</span>
                    <span style={{ fontWeight: 700, color: "#22c55e" }}>Available</span>
                  </div>
                )}
                {d.free_consultation && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#718096" }}>Free consultation</span>
                    <span style={{ fontWeight: 700, color: "#22c55e" }}>Yes</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "16px 20px", background: "#f8f6f2", borderRadius: 12, fontSize: 14, color: "#718096" }}>
                <p style={{ margin: 0 }}>Contact the office for pricing and insurance information.</p>
                {doctor.phone && <p style={{ margin: "8px 0 0", fontWeight: 700, color: "#1E2D3B" }}><a href={'tel:' + doctor.phone} style={{ color: "#1E2D3B", textDecoration: "none" }}>{doctor.phone}</a></p>}
              </div>
            )}
          </div>

          {/* Availability */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Clock style={{ width: 18, height: 18, color: "#D66829" }} />
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#1E2D3B" }}>Availability</h3>
            </div>
            {(hours || d.accepts_walkins || d.offers_telehealth || d.has_evening_hours || d.has_weekend_hours) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {hours && (
                  <p style={{ fontSize: 13, color: "#4a5568", whiteSpace: "pre-line", lineHeight: 1.7, margin: 0 }}>{hours}</p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: hours ? 8 : 0 }}>
                  {d.has_evening_hours && <span style={{ padding: "4px 12px", background: "#ecfdf5", color: "#059669", fontSize: 12, fontWeight: 700, borderRadius: 8 }}>Evening hours</span>}
                  {d.has_weekend_hours && <span style={{ padding: "4px 12px", background: "#ecfdf5", color: "#059669", fontSize: 12, fontWeight: 700, borderRadius: 8 }}>Weekend hours</span>}
                  {d.accepts_walkins && <span style={{ padding: "4px 12px", background: "#ecfdf5", color: "#059669", fontSize: 12, fontWeight: 700, borderRadius: 8 }}>Walk-ins welcome</span>}
                  {d.offers_telehealth && <span style={{ padding: "4px 12px", background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 700, borderRadius: 8 }}>Telehealth available</span>}
                  {acceptingNewPatients && <span style={{ padding: "4px 12px", background: "#ecfdf5", color: "#059669", fontSize: 12, fontWeight: 700, borderRadius: 8 }}>Accepting new patients</span>}
                </div>
              </div>
            ) : (
              <div style={{ padding: "16px 20px", background: "#f8f6f2", borderRadius: 12, fontSize: 14, color: "#718096" }}>
                <p style={{ margin: 0 }}>Contact the office for hours and availability.</p>
                {doctor.phone && <p style={{ margin: "8px 0 0", fontWeight: 700, color: "#1E2D3B" }}><a href={'tel:' + doctor.phone} style={{ color: "#1E2D3B", textDecoration: "none" }}>{doctor.phone}</a></p>}
              </div>
            )}
          </div>
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════
          7. CERTIFICATIONS + EDUCATION + BADGES
      ═══════════════════════════════════════════ */}
      {(certificationsList?.length || education?.length || doctor.user_id) && (
        <Section bg="cream" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40 }}>
            {certificationsList && certificationsList.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Award style={{ width: 18, height: 18, color: "#D66829" }} />
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: "#1E2D3B" }}>Certifications</h3>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {certificationsList.map((c: string, i: number) => (
                    <span key={i} style={{ padding: "6px 14px", background: "#fffbeb", color: "#b45309", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "1px solid #fde68a" }}>{c}</span>
                  ))}
                </div>
              </div>
            )}
            {(d.chiropractic_school || (education && education.length > 0)) && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <GraduationCap style={{ width: 18, height: 18, color: "#D66829" }} />
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: "#1E2D3B" }}>Education</h3>
                </div>
                {/* Structured education (preferred) */}
                {d.chiropractic_school && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1E2D3B" }}>{d.degree || 'Doctor of Chiropractic (DC)'}</p>
                    <p style={{ fontSize: 13, color: "#718096" }}>{d.chiropractic_school}{d.graduation_year ? `, ${d.graduation_year}` : ''}</p>
                  </div>
                )}
                {/* Post-doctoral training */}
                {d.post_doctoral_training && d.post_doctoral_training.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Post-Doctoral Training</p>
                    {d.post_doctoral_training.map((t: string, i: number) => (
                      <p key={i} style={{ fontSize: 13, color: "#4a5568", marginBottom: 2 }}>{t}</p>
                    ))}
                  </div>
                )}
                {/* Fallback to old education array when no structured data */}
                {!d.chiropractic_school && education && education.map((e: string, i: number) => (
                  <p key={i} style={{ fontSize: 14, color: "#4a5568", marginBottom: 4 }}>{e}</p>
                ))}
              </div>
            )}
          </div>
          {doctor.user_id && (
            <div style={{ marginTop: 32 }}>
              <PublicBadges doctorUserId={doctor.user_id} />
            </div>
          )}
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          8. FIRST VISIT + LOCATION + HOURS + PRACTICAL INFO
      ═══════════════════════════════════════════ */}
      {(mapQuery || hours || parkingInfo || languages?.length || acceptedPayment?.length || insuranceNetworks?.length || firstVisitInfo || amenitiesList?.length) && (
        <Section bg="white" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1E2D3B", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 40 }}>Visit the Practice</h2>

          {/* First Visit Info — rendered BEFORE map/hours/parking */}
          {firstVisitInfo && (
            <div style={{ maxWidth: 800, margin: "0 auto 40px", padding: "24px 28px", background: "#f8f6f2", borderRadius: 16, border: "1px solid rgba(30,45,59,0.06)" }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#D66829", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Your First Visit</p>
              <p style={{ fontSize: 14, color: "#4a5568", lineHeight: 1.7, whiteSpace: "pre-line", margin: 0 }}>{firstVisitInfo}</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: mapQuery ? "1fr 1fr" : "1fr", gap: 40 }}>
            {/* Map */}
            {mapQuery && (
              <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(30,45,59,0.08)", aspectRatio: "4 / 3" }}>
                <iframe src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`} style={{ width: "100%", height: "100%", border: "none" }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
            {/* Info stack */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {doctor.address && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <MapPin style={{ width: 18, height: 18, color: "#D66829", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: "#1E2D3B", marginBottom: 2 }}>{doctor.clinic_name}</p>
                    <p style={{ fontSize: 13, color: "#718096" }}>{addressLine}</p>
                  </div>
                </div>
              )}
              {parkingInfo && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Parking & Access</p>
                  <p style={{ fontSize: 14, color: "#4a5568" }}>{parkingInfo}</p>
                </div>
              )}
              {languages && languages.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Languages</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {languages.map((l: string, i: number) => (
                      <span key={i} style={{ padding: "5px 12px", background: "#f3f4f6", borderRadius: 8, fontSize: 13, color: "#4a5568" }}>{l}</span>
                    ))}
                  </div>
                </div>
              )}
              {acceptedPayment && acceptedPayment.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Accepted Payment</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {acceptedPayment.map((p: string, i: number) => (
                      <span key={i} style={{ padding: "5px 12px", background: "#f0fdf4", color: "#15803d", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "1px solid #bbf7d0" }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {insuranceNetworks && insuranceNetworks.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Insurance Accepted</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {insuranceNetworks.map((ins: string, i: number) => (
                      <span key={i} style={{ padding: "5px 12px", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, borderRadius: 8, border: "1px solid #bfdbfe" }}>{ins}</span>
                    ))}
                  </div>
                </div>
              )}
              {amenitiesList && amenitiesList.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Amenities</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {amenitiesList.map((a: string, i: number) => (
                      <span key={i} style={{ padding: "5px 12px", background: "#f3f4f6", borderRadius: 8, fontSize: 13, color: "#4a5568" }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          9. FAQ
      ═══════════════════════════════════════════ */}
      {faq && faq.length > 0 && (
        <Section bg="cream" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1E2D3B", textAlign: "center", marginBottom: 32 }}>Frequently Asked Questions</h2>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {faq.map((item, i) => (
              <details key={i} style={{ border: "1px solid rgba(30,45,59,0.08)", borderRadius: 16, overflow: "hidden", background: "white" }}>
                <summary style={{ padding: "18px 24px", fontWeight: 800, color: "#1E2D3B", fontSize: 15, cursor: "pointer" }}>{item.question}</summary>
                <div style={{ padding: "0 24px 18px" }}><p style={{ fontSize: 14, color: "#4a5568", lineHeight: 1.7, margin: 0 }}>{item.answer}</p></div>
              </details>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          10. APPOINTMENT REQUEST
      ═══════════════════════════════════════════ */}
      <Section bg="white" id="appointment" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 8 }}>
            <Calendar style={{ width: 20, height: 20, color: "#D66829" }} />
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1E2D3B" }}>Request a Consultation</h2>
          </div>
          {gated ? (
            <div style={{ textAlign: "center", paddingTop: 24 }}>
              <ContactGateCTA variant="sidebar" doctorId={doctor.id} doctorName={name} isClaimed={!!doctor.user_id} phone={doctor.phone} website={doctor.website_url} />
            </div>
          ) : (
            <>
              <p style={{ textAlign: "center", color: "#718096", fontSize: 14, marginBottom: 8 }}>Send a request to {doctor.clinic_name || name}. They&apos;ll get back to you directly.</p>
              {acceptingNewPatients !== false && (
                <p style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: "#15803d", marginBottom: 4 }}>New patients welcome</p>
              )}
              <p style={{ textAlign: "center", fontSize: 13, color: "#4a5568", marginBottom: 20 }}>The office typically replies within 1 business day.</p>
              {appointmentSubmitted ? requestSuccess() : (
                <>
                  {requestFields()}
                  <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 12 }}>Your request goes to the doctor&apos;s office. NeuroChiro stores it to make sure it gets there, and we never sell or share it with third parties.</p>
                </>
              )}
            </>
          )}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          11. NEARBY DOCTORS
      ═══════════════════════════════════════════ */}
      {nearbyDoctors.length > 0 && (
        <Section bg="cream" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1E2D3B", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 36 }}>Other Nervous System Chiropractors Near You</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {nearbyDoctors.map((doc: any) => (
              <Link key={doc.id} href={`/directory/${doc.slug || doc.id}`} style={{ background: "white", borderRadius: 20, padding: 24, textDecoration: "none", border: "1px solid rgba(30,45,59,0.04)", display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1E2D3B", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {doc.photo_url ? <img src={doc.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
                      <span style={{ color: "#D66829", fontWeight: 900, fontSize: 18 }}>{(doc.first_name?.[0] || "N").toUpperCase()}</span>}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#1E2D3B" }}>Dr. {doc.first_name} {doc.last_name}</p>
                    <p style={{ fontSize: 12, color: "#718096", display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin style={{ width: 12, height: 12 }} /> {doc.city}{doc.state ? `, ${doc.state}` : ''}
                      {doc.distance_miles != null && <span style={{ color: "#D66829", fontWeight: 700, marginLeft: 4 }}>{doc.distance_miles < 1 ? '< 1 mi' : `${Math.round(doc.distance_miles)} mi`}</span>}
                    </p>
                  </div>
                </div>
                {doc.specialties?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {doc.specialties.slice(0, 2).map((s: string, i: number) => (
                      <span key={i} style={{ padding: "4px 10px", background: "rgba(214,104,41,0.06)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#D66829" }}>{s}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          12. TEAM MEMBERS + GALLERY
      ═══════════════════════════════════════════ */}
      {teamMembersList && teamMembersList.length > 0 && (
        <Section bg="white" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 32 }}>
            <Users style={{ width: 18, height: 18, color: "#D66829" }} />
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1E2D3B" }}>Our Team</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
            {teamMembersList.map((m, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: 16, background: "#f3f4f6", overflow: "hidden", margin: "0 auto 10px" }}>
                  {m.photo_url ? <img src={m.photo_url} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 18, fontWeight: 800 }}>{nameInitials(m.name)}</div>}
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#1E2D3B" }}>{m.name}</p>
                <p style={{ fontSize: 12, color: "#718096" }}>{m.role}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {galleryImages && galleryImages.length > 0 && (
        <Section bg="cream" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1E2D3B", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 32 }}>Photos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {galleryImages.map((img: string, i: number) => (
              <img key={i} src={img} alt={`${doctor.clinic_name || name} office photo ${i + 1}`} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 16 }} />
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          13. SEMINARS + JOBS
      ═══════════════════════════════════════════ */}
      {(seminars.length > 0 || jobs.length > 0) && (
        <Section bg="white" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <div style={{ display: "grid", gridTemplateColumns: seminars.length > 0 && jobs.length > 0 ? "1fr 1fr" : "1fr", gap: 32 }}>
            {seminars.length > 0 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1E2D3B", marginBottom: 16 }}>Seminars & Events</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {seminars.map((sem: any) => (
                    <Link key={sem.id} href={`/seminars/${sem.slug || sem.id}`} style={{ background: "white", borderRadius: 16, padding: "16px 20px", textDecoration: "none", border: "1px solid rgba(30,45,59,0.06)", display: "block" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 800, color: "#1E2D3B", marginBottom: 6 }}>{sem.title}</p>
                          <div style={{ display: "flex", gap: 12 }}>
                            {sem.dates && <span style={{ fontSize: 12, color: "#718096", display: "flex", alignItems: "center", gap: 4 }}><Calendar style={{ width: 12, height: 12 }} /> {sem.dates}</span>}
                            {(sem.city || sem.location) && <span style={{ fontSize: 12, color: "#718096", display: "flex", alignItems: "center", gap: 4 }}><MapPin style={{ width: 12, height: 12 }} /> {sem.city || sem.location}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#D66829" }}>{priceLabel({ price: sem.price, country: sem.country })}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {jobs.length > 0 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1E2D3B", marginBottom: 16 }}>Open Positions</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {jobs.map((job: any) => (
                    <Link key={job.id} href={`/careers/${job.id}`} style={{ background: "white", borderRadius: 16, padding: "16px 20px", textDecoration: "none", border: "1px solid rgba(30,45,59,0.06)", display: "block" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 800, color: "#1E2D3B", marginBottom: 4 }}>{job.title}</p>
                          <div style={{ display: "flex", gap: 12 }}>
                            {job.employment_type && <span style={{ fontSize: 12, color: "#718096" }}>{job.employment_type}</span>}
                            {(job.salary_min || job.salary_max) && <span style={{ fontSize: 12, color: "#718096" }}>{job.salary_min && job.salary_max ? `$${(job.salary_min/1000).toFixed(0)}k–$${(job.salary_max/1000).toFixed(0)}k` : job.salary_min ? `From $${(job.salary_min/1000).toFixed(0)}k` : `Up to $${(job.salary_max/1000).toFixed(0)}k`}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#16a34a", background: "#f0fdf4", padding: "3px 10px", borderRadius: 20 }}>Hiring</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          14. REFERRAL (doctor-to-doctor)
      ═══════════════════════════════════════════ */}
      {session && userRole === 'doctor' && doctor.user_id !== session.user.id && (
        <Section bg="cream" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div style={{ textAlign: "center" }}>
            <button onClick={() => setShowReferralModal(true)} style={{ padding: "14px 32px", background: "#eff6ff", color: "#2563eb", borderRadius: 14, fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Users style={{ width: 16, height: 16 }} /> Refer a Patient to {name}
            </button>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          REPORT + DISCLAIMER
      ═══════════════════════════════════════════ */}
      <Section bg="cream" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div style={{ textAlign: "center" }}>
          {reportSubmitted ? (
            <p style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>Thank you. Our team will review this.</p>
          ) : showReportForm ? (
            <div style={{ background: "white", borderRadius: 20, border: "1px solid rgba(30,45,59,0.08)", padding: 28, textAlign: "left", maxWidth: 500, margin: "0 auto" }}>
              <h4 style={{ fontWeight: 800, color: "#1E2D3B", marginBottom: 4, fontSize: 14 }}>Report a Concern</h4>
              <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 16 }}>All reports are reviewed by our team.</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = new FormData(form);
                await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: data.get('email'), first_name: data.get('name'), source: 'report_concern', role: 'report', doctor_id: doctor.id, metadata: { concern: data.get('concern') } }) });
                setReportSubmitted(true);
              }} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input type="text" name="name" required placeholder="Your name" style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14 }} />
                <input type="email" name="email" required placeholder="Your email" style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14 }} />
                <textarea name="concern" required placeholder="Describe your concern..." rows={3} style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, resize: "none" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setShowReportForm(false)} style={{ padding: "8px 16px", color: "#718096", fontSize: 13, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ padding: "8px 16px", background: "#ef4444", color: "white", fontSize: 13, fontWeight: 800, borderRadius: 8, border: "none", cursor: "pointer" }}>Submit Report</button>
                </div>
              </form>
            </div>
          ) : (
            <button onClick={() => setShowReportForm(true)} style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Report a concern</button>
          )}
          <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.6, maxWidth: 500, margin: "16px auto 0" }}>
            NeuroChiro is a directory service. The &ldquo;Verified&rdquo; badge indicates identity review, not a guarantee of clinical outcomes.{" "}
            <a href="/terms" style={{ textDecoration: "underline", color: "#9ca3af" }}>Terms</a> · <a href="/privacy" style={{ textDecoration: "underline", color: "#9ca3af" }}>Privacy</a>
          </p>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          REFERRAL MODAL
      ═══════════════════════════════════════════ */}
      {showReferralModal && (
        <>
          <div onClick={() => setShowReferralModal(false)} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />
          <div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 501, width: "100%", maxWidth: 440, padding: 24 }}>
            <div style={{ background: "white", borderRadius: 24, padding: 32, boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
              {referralSent ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <CheckCircle2 style={{ width: 48, height: 48, color: "#22c55e", margin: "0 auto 12px" }} />
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1E2D3B" }}>Referral Sent!</h3>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1E2D3B", marginBottom: 20 }}>Refer a Patient to {name}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input type="text" value={referralPatientName} onChange={e => setReferralPatientName(e.target.value)} placeholder="Patient name (optional)" style={{ padding: "14px 18px", border: "1px solid #e5e7eb", borderRadius: 14, fontSize: 14 }} />
                    <textarea value={referralNotes} onChange={e => setReferralNotes(e.target.value)} placeholder="Notes (optional)" style={{ padding: "14px 18px", border: "1px solid #e5e7eb", borderRadius: 14, fontSize: 14, height: 80, resize: "none" }} />
                    <div style={{ display: "flex", gap: 12 }}>
                      <button onClick={() => setShowReferralModal(false)} style={{ flex: 1, padding: "14px", border: "1px solid #e5e7eb", borderRadius: 14, fontWeight: 800, color: "#718096", fontSize: 14, background: "none", cursor: "pointer" }}>Cancel</button>
                      <button onClick={async () => {
                        setReferring(true);
                        try { await sendReferral(doctor.id, referralPatientName || undefined, referralNotes || undefined); setReferralSent(true);
                          setTimeout(() => { setShowReferralModal(false); setReferralSent(false); setReferralPatientName(''); setReferralNotes(''); }, 2000);
                        } catch (err: any) { alert(err.message || 'Failed'); }
                        setReferring(false);
                      }} disabled={referring} style={{ flex: 1, padding: "14px", background: "#D66829", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", opacity: referring ? 0.5 : 1 }}>
                        {referring ? 'Sending...' : 'Send Referral'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <div style={{ background: "#F5F3EF", padding: "8px 24px 28px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#718096", margin: 0 }}>
          Are you a nervous system chiropractor?{" "}
          <Link href="/pro" style={{ color: "#D66829", fontWeight: 800, textDecoration: "none" }}>Get a profile like this →</Link>
        </p>
      </div>

      {/* Patient list CTA */}
      <div style={{ background: "#f5f3ef", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#718096", marginBottom: 8 }}>
          Can't find a nervous system chiropractor near you?
        </p>
        <a href="/list?source=profile_footer" style={{ color: "#D66829", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
          Join the patient list and get notified when one joins your area →
        </a>
      </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          STICKY BOOKING BAR
      ═══════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{ background: 'rgba(30,45,59,0.95)', backdropFilter: 'blur(20px)', padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3 max-w-lg mx-auto">
          {gated ? (
            <button onClick={() => document.getElementById('appointment-form')?.scrollIntoView({ behavior: 'smooth' })} className="flex-1 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 min-h-[44px]" aria-label="Request appointment">
              <Calendar className="w-4 h-4" /> Request Appointment
            </button>
          ) : (
            <>
              {bookingUrl ? (
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackConversion('book')} className="flex-1 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 min-h-[44px]" aria-label={`Book online with ${name}`}>
                  <Calendar className="w-4 h-4" /> Book
                </a>
              ) : null}
              <button onClick={() => { trackConversion('inquiry'); document.getElementById('appointment-form')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex-1 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 min-h-[44px]" aria-label="Request appointment">
                <Calendar className="w-4 h-4" /> {bookingUrl ? "Request" : "Request Appointment"}
              </button>
              {doctor.phone && (
                <a href={`tel:${doctor.phone}`} onClick={() => trackConversion('call')} className="py-3 px-5 bg-white/10 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 min-h-[44px]" aria-label={`Call ${name}`}>
                  <Phone className="w-4 h-4" /> Call
                </a>
              )}
            </>
          )}
        </div>
      </div>
      {/* Bottom spacer for sticky bar */}
      <div style={{ height: 76 }} className="lg:hidden" />
    </div>
  );
}
