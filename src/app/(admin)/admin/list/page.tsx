"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSubscriberStats, exportSubscribersCSV, getDoctorsForNotification, notifySubscribersNewDoctor, previewDoctorNotification, type NotifyRadius } from "./actions";
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Download,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Mail,
} from "lucide-react";

export default function AdminListPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getSubscriberStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const handleExport = async () => {
    setExporting(true);
    const csv = await exportSubscribersCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurochiro-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-neuro-orange animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-neuro-orange" />
            Patient Email List
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Subscribers from neurochiro.co/list
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/list/broadcast"
            className="px-4 py-2 bg-neuro-orange text-white text-sm font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4" /> Compose Broadcast
          </Link>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/15 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<Users className="w-5 h-5" />}
          color="text-white"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          icon={<CheckCircle className="w-5 h-5" />}
          color="text-green-400"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<Clock className="w-5 h-5" />}
          color="text-amber-400"
        />
        <StatCard
          label="Unsubscribed"
          value={stats.unsubscribed}
          icon={<XCircle className="w-5 h-5" />}
          color="text-red-400"
        />
      </div>

      {/* Growth Chart (simple bar) */}
      {stats.growthByWeek.length > 0 && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-neuro-orange" />
            Growth (Last 12 Weeks)
          </h2>
          <div className="flex items-end gap-2 h-24">
            {stats.growthByWeek.map((w: any, i: number) => {
              const max = Math.max(...stats.growthByWeek.map((x: any) => x.count), 1);
              const height = Math.max((w.count / max) * 100, 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{w.count}</span>
                  <div
                    className="w-full bg-neuro-orange/60 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* By State */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-neuro-orange" />
            Confirmed by State
          </h2>
          {stats.byState.length === 0 ? (
            <p className="text-gray-500 text-sm">No confirmed subscribers yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.byState.map((s: any) => (
                <div key={s.state} className="flex items-center justify-between">
                  <span className="text-sm text-white/70">{s.state}</span>
                  <span className="text-sm font-bold text-white">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By ZIP Prefix — Recruiting Targets */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Top ZIP Prefixes (Recruiting Targets)
          </h2>
          <p className="text-gray-500 text-xs mb-3">
            ZIP prefixes with subscribers but no nearby doctor are highlighted.
          </p>
          {stats.byZipPrefix.length === 0 ? (
            <p className="text-gray-500 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.byZipPrefix.map((z: any) => (
                <div
                  key={z.prefix}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    !z.hasDoctors
                      ? "bg-amber-500/10 border border-amber-500/20"
                      : "bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-white/70">{z.prefix}xx</span>
                    <span className="text-xs text-gray-500">{z.state || ""}</span>
                    {!z.hasDoctors && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                        NO DOCTOR
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-white">{z.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Signups */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-bold text-white">Recent Signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-gray-400 text-left">
                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider">ZIP</th>
                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider">State</th>
                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider">Signed Up</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSignups.map((s: any) => (
                <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white/80">{s.email}</td>
                  <td className="px-5 py-3 text-white/60 font-mono">{s.zip}</td>
                  <td className="px-5 py-3 text-white/60">{s.state || "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        s.status === "confirmed"
                          ? "bg-green-500/15 text-green-400"
                          : s.status === "pending"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs">
                    {new Date(s.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctor-Joined Trigger */}
      <DoctorJoinedTrigger />
    </div>
  );
}

function DoctorJoinedTrigger() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [radius, setRadius] = useState<NotifyRadius>("zip_prefix");
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadDoctors = async () => {
    const data = await getDoctorsForNotification();
    setDoctors(data);
    setLoaded(true);
  };

  const handlePreview = async () => {
    if (!selectedId) return;
    setPreviewLoading(true);
    setPreview(null);
    setResult(null);
    const data = await previewDoctorNotification(selectedId, radius);
    setPreview(data);
    setPreviewLoading(false);
  };

  const handleSend = async () => {
    if (!selectedId || !preview) return;
    setSending(true);
    setResult(null);
    const res = await notifySubscribersNewDoctor(selectedId, radius);
    setSending(false);
    setPreview(null);
    if (res.ok) {
      setResult(`Sent to ${res.notified} new subscriber${res.notified === 1 ? '' : 's'}. ${res.skipped} already notified (skipped).`);
      loadDoctors(); // refresh last notified dates
    } else {
      setResult(`Error: ${res.error}`);
    }
  };

  const selectedDoc = doctors.find(d => d.id === selectedId);

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mt-8">
      <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-neuro-orange" />
        Doctor Joined Trigger
      </h2>
      <p className="text-gray-500 text-xs mb-4">
        Notify subscribers when a new doctor joins near them. Default: ZIP prefix match (tightest radius).
      </p>
      {!loaded ? (
        <button
          onClick={loadDoctors}
          className="px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/15 transition-colors"
        >
          Load Recent Doctors
        </button>
      ) : (
        <>
          {/* Doctor list with last notified dates */}
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {doctors.map((d) => (
              <label
                key={d.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                  selectedId === d.id ? "bg-neuro-orange/10 border border-neuro-orange/30" : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"
                }`}
                onClick={() => { setSelectedId(d.id); setPreview(null); setResult(null); }}
              >
                <div>
                  <span className="text-sm text-white font-bold">{d.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{d.city}, {d.state}</span>
                  {d.zipPrefix && <span className="text-xs text-gray-600 ml-1">(ZIP: {d.zipPrefix}xx)</span>}
                </div>
                <div className="text-right">
                  {d.lastNotifiedAt ? (
                    <span className="text-[10px] text-green-400 font-bold">
                      Last sent {new Date(d.lastNotifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-600">Never sent</span>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Radius selector */}
          {selectedId && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { setRadius("zip_prefix"); setPreview(null); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  radius === "zip_prefix" ? "bg-neuro-orange text-white" : "bg-white/[0.06] text-gray-400 hover:bg-white/10"
                }`}
              >
                ZIP Prefix {selectedDoc?.zipPrefix ? `(${selectedDoc.zipPrefix}xx ± 1)` : "(nearby)"}
              </button>
              <button
                onClick={() => { setRadius("state"); setPreview(null); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  radius === "state" ? "bg-neuro-orange text-white" : "bg-white/[0.06] text-gray-400 hover:bg-white/10"
                }`}
              >
                State-wide ({selectedDoc?.state})
              </button>
            </div>
          )}

          {/* Preview button */}
          {selectedId && !preview && (
            <button
              onClick={handlePreview}
              disabled={previewLoading}
              className="px-5 py-2.5 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/15 transition-colors flex items-center gap-2 disabled:opacity-40"
            >
              {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Preview Recipients
            </button>
          )}

          {/* Preview results + confirm */}
          {preview && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 mt-4">
              <h3 className="text-sm font-bold text-white mb-3">Notification Preview</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Doctor</span>
                  <span className="text-white font-bold">{preview.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location</span>
                  <span className="text-white">{preview.doctorCity}, {preview.doctorState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Radius</span>
                  <span className="text-white font-bold">
                    {preview.radius === "zip_prefix"
                      ? `ZIP prefix ${preview.doctorZipPrefix || "?"}xx ± 1`
                      : `State-wide (${preview.doctorState})`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/[0.06] pt-2">
                  <span className="text-gray-400">New recipients</span>
                  <span className="text-green-400 font-black">{preview.newRecipients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Already notified (will skip)</span>
                  <span className="text-gray-500">{preview.alreadyNotified}</span>
                </div>
              </div>

              {preview.newRecipients === 0 ? (
                <p className="text-amber-400 text-sm font-bold">No new subscribers to notify. All have already been notified for this doctor.</p>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setPreview(null)}
                    className="px-4 py-2.5 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/15 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="flex-1 px-5 py-2.5 bg-neuro-orange text-white text-sm font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Send to {preview.newRecipients} new subscriber{preview.newRecipients === 1 ? '' : 's'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {result && (
        <p className={`text-sm font-bold mt-3 ${result.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
          {result}
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}
