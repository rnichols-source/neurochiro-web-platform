"use client";

import { useState, useEffect } from "react";
import { Award, Loader2, Calendar, MapPin, Download, BookOpen } from "lucide-react";
import Link from "next/link";
import { getCEHistory } from "./actions";
import UpgradeGate from "@/components/doctor/UpgradeGate";

export default function CETrackerPage() {
  return (
    <UpgradeGate feature="CE Tracker" requiredTier="growth" description="Track your continuing education credits — logged, verified, and exportable for license renewal.">
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

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-6 h-6 text-neuro-orange" />
          <h1 className="text-3xl font-bold text-white tracking-tight">CE Tracker</h1>
        </div>
        <p className="text-white/30 text-sm">Your continuing education credits — tracked, verified, certified.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6 text-center">
          <p className="text-4xl font-bold text-white">{data?.totalHours || 0}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mt-1">Total CE Hours</p>
        </div>
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6 text-center">
          <p className="text-4xl font-bold text-neuro-orange">{data?.thisYearHours || 0}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mt-1">This Year</p>
        </div>
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6 text-center">
          <p className="text-4xl font-bold text-white">{data?.certificates?.length || 0}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mt-1">Certificates</p>
        </div>
      </div>

      {/* Certificate List */}
      <div>
        <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Your Certificates</h2>
        {!data?.certificates || data.certificates.length === 0 ? (
          <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-8 text-center">
            <BookOpen className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm mb-4">No CE certificates yet. Attend seminars and check in to earn credits.</p>
            <Link href="/seminars" className="text-neuro-orange text-sm font-bold hover:underline">Browse Seminars &rarr;</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.certificates.map((cert: any) => (
              <div key={cert.id} className="bg-[#162231] rounded-xl border border-white/[0.06] p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{cert.seminar_title}</p>
                    <div className="flex items-center gap-3 text-xs text-white/30 mt-0.5">
                      {cert.seminar_dates && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{cert.seminar_dates}</span>}
                      {cert.seminar_city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cert.seminar_city}</span>}
                    </div>
                    <p className="text-[10px] text-white/20 mt-1">Certificate: {cert.certificate_number}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-blue-400">{cert.ce_hours} hrs</p>
                  <p className="text-[10px] text-white/20">{new Date(cert.issued_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
