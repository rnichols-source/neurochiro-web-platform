"use client";

import { useState, useEffect } from "react";
import { Shuffle, Loader2, MapPin, DollarSign, ArrowRight, Briefcase } from "lucide-react";
import Link from "next/link";
import { getActiveCycleForStudent, getMyMatchResult } from "../actions";

export default function StudentResultsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    getActiveCycleForStudent().then(async (cycle) => {
      if (cycle && (cycle.status === 'matched' || cycle.status === 'completed')) {
        const r = await getMyMatchResult(cycle.id);
        setResult(r);
        if (!r) setNoResults(true);
      } else {
        setNoResults(true);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  if (noResults) {
    return (
      <div className="p-10 max-w-lg mx-auto text-center space-y-4">
        <Shuffle className="w-12 h-12 text-white/10 mx-auto" />
        <h1 className="text-2xl font-bold text-white">No Results Yet</h1>
        <p className="text-white/30 text-sm">Match results will appear here after Match Day.</p>
        <Link href="/student/chiromatch" className="text-neuro-orange text-sm font-bold hover:underline">&larr; Back to ChiroMatch</Link>
      </div>
    );
  }

  const isMatched = result?.status === 'matched';
  const pos = result?.position;

  return (
    <div className="p-4 md:p-10 max-w-2xl mx-auto space-y-6">
      <Link href="/student/chiromatch" className="text-xs text-white/30 hover:text-neuro-orange transition-colors">&larr; Back to ChiroMatch</Link>

      {isMatched && pos ? (
        <>
          {/* Celebration */}
          <div className="bg-gradient-to-b from-green-900/20 to-[#162231] rounded-2xl border border-green-500/20 p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shuffle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">You Matched!</h1>
            <p className="text-green-400 font-bold text-lg mb-1">{pos.title}</p>
            <p className="text-white/40">{pos.doctor.clinic_name} — Dr. {pos.doctor.first_name} {pos.doctor.last_name}</p>
          </div>

          {/* Match Details */}
          <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-6 space-y-4">
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest">Your Match</h2>
            <div className="flex items-center gap-4">
              {pos.doctor.photo_url ? (
                <img src={pos.doctor.photo_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-neuro-orange/10 flex items-center justify-center text-neuro-orange font-bold text-lg">
                  {pos.doctor.first_name?.[0]}{pos.doctor.last_name?.[0]}
                </div>
              )}
              <div>
                <p className="font-bold text-white">{pos.doctor.clinic_name}</p>
                <p className="text-white/40 text-sm">Dr. {pos.doctor.first_name} {pos.doctor.last_name}</p>
                {pos.city && <p className="text-white/30 text-xs flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{pos.city}{pos.state ? `, ${pos.state}` : ''}</p>}
              </div>
            </div>
            {pos.salary_min && (
              <p className="text-white/40 text-sm flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                ${pos.salary_min.toLocaleString()}{pos.salary_max ? ` – $${pos.salary_max.toLocaleString()}` : ''}
              </p>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-neuro-orange/5 border border-neuro-orange/20 rounded-2xl p-6">
            <h2 className="font-bold text-white mb-3">Next Steps</h2>
            <ol className="space-y-2 text-sm text-white/60">
              <li className="flex gap-2"><span className="text-neuro-orange font-bold">1.</span> The practice has been notified of your match</li>
              <li className="flex gap-2"><span className="text-neuro-orange font-bold">2.</span> Expect to hear from them within 48 hours</li>
              <li className="flex gap-2"><span className="text-neuro-orange font-bold">3.</span> Review your contract terms in the <Link href="/student/contract-lab" className="text-neuro-orange hover:underline">Contract Lab</Link></li>
              <li className="flex gap-2"><span className="text-neuro-orange font-bold">4.</span> Plan your finances with the <Link href="/student/financial-planner" className="text-neuro-orange hover:underline">Financial Planner</Link></li>
            </ol>
          </div>
        </>
      ) : (
        <>
          {/* Unmatched */}
          <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-8 text-center">
            <Shuffle className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Not Matched This Cycle</h1>
            <p className="text-white/30 text-sm mb-6">
              Don&apos;t worry — the next ChiroMatch cycle opens soon. In the meantime, great opportunities are available on the Jobs board.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/student/jobs" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                <Briefcase className="w-4 h-4" /> Browse Jobs
              </Link>
              <Link href="/student/chiromatch" className="px-6 py-3 bg-white/[0.06] text-white/60 font-bold rounded-xl text-sm">
                Back to ChiroMatch
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
