"use client";

import { useState, useEffect } from "react";
import { Users, Loader2, ArrowUpRight, ArrowDownLeft, Send, MapPin } from "lucide-react";
import Link from "next/link";
import { getReferralNetwork } from "./actions";

export default function ReferralNetworkPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReferralNetwork().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return <div className="p-10 flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  const stats = data?.stats || { totalSent: 0, totalReceived: 0, uniquePartners: 0, topPartner: null, thisMonth: 0 };
  const network = data?.network || [];

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-6 h-6 text-neuro-orange" />
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Referral Network</h1>
        </div>
        <p className="text-white/30 text-sm">Track your doctor-to-doctor referral relationships.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-5 text-center">
          <ArrowUpRight className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-white">{stats.totalSent}</p>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Sent</p>
        </div>
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-5 text-center">
          <ArrowDownLeft className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-white">{stats.totalReceived}</p>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Received</p>
        </div>
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-5 text-center">
          <Users className="w-5 h-5 text-violet-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-white">{stats.uniquePartners}</p>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Partners</p>
        </div>
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-5 text-center">
          <Send className="w-5 h-5 text-neuro-orange mx-auto mb-2" />
          <p className="text-2xl font-black text-white">{stats.thisMonth}</p>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">This Month</p>
        </div>
      </div>

      {/* Top Partner */}
      {stats.topPartner && (
        <div className="bg-gradient-to-r from-neuro-orange/5 to-white rounded-2xl border border-neuro-orange/20 p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neuro-orange font-semibold mb-1">Top Referral Partner</p>
            <p className="text-lg font-bold text-white">{stats.topPartner.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-neuro-orange">{stats.topPartner.count}</p>
            <p className="text-[10px] text-white/25">total referrals</p>
          </div>
        </div>
      )}

      {/* Network List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white/25 uppercase tracking-widest">Your Network</h2>
          <Link href="/directory" className="text-xs font-bold text-neuro-orange hover:underline flex items-center gap-1">
            Find Doctors to Refer <Send className="w-3 h-3" />
          </Link>
        </div>

        {network.length === 0 ? (
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-8 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <p className="text-white/30 text-sm mb-4">No referral connections yet. Start by referring a patient to another doctor on the platform.</p>
            <Link href="/directory" className="text-neuro-orange text-sm font-bold hover:underline">Browse the Directory &rarr;</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {network.map((doc: any, i: number) => (
              <div key={i} className="bg-[#162231] rounded-xl border border-white/[0.06] p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {doc.photoUrl ? (
                    <img src={doc.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-white font-bold">
                      {doc.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-white">{doc.name}</p>
                    {doc.clinicName && <p className="text-xs text-white/30">{doc.clinicName}</p>}
                    {doc.city && <p className="text-xs text-white/25 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{doc.city}{doc.state ? `, ${doc.state}` : ''}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-500">{doc.sent}</p>
                    <p className="text-[10px] text-white/25">sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-500">{doc.received}</p>
                    <p className="text-[10px] text-white/25">received</p>
                  </div>
                  {doc.slug && (
                    <Link href={`/directory/${doc.slug}`} className="px-3 py-1.5 bg-white/[0.04] text-white/30 text-xs font-bold rounded-lg hover:bg-neuro-orange/5 hover:text-neuro-orange transition-colors">
                      Profile
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
