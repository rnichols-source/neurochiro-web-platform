"use client";

import { useState } from "react";
import {
  MapPin,
  Phone,
  Calendar,
  Globe,
  Instagram,
  Facebook,
  Share2,
  Mail,
  Clock,
  ChevronDown,
  GraduationCap,
  Award,
  Users,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { isProfileGated } from "@/lib/profile-gating";

/* ─── helpers ─── */

function formatUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  return `https://${trimmed}`;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone;
}

function truncateWords(text: string, maxWords: number): { text: string; truncated: boolean } {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return { text, truncated: false };
  return { text: words.slice(0, maxWords).join(" ") + "...", truncated: true };
}

function getInitials(first?: string, last?: string): string {
  return ((first?.[0] || "") + (last?.[0] || "")).toUpperCase() || "?";
}

/* ─── palette ─── */

const C = {
  navy: "#1E2D3B",
  orange: "#D66829",
  black: "#131313",
  cream: "#F0EBDD",
  gray: "#4B5563",
  white: "#FFFFFF",
} as const;

/* ─── section wrapper ─── */

function Section({
  bg,
  children,
  id,
}: {
  bg: "cream" | "white";
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      style={{
        background: bg === "cream" ? C.cream : C.white,
        width: "100%",
        padding: "48px 0",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px" }}>
        {children}
      </div>
    </section>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Lato', sans-serif",
        fontWeight: 900,
        fontSize: 24,
        color: C.black,
        marginBottom: 24,
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </h2>
  );
}

/* ─── pill component ─── */

function Pill({
  children,
  variant = "filled",
}: {
  children: React.ReactNode;
  variant?: "filled" | "outline";
}) {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 500,
    lineHeight: 1.4,
  };
  if (variant === "outline") {
    return (
      <span
        style={{
          ...base,
          border: `1.5px solid ${C.orange}`,
          color: C.orange,
          background: "transparent",
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      style={{
        ...base,
        background: "#F3E8DF",
        color: C.black,
      }}
    >
      {children}
    </span>
  );
}

/* ─── badge pill (header) ─── */

function BadgePill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        borderRadius: 16,
        fontSize: 12,
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 600,
        background: "rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      {children}
    </span>
  );
}

/* ─── FAQ accordion item ─── */

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderBottom: `1px solid ${C.cream}`,
        paddingBottom: 16,
        marginBottom: 16,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textAlign: "left",
          fontFamily: "'Lato', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: C.black,
        }}
      >
        {question}
        <ChevronDown
          size={18}
          style={{
            flexShrink: 0,
            marginLeft: 12,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: C.gray,
          }}
        />
      </button>
      {open && (
        <p
          style={{
            marginTop: 12,
            fontSize: 15,
            lineHeight: 1.7,
            color: C.gray,
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          {answer}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function ProfileRedesign({
  doctor,
  slug,
  seminars = [],
  jobs = [],
  cityDoctorCount = 0,
  nearbyDoctors = [],
  citySearchVolume = 0,
}: {
  doctor: any;
  slug: string;
  seminars?: any[];
  jobs?: any[];
  cityDoctorCount?: number;
  nearbyDoctors?: any[];
  citySearchVolume?: number;
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [hiddenGalleryImages, setHiddenGalleryImages] = useState<Set<number>>(
    new Set()
  );

  const gated = isProfileGated(doctor);
  const d = doctor as any;

  /* ─── derived data ─── */

  const doctorName = `Dr. ${d.first_name || ""} ${d.last_name || ""}`.trim();
  const location = [d.city, d.state].filter(Boolean).join(", ");
  const shortIntro = d.short_intro
    ? d.short_intro.split(/[.!?]/)[0]?.trim() + "."
    : null;

  const specialties = (d.specialties || [])
    .flatMap((s: string) => s.split(/\n/).map((t: string) => t.trim()))
    .filter((s: string) => s.length > 0 && s.length <= 50);

  const conditionsTreated = (d.conditions_treated || []).filter(
    (c: string) =>
      c.length <= 50 && !/\b(any|every|all)\s+(condition|problem)/i.test(c)
  );

  const certificationsList = d.certifications
    ? [
        ...new Set(d.certifications as string[]),
      ].filter(
        (c: string) =>
          !/\b(only one|fastest|one of the only|finalist|business person|business of the year)\b/i.test(
            c
          ) && !/\b(specialties in|specialize in)\b/i.test(c)
      )
    : [];

  const teamMembers = (d.team_members || []) as {
    name: string;
    role: string;
    photo_url?: string;
  }[];
  const galleryImages = (d.gallery_images || []) as string[];
  const faq = (d.faq || []) as { question: string; answer: string }[];
  const insuranceNetworks = (d.insurance_networks || []) as string[];
  const acceptedPayment = (d.accepted_payment || []) as string[];
  const hours = d.hours as string | null;
  const bookingUrl = d.booking_url as string | null;
  const firstVisitInfo = d.first_visit_info as string | null;
  const parkingInfo = d.parking_info as string | null;
  const philosophy = d.philosophy as string | null;
  const bio = d.bio as string | null;
  const photoUrl = d.photo_url as string | null;
  const phone = d.phone as string | null;
  const email = d.email as string | null;
  const websiteUrl = formatUrl(d.website);
  const instagramUrl = formatUrl(d.instagram_url);
  const facebookUrl = formatUrl(d.facebook_url);
  const tiktokUrl = formatUrl(d.tiktok_url);

  const hasCostData =
    d.first_visit_price ||
    d.payment_model ||
    insuranceNetworks.length > 0 ||
    d.files_insurance ||
    d.payment_plans ||
    d.free_consultation;

  const hasAvailData =
    hours ||
    d.has_evening_hours ||
    d.has_weekend_hours ||
    d.accepting_new_patients;

  const hasCredentials =
    d.chiropractic_school ||
    d.degree ||
    d.graduation_year ||
    certificationsList.length > 0 ||
    d.years_in_practice;

  const mapQuery = d.address
    ? encodeURIComponent(`${d.address}, ${d.city}, ${d.state}`)
    : d.city
      ? encodeURIComponent(`${d.city}, ${d.state}`)
      : null;

  // Deduplicate specialties vs conditions
  const conditionsLower = new Set(
    conditionsTreated.map((c: string) => c.toLowerCase())
  );
  const dedupedSpecialties = specialties.filter(
    (s: string) => !conditionsLower.has(s.toLowerCase())
  );

  // Bio truncation
  const bioTruncated = bio ? truncateWords(bio, 200) : null;

  /* ─── badges (max 3) ─── */

  const badges: { label: string; icon: React.ReactNode }[] = [];
  if (d.verified)
    badges.push({
      label: "Verified",
      icon: <ShieldCheck size={12} />,
    });
  if (d.accepting_new_patients)
    badges.push({
      label: "Accepting Patients",
      icon: <CheckCircle2 size={12} />,
    });
  if (specialties.length > 0)
    badges.push({
      label: specialties[0],
      icon: <Award size={12} />,
    });
  const headerBadges = badges.slice(0, 3);

  /* ─── share handler ─── */

  const handleShare = async () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://neurochiro.co/directory/${slug}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: doctorName, url });
      } catch {
        /* cancelled */
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ─── primary CTA logic ─── */

  let primaryCTA: { label: string; href: string; icon: React.ReactNode } | null =
    null;
  let secondaryActions: {
    label: string;
    href: string;
    icon: React.ReactNode;
  }[] = [];

  if (!gated) {
    if (bookingUrl) {
      primaryCTA = {
        label: "Book Online",
        href: bookingUrl,
        icon: <Calendar size={18} />,
      };
      if (phone)
        secondaryActions.push({
          label: "Call",
          href: `tel:${phone}`,
          icon: <Phone size={16} />,
        });
    } else if (phone) {
      primaryCTA = {
        label: `Call ${formatPhone(phone)}`,
        href: `tel:${phone}`,
        icon: <Phone size={18} />,
      };
    }
    if (email)
      secondaryActions.push({
        label: "Email",
        href: `mailto:${email}`,
        icon: <Mail size={16} />,
      });
    secondaryActions.push({
      label: copied ? "Copied!" : "Share",
      href: "#",
      icon: <Share2 size={16} />,
    });
  }

  /* ─── social links ─── */

  const socials: { href: string; icon: React.ReactNode; label: string }[] = [];
  if (instagramUrl)
    socials.push({
      href: instagramUrl,
      icon: <Instagram size={18} />,
      label: "Instagram",
    });
  if (facebookUrl)
    socials.push({
      href: facebookUrl,
      icon: <Facebook size={18} />,
      label: "Facebook",
    });
  if (tiktokUrl)
    socials.push({
      href: tiktokUrl,
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.11a8.16 8.16 0 003.76.92V6.69z" />
        </svg>
      ),
      label: "TikTok",
    });
  if (websiteUrl)
    socials.push({
      href: websiteUrl,
      icon: <Globe size={18} />,
      label: "Website",
    });

  /* ─── visible gallery images (hide broken ones) ─── */

  const visibleGallery = galleryImages.filter(
    (_, i) => !hiddenGalleryImages.has(i)
  );

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: C.cream,
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {/* ─── 1. HEADER ─── */}
      <section
        style={{
          background: C.navy,
          width: "100%",
          paddingTop: 60,
          paddingBottom: 48,
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Photo */}
          {photoUrl && !photoError ? (
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                overflow: "hidden",
                border: `3px solid rgba(255,255,255,0.2)`,
                marginBottom: 20,
                flexShrink: 0,
              }}
            >
              <Image
                src={photoUrl}
                alt={doctorName}
                width={180}
                height={180}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={() => setPhotoError(true)}
              />
            </div>
          ) : (
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: C.orange,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  color: C.white,
                  fontFamily: "'Lato', sans-serif",
                  fontWeight: 900,
                  fontSize: 48,
                }}
              >
                {getInitials(d.first_name, d.last_name)}
              </span>
            </div>
          )}

          {/* Name */}
          <h1
            style={{
              fontFamily: "'Lato', sans-serif",
              fontWeight: 900,
              fontSize: 28,
              color: C.white,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {doctorName}
          </h1>

          {/* Clinic name */}
          {d.clinic_name && (
            <p
              style={{
                color: C.orange,
                fontSize: 16,
                fontWeight: 600,
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              {d.clinic_name}
            </p>
          )}

          {/* Location */}
          {location && (
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                marginTop: 8,
                marginBottom: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <MapPin size={14} />
              {location}
            </p>
          )}

          {/* One-line descriptor */}
          {shortIntro && (
            <p
              style={{
                color: C.white,
                fontSize: 15,
                fontStyle: "italic",
                marginTop: 14,
                marginBottom: 0,
                maxWidth: 520,
                lineHeight: 1.5,
                opacity: 0.9,
              }}
            >
              {shortIntro}
            </p>
          )}

          {/* Badges */}
          {headerBadges.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 18,
                justifyContent: "center",
              }}
            >
              {headerBadges.map((b, i) => (
                <BadgePill key={i}>
                  {b.icon}
                  {b.label}
                </BadgePill>
              ))}
            </div>
          )}

          {/* ─── GATED: Claim CTA ─── */}
          {gated ? (
            <div style={{ marginTop: 28 }}>
              <Link
                href={`/claim/${slug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: C.orange,
                  color: C.white,
                  padding: "14px 32px",
                  borderRadius: 8,
                  fontFamily: "'Lato', sans-serif",
                  fontWeight: 900,
                  fontSize: 16,
                  textDecoration: "none",
                  border: "none",
                }}
              >
                Claim This Profile
              </Link>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  marginTop: 10,
                }}
              >
                Are you this doctor? Claim your profile to unlock full features.
              </p>
            </div>
          ) : (
            <>
              {/* ─── Primary CTA ─── */}
              {primaryCTA && (
                <a
                  href={primaryCTA.href}
                  target={
                    primaryCTA.href.startsWith("http") ? "_blank" : undefined
                  }
                  rel={
                    primaryCTA.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: C.orange,
                    color: C.white,
                    padding: "14px 32px",
                    borderRadius: 8,
                    fontFamily: "'Lato', sans-serif",
                    fontWeight: 900,
                    fontSize: 16,
                    textDecoration: "none",
                    marginTop: 28,
                    border: "none",
                    cursor: "pointer",
                    transition: "opacity 0.15s",
                  }}
                >
                  {primaryCTA.icon}
                  {primaryCTA.label}
                </a>
              )}

              {/* ─── Secondary actions ─── */}
              {secondaryActions.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    marginTop: 16,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {secondaryActions.map((a, i) => (
                    <a
                      key={i}
                      href={a.href === "#" ? undefined : a.href}
                      onClick={
                        a.href === "#"
                          ? (e) => {
                              e.preventDefault();
                              handleShare();
                            }
                          : undefined
                      }
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 13,
                        fontWeight: 500,
                        textDecoration: "none",
                        cursor: "pointer",
                        transition: "color 0.15s",
                      }}
                    >
                      {a.icon}
                      {a.label}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─── Social icons ─── */}
          {socials.length > 0 && !gated && (
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 20,
                justifyContent: "center",
              }}
            >
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    transition: "color 0.15s",
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── 2. CAN YOU HELP ME (Patients We Help) ─── */}
      {conditionsTreated.length > 0 && (
        <Section bg="cream">
          <SectionHeading>Patients We Help</SectionHeading>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {conditionsTreated.map((c: string, i: number) => (
              <Pill key={i}>{c}</Pill>
            ))}
          </div>
        </Section>
      )}

      {/* ─── 3. WHY THIS DOCTOR ─── */}
      {(philosophy || bio) && (
        <Section bg="white">
          {philosophy && (
            <blockquote
              style={{
                borderLeft: `4px solid ${C.orange}`,
                paddingLeft: 20,
                margin: "0 0 24px 0",
                fontStyle: "italic",
                fontSize: 18,
                lineHeight: 1.7,
                color: C.black,
                fontFamily: "'Lato', sans-serif",
                fontWeight: 400,
              }}
            >
              {philosophy}
            </blockquote>
          )}
          {bio && (
            <div>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: C.gray,
                  margin: 0,
                  whiteSpace: "pre-line",
                }}
              >
                {bioExpanded || !bioTruncated?.truncated
                  ? bio
                  : bioTruncated.text}
              </p>
              {bioTruncated?.truncated && !bioExpanded && (
                <button
                  onClick={() => setBioExpanded(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.orange,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    padding: "8px 0 0",
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  Read more
                </button>
              )}
            </div>
          )}
        </Section>
      )}

      {/* ─── 4. FIRST VISIT ─── */}
      {firstVisitInfo && (
        <Section bg="cream">
          <SectionHeading>Your First Visit</SectionHeading>
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: C.gray,
              whiteSpace: "pre-line",
            }}
          >
            {firstVisitInfo}
          </div>
        </Section>
      )}

      {/* ─── 5. COST & INSURANCE ─── */}
      {hasCostData && (
        <Section bg="white">
          <SectionHeading>Cost</SectionHeading>
          <div
            style={{
              display: "grid",
              gap: 14,
              fontSize: 15,
              lineHeight: 1.6,
              color: C.gray,
            }}
          >
            {d.first_visit_price && (
              <p style={{ margin: 0 }}>
                <strong style={{ color: C.black }}>First Visit:</strong>{" "}
                {d.first_visit_price}
              </p>
            )}
            {d.payment_model && (
              <p style={{ margin: 0 }}>
                <strong style={{ color: C.black }}>Payment Model:</strong>{" "}
                {d.payment_model}
              </p>
            )}
            {d.files_insurance && (
              <p style={{ margin: 0 }}>
                <strong style={{ color: C.black }}>Files Insurance:</strong> Yes
              </p>
            )}
            {d.payment_plans && (
              <p style={{ margin: 0 }}>
                <strong style={{ color: C.black }}>Payment Plans:</strong>{" "}
                Available
              </p>
            )}
            {d.free_consultation && (
              <p style={{ margin: 0 }}>
                <strong style={{ color: C.black }}>
                  Free Consultation:
                </strong>{" "}
                Yes
              </p>
            )}
            {acceptedPayment.length > 0 && (
              <div>
                <strong style={{ color: C.black }}>Accepted Payment:</strong>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {acceptedPayment.map((p: string, i: number) => (
                    <Pill key={i}>{p}</Pill>
                  ))}
                </div>
              </div>
            )}
            {insuranceNetworks.length > 0 && (
              <div>
                <strong style={{ color: C.black }}>Insurance Networks:</strong>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {insuranceNetworks.map((n: string, i: number) => (
                    <Pill key={i}>{n}</Pill>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ─── 6. AVAILABILITY / HOURS ─── */}
      {hasAvailData && (
        <Section bg={hasCostData ? "cream" : "white"}>
          <SectionHeading>Hours</SectionHeading>
          {hours && (
            <div
              style={{
                fontSize: 15,
                lineHeight: 2,
                color: C.gray,
                whiteSpace: "pre-line",
                marginBottom: 16,
              }}
            >
              {hours}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {d.accepting_new_patients && (
              <Pill>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={14} color={C.orange} />
                  Accepting New Patients
                </span>
              </Pill>
            )}
            {d.has_evening_hours && (
              <Pill>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Clock size={14} color={C.orange} />
                  Evening Hours
                </span>
              </Pill>
            )}
            {d.has_weekend_hours && (
              <Pill>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Clock size={14} color={C.orange} />
                  Weekend Hours
                </span>
              </Pill>
            )}
          </div>
        </Section>
      )}

      {/* ─── 7. LOCATION ─── */}
      {(d.address || d.city) && (
        <Section bg="cream">
          <SectionHeading>Location</SectionHeading>
          <div style={{ fontSize: 15, lineHeight: 1.8, color: C.gray }}>
            {d.address && <p style={{ margin: "0 0 4px" }}>{d.address}</p>}
            <p style={{ margin: 0 }}>{location}</p>
            {parkingInfo && (
              <p style={{ margin: "12px 0 0", fontSize: 14 }}>
                <strong style={{ color: C.black }}>Parking:</strong>{" "}
                {parkingInfo}
              </p>
            )}
          </div>
          {mapQuery && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 16,
                color: C.orange,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              <MapPin size={16} />
              View on Google Maps
              <ExternalLink size={14} />
            </a>
          )}
        </Section>
      )}

      {/* ─── 8. CREDENTIALS ─── */}
      {hasCredentials && (
        <Section bg="white">
          <SectionHeading>Education & Credentials</SectionHeading>
          <div
            style={{
              display: "grid",
              gap: 12,
              fontSize: 15,
              lineHeight: 1.6,
              color: C.gray,
            }}
          >
            {d.chiropractic_school && (
              <p
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <GraduationCap size={18} color={C.orange} />
                <span>
                  <strong style={{ color: C.black }}>
                    {d.chiropractic_school}
                  </strong>
                  {d.degree && ` - ${d.degree}`}
                  {d.graduation_year && ` (${d.graduation_year})`}
                </span>
              </p>
            )}
            {d.years_in_practice && (
              <p style={{ margin: 0 }}>
                <strong style={{ color: C.black }}>Years in Practice:</strong>{" "}
                {d.years_in_practice}
              </p>
            )}
            {certificationsList.length > 0 && (
              <div>
                <strong style={{ color: C.black }}>Certifications:</strong>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {certificationsList.map((c: string, i: number) => (
                    <Pill key={i}>{c}</Pill>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ─── 9. SPECIALTIES ─── */}
      {dedupedSpecialties.length > 0 && (
        <Section bg="cream">
          <SectionHeading>Specialties</SectionHeading>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {dedupedSpecialties.map((s: string, i: number) => (
              <Pill key={i} variant="outline">
                {s}
              </Pill>
            ))}
          </div>
        </Section>
      )}

      {/* ─── 10. TEAM ─── */}
      {teamMembers.length > 0 && (
        <Section bg="white">
          <SectionHeading>Our Team</SectionHeading>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 20,
            }}
          >
            {teamMembers.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: C.cream,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {m.photo_url ? (
                    <Image
                      src={m.photo_url}
                      alt={m.name}
                      width={48}
                      height={48}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Users size={20} color={C.gray} />
                  )}
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: 14,
                      color: C.black,
                    }}
                  >
                    {m.name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: C.gray,
                    }}
                  >
                    {m.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── 11. GALLERY ─── */}
      {visibleGallery.length > 0 && (
        <Section bg="cream">
          <SectionHeading>Gallery</SectionHeading>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {galleryImages.map((img, i) =>
              hiddenGalleryImages.has(i) ? null : (
                <div
                  key={i}
                  style={{
                    borderRadius: 8,
                    overflow: "hidden",
                    aspectRatio: "1",
                    background: C.white,
                  }}
                >
                  <Image
                    src={img}
                    alt={`${doctorName} gallery ${i + 1}`}
                    width={320}
                    height={320}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={() =>
                      setHiddenGalleryImages((prev) => {
                        const next = new Set(prev);
                        next.add(i);
                        return next;
                      })
                    }
                  />
                </div>
              )
            )}
          </div>
        </Section>
      )}

      {/* ─── 12. FAQ ─── */}
      {faq.length > 0 && (
        <Section bg="white">
          <SectionHeading>Frequently Asked Questions</SectionHeading>
          {faq.map((item, i) => (
            <FaqItem
              key={i}
              question={item.question}
              answer={item.answer}
              open={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </Section>
      )}

      {/* ─── 13. NEARBY DOCTORS ─── */}
      {nearbyDoctors.length > 0 && (
        <Section bg="cream">
          <SectionHeading>Nearby Doctors</SectionHeading>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {nearbyDoctors.slice(0, 3).map((nd: any, i: number) => {
              const ndSlug = nd.slug || `${nd.first_name}-${nd.last_name}`.toLowerCase().replace(/\s+/g, "-");
              const ndName = `Dr. ${nd.first_name || ""} ${nd.last_name || ""}`.trim();
              const ndLocation = [nd.city, nd.state]
                .filter(Boolean)
                .join(", ");
              return (
                <Link
                  key={i}
                  href={`/directory/${ndSlug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 16,
                    background: C.white,
                    borderRadius: 10,
                    textDecoration: "none",
                    transition: "box-shadow 0.15s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: nd.photo_url ? "transparent" : C.orange,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {nd.photo_url ? (
                      <Image
                        src={nd.photo_url}
                        alt={ndName}
                        width={48}
                        height={48}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          color: C.white,
                          fontWeight: 900,
                          fontSize: 16,
                          fontFamily: "'Lato', sans-serif",
                        }}
                      >
                        {getInitials(nd.first_name, nd.last_name)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 14,
                        color: C.black,
                      }}
                    >
                      {ndName}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 13,
                        color: C.gray,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MapPin size={12} />
                      {ndLocation}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
