"use client";

import { useState, useEffect } from "react";
import { Award, Loader2, Calendar, MapPin } from "lucide-react";
import { getCEHistory } from "./actions";
import UpgradeGate from "@/components/doctor/UpgradeGate";
import PageHeader from "@/components/portal/PageHeader";
import EmptyState from "@/components/portal/EmptyState";

function dedupeCertificates(certificates: any[]) {
  const seen = new Set<string>();
  const unique = [];
  for (const cert of certificates || []) {
    const key = cert.registration_id
      ? `registration:${cert.registration_id}`
      : `seminar:${cert.seminar_id || ""}:${cert.user_id || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(cert);
  }
  return unique;
}

export default function CETrackerPage() {
  return (
    <UpgradeGate feature="CE Tracker" requiredTier="pro" description="Track your continuing education credits — logged, verified, and exportable for license renewal.">
      <CETrackerContent />
    </UpgradeGate>
  );
}

function CETrackerContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCEHistory().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  const certificates = dedupeCertificates(data?.certificates || []);
  const totalHours = certificates.reduce((sum, cert) => sum + (Number(cert.ce_hours) || 0), 0);
  const thisYear = new Date().getFullYear();
  const thisYearHours = certificates
    .filter((cert) => new Date(cert.issued_at).getFullYear() === thisYear)
    .reduce((sum, cert) => sum + (Number(cert.ce_hours) || 0), 0);

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-8">
      <PageHeader title="CE tracker" description="Credits from seminars you checked in for." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-portal-border p-6 text-center">
          <p className="text-4xl font-bold text-portal-ink">{totalHours}</p>
          <p className="text-sm text-portal-ink-2 mt-1">Total CE hours</p>
        </div>
        <div className="bg-white rounded-xl border border-portal-border p-6 text-center">
          <p className="text-4xl font-bold text-portal-ink">{thisYearHours}</p>
          <p className="text-sm text-portal-ink-2 mt-1">This year</p>
        </div>
        <div className="bg-white rounded-xl border border-portal-border p-6 text-center">
          <p className="text-4xl font-bold text-portal-ink">{certificates.length}</p>
          <p className="text-sm text-portal-ink-2 mt-1">Certificates</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-portal-ink mb-4">Your certificates</h2>
        {certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates yet"
            sentence="Attend a seminar and check in to earn credits."
            action={{ label: "Browse seminars", href: "/seminars" }}
          />
        ) : (
          <div className="space-y-3">
            {certificates.map((cert: any) => (
              <div key={cert.id} className="bg-white rounded-xl border border-portal-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-portal-canvas rounded-xl flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-portal-accent" />
                  </div>
                  <div>
                    <p className="font-bold text-portal-ink text-sm">{cert.seminar_title}</p>
                    <div className="flex items-center gap-3 text-sm text-portal-ink-2 mt-0.5">
                      {cert.seminar_dates && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{cert.seminar_dates}</span>}
                      {cert.seminar_city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cert.seminar_city}</span>}
                    </div>
                    <p className="text-sm text-portal-muted mt-1">Certificate: {cert.certificate_number}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-portal-ink">{cert.ce_hours} hrs</p>
                  <p className="text-sm text-portal-muted">{new Date(cert.issued_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
