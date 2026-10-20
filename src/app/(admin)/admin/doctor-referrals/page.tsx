"use client";

import { useState, useEffect } from "react";
import { Send, AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface ReferralRow {
  id: string;
  patient_first_name: string;
  patient_last_initial: string;
  reason: string;
  urgency: string;
  status: string;
  decline_reason: string | null;
  created_at: string;
  responded_at: string | null;
  referring_doctor: { first_name: string; last_name: string; clinic_name: string | null } | null;
  receiving_doctor: { first_name: string; last_name: string; clinic_name: string | null } | null;
}

interface DoctorDeclineStats {
  name: string;
  declinedOrIgnored: number;
}

export default function AdminDoctorReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [flaggedDoctors, setFlaggedDoctors] = useState<DoctorDeclineStats[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/referral-stats");
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.referrals || []);
        setFlaggedDoctors(data.flaggedDoctors || []);
      }
    } catch {
      // fail silently
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const counts = {
    total: referrals.length,
    pending: referrals.filter((r) => r.status === "pending").length,
    accepted: referrals.filter((r) => r.status === "accepted").length,
    declined: referrals.filter((r) => r.status === "declined").length,
    expired: referrals.filter((r) => r.status === "expired").length,
  };

  const statCards = [
    { label: "Total", value: counts.total, color: "#fff" },
    { label: "Pending", value: counts.pending, color: "#f59e0b" },
    { label: "Accepted", value: counts.accepted, color: "#10b981" },
    { label: "Declined", value: counts.declined, color: "#ef4444" },
    { label: "Expired", value: counts.expired, color: "#6b7280" },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Send style={{ width: 24, height: 24, color: "#D66829" }} />
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0 }}>Doctor Referrals</h1>
        <button onClick={load} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
          <RefreshCw style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {statCards.map((s) => (
          <div key={s.label} style={{
            background: "linear-gradient(to bottom, #1a2e40, #162231)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 16,
            textAlign: "center",
          }}>
            <p style={{ color: s.color, fontSize: 28, fontWeight: 900, margin: 0 }}>{s.value}</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "4px 0 0" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Flagged doctors */}
      {flaggedDoctors.length > 0 && (
        <div style={{
          background: "rgba(239,68,68,0.08)",
          borderRadius: 12,
          border: "1px solid rgba(239,68,68,0.2)",
          padding: 16,
          marginBottom: 24,
        }}>
          <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 800, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle style={{ width: 14, height: 14 }} /> Doctors with 3+ Declined/Ignored Referrals
          </p>
          {flaggedDoctors.map((d) => (
            <p key={d.name} style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: "4px 0" }}>
              {d.name} &mdash; {d.declinedOrIgnored} declined/expired
            </p>
          ))}
        </div>
      )}

      {/* Referrals table */}
      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 40 }}>Loading...</p>
      ) : referrals.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 40 }}>No referrals yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                {["Referring Doctor", "Receiving Doctor", "Patient", "Status", "Urgency", "Created", "Responded"].map((h) => (
                  <th key={h} style={{ padding: "10px 8px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => {
                const statusColors: Record<string, string> = {
                  pending: "#f59e0b",
                  accepted: "#10b981",
                  declined: "#ef4444",
                  expired: "#6b7280",
                };
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "10px 8px", color: "#fff" }}>
                      Dr. {r.referring_doctor?.first_name} {r.referring_doctor?.last_name}
                    </td>
                    <td style={{ padding: "10px 8px", color: "#fff" }}>
                      Dr. {r.receiving_doctor?.first_name} {r.receiving_doctor?.last_name}
                    </td>
                    <td style={{ padding: "10px 8px", color: "rgba(255,255,255,0.7)" }}>
                      {r.patient_first_name} {r.patient_last_initial}.
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        color: statusColors[r.status] || "#6b7280",
                        background: `${statusColors[r.status] || "#6b7280"}20`,
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", color: r.urgency === "urgent" ? "#ef4444" : "rgba(255,255,255,0.4)", fontWeight: r.urgency === "urgent" ? 700 : 400 }}>
                      {r.urgency}
                    </td>
                    <td style={{ padding: "10px 8px", color: "rgba(255,255,255,0.4)" }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 8px", color: "rgba(255,255,255,0.4)" }}>
                      {r.responded_at ? new Date(r.responded_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
