"use client";

import { useState, useEffect } from "react";
import { getModerationData, moderateDoctor } from "./actions";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ShieldCheck, X as XIcon, AlertTriangle, MapPin, Calendar, ExternalLink, Loader2 } from "lucide-react";

export default function ModerationCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await getModerationData();
    if (res.success) setData(res.data);
    setLoading(false);
  };

  const handleAction = async (doctorId: string, action: "approve" | "reject" | "flag") => {
    setModerating(doctorId);
    setActionResult(null);
    const res = await moderateDoctor(doctorId, action);
    if (res.success) {
      setActionResult({ id: doctorId, msg: action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Flagged', ok: true });
      await fetchData();
    } else {
      setActionResult({ id: doctorId, msg: res.error || 'Failed', ok: false });
    }
    setModerating(null);
  };

  if (loading && !data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
    </div>
  );

  const pending = data?.pendingDoctors || [];
  const flagged = data?.flaggedProfiles || [];
  const pendingSeminars = data?.pendingSeminars || [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto text-white space-y-6">
      <h1 className="text-2xl font-bold">Moderation</h1>

      {/* ── Doctor Applications ── */}
      <section>
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
          Doctor Applications ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
            <p className="text-sm font-bold text-green-400">No pending applications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((doc: any) => {
              const name = `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`.trim() || doc.clinic_name || 'Unknown';
              const completeness = [
                doc.bio ? 'Bio' : null,
                doc.photo_url ? 'Photo' : null,
                doc.phone ? 'Phone' : null,
                doc.address ? 'Address' : null,
                doc.hours ? 'Hours' : null,
                doc.booking_url ? 'Booking' : null,
              ].filter(Boolean);
              const missing = [
                !doc.bio ? 'bio' : null,
                !doc.photo_url ? 'photo' : null,
                !doc.phone ? 'phone' : null,
                !doc.address ? 'address' : null,
              ].filter(Boolean);
              const isActioning = moderating === doc.id;
              const result = actionResult?.id === doc.id ? actionResult : null;

              return (
                <div key={doc.id} className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{name}</p>
                      {doc.clinic_name && doc.first_name && (
                        <p className="text-xs text-white/40 truncate">{doc.clinic_name}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Link href={`/directory/${doc.slug || doc.id}`} target="_blank"
                        className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10">
                        <ExternalLink className="w-3 h-3 text-white/50" />
                      </Link>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
                    <div>
                      <span className="text-white/30">Location</span>
                      <p className="text-white/70 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[doc.city, doc.state].filter(Boolean).join(', ') || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/30">Applied</span>
                      <p className="text-white/70 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {doc.created_at ? formatDistanceToNow(new Date(doc.created_at), { addSuffix: true }) : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/30">Profile</span>
                      <p className="text-white/70">{completeness.length}/6 fields</p>
                    </div>
                    <div>
                      <span className="text-white/30">Email</span>
                      <p className="text-white/70 truncate">{doc.email || 'None'}</p>
                    </div>
                  </div>

                  {missing.length > 0 && (
                    <p className="text-[10px] text-amber-400/60 mb-3">Missing: {missing.join(', ')}</p>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAction(doc.id, 'approve')} disabled={isActioning}
                      className="px-4 py-2 bg-green-500/15 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/25 disabled:opacity-50 min-h-[36px]">
                      {isActioning ? '...' : 'Approve'}
                    </button>
                    <button onClick={() => handleAction(doc.id, 'reject')} disabled={isActioning}
                      className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 disabled:opacity-50 min-h-[36px]">
                      Reject
                    </button>
                    <button onClick={() => handleAction(doc.id, 'flag')} disabled={isActioning}
                      className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-500/20 disabled:opacity-50 min-h-[36px]">
                      Need Info
                    </button>
                    {result && (
                      <span className={`text-xs font-bold ml-2 ${result.ok ? 'text-green-400' : 'text-red-400'}`}>
                        {result.msg}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Flagged Profiles ── */}
      {flagged.length > 0 && (
        <section>
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
            Flagged Profiles ({flagged.length})
          </h2>
          <div className="space-y-2">
            {flagged.map((doc: any) => (
              <div key={doc.id} className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    Dr. {doc.first_name} {doc.last_name}
                  </p>
                  <p className="text-xs text-amber-400/80 mt-0.5">{doc.review_notes}</p>
                </div>
                <Link href={`/admin/directory?search=${encodeURIComponent(`${doc.first_name} ${doc.last_name}`)}`}
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-xs font-bold text-white/50 hover:text-white hover:bg-white/10 shrink-0">
                  Edit
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Pending Seminars ── */}
      {pendingSeminars.length > 0 && (
        <section>
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
            Seminars Pending Review ({pendingSeminars.length})
          </h2>
          <div className="space-y-2">
            {pendingSeminars.map((sem: any) => (
              <div key={sem.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{sem.title}</p>
                  <p className="text-xs text-white/40">
                    {sem.city}{sem.country ? `, ${sem.country}` : ''} — {sem.dates || 'No dates'}
                  </p>
                </div>
                <Link href="/admin/seminars" className="px-3 py-1.5 bg-white/5 rounded-lg text-xs font-bold text-white/50 hover:text-white hover:bg-white/10 shrink-0">
                  Review
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {pending.length === 0 && flagged.length === 0 && pendingSeminars.length === 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center mt-4">
          <ShieldCheck className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-green-400">All clear. Nothing to moderate.</p>
        </div>
      )}
    </div>
  );
}
