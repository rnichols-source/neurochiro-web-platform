"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Plus, Copy, Check, Send, Mail, MessageSquare, Phone,
  Instagram, Globe, MapPin, Users, AlertTriangle, ChevronRight,
  Loader2, X, Upload, ExternalLink, Calendar, Clock, User,
  Target, TrendingUp, Filter
} from "lucide-react";
import {
  searchProspects, getProspect, addProspect, getDemandForProspect,
  getTemplatesForChannel, renderTemplate, logOutreach, getOutreachConfig,
  getProspects, getPipelineStats, bulkAddProspects, updateProspect, deleteProspect,
  logOutcome, getLastContact, setFollowUpDate, getQueue
} from "./actions";

// ── Types ──
type ProspectStatus = "new" | "contacted" | "replied" | "call_booked" | "call_held" | "joined" | "declined" | "dormant" | "bad_fit" | "unreachable";
type Channel = "ig_dm" | "email" | "sms";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  contacted: "bg-amber-500/20 text-amber-400",
  replied: "bg-green-500/20 text-green-400",
  call_booked: "bg-purple-500/20 text-purple-400",
  call_held: "bg-purple-500/20 text-purple-300",
  joined: "bg-emerald-500/20 text-emerald-400",
  declined: "bg-red-500/20 text-red-400",
  dormant: "bg-gray-500/20 text-gray-400",
  bad_fit: "bg-gray-500/20 text-gray-500",
  unreachable: "bg-gray-500/20 text-gray-600",
};

const CHANNEL_ICONS: Record<Channel, typeof Instagram> = {
  ig_dm: Instagram,
  email: Mail,
  sms: Phone,
};

const CHANNEL_LABELS: Record<Channel, string> = {
  ig_dm: "Instagram DM",
  email: "Email",
  sms: "Text",
};

const INTENT_LABELS: Record<string, string> = {
  first_contact: "First Contact",
  warm_reply: "Warm Reply",
  city_led: "City Led",
  info_request: "Info Request",
  follow_up_1: "Follow-Up 1",
  follow_up_2: "Follow-Up 2",
  post_call: "Post Call",
  re_engage: "Re-engage",
  objection_price: "Objection: Price",
  objection_timing: "Objection: Timing",
  declined_graceful: "Declined Graceful",
};

