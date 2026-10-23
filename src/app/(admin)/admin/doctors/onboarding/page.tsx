"use client";

import { useState, useEffect } from "react";
import {
  getOnboardingDoctors,
  updateOnboardingStatus,
  markAgreementSigned,
  triggerOnboardingEmail,
  type OnboardingDoctorRow,
  type OnboardingStatus,
  type EmailType,
} from "./actions";
import {
  Loader2,
  Search,
  ChevronDown,
  Mail,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";

// ── Status badge config ──

const STATUS_CONFIG: Record<
  OnboardingStatus,
  { label: string; color: string }
> = {
  not_started: { label: "Not Started", color: "bg-white/[0.06] text-white/40" },
  paid: { label: "Paid", color: "bg-amber-500/15 text-amber-400" },
  profile_live: { label: "Profile Live", color: "bg-orange-500/15 text-orange-400" },
  call_booked: { label: "Call Booked", color: "bg-blue-500/15 text-blue-400" },
  call_done: { label: "Call Done", color: "bg-emerald-500/15 text-emerald-400" },
  complete: { label: "Complete", color: "bg-green-500/15 text-green-400" },
};

// ── Actions menu items ──

interface ActionItem {
  label: string;
  type: "email" | "status" | "mark";
  emailType?: EmailType;
  status?: OnboardingStatus;
  field?: string;
}

const ACTIONS: ActionItem[] = [
  { label: "Send Email 1 (Payment Received)", type: "email", emailType: "payment_received" },
  { label: "Send Email 1B (Join Packet)", type: "email", emailType: "join_packet" },
  { label: "Send Email 2 (Profile Live)", type: "email", emailType: "profile_live" },
  { label: "Send Email 3 (Post Call)", type: "email", emailType: "post_call" },
  { label: "Send Nudge: Agreement", type: "email", emailType: "nudge_agreement" },
  { label: "Send Nudge: Call", type: "email", emailType: "nudge_call" },
  { label: "---", type: "status" }, // divider
  { label: "Mark Agreement Signed", type: "mark", field: "agreement" },
  { label: "Set Status: Paid", type: "status", status: "paid" },
  { label: "Set Status: Profile Live", type: "status", status: "profile_live" },
  { label: "Set Status: Call Booked", type: "status", status: "call_booked" },
  { label: "Set Status: Call Done", type: "status", status: "call_done" },
  { label: "Set Status: Complete", type: "status", status: "complete" },
];

// ── Helpers ──

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function daysSinceLastStep(doc: OnboardingDoctorRow): number {
  // Find the most recent timestamp across all onboarding steps
  const dates = [
    doc.onboarding_completed_at,
    doc.onboarding_call_done_at,
    doc.onboarding_call_booked_at,
    doc.profile_built_at,
    doc.agreement_signed_at,
    doc.last_onboarding_email_sent_at,
    doc.created_at,
  ].filter(Boolean) as string[];

  if (dates.length === 0) return 0;

  const latest = dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
  return daysSince(latest) ?? 0;
}

// ── Component ──

export default function OnboardingAdminPage() {
  const [doctors, setDoctors] = useState<OnboardingDoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OnboardingStatus | "all">("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await getOnboardingDoctors();
      setDoctors(data);
    } catch (e) {
      console.error("Failed to fetch onboarding doctors:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleAction = async (doctorId: string, action: ActionItem) => {
    setProcessing(doctorId);
    setOpenMenu(null);

    try {
      if (action.type === "email" && action.emailType) {
        const result = await triggerOnboardingEmail(doctorId, action.emailType);
        if (result.success) {
          showToast(`Sent: ${action.label}`, "success");
        } else {
          showToast(`Failed: ${result.error}`, "error");
        }
      } else if (action.type === "status" && action.status) {
        const result = await updateOnboardingStatus(doctorId, action.status);
        if (result.success) {
          showToast(`Status updated to ${action.status}`, "success");
        } else {
          showToast(`Failed: ${result.error}`, "error");
        }
      } else if (action.type === "mark" && action.field === "agreement") {
        const result = await markAgreementSigned(doctorId);
        if (result.success) {
          showToast("Agreement marked as signed", "success");
        } else {
          showToast(`Failed: ${result.error}`, "error");
        }
      }
    } catch (err: any) {
      showToast(`Error: ${err.message || "Unknown error"}`, "error");
    }

    await fetchDoctors();
    setProcessing(null);
  };

  // Filter and sort
  const filtered = doctors
    .filter((d) => {
      const name = `${d.first_name} ${d.last_name}`.toLowerCase();
      const matchesSearch =
        !search ||
        name.includes(search.toLowerCase()) ||
        (d.city || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.email || "").toLowerCase().includes(search.toLowerCase());
      if (filter === "all") return matchesSearch;
      return matchesSearch && d.onboarding_status === filter;
    })
    .sort((a, b) => daysSinceLastStep(b) - daysSinceLastStep(a));

  // Stats
  const statCounts: Record<string, number> = { all: doctors.length };
  for (const d of doctors) {
    statCounts[d.onboarding_status] = (statCounts[d.onboarding_status] || 0) + 1;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0B1118", color: "#FFFFFF", padding: "32px" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: "12px 24px",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            backgroundColor: toast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            color: toast.type === "success" ? "#22C55E" : "#EF4444",
            border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Member Onboarding</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "4px 0 0" }}>
              Track and manage new member onboarding progress
            </p>
          </div>
          <button
            onClick={fetchDoctors}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          {(["all", "not_started", "paid", "profile_live", "call_booked", "call_done"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "16px",
                borderRadius: 12,
                border: filter === key ? "1px solid rgba(214,104,41,0.5)" : "1px solid rgba(255,255,255,0.06)",
                backgroundColor: filter === key ? "rgba(214,104,41,0.1)" : "rgba(255,255,255,0.03)",
                color: "#FFFFFF",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 900 }}>{statCounts[key] || 0}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>
                {key === "all" ? "Total" : STATUS_CONFIG[key]?.label || key}
              </div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: "rgba(255,255,255,0.3)" }} />
          <input
            type="text"
            placeholder="Search by name, city, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 12px 12px 40px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "#FFFFFF",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 size={24} style={{ color: "#D66829", animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  {["Name", "City", "Status", "Paid", "Agreement", "Profile Built", "Call Booked", "Days Stale", "Last Email", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: 700,
                          fontSize: 11,
                          color: "rgba(255,255,255,0.4)",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                      No doctors in onboarding pipeline
                    </td>
                  </tr>
                )}
                {filtered.map((doc) => {
                  const stale = daysSinceLastStep(doc);
                  const statusCfg = STATUS_CONFIG[doc.onboarding_status] || STATUS_CONFIG.not_started;
                  const isPaid = doc.membership_tier === "pro";

                  return (
                    <tr
                      key={doc.id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        backgroundColor: processing === doc.id ? "rgba(214,104,41,0.05)" : "transparent",
                      }}
                    >
                      {/* Name */}
                      <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                        Dr. {doc.first_name} {doc.last_name}
                        {doc.email && (
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 400, marginTop: 2 }}>
                            {doc.email}
                          </div>
                        )}
                      </td>

                      {/* City */}
                      <td style={{ padding: "14px 16px", color: "rgba(255,255,255,0.6)" }}>
                        {[doc.city, doc.state].filter(Boolean).join(", ") || "\u2014"}
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                          className={statusCfg.color}
                        >
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Paid */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        {isPaid ? (
                          <CheckCircle2 size={16} style={{ color: "#22C55E" }} />
                        ) : (
                          <Clock size={16} style={{ color: "rgba(255,255,255,0.2)" }} />
                        )}
                      </td>

                      {/* Agreement */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        {doc.agreement_signed_at ? (
                          <CheckCircle2 size={16} style={{ color: "#22C55E" }} />
                        ) : (
                          <Clock size={16} style={{ color: "rgba(255,255,255,0.2)" }} />
                        )}
                      </td>

                      {/* Profile Built */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        {doc.profile_built_at ? (
                          <CheckCircle2 size={16} style={{ color: "#22C55E" }} />
                        ) : (
                          <Clock size={16} style={{ color: "rgba(255,255,255,0.2)" }} />
                        )}
                      </td>

                      {/* Call Booked */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        {doc.onboarding_call_booked_at ? (
                          <CheckCircle2 size={16} style={{ color: "#22C55E" }} />
                        ) : (
                          <Clock size={16} style={{ color: "rgba(255,255,255,0.2)" }} />
                        )}
                      </td>

                      {/* Days Stale */}
                      <td
                        style={{
                          padding: "14px 16px",
                          textAlign: "center",
                          fontWeight: 700,
                          color: stale >= 7 ? "#EF4444" : stale >= 3 ? "#F59E0B" : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {stale}d
                      </td>

                      {/* Last Email */}
                      <td style={{ padding: "14px 16px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        {doc.last_onboarding_email_type ? (
                          <div>
                            <div style={{ fontWeight: 700 }}>{doc.last_onboarding_email_type.replace(/_/g, " ")}</div>
                            {doc.last_onboarding_email_sent_at && (
                              <div>{daysSince(doc.last_onboarding_email_sent_at)}d ago</div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.15)" }}>{"\u2014"}</span>
                        )}
                      </td>

                      {/* Actions dropdown */}
                      <td style={{ padding: "14px 16px", position: "relative" }}>
                        {processing === doc.id ? (
                          <Loader2 size={16} style={{ color: "#D66829", animation: "spin 1s linear infinite" }} />
                        ) : (
                          <div style={{ position: "relative" }}>
                            <button
                              onClick={() => setOpenMenu(openMenu === doc.id ? null : doc.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 14px",
                                borderRadius: 8,
                                border: "1px solid rgba(255,255,255,0.1)",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                color: "#FFFFFF",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Actions <ChevronDown size={12} />
                            </button>

                            {openMenu === doc.id && (
                              <div
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: "100%",
                                  marginTop: 4,
                                  width: 260,
                                  backgroundColor: "#1A2332",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  borderRadius: 12,
                                  boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                                  zIndex: 50,
                                  overflow: "hidden",
                                }}
                              >
                                {ACTIONS.map((action, i) => {
                                  if (action.label === "---") {
                                    return (
                                      <div
                                        key={i}
                                        style={{
                                          height: 1,
                                          backgroundColor: "rgba(255,255,255,0.06)",
                                          margin: "4px 0",
                                        }}
                                      />
                                    );
                                  }
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => handleAction(doc.id, action)}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        width: "100%",
                                        padding: "10px 16px",
                                        border: "none",
                                        backgroundColor: "transparent",
                                        color: action.type === "email" ? "#D66829" : "rgba(255,255,255,0.7)",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        textAlign: "left",
                                      }}
                                      onMouseEnter={(e) => {
                                        (e.target as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)";
                                      }}
                                      onMouseLeave={(e) => {
                                        (e.target as HTMLElement).style.backgroundColor = "transparent";
                                      }}
                                    >
                                      {action.type === "email" ? <Mail size={13} /> : <CheckCircle2 size={13} />}
                                      {action.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Close menu on outside click */}
      {openMenu && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onClick={() => setOpenMenu(null)}
        />
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
