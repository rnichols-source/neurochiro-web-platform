"use client";

import { useState, useEffect } from "react";
import { getLeads, updateLeadStatus, deleteLeadAction } from "./actions";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink,
  Search,
  Loader2,
  Users,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

const STATUS_OPTIONS = ["new", "contacted", "qualified", "converted", "closed"];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400",
  contacted: "bg-amber-500/15 text-amber-400",
  qualified: "bg-violet-500/15 text-violet-400",
  converted: "bg-green-500/15 text-green-400",
  closed: "bg-white/[0.06] text-white/30",
};

const STATUS_ICONS: Record<string, any> = {
  new: Clock,
  contacted: Mail,
  qualified: Users,
  converted: CheckCircle,
  closed: XCircle,
};

function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  if (diffD < 7) return `${diffD} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getLeads().then((data) => {
      setLeads(data);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLeadStatus(leadId, newStatus);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    } catch {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    try {
      await deleteLeadAction(leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch {
      alert("Failed to delete");
    }
  };

  const sources = [...new Set(leads.map((l) => l.source).filter(Boolean))];

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.first_name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q) ||
      l.source?.toLowerCase().includes(q) ||
      JSON.stringify(l.metadata || {}).toLowerCase().includes(q);
    const matchSource = filterSource === "all" || l.source === filterSource;
    const matchStatus = filterStatus === "all" || (l.status || "new") === filterStatus;
    return matchSearch && matchSource && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 text-[#D66829] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-sm text-white/40 mt-1">
          Everyone who submitted a form on the site. Contact them, track status, never lose a lead.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: leads.length, color: "text-white" },
          { label: "New", value: leads.filter((l) => !l.status || l.status === "new").length, color: "text-blue-400" },
          { label: "Contacted", value: leads.filter((l) => l.status === "contacted").length, color: "text-amber-400" },
          { label: "Converted", value: leads.filter((l) => l.status === "converted").length, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-xl border border-white/[0.08] p-4 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, location..."
            className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:border-[#D66829]/40 outline-none"
          />
        </div>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-3 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:border-[#D66829]/40 outline-none appearance-none min-w-[140px]"
        >
          <option value="all">All Sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:border-[#D66829]/40 outline-none appearance-none min-w-[140px]"
        >
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Leads List */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/30 text-sm">No leads match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => {
            const isExpanded = expandedId === lead.id;
            const status = lead.status || "new";
            const StatusIcon = STATUS_ICONS[status] || Clock;
            const metadata = lead.metadata || {};

            return (
              <div
                key={lead.id}
                className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-xl border border-white/[0.08] shadow-lg shadow-black/20 overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                  className="w-full text-left p-4 sm:p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <StatusIcon className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{lead.first_name || lead.email || "Unknown"}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
                        {status}
                      </span>
                      <span className="text-[10px] text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-full">
                        {(lead.source || "unknown").replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                      {lead.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3" /> {lead.email}
                        </span>
                      )}
                      {lead.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {lead.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-white/20 hidden sm:block">{formatDate(lead.created_at)}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
                    {/* Contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-1">Name</p>
                        <p className="text-sm text-white">{lead.first_name || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-1">Email</p>
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="text-sm text-[#D66829] hover:underline flex items-center gap-1">
                            {lead.email} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="text-sm text-white/30">Not provided</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-1">Submitted</p>
                        <p className="text-sm text-white">{new Date(lead.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Location & Role */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {lead.location && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-1">Location</p>
                          <p className="text-sm text-white">{lead.location}</p>
                        </div>
                      )}
                      {lead.role && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-1">Role</p>
                          <p className="text-sm text-white">{lead.role}</p>
                        </div>
                      )}
                      {lead.source && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-1">Source</p>
                          <p className="text-sm text-white">{lead.source.replace(/_/g, " ")}</p>
                        </div>
                      )}
                    </div>

                    {/* Metadata (form data) */}
                    {Object.keys(metadata).length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-2">Form Data</p>
                        <div className="bg-white/[0.03] rounded-lg p-4 space-y-2">
                          {Object.entries(metadata).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-2">
                              <span className="text-[11px] text-white/30 min-w-[100px] flex-shrink-0">{key.replace(/_/g, " ")}:</span>
                              <span className="text-[12px] text-white/70 break-all">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-wrap pt-2">
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:border-[#D66829]/40 outline-none"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="px-4 py-2 bg-[#D66829] text-white font-semibold rounded-lg text-sm hover:bg-[#e8834a] shadow-lg shadow-[#D66829]/20 flex items-center gap-2"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email Them
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="px-3 py-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
