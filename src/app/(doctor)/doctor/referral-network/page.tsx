"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Send, Search, MapPin, Clock, CheckCircle, XCircle, AlertTriangle, Phone, Mail, ChevronRight, User, Loader2 } from "lucide-react";
import UpgradeGate from "@/components/doctor/UpgradeGate";
import {
  searchDoctorsForReferral,
  submitReferral,
  respondToReferral,
  getMyReferrals,
  logReferralGap,
  type ReferralDoctorResult,
  type ReferralRecord,
  type ReferralSubmission,
} from "./actions";
import { formatDistance } from "@/lib/geo";
import { useSearchParams } from "next/navigation";

// ── Shared styles ────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(to bottom, #1a2e40, #162231)",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 20,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontSize: 15,
  outline: "none",
};

const btnPrimary: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: 10,
  background: "#D66829",
  color: "#fff",
  fontWeight: 800,
  fontSize: 14,
  border: "none",
  cursor: "pointer",
  letterSpacing: 0.5,
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 13,
  border: "1px solid rgba(255,255,255,0.12)",
  cursor: "pointer",
};

const badgeColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  accepted: { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
  declined: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
  expired: { bg: "rgba(107,114,128,0.15)", text: "#6b7280" },
};

function StatusBadge({ status }: { status: string }) {
  const colors = badgeColors[status] || badgeColors.expired;
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: 1,
      background: colors.bg,
      color: colors.text,
    }}>
      {status}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  if (urgency !== "urgent") return null;
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: 1,
      background: "rgba(239,68,68,0.15)",
      color: "#ef4444",
    }}>
      URGENT
    </span>
  );
}

function DoctorAvatar({ photoUrl, firstName, lastName, size = 44 }: { photoUrl: string | null; firstName: string; lastName: string; size?: number }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`Dr. ${firstName} ${lastName}`}
        style={{ width: size, height: size, borderRadius: size / 2, objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }}
      />
    );
  }
  const initials = `${(firstName || "?")[0]}${(lastName || "?")[0]}`.toUpperCase();
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: "rgba(214,104,41,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#D66829",
      fontWeight: 900,
      fontSize: size * 0.36,
      border: "2px solid rgba(255,255,255,0.1)",
    }}>
      {initials}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Main page ────────────────────────────────────────────────────────────────

