"use client";

import { Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getAuditLogs } from "./actions";
import { AuditLog } from "@/types/admin";
import { formatDistanceToNow } from "date-fns";

export default function AdminLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const data = await getAuditLogs({ search: searchQuery });
      setLogs(data);
      setLoading(false);
    }
    loadLogs();
  }, [searchQuery]);

  const severityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500 text-white";
      case "High":
        return "bg-red-500/10 text-red-500";
      case "Medium":
        return "bg-amber-500/10 text-amber-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-white">Audit Logs</h1>
        <p className="text-gray-400 text-sm mt-1">Record of platform events and actions.</p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by event, user, or target..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neuro-orange transition-colors"
        />
      </div>

      {/* Logs list */}
      <section className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-gray-500 text-sm">No logs found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{log.event}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {log.user} &rarr; {log.target}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${severityColor(log.severity)}`}
                  >
                    {log.severity}
                  </span>
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
