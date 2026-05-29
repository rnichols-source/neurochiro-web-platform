"use client";

import { useState, useEffect } from "react";
import PublicBadges from "./public-badges";
import {
  MapPin, ShieldCheck, CheckCircle2, Mail, ExternalLink, MessageSquare,
  Loader2, Phone, Heart, Share2, Calendar, Send, Globe, Users, Star,
  Copy, Instagram, Facebook, Award, Clock, Stethoscope, GraduationCap,
  ChevronDown, ArrowLeft, Play, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { sendReferral } from "@/app/actions/referrals";
import { submitPatientStory, getApprovedStories } from "@/app/actions/patient-stories";
import { isProfileGated } from "@/lib/profile-gating";
import ContactGateCTA from "@/components/directory/ContactGateCTA";
import GoogleReviews from "@/components/directory/GoogleReviews";
import Image from "next/image";
import { getEpisodeByDoctorSlug } from "../../spotlight/spotlight-data";

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

export default function DoctorProfileClient({ doctor, slug, seminars = [], jobs = [], cityDoctorCount = 0, nearbyDoctors = [], citySearchVolume = 0 }: { doctor: any; slug: string; seminars?: any[]; jobs?: any[]; cityDoctorCount?: number; nearbyDoctors?: any[]; citySearchVolume?: number }) {
  const { toggleSave, isSaved } = useUserPreferences();
  const [copied, setCopied] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storySubmitted, setStorySubmitted] = useState(false);
  const [storyForm, setStoryForm] = useState({ patientFirstName: '', conditionBefore: '', outcomeAfter: '', storyText: '' });
  const [submittingStory, setSubmittingStory] = useState(false);
  const [appointmentSubmitted, setAppointmentSubmitted] = useState(false);
  const [submittingAppointment, setSubmittingAppointment] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({ name: '', email: '', phone: '', preferredDate: '', message: '' });
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralSent, setReferralSent] = useState(false);
  const [referring, setReferring] = useState(false);
  const [referralPatientName, setReferralPatientName] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const supabase = createClient();
  const [photoError, setPhotoError] = useState(false);

  const gated = isProfileGated(doctor);
  const saved = isSaved('doctors', doctor.id?.toString());
  const name = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  const spotlightEpisode = getEpisodeByDoctorSlug(slug);
  const location = [doctor.city, doctor.state].filter(Boolean).join(", ");
  const specialties = doctor.specialties || [];
  const d = doctor as any;

  // Extended fields
  const bannerUrl = d.banner_url as string | null;
  const instagramUrl = d.instagram_url as string | null;
  const facebookUrl = d.facebook_url as string | null;
  const highlights = d.highlights as string[] | null;
  const conditionsTreated = d.conditions_treated as string[] | null;
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
  const certificationsList = d.certifications as string[] | null;
  const mapQuery = doctor.address ? encodeURIComponent(`${doctor.address}, ${doctor.city}, ${doctor.state}`) : doctor.city ? encodeURIComponent(`${doctor.city}, ${doctor.state}`) : null;

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
    getApprovedStories(doctor.id).then(setStories);
  }, [supabase, doctor.id]);

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
            <div style={{ width: 140, height: 140, borderRadius: "50%", border: "4px solid rgba(214,104,41,0.4)", overflow: "hidden", background: "#1E2D3B", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 25px 60px rgba(0,0,0,0.4)", marginBottom: 24 }}>
              {doctor.photo_url && !photoError ? (
                <img src={doctor.photo_url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setPhotoError(true)} />
              ) : (
                <span style={{ fontSize: 48, fontWeight: 900, color: "#D66829" }}>{(doctor.first_name?.[0] || 'N').toUpperCase()}</span>
              )}
            </div>

            {/* Name */}
            <h1 style={{ fontSize: 42, fontWeight: 900, color: "white", fontFamily: "Lato, sans-serif", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 8 }}>{name}</h1>

            {/* Clinic */}
            <p style={{ fontSize: 14, fontWeight: 800, color: "#D66829", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>{doctor.clinic_name || 'Private Practice'}</p>

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
                  {doctor.phone && (
                    <a href={`tel:${doctor.phone}`} onClick={() => trackEvent('phone_tap')} style={{ padding: "14px 28px", background: "#D66829", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", boxShadow: "0 8px 30px rgba(214,104,41,0.3)" }}>
                      <Phone style={{ width: 16, height: 16 }} /> Call Now
                    </a>
                  )}
                  {bookingUrl ? (
                    <a href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('booking_click')} style={{ padding: "14px 28px", background: "#22c55e", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                      <Calendar style={{ width: 16, height: 16 }} /> Book Online
                    </a>
                  ) : (
                    <a href="#appointment" style={{ padding: "14px 28px", background: "rgba(255,255,255,0.1)", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <Calendar style={{ width: 16, height: 16 }} /> Book Consultation
                    </a>
                  )}
                  {doctor.email && (
                    <a href={`mailto:${doctor.email}`} onClick={() => trackEvent('contact_click')} style={{ padding: "14px 28px", background: "rgba(255,255,255,0.08)", color: "white", borderRadius: 14, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)" }}>
                      <Mail style={{ width: 16, height: 16 }} /> Email
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          2. TRUST BAR
      ═══════════════════════════════════════════ */}
      <section style={{ background: "#162230", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", overflow: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "center", minWidth: "fit-content" }}>
          {[
            ...(yearsInPractice ? [{ value: `${yearsInPractice}+`, label: "Years Practice" }] : []),
            ...(cityDoctorCount > 0 && doctor.city ? [{ value: `1 of ${cityDoctorCount}`, label: `in ${doctor.city}` }] : []),
            ...(certificationsList?.length ? [{ value: certificationsList[0], label: "Certified" }] : []),
            ...(specialties.length > 0 ? [{ value: String(specialties.length), label: "Specialties" }] : []),
            ...(d.profile_views > 0 && !gated ? [{ value: d.profile_views > 999 ? `${(d.profile_views / 1000).toFixed(1)}k` : String(d.profile_views), label: "Profile Views" }] : []),
            ...(d.patient_leads > 0 ? [{ value: String(d.patient_leads), label: "Inquiries" }] : []),
          ].map((item, i) => (
            <div key={i} style={{ flex: "0 0 auto", textAlign: "center", padding: "16px 28px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#D66829", lineHeight: 1.2, whiteSpace: "nowrap" }}>{item.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. CLAIM / UPGRADE BANNERS
      ═══════════════════════════════════════════ */}
      {!doctor.user_id && (
        <Section bg="cream" style={{ paddingTop: 32, paddingBottom: 0 }}>
          <div style={{ background: "linear-gradient(135deg, #1E2D3B 0%, #1a3048 100%)", borderRadius: 20, padding: "32px 36px", color: "white" }}>
            <p style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Welcome, {name}!</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>We built this free listing for you based on your public practice info. Claim it to manage your profile — takes 15 seconds. Your free plan is yours forever.</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>You&apos;ll also get a <span style={{ color: "#D66829", fontWeight: 800 }}>free 7-day Pro trial</span> to try everything — contact info visible to patients, analytics, practice tools, and more.</p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}>After the trial, Pro is $49/mo. Stay on the free plan as long as you want — no pressure, no credit card required to claim.</p>
            <a href={`/register?claim_id=${doctor.id}&role=doctor`} style={{ display: "inline-block", padding: "14px 28px", background: "#D66829", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 20px rgba(214,104,41,0.3)" }}>
              Claim My Profile
            </a>
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
            <Link href="/doctor/billing" style={{ padding: "12px 24px", background: "#D66829", color: "white", borderRadius: 12, fontWeight: 800, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>Upgrade to Pro — $49/mo</Link>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          4. WHY CHOOSE ME / HIGHLIGHTS
      ═══════════════════════════════════════════ */}
      {highlights && highlights.length > 0 && (
        <Section bg="cream" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1E2D3B", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 36 }}>Why Choose {doctor.first_name}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {highlights.map((h: string, i: number) => (
              <div key={i} style={{ background: "white", borderRadius: 16, padding: "24px 28px", display: "flex", alignItems: "flex-start", gap: 14, border: "1px solid rgba(30,45,59,0.06)" }}>
                <CheckCircle2 style={{ width: 20, height: 20, color: "#22c55e", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 15, color: "#374151", lineHeight: 1.5 }}>{h}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          5. BIO — Pull Quote
      ═══════════════════════════════════════════ */}
      {doctor.bio && (
        <Section bg="white" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            {firstSentence && (
              <p style={{ fontSize: 26, fontWeight: 500, fontStyle: "italic", color: "#1E2D3B", lineHeight: 1.55, borderLeft: "4px solid #D66829", paddingLeft: 28, marginBottom: 28 }}>
                &ldquo;{firstSentence}&rdquo;
              </p>
            )}
            {restOfBio && (
              <p style={{ fontSize: 16, lineHeight: 1.8, color: "#4a5568" }}>{restOfBio}</p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(30,45,59,0.08)" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "#1E2D3B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                {doctor.photo_url && !photoError ? (
                  <img src={doctor.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "#D66829", fontWeight: 900, fontSize: 16 }}>{(doctor.first_name?.[0] || "N").toUpperCase()}</span>
                )}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#1E2D3B" }}>{name}</p>
                <p style={{ fontSize: 12, color: "#718096" }}>{doctor.clinic_name}{doctor.city ? ` · ${doctor.city}` : ""}</p>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          6. SPECIALTIES + CONDITIONS
      ═══════════════════════════════════════════ */}
      {(specialties.length > 0 || (conditionsTreated && conditionsTreated.length > 0)) && (
        <Section bg="cream" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1E2D3B", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 32 }}>Patients We Help</h2>
          {specialties.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: conditionsTreated?.length ? 24 : 0 }}>
              {specialties.map((s: string, i: number) => (
                <span key={i} style={{ padding: "10px 22px", background: "rgba(214,104,41,0.08)", border: "1px solid rgba(214,104,41,0.15)", borderRadius: 50, fontSize: 14, fontWeight: 700, color: "#D66829" }}>{s}</span>
              ))}
            </div>
          )}
          {conditionsTreated && conditionsTreated.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {conditionsTreated.map((c: string, i: number) => (
                <span key={i} style={{ padding: "7px 16px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 50, fontSize: 13, fontWeight: 600, color: "#3b82f6" }}>{c}</span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          7. CERTIFICATIONS + EDUCATION + BADGES
      ═══════════════════════════════════════════ */}
      {(certificationsList?.length || education?.length || doctor.user_id) && (
        <Section bg="white" style={{ paddingTop: 72, paddingBottom: 72 }}>
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
            {education && education.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <GraduationCap style={{ width: 18, height: 18, color: "#D66829" }} />
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: "#1E2D3B" }}>Education</h3>
                </div>
                {education.map((e: string, i: number) => (
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
          8. VIDEO / SPOTLIGHT — Cinematic
      ═══════════════════════════════════════════ */}
      {(spotlightEpisode || doctor.video_url) && (
        <section style={{ background: "linear-gradient(180deg, #1E2D3B 0%, #162230 100%)", padding: "80px 24px" }}>
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
                  <Play style={{ width: 14, height: 14 }} /> Meet {doctor.first_name}
                </h2>
                <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", aspectRatio: "16 / 9" }}>
                  <iframe src={doctor.video_url.replace('watch?v=', 'embed/').replace('vimeo.com/', 'player.vimeo.com/video/')} style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          9. GALLERY
      ═══════════════════════════════════════════ */}
      {galleryImages && galleryImages.length > 0 && (
        <Section bg="cream" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1E2D3B", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 32 }}>Photos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {galleryImages.map((img: string, i: number) => (
              <img key={i} src={img} alt="" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 16 }} />
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          10. TEAM MEMBERS
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
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 24, fontWeight: 700 }}>{m.name?.[0]}</div>}
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#1E2D3B" }}>{m.name}</p>
                <p style={{ fontSize: 12, color: "#718096" }}>{m.role}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          11. SOCIAL PROOF — Reviews + City Demand + Stories
      ═══════════════════════════════════════════ */}
      <section style={{ background: "linear-gradient(180deg, #1E2D3B 0%, #162230 100%)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 48 }}>Social Proof</h2>

          {/* City demand */}
          {citySearchVolume > 0 && doctor.city && (
            <div style={{ textAlign: "center", marginBottom: 48, padding: "28px 32px", background: "rgba(214,104,41,0.08)", borderRadius: 20, border: "1px solid rgba(214,104,41,0.12)" }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#D66829" }}>{citySearchVolume.toLocaleString()}</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>patients found nervous system chiropractors in {doctor.city} recently</p>
            </div>
          )}

          {/* Google Reviews */}
          {doctor.google_place_id && (
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: "32px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 32 }}>
              <GoogleReviews placeId={doctor.google_place_id} doctorName={name} />
            </div>
          )}

          {/* Patient Stories */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: "32px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: "white", marginBottom: 20 }}>Patient Stories</h3>
            {stories.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
                {stories.map((story) => (
                  <div key={story.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>{story.patient_first_name}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{story.condition_before} → {story.outcome_after}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontStyle: "italic", lineHeight: 1.6 }}>&ldquo;{story.story_text}&rdquo;</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>No stories yet. Be the first to share your experience.</p>
            )}

            {storySubmitted ? (
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16, padding: 20, textAlign: "center" }}>
                <CheckCircle2 style={{ width: 24, height: 24, color: "#4ade80", margin: "0 auto 8px" }} />
                <p style={{ fontWeight: 800, color: "#4ade80", fontSize: 14 }}>Thank you! Your story will appear after review.</p>
              </div>
            ) : showStoryForm ? (
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                <input type="text" placeholder="Your first name" value={storyForm.patientFirstName} onChange={e => setStoryForm(f => ({...f, patientFirstName: e.target.value}))} style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white", fontSize: 14, outline: "none" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input type="text" placeholder="Condition before" value={storyForm.conditionBefore} onChange={e => setStoryForm(f => ({...f, conditionBefore: e.target.value}))} style={{ padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white", fontSize: 14, outline: "none" }} />
                  <input type="text" placeholder="Outcome after" value={storyForm.outcomeAfter} onChange={e => setStoryForm(f => ({...f, outcomeAfter: e.target.value}))} style={{ padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white", fontSize: 14, outline: "none" }} />
                </div>
                <textarea placeholder="Tell your story..." value={storyForm.storyText} onChange={e => setStoryForm(f => ({...f, storyText: e.target.value}))} style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white", fontSize: 14, height: 80, resize: "none", outline: "none" }} />
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => setShowStoryForm(false)} style={{ padding: "10px 20px", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
                  <button disabled={submittingStory || !storyForm.patientFirstName || !storyForm.storyText}
                    onClick={async () => { setSubmittingStory(true); const result = await submitPatientStory(doctor.id, storyForm); setSubmittingStory(false); if (result && 'success' in result) { setStorySubmitted(true); setShowStoryForm(false); } }}
                    style={{ padding: "10px 20px", background: "#D66829", color: "white", borderRadius: 10, fontSize: 14, fontWeight: 800, border: "none", cursor: "pointer", opacity: submittingStory || !storyForm.patientFirstName || !storyForm.storyText ? 0.5 : 1 }}>
                    {submittingStory ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowStoryForm(true)} style={{ color: "#D66829", fontWeight: 800, fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>Share your experience</button>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          12. LOCATION + HOURS + PRACTICAL INFO
      ═══════════════════════════════════════════ */}
      {(mapQuery || hours || parkingInfo || languages?.length || acceptedPayment?.length || insuranceNetworks?.length || firstVisitInfo || amenitiesList?.length) && (
        <Section bg="white" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1E2D3B", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 40 }}>Visit the Practice</h2>
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
                    <p style={{ fontSize: 13, color: "#718096" }}>{doctor.address}, {location}</p>
                  </div>
                </div>
              )}
              {hours && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Clock style={{ width: 16, height: 16, color: "#D66829" }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>Hours</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#4a5568", whiteSpace: "pre-line", lineHeight: 1.7 }}>{hours}</p>
                </div>
              )}
              {firstVisitInfo && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>First Visit</p>
                  <p style={{ fontSize: 14, color: "#4a5568", lineHeight: 1.7, whiteSpace: "pre-line" }}>{firstVisitInfo}</p>
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
          13. SEMINARS + JOBS
      ═══════════════════════════════════════════ */}
      {(seminars.length > 0 || jobs.length > 0) && (
        <Section bg="cream" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <div style={{ display: "grid", gridTemplateColumns: seminars.length > 0 && jobs.length > 0 ? "1fr 1fr" : "1fr", gap: 32 }}>
            {seminars.length > 0 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1E2D3B", marginBottom: 16 }}>Seminars & Events</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {seminars.map((sem: any) => (
                    <Link key={sem.id} href={`/seminars/${sem.id}`} style={{ background: "white", borderRadius: 16, padding: "16px 20px", textDecoration: "none", border: "1px solid rgba(30,45,59,0.06)", display: "block" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 800, color: "#1E2D3B", marginBottom: 6 }}>{sem.title}</p>
                          <div style={{ display: "flex", gap: 12 }}>
                            {sem.dates && <span style={{ fontSize: 12, color: "#718096", display: "flex", alignItems: "center", gap: 4 }}><Calendar style={{ width: 12, height: 12 }} /> {sem.dates}</span>}
                            {(sem.city || sem.location) && <span style={{ fontSize: 12, color: "#718096", display: "flex", alignItems: "center", gap: 4 }}><MapPin style={{ width: 12, height: 12 }} /> {sem.city || sem.location}</span>}
                          </div>
                        </div>
                        {sem.price ? <span style={{ fontSize: 12, fontWeight: 800, color: "#D66829" }}>${sem.price}</span> : <span style={{ fontSize: 12, fontWeight: 800, color: "#16a34a" }}>Free</span>}
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
          14. FAQ
      ═══════════════════════════════════════════ */}
      {faq && faq.length > 0 && (
        <Section bg="white" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1E2D3B", textAlign: "center", marginBottom: 32 }}>Frequently Asked Questions</h2>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {faq.map((item, i) => (
              <div key={i} style={{ border: "1px solid rgba(30,45,59,0.08)", borderRadius: 16, overflow: "hidden" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", padding: "18px 24px", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer" }}>
                  <span style={{ fontWeight: 800, color: "#1E2D3B", fontSize: 15 }}>{item.question}</span>
                  <ChevronDown style={{ width: 18, height: 18, color: "#9ca3af", transition: "transform 0.2s", transform: openFaq === i ? "rotate(180deg)" : "none" }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 24px 18px" }}><p style={{ fontSize: 14, color: "#4a5568", lineHeight: 1.7 }}>{item.answer}</p></div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════
          15. APPOINTMENT REQUEST
      ═══════════════════════════════════════════ */}
      <Section bg="cream" id="appointment" style={{ paddingTop: 80, paddingBottom: 80 }}>
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
              <p style={{ textAlign: "center", color: "#718096", fontSize: 14, marginBottom: 28 }}>Send a request to {doctor.clinic_name || name}. They&apos;ll get back to you directly.</p>
              {appointmentSubmitted ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: 28, textAlign: "center" }}>
                  <CheckCircle2 style={{ width: 28, height: 28, color: "#22c55e", margin: "0 auto 8px" }} />
                  <p style={{ fontWeight: 800, color: "#15803d", fontSize: 15 }}>Request Sent!</p>
                  <p style={{ color: "#16a34a", fontSize: 13, marginTop: 4 }}>They&apos;ll contact you within 1-2 business days.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input type="text" placeholder="Your name *" value={appointmentForm.name} onChange={e => setAppointmentForm(f => ({...f, name: e.target.value}))} style={{ padding: "14px 18px", border: "1px solid #e5e7eb", borderRadius: 14, fontSize: 14, outline: "none" }} />
                    <input type="email" placeholder="Email *" value={appointmentForm.email} onChange={e => setAppointmentForm(f => ({...f, email: e.target.value}))} style={{ padding: "14px 18px", border: "1px solid #e5e7eb", borderRadius: 14, fontSize: 14, outline: "none" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input type="tel" placeholder="Phone (optional)" value={appointmentForm.phone} onChange={e => setAppointmentForm(f => ({...f, phone: e.target.value}))} style={{ padding: "14px 18px", border: "1px solid #e5e7eb", borderRadius: 14, fontSize: 14, outline: "none" }} />
                    <input type="date" value={appointmentForm.preferredDate} onChange={e => setAppointmentForm(f => ({...f, preferredDate: e.target.value}))} style={{ padding: "14px 18px", border: "1px solid #e5e7eb", borderRadius: 14, fontSize: 14, outline: "none" }} />
                  </div>
                  <textarea placeholder="What are you looking for? (optional)" value={appointmentForm.message} onChange={e => setAppointmentForm(f => ({...f, message: e.target.value}))} style={{ padding: "14px 18px", border: "1px solid #e5e7eb", borderRadius: 14, fontSize: 14, height: 80, resize: "none", outline: "none" }} />
                  <button disabled={submittingAppointment || !appointmentForm.name || !appointmentForm.email}
                    onClick={async () => {
                      setSubmittingAppointment(true);
                      try {
                        const res = await fetch('/api/appointment', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ patientName: appointmentForm.name, patientEmail: appointmentForm.email, patientPhone: appointmentForm.phone, preferredDate: appointmentForm.preferredDate, message: appointmentForm.message, doctorId: doctor.id }) });
                        if (!res.ok) throw new Error();
                        setAppointmentSubmitted(true);
                      } catch { alert('Something went wrong. Please try again or call the office directly.'); }
                      setSubmittingAppointment(false);
                    }}
                    style={{ padding: "16px 32px", background: "#D66829", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: submittingAppointment || !appointmentForm.name || !appointmentForm.email ? 0.5 : 1, boxShadow: "0 4px 20px rgba(214,104,41,0.25)" }}>
                    {submittingAppointment ? <><Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> Sending...</> : <><Send style={{ width: 16, height: 16 }} /> Send Request</>}
                  </button>
                  <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>Your info is sent directly to the doctor. We never share it with anyone else.</p>
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          16. NEARBY DOCTORS
      ═══════════════════════════════════════════ */}
      {nearbyDoctors.length > 0 && (
        <Section bg="white" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#1E2D3B", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 36 }}>Other Nervous System Chiropractors Near You</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {nearbyDoctors.map((doc: any) => (
              <Link key={doc.id} href={`/directory/${doc.slug || doc.id}`} style={{ background: "#F5F3EF", borderRadius: 20, padding: 24, textDecoration: "none", border: "1px solid rgba(30,45,59,0.04)", display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1E2D3B", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {doc.photo_url ? <img src={doc.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
                      <span style={{ color: "#D66829", fontWeight: 900, fontSize: 18 }}>{(doc.first_name?.[0] || "N").toUpperCase()}</span>}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#1E2D3B" }}>Dr. {doc.first_name} {doc.last_name}</p>
                    <p style={{ fontSize: 12, color: "#718096", display: "flex", alignItems: "center", gap: 4 }}><MapPin style={{ width: 12, height: 12 }} /> {doc.city}{doc.state ? `, ${doc.state}` : ''}</p>
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
          17. REFERRAL (doctor-to-doctor)
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
          18. REPORT + DISCLAIMER
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
          19. REFERRAL MODAL
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

      {/* ═══════════════════════════════════════════
          20. STICKY MOBILE CTA
      ═══════════════════════════════════════════ */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid #e5e7eb", padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))", zIndex: 100 }} className="lg:hidden">
        <div style={{ display: "flex", gap: 10, maxWidth: 600, margin: "0 auto" }}>
          {gated ? (
            <ContactGateCTA variant="mobile" doctorId={doctor.id} doctorName={name} isClaimed={!!doctor.user_id} phone={doctor.phone} website={doctor.website_url} />
          ) : (
            <>
              {bookingUrl ? (
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('booking_click')} style={{ flex: 1, padding: "14px 0", background: "#22c55e", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 14, textAlign: "center", textDecoration: "none" }}>Book Online</a>
              ) : (
                <a href="#appointment" style={{ flex: 1, padding: "14px 0", background: "#D66829", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 14, textAlign: "center", textDecoration: "none" }}>Book Consultation</a>
              )}
              {doctor.phone && (
                <a href={`tel:${doctor.phone}`} onClick={() => trackEvent('phone_tap')} style={{ flex: 1, padding: "14px 0", background: "#1E2D3B", color: "white", borderRadius: 14, fontWeight: 800, fontSize: 14, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Phone style={{ width: 16, height: 16 }} /> Call
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom spacer for mobile sticky CTA */}
      <div style={{ height: 80 }} className="lg:hidden" />
    </div>
  );
}