function ReferralNetworkSkeleton() {
  return (
    <div style={{ padding: "16px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Send style={{ width: 24, height: 24, color: "#D66829" }} />
        <div style={{ height: 28, width: 200, background: "rgba(255,255,255,0.06)", borderRadius: 8 }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["Refer a Patient", "Sent", "Received"].map(label => (
          <div key={label} style={{ height: 40, width: 120, background: "rgba(255,255,255,0.06)", borderRadius: 12 }} />
        ))}
      </div>
      <div style={{ ...cardStyle, height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 24, height: 24, color: "#D66829", animation: "spin 1s linear infinite" }} />
      </div>
    </div>
  );
}

export default function ReferralNetworkPage() {
  return (
    <UpgradeGate feature="Referral Network" requiredTier="pro" description="Refer patients to other NeuroChiro doctors and receive referrals from the network.">
      <Suspense fallback={<ReferralNetworkSkeleton />}>
        <ReferralNetworkContent />
      </Suspense>
    </UpgradeGate>
  );
}

function ReferralNetworkContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "refer";
  const [activeTab, setActiveTab] = useState<"refer" | "sent" | "received">(
    initialTab === "sent" ? "sent" : initialTab === "received" ? "received" : "refer"
  );

  // Referrals data
  const [sent, setSent] = useState<ReferralRecord[]>([]);
  const [received, setReceived] = useState<ReferralRecord[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  const loadReferrals = useCallback(async () => {
    setLoadingReferrals(true);
    const result = await getMyReferrals();
    if (result) {
      setSent(result.sent);
      setReceived(result.received);
    }
    setLoadingReferrals(false);
  }, []);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  const pendingCount = received.filter((r) => r.status === "pending").length;

  const tabs: { key: "refer" | "sent" | "received"; label: string; badge?: number }[] = [
    { key: "refer", label: "Refer a Patient" },
    { key: "sent", label: "Sent" },
    { key: "received", label: "Received", badge: pendingCount || undefined },
  ];

  return (
    <div style={{ padding: "16px", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Send style={{ width: 24, height: 24, color: "#D66829" }} />
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0 }}>Referral Network</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              background: activeTab === tab.key ? "rgba(214,104,41,0.15)" : "transparent",
              color: activeTab === tab.key ? "#D66829" : "rgba(255,255,255,0.5)",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {tab.label}
            {tab.badge ? (
              <span style={{
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: "#D66829",
                color: "#fff",
                fontSize: 11,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 5px",
              }}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "refer" && <ReferTab onReferralSent={loadReferrals} />}
      {activeTab === "sent" && <SentTab referrals={sent} loading={loadingReferrals} />}
      {activeTab === "received" && <ReceivedTab referrals={received} loading={loadingReferrals} onAction={loadReferrals} />}
    </div>
  );
}

// ── Tab 1: Refer a Patient ───────────────────────────────────────────────────

function ReferTab({ onReferralSent }: { onReferralSent: () => void }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("US");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ReferralDoctorResult[] | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);
  const [searchLabel, setSearchLabel] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<ReferralDoctorResult | null>(null);
  const [gapLogged, setGapLogged] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults(null);
    setNoResults(false);
    setGapLogged(false);
    setSelectedDoctor(null);

    const res = await searchDoctorsForReferral(query.trim(), country);
    setResults(res.doctors);
    setNoResults(res.noResults);
    setGeocodeFailed(res.geocodeFailed);
    setSearchLabel(res.searchLabel);
    setSearching(false);
  };

  const handleNotifyGap = async () => {
    await logReferralGap(query, "", country);
    setGapLogged(true);
  };

  return (
    <div>
      {/* Search bar */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Enter ZIP code or city..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              style={inputStyle}
            />
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={{ ...inputStyle, width: 70, padding: "12px 8px", textAlign: "center" }}
          >
            <option value="US">US</option>
            <option value="CA">CA</option>
            <option value="GB">UK</option>
            <option value="AU">AU</option>
            <option value="NZ">NZ</option>
          </select>
        </div>
        <button onClick={doSearch} disabled={searching || !query.trim()} style={{ ...btnPrimary, width: "100%", opacity: searching ? 0.6 : 1 }}>
          {searching ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Searching...
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Search style={{ width: 16, height: 16 }} /> Search Doctors
            </span>
          )}
        </button>
      </div>

      {/* Search label */}
      {searchLabel && (
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{searchLabel}</p>
      )}

      {/* No results */}
      {noResults && !searching && geocodeFailed && (
        <div style={{ ...cardStyle, textAlign: "center", padding: 32 }}>
          <AlertTriangle style={{ width: 32, height: 32, color: "#f59e0b", margin: "0 auto 12px" }} />
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Location Not Found</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            We couldn&apos;t find that postcode or city. Try searching by city name instead (e.g. &quot;Austin&quot; or &quot;London&quot;).
          </p>
        </div>
      )}
      {noResults && !searching && !geocodeFailed && (
        <div style={{ ...cardStyle, textAlign: "center", padding: 32 }}>
          <AlertTriangle style={{ width: 32, height: 32, color: "#f59e0b", margin: "0 auto 12px" }} />
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No Member in That Area</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>
            We don&apos;t have a NeuroChiro member near that location yet.
          </p>
          {!gapLogged ? (
            <button onClick={handleNotifyGap} style={btnPrimary}>
              Notify Dr. Ray
            </button>
          ) : (
            <p style={{ color: "#10b981", fontSize: 13, fontWeight: 700 }}>
              <CheckCircle style={{ width: 14, height: 14, display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              Dr. Ray has been notified. We&apos;ll work on finding coverage there.
            </p>
          )}
        </div>
      )}

      {/* Results list */}
      {results && results.length > 0 && !selectedDoctor && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {results.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoctor(doc)}
              style={{
                ...cardStyle,
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <DoctorAvatar photoUrl={doc.photo_url} firstName={doc.first_name} lastName={doc.last_name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0 }}>
                  Dr. {doc.first_name} {doc.last_name}
                </p>
                {doc.clinic_name && (
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "2px 0 0" }}>{doc.clinic_name}</p>
                )}
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin style={{ width: 11, height: 11 }} />
                  {doc.city}{doc.state ? `, ${doc.state}` : ""} &middot; {formatDistance(doc.distance_miles)}
                </p>
              </div>
              <ChevronRight style={{ width: 18, height: 18, color: "rgba(255,255,255,0.3)" }} />
            </button>
          ))}
        </div>
      )}

      {/* Referral form */}
      {selectedDoctor && (
        <ReferralForm
          doctor={selectedDoctor}
          onCancel={() => setSelectedDoctor(null)}
          onSuccess={() => {
            setSelectedDoctor(null);
            setResults(null);
            setQuery("");
            setSearchLabel("");
            onReferralSent();
          }}
        />
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Referral form ────────────────────────────────────────────────────────────

function ReferralForm({
  doctor,
  onCancel,
  onSuccess,
}: {
  doctor: ReferralDoctorResult;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent">("routine");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!firstName.trim() || !lastInitial.trim() || !phone.trim() || !reason.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!consent) {
      setError("You must confirm patient consent.");
      return;
    }
    setSubmitting(true);

    const data: ReferralSubmission = {
      receivingDoctorId: doctor.id,
      patientFirstName: firstName.trim(),
      patientLastInitial: lastInitial.trim(),
      patientPhone: phone.trim(),
      patientEmail: email.trim() || undefined,
      patientCity: city.trim() || undefined,
      patientZip: zip.trim() || undefined,
      reason: reason.trim(),
      urgency,
      consentConfirmed: true,
    };

    const result = await submitReferral(data);
    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(onSuccess, 1500);
    } else {
      setError(result.error || "Something went wrong.");
    }
  };

  if (success) {
    return (
      <div style={{ ...cardStyle, textAlign: "center", padding: 40 }}>
        <CheckCircle style={{ width: 40, height: 40, color: "#10b981", margin: "0 auto 12px" }} />
        <p style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>Referral Sent</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          Dr. {doctor.first_name} {doctor.last_name} has been notified.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {/* Recipient header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <DoctorAvatar photoUrl={doctor.photo_url} firstName={doctor.first_name} lastName={doctor.last_name} size={40} />
        <div style={{ flex: 1 }}>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>
            Referring to Dr. {doctor.first_name} {doctor.last_name}
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>
            {doctor.city}{doctor.state ? `, ${doctor.state}` : ""} &middot; {formatDistance(doctor.distance_miles)}
          </p>
        </div>
        <button onClick={onCancel} style={{ ...btnSecondary, fontSize: 12, padding: "6px 14px" }}>Change</button>
      </div>

      {/* Form fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 3 }}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>
              Patient First Name *
            </label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} placeholder="Jane" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>
              Last Initial *
            </label>
            <input type="text" value={lastInitial} onChange={(e) => setLastInitial(e.target.value.slice(0, 1))} maxLength={1} style={{ ...inputStyle, textAlign: "center" }} placeholder="S" />
          </div>
        </div>

        <div>
          <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>
            Patient Phone *
          </label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="(555) 123-4567" />
        </div>

        <div>
          <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>
            Patient Email (optional)
          </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="jane@example.com" />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>
              Patient City (optional)
            </label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} placeholder="Austin" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>
              Patient ZIP (optional)
            </label>
            <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} style={inputStyle} placeholder="78701" />
          </div>
        </div>

        <div>
          <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>
            Reason for Referral *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Patient is relocating to Austin, needs ongoing neurological-based care for cervical instability..."
          />
        </div>

        {/* Urgency toggle */}
        <div>
          <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
            Urgency
          </label>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
            {(["routine", "urgent"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUrgency(u)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "capitalize",
                  background: urgency === u
                    ? u === "urgent" ? "rgba(239,68,68,0.15)" : "rgba(214,104,41,0.15)"
                    : "transparent",
                  color: urgency === u
                    ? u === "urgent" ? "#ef4444" : "#D66829"
                    : "rgba(255,255,255,0.4)",
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Consent checkbox */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 0" }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{ marginTop: 2, accentColor: "#D66829", width: 18, height: 18, flexShrink: 0 }}
          />
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.5 }}>
            I have this patient&apos;s permission to share their contact information with this doctor.
          </span>
        </label>

        {error && (
          <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, margin: 0 }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ ...btnPrimary, width: "100%", padding: "14px 24px", opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Sending Referral..." : "Send Referral"}
        </button>
      </div>
    </div>
  );
}

// ── Tab 2: Sent ──────────────────────────────────────────────────────────────

function SentTab({ referrals, loading }: { referrals: ReferralRecord[]; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Loader2 style={{ width: 24, height: 24, color: "rgba(255,255,255,0.3)", animation: "spin 1s linear infinite", margin: "0 auto" }} />
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: "center", padding: 40 }}>
        <Send style={{ width: 32, height: 32, color: "rgba(255,255,255,0.2)", margin: "0 auto 12px" }} />
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>No referrals sent yet.</p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Search for a doctor to send your first referral.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {referrals.map((r) => (
        <div key={r.id} style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <User style={{ width: 18, height: 18, color: "rgba(255,255,255,0.3)" }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>
                {r.patient_first_name} {r.patient_last_initial}. &rarr; {r.other_doctor_name}
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>
                {r.other_doctor_clinic || ""}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <UrgencyBadge urgency={r.urgency} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
              <Clock style={{ width: 11, height: 11, display: "inline", verticalAlign: "middle", marginRight: 3 }} />
              {timeAgo(r.created_at)}
            </span>
            {r.status === "declined" && r.decline_reason && (
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontStyle: "italic" }}>
                &mdash; {r.decline_reason}
              </span>
            )}
          </div>
        </div>
      ))}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Tab 3: Received ──────────────────────────────────────────────────────────

function ReceivedTab({
  referrals,
  loading,
  onAction,
}: {
  referrals: ReferralRecord[];
  loading: boolean;
  onAction: () => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    await respondToReferral(id, "accept");
    setActionLoading(null);
    onAction();
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    await respondToReferral(id, "decline", declineReason || undefined);
    setActionLoading(null);
    setDeclineId(null);
    setDeclineReason("");
    onAction();
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Loader2 style={{ width: 24, height: 24, color: "rgba(255,255,255,0.3)", animation: "spin 1s linear infinite", margin: "0 auto" }} />
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: "center", padding: 40 }}>
        <Send style={{ width: 32, height: 32, color: "rgba(255,255,255,0.2)", margin: "0 auto 12px", transform: "scaleX(-1)" }} />
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>No referrals received yet.</p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>When another doctor refers a patient to you, it will appear here.</p>
      </div>
    );
  }

  // Sort: pending first, then by date
  const sorted = [...referrals].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sorted.map((r) => (
        <div key={r.id} style={cardStyle}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <User style={{ width: 18, height: 18, color: "rgba(255,255,255,0.3)" }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>
                {r.patient_first_name} {r.patient_last_initial}. &mdash; from {r.other_doctor_name}
              </p>
              {r.other_doctor_clinic && (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>{r.other_doctor_clinic}</p>
              )}
            </div>
            <StatusBadge status={r.status} />
          </div>

          {/* Details */}
          <div style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
            {r.patient_city && (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin style={{ width: 12, height: 12 }} /> {r.patient_city}{r.patient_zip ? ` ${r.patient_zip}` : ""}
              </p>
            )}
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "0 0 4px" }}>{r.reason}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <UrgencyBadge urgency={r.urgency} />
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                <Clock style={{ width: 11, height: 11, display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                {timeAgo(r.created_at)}
              </span>
            </div>
          </div>

          {/* Accepted: show contact info */}
          {r.status === "accepted" && (r.patient_phone || r.patient_email) && (
            <div style={{ padding: "10px 12px", background: "rgba(16,185,129,0.08)", borderRadius: 8, marginBottom: 12 }}>
              <p style={{ color: "#10b981", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>
                Patient Contact Info
              </p>
              {r.patient_phone && (
                <p style={{ color: "#fff", fontSize: 14, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                  <Phone style={{ width: 13, height: 13, color: "#10b981" }} />
                  <a href={`tel:${r.patient_phone}`} style={{ color: "#fff", textDecoration: "none" }}>{r.patient_phone}</a>
                </p>
              )}
              {r.patient_email && (
                <p style={{ color: "#fff", fontSize: 14, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Mail style={{ width: 13, height: 13, color: "#10b981" }} />
                  <a href={`mailto:${r.patient_email}`} style={{ color: "#fff", textDecoration: "none" }}>{r.patient_email}</a>
                </p>
              )}
            </div>
          )}

          {/* Pending: action buttons */}
          {r.status === "pending" && (
            <div>
              {declineId === r.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Reason for declining (optional)"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    style={inputStyle}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleDecline(r.id)}
                      disabled={actionLoading === r.id}
                      style={{ ...btnPrimary, flex: 1, background: "#ef4444", fontSize: 12, padding: "10px 16px" }}
                    >
                      {actionLoading === r.id ? "Declining..." : "Confirm Decline"}
                    </button>
                    <button
                      onClick={() => { setDeclineId(null); setDeclineReason(""); }}
                      style={{ ...btnSecondary, flex: 1, fontSize: 12 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleAccept(r.id)}
                    disabled={actionLoading === r.id}
                    style={{ ...btnPrimary, flex: 1, fontSize: 12, padding: "10px 16px" }}
                  >
                    {actionLoading === r.id ? "Accepting..." : "Accept Referral"}
                  </button>
                  <button
                    onClick={() => setDeclineId(r.id)}
                    style={{ ...btnSecondary, flex: 1, fontSize: 12, color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
