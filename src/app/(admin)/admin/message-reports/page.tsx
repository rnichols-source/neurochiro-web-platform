"use client";

import { useState, useEffect } from "react";
import { Flag, CheckCircle, Loader2 } from "lucide-react";
import { getMessageReports, markReportReviewed } from "@/app/actions/messaging-actions";

interface Report {
  id: string;
  reporterName: string;
  reason: string;
  messageBody: string;
  messageSenderName: string;
  messageDate: string;
  reportDate: string;
  reviewed: boolean;
}

export default function MessageReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMessageReports().then((data) => {
      setReports(data as Report[]);
      setLoading(false);
    });
  }, []);

  const handleMarkReviewed = async (reportId: string) => {
    await markReportReviewed(reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, reviewed: true } : r));
  };

  if (loading) {
    return <div className="p-10 flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Flag className="w-6 h-6 text-red-500" />
        <h1 className="text-2xl font-bold text-white tracking-tight">Message Reports</h1>
      </div>
      <p className="text-white/30 text-sm">{reports.filter(r => !r.reviewed).length} unreviewed reports</p>

      {reports.length === 0 ? (
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-8 text-center">
          <p className="text-white/30 text-sm">No reports yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className={`bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border ${r.reviewed ? 'border-white/[0.04]' : 'border-red-500/20'} p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-white/25 uppercase tracking-wider">Reported by</span>
                    <span className="text-sm text-white font-medium">{r.reporterName}</span>
                    <span className="text-xs text-white/20">{new Date(r.reportDate).toLocaleDateString()}</span>
                  </div>
                  <div className="bg-white/[0.04] rounded-xl p-3 mb-2">
                    <p className="text-xs text-white/25 mb-1">Message from <span className="text-white/50">{r.messageSenderName}</span>:</p>
                    <p className="text-sm text-white/70 break-words">{r.messageBody}</p>
                  </div>
                  <p className="text-sm text-white/50"><span className="text-white/25 font-bold text-xs uppercase">Reason:</span> {r.reason}</p>
                </div>
                <div className="shrink-0">
                  {r.reviewed ? (
                    <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Reviewed</span>
                  ) : (
                    <button onClick={() => handleMarkReviewed(r.id)} className="px-3 py-1.5 bg-white/[0.06] text-white/50 text-xs font-bold rounded-lg hover:bg-white/[0.1] hover:text-white transition-colors">Mark Reviewed</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