export default function OutreachStationPage() {
  // ── State ──
  const [prospectType, setProspectType] = useState<string>("doctor");
  const [viewMode, setViewMode] = useState<"station" | "queue">("station");
  const [queueData, setQueueData] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueFilter, setQueueFilter] = useState<"new" | "follow_up">("new");

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ prospects: any[]; members: any[] } | null>(null);
  const [searching, setSearching] = useState(false);

  const [selectedProspect, setSelectedProspect] = useState<any | null>(null);
  const [demandData, setDemandData] = useState<any | null>(null);
  const [demandLoading, setDemandLoading] = useState(false);

  const [selectedChannel, setSelectedChannel] = useState<Channel>("ig_dm");
  const [selectedIntent, setSelectedIntent] = useState<string>("first_contact");
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  const [renderedMessage, setRenderedMessage] = useState<any | null>(null);
  const [renderLoading, setRenderLoading] = useState(false);

  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcomeLoading, setOutcomeLoading] = useState(false);

  const [lastContactInfo, setLastContactInfo] = useState<any | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addDuplicates, setAddDuplicates] = useState<any[] | null>(null);

  const [showImport, setShowImport] = useState(false);
  const [editingFirstName, setEditingFirstName] = useState(false);
  const [firstNameDraft, setFirstNameDraft] = useState("");
  const [savingFirstName, setSavingFirstName] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<Record<string, number>>({});

  const [warnUnsent, setWarnUnsent] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Focus search on load ──
  useEffect(() => {
    searchInputRef.current?.focus();
    loadStats();
  }, []);

  // Reload stats + queue when prospect type changes
  useEffect(() => {
    loadStats();
    if (viewMode === "queue") loadQueue();
  }, [prospectType]);

  async function loadStats() {
    const s = await getPipelineStats(prospectType);
    setStats(s);
  }

  async function loadQueue() {
    setQueueLoading(true);
    try {
      const data = await getQueue({ prospect_type: prospectType, status: queueFilter });
      setQueueData(data);
    } finally {
      setQueueLoading(false);
    }
  }

  // Reload queue when filter changes
  useEffect(() => {
    if (viewMode === "queue") loadQueue();
  }, [queueFilter, viewMode]);

  // ── Search ──
  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await searchProspects(query.trim(), prospectType);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  // ── Select Prospect ──
  async function selectProspect(prospect: any) {
    if (copied && !sent) {
      setWarnUnsent(true);
      return;
    }
    setSelectedProspect(prospect);
    setSearchResults(null);
    setDemandData(null);
    setRenderedMessage(null);
    setCopied(false);
    setSent(false);
    setShowOutcome(false);
    setWarnUnsent(false);
    setLastContactInfo(null);

    // Auto-load demand + collision info in parallel
    setDemandLoading(true);
    const [demand, contact] = await Promise.all([
      getDemandForProspect(prospect.id),
      getLastContact(prospect.id),
    ]);
    setDemandData(demand);
    setLastContactInfo(contact);
    setDemandLoading(false);

    // Auto-detect available channel
    if (prospect.instagram_handle) setSelectedChannel("ig_dm");
    else if (prospect.email) setSelectedChannel("email");
    else if (prospect.phone) setSelectedChannel("sms");
  }

  // ── Load templates when channel or intent changes ──
  useEffect(() => {
    if (!selectedProspect) return;
    loadTemplates();
  }, [selectedChannel, selectedIntent, selectedProspect?.id]);

  async function loadTemplates() {
    const tpls = await getTemplatesForChannel(selectedChannel, selectedIntent);
    setTemplates(tpls);
    setSelectedTemplate(tpls[0] || null);
    setRenderedMessage(null);
    setCopied(false);
    setSent(false);
  }

  // ── Render template when selected ──
  useEffect(() => {
    if (!selectedTemplate || !selectedProspect) return;
    renderCurrentTemplate();
  }, [selectedTemplate?.key, selectedProspect?.id]);

  async function renderCurrentTemplate() {
    if (!selectedTemplate || !selectedProspect) return;
    setRenderLoading(true);
    setCopied(false);
    setSent(false);
    try {
      const result = await renderTemplate(selectedTemplate.key, selectedProspect.id);
      setRenderedMessage(result);
    } finally {
      setRenderLoading(false);
    }
  }

  // ── Copy ──
  async function handleCopy() {
    if (!renderedMessage?.rendered) return;
    await navigator.clipboard.writeText(renderedMessage.rendered);
    setCopied(true);
    setSent(false);
  }

  async function handleCopySubject() {
    if (!renderedMessage?.subject) return;
    await navigator.clipboard.writeText(renderedMessage.subject);
  }

  // ── Mark Sent ──
  async function handleMarkSent() {
    if (!selectedProspect || !selectedTemplate || !renderedMessage) return;
    setSendLoading(true);
    try {
      const statusAfter = selectedProspect.status === "new" ? "contacted" : undefined;
      await logOutreach({
        prospectId: selectedProspect.id,
        channel: selectedChannel,
        templateKey: selectedTemplate.key,
        intent: selectedIntent,
        renderedBody: renderedMessage.rendered,
        demandSnapshot: renderedMessage.demandSnapshot,
        statusAfter,
      });
      setSent(true);
      setCopied(false);
      setShowOutcome(true);
      setSessionCount((c) => c + 1);

      // Refresh prospect
      const updated = await getProspect(selectedProspect.id);
      setSelectedProspect(updated);
      loadStats();
    } finally {
      setSendLoading(false);
    }
  }

  // ── Log Outcome ──
  async function handleOutcome(outcome: 'replied' | 'call_booked' | 'call_held' | 'no_response' | 'declined') {
    if (!selectedProspect) return;
    setOutcomeLoading(true);
    try {
      await logOutcome({ prospectId: selectedProspect.id, outcome });
      const updated = await getProspect(selectedProspect.id);
      setSelectedProspect(updated);
      setShowOutcome(false);
      loadStats();
    } finally {
      setOutcomeLoading(false);
    }
  }

  // ── Clear / Reset ──
  function handleClear() {
    setSelectedProspect(null);
    setDemandData(null);
    setRenderedMessage(null);
    setCopied(false);
    setShowOutcome(false);
    setLastContactInfo(null);
    setSent(false);
    setWarnUnsent(false);
    setQuery("");
    searchInputRef.current?.focus();
  }

  // ── Save first_name inline ──
  async function handleSaveFirstName() {
    if (!selectedProspect || !firstNameDraft.trim()) return;
    setSavingFirstName(true);
    try {
      await updateProspect(selectedProspect.id, { first_name: firstNameDraft.trim() });
      const updated = await getProspect(selectedProspect.id);
      setSelectedProspect(updated);
      setEditingFirstName(false);
      // Re-render the current template with the new first_name
      if (selectedTemplate) renderCurrentTemplate();
    } finally {
      setSavingFirstName(false);
    }
  }

  // ── Add Prospect ──
  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddLoading(true);
    setAddDuplicates(null);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      first_name: (fd.get("first_name") as string) || undefined,
      clinic_name: (fd.get("clinic_name") as string) || undefined,
      city: fd.get("city") as string,
      state: (fd.get("state") as string) || undefined,
      country: (fd.get("country") as string) || "US",
      postal_code: (fd.get("postal_code") as string) || undefined,
      instagram_handle: (fd.get("instagram_handle") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      source: (fd.get("source") as string) || "manual",
    };
    try {
      const result = await addProspect(data);
      if (result.duplicates && result.duplicates.length > 0) {
        setAddDuplicates(result.duplicates);
        setAddLoading(false);
        return;
      }
      if (result.success && result.prospect) {
        setShowAdd(false);
        selectProspect(result.prospect);
      }
    } finally {
      setAddLoading(false);
    }
  }

  // ── CSV Import ──
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""));
        const row: any = {};
        headers.forEach((h, i) => { row[h] = values[i] || ""; });
        return row;
      });
      setCsvPreview(rows.slice(0, 100));
    };
    reader.readAsText(file);
  }

  async function handleCSVImport() {
    setImporting(true);
    const prospects = csvPreview.map((row) => ({
      name: row.name || row.full_name || row.doctor || "",
      instagram_handle: row.instagram || row.instagram_handle || row.ig || "",
      email: row.email || "",
      website: row.website || row.url || "",
      phone: row.phone || "",
      clinic_name: row.clinic || row.clinic_name || row.practice || "",
      city: row.city || "",
      state: row.state || "",
      prospect_type: "doctor" as const,
    })).filter((p) => p.name);
    try {
      const result = await bulkAddProspects(prospects);
      if (result.success) {
        setShowImport(false);
        setCsvPreview([]);
        loadStats();
        alert(`Imported ${result.count} prospects`);
      }
    } finally {
      setImporting(false);
    }
  }

  // ── Keyboard shortcuts ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Escape") { (e.target as HTMLElement).blur(); handleClear(); }
        return;
      }
      if (e.key === "/") { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key === "1" && renderedMessage?.rendered && !renderedMessage.blocked) { handleCopy(); }
      if (e.key === "Enter" && copied && !sent) { handleMarkSent(); }
      if (e.key === "Escape") { handleClear(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [renderedMessage, copied, sent]);

  // ── Channel availability ──
  function channelAvailable(ch: Channel): { available: boolean; reason?: string } {
    if (!selectedProspect) return { available: false, reason: "No prospect selected" };
    if (ch === "ig_dm" && !selectedProspect.instagram_handle) return { available: false, reason: "No Instagram handle" };
    if (ch === "email" && !selectedProspect.email) return { available: false, reason: "No email address" };
    if (ch === "sms" && !selectedProspect.phone) return { available: false, reason: "No phone number" };
    return { available: true };
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#0B1118] text-white">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-neuro-orange" />
            <h1 className="text-lg font-black text-white uppercase tracking-tight">Outreach</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30 font-bold">{sessionCount} sent</span>
            <button onClick={() => setShowImport(true)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-base font-bold text-gray-300 flex items-center gap-2">
              <Upload className="w-4 h-4" /> CSV
            </button>
            <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-neuro-orange rounded-xl text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
        {/* Prospect Type Tabs */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {([
              { key: "doctor", label: "Doctors" },
              { key: "vendor", label: "Vendors" },
              { key: "seminar_host", label: "Seminar Hosts" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setProspectType(key); setSelectedProspect(null); setSearchResults(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  prospectType === key
                    ? "bg-neuro-orange text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex gap-1">
            {([
              { key: "station" as const, label: "Station" },
              { key: "queue" as const, label: "Queue" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewMode === key
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-white/5 text-gray-500 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Pipeline Stats */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["new", "contacted", "replied", "call_booked", "call_held", "joined"].map((s) => (
            <div key={s} className="shrink-0 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-center">
              <div className="text-sm font-black text-white">{stats[s] || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{s.replace("_", " ")}</div>
            </div>
          ))}
        </div>

        {/* ═══ Queue View ═══ */}
        {viewMode === "queue" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <button onClick={() => setQueueFilter("new")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${queueFilter === "new" ? "bg-neuro-orange text-white" : "bg-white/5 text-gray-400"}`}>
                  New Prospects ({queueData.length})
                </button>
                <button onClick={() => setQueueFilter("follow_up")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${queueFilter === "follow_up" ? "bg-neuro-orange text-white" : "bg-white/5 text-gray-400"}`}>
                  Follow-Ups Due
                </button>
              </div>
              <button onClick={loadQueue} disabled={queueLoading} className="text-xs text-gray-500 hover:text-white">
                {queueLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {queueLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-neuro-orange animate-spin" /></div>
            ) : queueData.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold">{queueFilter === "new" ? "No prospects above demand floor" : "No follow-ups due"}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {queueData.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => { setViewMode("station"); selectProspect(p); }}
                    className="w-full text-left px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm truncate">{p.name}</span>
                          {p.first_name && <span className="text-xs text-gray-500">(Dr. {p.first_name})</span>}
                          {p.metro_count > 1 && <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-500 rounded font-bold">+{p.metro_count - 1} in metro</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {p.city}{p.state ? `, ${p.state}` : ""}
                          {p.next_follow_up_at && queueFilter === "follow_up" && (
                            <span className={`ml-2 ${new Date(p.next_follow_up_at) <= new Date() ? "text-red-400" : "text-gray-500"}`}>
                              Due: {new Date(p.next_follow_up_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-black text-cyan-400">{p.demand_50mi}</div>
                          <div className="text-[9px] text-gray-600 uppercase">within 50mi</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {p.instagram_handle && <Instagram className="w-3 h-3 text-pink-400" />}
                          {p.email && <Mail className="w-3 h-3 text-green-400" />}
                          {p.phone && <Phone className="w-3 h-3 text-amber-400" />}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    {/* Coverage tier + nearest member */}
                    <div className={`mt-1.5 text-[11px] font-bold flex items-center gap-2 ${
                      p.coverage_tier === 'gap' ? "text-red-400" : p.coverage_tier === 'thin' ? "text-amber-400" : "text-gray-600"
                    }`}>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                        p.coverage_tier === 'gap' ? "bg-red-500/20" : p.coverage_tier === 'thin' ? "bg-amber-500/20" : "bg-gray-500/20"
                      }`}>{p.coverage_tier}</span>
                      Nearest: {p.nearest_member_name} ({Math.round(p.nearest_member_distance)}mi, {p.nearest_member_city})
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ Station View ═══ */}
        {viewMode === "station" && <>
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, clinic, city, handle, email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-white/25 focus:outline-none focus:border-neuro-orange"
            />
          </div>
          <button onClick={handleSearch} disabled={searching || !query.trim()} className="px-5 py-3 bg-neuro-orange text-white rounded-xl font-bold text-base disabled:opacity-50">
            {searching ? "..." : "Search"}
          </button>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            {searchResults.members.length > 0 && (
              <div className="p-3 bg-emerald-500/10 border-b border-white/5">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Existing Members (do not contact)</p>
                {searchResults.members.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm text-emerald-300 py-1">
                    <Check className="w-3 h-3" />
                    <span className="font-bold">Dr. {m.first_name} {m.last_name}</span>
                    <span className="text-emerald-400/50">{m.city}, {m.state}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 rounded-full uppercase font-bold">{m.membership_tier}</span>
                  </div>
                ))}
              </div>
            )}
            {searchResults.prospects.length > 0 ? (
              <div className="divide-y divide-white/5">
                {searchResults.prospects.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => selectProspect(p)}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{p.name}</span>
                        {p.is_existing_member && <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold">MEMBER</span>}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${STATUS_COLORS[p.status]}`}>{p.status.replace("_", " ")}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.city}{p.state ? `, ${p.state}` : ""} {p.clinic_name ? `· ${p.clinic_name}` : ""}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.instagram_handle && <Instagram className="w-3.5 h-3.5 text-pink-400" />}
                      {p.email && <Mail className="w-3.5 h-3.5 text-green-400" />}
                      {p.phone && <Phone className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : searchResults.members.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No results found</div>
            ) : null}
          </div>
        )}

        {/* ── Selected Prospect ── */}
        {selectedProspect && (
          <div className="space-y-4">
            {/* Prospect Card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-white">{selectedProspect.name}</h2>
                    {editingFirstName ? (
                      <div className="flex items-center gap-1">
                        <input
                          ref={firstNameRef}
                          value={firstNameDraft}
                          onChange={(e) => setFirstNameDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFirstName(); if (e.key === 'Escape') setEditingFirstName(false); }}
                          placeholder="First name"
                          className="px-2 py-1 bg-white/10 border border-neuro-orange rounded text-base text-white w-28 focus:outline-none"
                          autoFocus
                        />
                        <button onClick={handleSaveFirstName} disabled={savingFirstName} className="px-2 py-1 bg-neuro-orange text-white rounded text-xs font-bold min-h-[32px]">
                          {savingFirstName ? "..." : "Save"}
                        </button>
                        <button onClick={() => setEditingFirstName(false)} className="text-gray-500 text-xs">Cancel</button>
                      </div>
                    ) : selectedProspect.first_name ? (
                      <button onClick={() => { setEditingFirstName(true); setFirstNameDraft(selectedProspect.first_name); }} className="text-xs text-gray-500 hover:text-white transition-colors">
                        (Dr. {selectedProspect.first_name})
                      </button>
                    ) : (
                      <button onClick={() => { setEditingFirstName(true); setFirstNameDraft(""); setTimeout(() => firstNameRef.current?.focus(), 50); }} className="text-xs text-neuro-orange hover:text-neuro-orange/80 font-bold transition-colors">
                        + Add first name
                      </button>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${STATUS_COLORS[selectedProspect.status]}`}>
                      {selectedProspect.status.replace("_", " ")}
                    </span>
                    {selectedProspect.is_existing_member && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold">ALREADY A MEMBER</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                    {selectedProspect.clinic_name && <span>{selectedProspect.clinic_name}</span>}
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedProspect.city}{selectedProspect.state ? `, ${selectedProspect.state}` : ""}</span>
                    {selectedProspect.owner && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {selectedProspect.owner}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {selectedProspect.instagram_handle && (
                      <span className="text-xs text-pink-400 font-bold">@{selectedProspect.instagram_handle.replace("@", "")}</span>
                    )}
                    {selectedProspect.email && <span className="text-xs text-green-400">{selectedProspect.email}</span>}
                    {selectedProspect.phone && <span className="text-xs text-amber-400">{selectedProspect.phone}</span>}
                  </div>
                </div>
                <button onClick={handleClear} className="p-2 text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contact collision warning */}
              {lastContactInfo && lastContactInfo.daysAgo <= 7 && (
                <div className={`mt-3 px-3 py-2 rounded-lg flex items-center gap-2 ${
                  lastContactInfo.isMe
                    ? "bg-amber-500/10 border border-amber-500/30"
                    : "bg-red-500/10 border border-red-500/30"
                }`}>
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${lastContactInfo.isMe ? "text-amber-400" : "text-red-400"}`} />
                  <span className={`text-xs font-bold ${lastContactInfo.isMe ? "text-amber-300" : "text-red-300"}`}>
                    {lastContactInfo.isMe ? "You" : lastContactInfo.operatorName} contacted this prospect {lastContactInfo.daysAgo === 0 ? "today" : `${lastContactInfo.daysAgo} day${lastContactInfo.daysAgo > 1 ? "s" : ""} ago`} via {CHANNEL_LABELS[lastContactInfo.channel as Channel] || lastContactInfo.channel}
                  </span>
                </div>
              )}

              {/* Follow-up date */}
              {selectedProspect.next_follow_up_at && (
                <div className={`mt-2 px-3 py-2 rounded-lg flex items-center gap-2 ${
                  new Date(selectedProspect.next_follow_up_at) <= new Date()
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-white/5 border border-white/5"
                }`}>
                  <Calendar className={`w-3.5 h-3.5 ${new Date(selectedProspect.next_follow_up_at) <= new Date() ? "text-red-400" : "text-gray-500"}`} />
                  <span className={`text-xs font-bold ${new Date(selectedProspect.next_follow_up_at) <= new Date() ? "text-red-400" : "text-gray-400"}`}>
                    Follow-up {new Date(selectedProspect.next_follow_up_at) <= new Date() ? "overdue" : "due"}: {new Date(selectedProspect.next_follow_up_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Demand Panel */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-neuro-orange" /> Demand Near {selectedProspect.city || "This Location"}
              </h3>
              {demandLoading ? (
                <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 text-neuro-orange animate-spin" /></div>
              ) : demandData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                      <div className="text-xl font-black text-cyan-400">{demandData.demand_city}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">In City</div>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                      <div className="text-xl font-black text-cyan-400">{demandData.demand_25mi}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Within 25mi</div>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                      <div className="text-xl font-black text-neuro-orange">{demandData.demand_50mi}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Within 50mi</div>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                      <div className="text-xl font-black text-white/60">{demandData.demand_100mi}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Within 100mi</div>
                    </div>
                  </div>

                  {/* Coverage verdict */}
                  <div className={`px-3 py-2 rounded-lg text-sm font-bold ${
                    demandData.is_uncovered ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-white/5 text-gray-400"
                  }`}>
                    {demandData.is_uncovered
                      ? `Nobody within ${Math.round(demandData.nearest_member_distance)} miles. Nearest member is in ${demandData.nearest_member_city} (${Math.round(demandData.nearest_member_distance)}mi).`
                      : demandData.nearest_member_distance !== null
                        ? `Nearest member: ${demandData.nearest_member_name} in ${demandData.nearest_member_city} (${Math.round(demandData.nearest_member_distance)}mi)`
                        : "No members with coordinates to compare."
                    }
                  </div>
                  <div className="text-[10px] text-gray-600">{demandData.total_demand.toLocaleString()} total demand requests across all locations</div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Could not load demand data. Prospect may need coordinates.</p>
              )}
            </div>

            {/* Intent Selector */}
            <div>
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Intent</h3>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(INTENT_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedIntent(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      selectedIntent === key
                        ? "bg-neuro-orange text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Channel Tabs */}
            <div>
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Channel</h3>
              <div className="flex gap-2">
                {(["ig_dm", "email", "sms"] as Channel[]).map((ch) => {
                  const { available, reason } = channelAvailable(ch);
                  const Icon = CHANNEL_ICONS[ch];
                  return (
                    <button
                      key={ch}
                      onClick={() => available && setSelectedChannel(ch)}
                      disabled={!available}
                      title={reason}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                        selectedChannel === ch
                          ? "bg-neuro-orange text-white"
                          : available
                            ? "bg-white/5 text-gray-400 hover:bg-white/10"
                            : "bg-white/[0.02] text-gray-700 cursor-not-allowed"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {CHANNEL_LABELS[ch]}
                      {!available && <span className="text-[10px] text-gray-700 ml-1">({reason})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Selector (if multiple for this channel+intent) */}
            {templates.length > 1 && (
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Template</h3>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.key}
                      onClick={() => setSelectedTemplate(tpl)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        selectedTemplate?.key === tpl.key
                          ? "bg-white/10 text-white border border-white/20"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {tpl.key.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {templates.length === 0 && !renderLoading && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-red-400">No template found for {CHANNEL_LABELS[selectedChannel]} + {INTENT_LABELS[selectedIntent] || selectedIntent}</p>
              </div>
            )}

            {/* Rendered Message */}
            {renderLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-neuro-orange animate-spin" /></div>
            ) : renderedMessage && (
              <div className="space-y-3">
                {renderedMessage.blocked ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <p className="text-sm font-bold text-red-400 mb-1">Template blocked:</p>
                    <ul className="text-xs text-red-300 space-y-1">
                      {renderedMessage.missing?.map((v: string) => (
                        <li key={v}>{v.includes("Not enough") || v.includes("Zero demand") || v.includes("Cannot send") ? v : `{${v}} could not resolve`}</li>
                      ))}
                    </ul>
                    {renderedMessage.missing?.includes("first_name") && !editingFirstName && (
                      <button
                        onClick={() => { setEditingFirstName(true); setFirstNameDraft(""); setTimeout(() => firstNameRef.current?.focus(), 50); }}
                        className="mt-2 px-3 py-1.5 bg-neuro-orange text-white rounded-lg text-xs font-bold min-h-[36px]"
                      >
                        Add first name now
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {renderedMessage.warnings?.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                        {renderedMessage.warnings.map((w: string, i: number) => (
                          <p key={i} className="text-xs text-amber-400">{w}</p>
                        ))}
                      </div>
                    )}

                    {/* Subject line for email */}
                    {selectedChannel === "email" && renderedMessage.subject && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Subject: </span>
                          <span className="text-sm text-white">{renderedMessage.subject}</span>
                        </div>
                        <button onClick={handleCopySubject} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded">Copy</button>
                      </div>
                    )}

                    {/* Message body */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                      <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">{renderedMessage.rendered}</pre>
                      {selectedChannel === "sms" && (
                        <div className={`mt-2 text-[10px] font-bold ${
                          renderedMessage.rendered.length > 320 ? "text-red-400" : "text-gray-600"
                        }`}>
                          {renderedMessage.rendered.length} / 320 characters
                        </div>
                      )}
                      {selectedChannel === "ig_dm" && (
                        <div className={`mt-2 text-[10px] font-bold ${
                          renderedMessage.rendered.split(/\s+/).length > 120 ? "text-amber-400" : "text-gray-600"
                        }`}>
                          {renderedMessage.rendered.split(/\s+/).length} words
                        </div>
                      )}
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      className={`w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors min-h-[44px] ${
                        copied
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-neuro-orange text-white hover:bg-neuro-orange/90"
                      }`}
                    >
                      {copied ? <><Check className="w-5 h-5" /> Copied to clipboard</> : <><Copy className="w-5 h-5" /> Copy Message</>}
                    </button>

                    {/* Mark Sent (shown after copy) */}
                    {copied && !sent && (
                      <button
                        onClick={handleMarkSent}
                        disabled={sendLoading}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-emerald-500 min-h-[44px] disabled:opacity-50"
                      >
                        {sendLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {sendLoading ? "Logging..." : "Mark Sent"}
                      </button>
                    )}

                    {sent && !showOutcome && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-center">
                        <p className="text-sm font-bold text-emerald-400">Logged. Press / to search the next prospect.</p>
                      </div>
                    )}

                    {/* Outcome Buttons */}
                    {showOutcome && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">What happened?</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {([
                            { key: 'replied', label: 'Replied', color: 'bg-green-600 hover:bg-green-500' },
                            { key: 'call_booked', label: 'Booked a Call', color: 'bg-purple-600 hover:bg-purple-500' },
                            { key: 'no_response', label: 'No Response Yet', color: 'bg-gray-600 hover:bg-gray-500' },
                            { key: 'declined', label: 'Declined', color: 'bg-red-600 hover:bg-red-500' },
                          ] as const).map(({ key, label, color }) => (
                            <button
                              key={key}
                              onClick={() => handleOutcome(key)}
                              disabled={outcomeLoading}
                              className={`py-2.5 rounded-xl text-sm font-bold text-white ${color} disabled:opacity-50 min-h-[44px]`}
                            >
                              {outcomeLoading ? "..." : label}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowOutcome(false)}
                          className="text-xs text-gray-600 hover:text-gray-400"
                        >
                          Skip, record outcome later
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Unsent warning */}
            {warnUnsent && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-amber-400 font-bold">You copied a message but did not mark it sent.</span>
                <div className="flex gap-2">
                  <button onClick={() => { setWarnUnsent(false); setCopied(false); }} className="text-xs text-gray-400 px-3 py-1 rounded-lg bg-white/5">Discard</button>
                  <button onClick={() => { handleMarkSent(); setWarnUnsent(false); }} className="text-xs text-white px-3 py-1 rounded-lg bg-neuro-orange">Mark Sent</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!selectedProspect && !searchResults && (
          <div className="text-center py-16">
            <Target className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 font-bold mb-1">Doctor Outreach Station</p>
            <p className="text-gray-600 text-sm">Search for a prospect or add a new one to get started.</p>
            <p className="text-gray-700 text-xs mt-4">Shortcuts: / search, 1 copy, Enter send, Esc clear</p>
          </div>
        )}
        </>}
      </div>

      {/* ── Add Prospect Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-lg bg-[#0F172A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Add Prospect</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {addDuplicates && addDuplicates.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-sm font-bold text-amber-400 mb-2">Possible duplicates found:</p>
                  {addDuplicates.map((d: any, i: number) => (
                    <div key={i} className={`text-xs py-1 flex items-center gap-2 ${d.source === 'member' ? 'text-red-300' : 'text-amber-300'}`}>
                      {d.source === 'member' && <span className="px-1.5 py-0.5 bg-red-500/20 rounded text-[10px] font-bold uppercase">Member</span>}
                      {d.source === 'prospect' && <span className="px-1.5 py-0.5 bg-amber-500/20 rounded text-[10px] font-bold uppercase">Prospect</span>}
                      <span className="font-bold">{d.name}</span>
                      {d.email && <span className="text-gray-500">{d.email}</span>}
                      {d.instagram_handle && <span className="text-pink-400">@{d.instagram_handle?.replace('@','')}</span>}
                    </div>
                  ))}
                  {addDuplicates.some((d: any) => d.source === 'member') && (
                    <p className="text-xs text-red-400 mt-2 font-bold">One or more matches are existing members. Adding them will flag the prospect as a member duplicate.</p>
                  )}
                  <button type="submit" className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold min-h-[44px]">Add Anyway</button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <input name="name" required placeholder="Full Name or Clinic *" className="col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
                <input name="first_name" placeholder="First name (if known)" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
                <input name="clinic_name" placeholder="Clinic name" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
                <input name="city" required placeholder="City *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
                <input name="state" placeholder="State (2-letter)" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
                <input name="country" placeholder="Country" defaultValue="US" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
                <input name="postal_code" placeholder="ZIP / Postal code" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
                <input name="instagram_handle" placeholder="@instagram" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
                <input name="email" type="email" placeholder="Email" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
                <input name="phone" placeholder="Phone" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
                <select name="source" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-gray-300 focus:outline-none focus:border-neuro-orange">
                  <option value="manual">Manual</option>
                  <option value="ig_comment">IG Comment</option>
                  <option value="ig_dm">IG DM</option>
                  <option value="referral">Referral</option>
                  <option value="event">Event</option>
                  <option value="cold_list">Cold List</option>
                  <option value="student">Student</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button type="submit" disabled={addLoading} className="w-full py-3 bg-neuro-orange text-white rounded-xl font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]">
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {addLoading ? "Adding..." : "Add Prospect"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── CSV Import Modal ── */}
      {showImport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowImport(false); setCsvPreview([]); }} />
          <div className="relative w-full max-w-2xl bg-[#0F172A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Import CSV</h3>
              <button onClick={() => { setShowImport(false); setCsvPreview([]); }} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-sm font-bold text-white mb-1">CSV Format:</p>
                <p className="text-xs text-gray-400 font-mono">name, instagram, email, website, phone, clinic, city, state</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVFile} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white file:mr-4 file:bg-neuro-orange file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:text-base file:font-bold" />
              {csvPreview.length > 0 && (
                <>
                  <p className="text-sm text-gray-400">{csvPreview.length} rows found</p>
                  <button onClick={handleCSVImport} disabled={importing} className="w-full py-3 bg-neuro-orange text-white rounded-xl font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]">
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {importing ? "Importing..." : `Import ${csvPreview.length} Prospects`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
