"use client";

import { useState, useEffect, useCallback } from "react";
import {
  loadSettings,
  saveSettings,
  loadQueue,
  cancelNotification,
  releaseNotification,
  loadStats,
  loadLog,
} from "./actions";
import type { NotifySettings, QueuedNotification, LogEntry } from "@/lib/doctor-joined-notify";
import {
  Bell,
  Loader2,
  Power,
  Shield,
  Clock,
  Users,
  Send,
  XCircle,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Filter,
} from "lucide-react";

// ── Helpers ──

function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const mins = Math.round(absDiff / 60000);
  if (mins < 60) return diff > 0 ? `in ${mins}m` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return diff > 0 ? `in ${hrs}h` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return diff > 0 ? `in ${days}d` : `${days}d ago`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    held: "bg-red-500/20 text-red-400",
    processing: "bg-blue-500/20 text-blue-400",
    sent: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
    suppressed: "bg-gray-500/20 text-gray-400",
    cancelled: "bg-gray-500/20 text-gray-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${map[status] || "bg-gray-500/20 text-gray-400"}`}>
      {status}
    </span>
  );
}

// ── Component ──

export default function NotificationsClient() {
  const [settings, setSettings] = useState<NotifySettings | null>(null);
  const [queue, setQueue] = useState<QueuedNotification[]>([]);
  const [stats, setStats] = useState<{
    totalSent: number;
    totalSuppressed: number;
    totalContactRequests: number;
    conversionRate: number;
  } | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logFilter, setLogFilter] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Draft settings for editing
  const [draftHoldHours, setDraftHoldHours] = useState<number>(24);
  const [draftMaxPerDoctor, setDraftMaxPerDoctor] = useState<number>(25);
  const [draftMaxPerDay, setDraftMaxPerDay] = useState<number>(100);

  const PAGE_SIZE = 50;

  const fetchAll = useCallback(async () => {
    const [s, q, st, l] = await Promise.all([
      loadSettings(),
      loadQueue(),
      loadStats(),
      loadLog({ status: logFilter || undefined, limit: PAGE_SIZE, offset: 0 }),
    ]);
    setSettings(s);
    setDraftHoldHours(s.hold_hours);
    setDraftMaxPerDoctor(s.max_per_doctor);
    setDraftMaxPerDay(s.max_per_day);
    setQueue(q);
    setStats(st);
    setLogEntries(l.entries);
    setLogTotal(l.total);
    setLogPage(0);
    setLoading(false);
  }, [logFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fetchLog = useCallback(
    async (page: number) => {
      const l = await loadLog({
        status: logFilter || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setLogEntries(l.entries);
      setLogTotal(l.total);
      setLogPage(page);
    },
    [logFilter]
  );

  // ── Handlers ──

  const handleToggle = async () => {
    if (!settings) return;
    setSaving(true);
    const newEnabled = !settings.enabled;
    await saveSettings({ enabled: newEnabled });
    setSettings({ ...settings, enabled: newEnabled });
    setSaving(false);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    await saveSettings({
      hold_hours: draftHoldHours,
      max_per_doctor: draftMaxPerDoctor,
      max_per_day: draftMaxPerDay,
    });
    setSettings({
      ...settings,
      hold_hours: draftHoldHours,
      max_per_doctor: draftMaxPerDoctor,
      max_per_day: draftMaxPerDay,
    });
    setSaving(false);
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    await cancelNotification(id);
    setQueue((prev) => prev.filter((q) => q.id !== id));
    setActionLoading(null);
  };

  const handleRelease = async (id: string) => {
    setActionLoading(id);
    await releaseNotification(id);
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "pending", held_reason: null } : q))
    );
    setActionLoading(null);
  };

  // ── Loading ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-neuro-orange animate-spin" />
      </div>
    );
  }

  if (!settings || !stats) return null;

  const totalPages = Math.ceil(logTotal / PAGE_SIZE);

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-neuro-orange" />
          Doctor-Joined Notifications
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Automated emails to waitlisted patients when a doctor joins their area.
        </p>
      </div>

      {/* ═══ 1. Kill Switch + Settings ═══ */}
      <div className="bg-[#1a2744] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Power className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-white">System Status</h2>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              settings.enabled ? "bg-green-600" : "bg-red-600/60"
            }`}
          >
            <span
              className={`inline-block h-8 w-8 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${
                settings.enabled ? "translate-x-11" : "translate-x-1"
              }`}
            />
            {saving && (
              <Loader2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white animate-spin" />
            )}
          </button>
        </div>

        {/* Status label */}
        <div className="flex items-center gap-2 mb-6">
          {settings.enabled ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-bold text-sm">
                ENABLED - Notifications will be sent after the hold window
              </span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-bold text-sm">
                OFF - No notifications will be sent. Queue is paused.
              </span>
            </>
          )}
        </div>

        {/* Settings grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">
              Hold Window (hours)
            </label>
            <input
              type="number"
              min={0}
              value={draftHoldHours}
              onChange={(e) => setDraftHoldHours(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-neuro-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">
              Max Per Doctor
            </label>
            <input
              type="number"
              min={1}
              value={draftMaxPerDoctor}
              onChange={(e) => setDraftMaxPerDoctor(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-neuro-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">
              Max Per Day
            </label>
            <input
              type="number"
              min={1}
              value={draftMaxPerDay}
              onChange={(e) => setDraftMaxPerDay(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-neuro-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">
              Cutoff Date
            </label>
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm">
              {new Date(settings.cutoff_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Save button (only show if changed) */}
        {(draftHoldHours !== settings.hold_hours ||
          draftMaxPerDoctor !== settings.max_per_doctor ||
          draftMaxPerDay !== settings.max_per_day) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 bg-neuro-orange text-white text-sm font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        )}
      </div>

      {/* ═══ 2. Conversion Stats ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a2744] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-xs font-bold uppercase">Total Sent</span>
          </div>
          <p className="text-2xl font-black text-white">{stats.totalSent}</p>
        </div>
        <div className="bg-[#1a2744] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-xs font-bold uppercase">Suppressed</span>
          </div>
          <p className="text-2xl font-black text-white">{stats.totalSuppressed}</p>
        </div>
        <div className="bg-[#1a2744] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-neuro-orange" />
            <span className="text-gray-400 text-xs font-bold uppercase">Contact Requests</span>
          </div>
          <p className="text-2xl font-black text-white">{stats.totalContactRequests}</p>
        </div>
        <div className="bg-[#1a2744] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-xs font-bold uppercase">Conversion</span>
          </div>
          <p className="text-2xl font-black text-white">{stats.conversionRate}%</p>
        </div>
      </div>

      {/* ═══ 3. Pending Queue ═══ */}
      <div className="bg-[#1a2744] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-bold text-white">Pending Queue</h2>
          <span className="text-gray-400 text-sm">({queue.length})</span>
        </div>

        {queue.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No pending or held notifications.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Doctor</th>
                  <th className="pb-2 text-gray-400 font-bold text-xs uppercase">City</th>
                  <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Matched</th>
                  <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Send After</th>
                  <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Status</th>
                  <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Held Reason</th>
                  <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-white font-medium">{q.doctor_name}</td>
                    <td className="py-3 text-gray-300">
                      {q.doctor_city}, {q.doctor_state}
                    </td>
                    <td className="py-3 text-white">{q.matched_count}</td>
                    <td className="py-3 text-gray-300">{relativeTime(q.send_after)}</td>
                    <td className="py-3">{statusBadge(q.status)}</td>
                    <td className="py-3 text-gray-400 text-xs max-w-[200px] truncate">
                      {q.held_reason || "-"}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {q.status === "held" && (
                          <button
                            onClick={() => handleRelease(q.id)}
                            disabled={actionLoading === q.id}
                            className="px-3 py-1 bg-green-600/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === q.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Release"
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleCancel(q.id)}
                          disabled={actionLoading === q.id}
                          className="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === q.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Cancel"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ 4. Audit Log ═══ */}
      <div className="bg-[#1a2744] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-white">Audit Log</h2>
            <span className="text-gray-400 text-sm">({logTotal})</span>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={logFilter}
              onChange={(e) => {
                setLogFilter(e.target.value);
                setLogPage(0);
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:border-neuro-orange focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="suppressed">Suppressed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {logEntries.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No log entries found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Date</th>
                    <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Doctor</th>
                    <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Subscriber</th>
                    <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Email #</th>
                    <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Status</th>
                    <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Reason</th>
                    <th className="pb-2 text-gray-400 font-bold text-xs uppercase">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {logEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 text-gray-300 text-xs">
                        {new Date(entry.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {new Date(entry.created_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 text-white text-xs">{entry.doctor_id.slice(0, 8)}...</td>
                      <td className="py-3 text-gray-300 text-xs">
                        {entry.subscriber_city
                          ? `${entry.subscriber_city}, ${entry.subscriber_state}`
                          : entry.subscriber_id.slice(0, 8) + "..."}
                      </td>
                      <td className="py-3 text-white">{entry.email_number}</td>
                      <td className="py-3">{statusBadge(entry.status)}</td>
                      <td className="py-3 text-gray-400 text-xs max-w-[180px] truncate">
                        {entry.suppression_reason || "-"}
                      </td>
                      <td className="py-3 text-gray-300 text-xs">
                        {entry.distance_miles != null ? `${entry.distance_miles} mi` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <span className="text-gray-400 text-xs">
                  Page {logPage + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchLog(logPage - 1)}
                    disabled={logPage === 0}
                    className="px-3 py-1.5 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </button>
                  <button
                    onClick={() => fetchLog(logPage + 1)}
                    disabled={logPage >= totalPages - 1}
                    className="px-3 py-1.5 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
