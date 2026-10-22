"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Copy, Check, Send, Upload, Loader2, ChevronDown, ChevronUp,
  AlertTriangle, MapPin, Users, Target, ExternalLink, Filter, X,
} from "lucide-react";
import {
  parseProspects,
  computeProspectData,
  logColdDmOutreach,
  getOutreachStats,
  getAvailableTemplates,
} from "./actions";
import type { ParsedProspect, ProspectData } from "./actions";

const TIER_COLORS: Record<string, string> = {
  local: "bg-green-500/20 text-green-400",
  metro: "bg-cyan-500/20 text-cyan-400",
  metro_90: "bg-blue-500/20 text-blue-400",
  state: "bg-purple-500/20 text-purple-400",
  fallback: "bg-gray-500/20 text-gray-500",
};

const TIER_LABELS: Record<string, string> = {
  local: "Local",
  metro: "Metro",
  metro_90: "Metro 90d",
  state: "State",
  fallback: "Fallback",
};

type FilterMode = "all" | "uncovered" | "has_number";

export default function ColdDmQueuePage() {
  // ── State ──
  const [input, setInput] = useState("");
  const [templateKey, setTemplateKey] = useState("uncovered_short");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProspectData[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);
  const [copiedFollowUp, setCopiedFollowUp] = useState<string | null>(null);
  const [sentHandles, setSentHandles] = useState<Set<string>>(new Set());
  const [sendingHandle, setSendingHandle] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    total_sent: number;
    reply_count: number;
    join_count: number;
    by_template: Record<string, { sent: number; replies: number; joins: number }>;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load Stats ──
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await getOutreachStats();
      setStats(s);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load stats on mount
  useEffect(() => { loadStats(); }, [loadStats]);

  // ── CSV Upload ──
  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInput(text);
    };
    reader.readAsText(file);
    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Process ──
  async function handleProcess() {
    if (!input.trim()) return;
    setProcessing(true);
    setResults([]);
    setSentHandles(new Set());
    try {
      const parsed = await parseProspects(input);
      if (parsed.length === 0) return;
      const computed = await computeProspectData(parsed, templateKey);
      setResults(computed);
    } finally {
      setProcessing(false);
    }
  }

  // ── Copy Message ──
  async function handleCopy(prospect: ProspectData) {
    await navigator.clipboard.writeText(prospect.message);
    setCopiedHandle(prospect.handle);
    setCopiedFollowUp(null);
    setTimeout(() => setCopiedHandle(null), 2000);
  }

  async function handleCopyFollowUp(prospect: ProspectData) {
    await navigator.clipboard.writeText(prospect.follow_up);
    setCopiedFollowUp(prospect.handle);
    setCopiedHandle(null);
    setTimeout(() => setCopiedFollowUp(null), 2000);
  }

  // ── Mark Sent ──
  async function handleSent(prospect: ProspectData) {
    setSendingHandle(prospect.handle);
    try {
      const result = await logColdDmOutreach({
        handle: prospect.handle,
        name: prospect.name,
        city: prospect.city,
        state: prospect.state,
        country: prospect.country,
        lat: prospect.lat,
        lng: prospect.lng,
        template_used: prospect.template_used,
        tier: prospect.tier,
        headline_number: prospect.headline_number,
        scope_label: prospect.scope_label,
        message: prospect.message,
      });
      if (result.ok) {
        setSentHandles((prev) => new Set([...prev, prospect.handle]));
      }
    } finally {
      setSendingHandle(null);
    }
  }

  // ── Filtering ──
  const filteredResults = results.filter((r) => {
    if (filterMode === "uncovered") return r.covering_doctors.length === 0;
    if (filterMode === "has_number") return r.headline_number !== null;
    return true;
  });

  const replyRate = stats && stats.total_sent > 0
    ? ((stats.reply_count / stats.total_sent) * 100).toFixed(1)
    : "0";
  const joinRate = stats && stats.total_sent > 0
    ? ((stats.join_count / stats.total_sent) * 100).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-[#0B1118] text-white">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-neuro-orange" />
            <h1 className="text-lg font-black text-white uppercase tracking-tight">Cold DM Queue</h1>
          </div>
          <a
            href="/admin/outreach"
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Back to Outreach Station
          </a>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Stats Strip */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          <div className="shrink-0 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-lg text-center min-w-[80px]">
            <div className="text-lg font-black text-white">{stats?.total_sent ?? "-"}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Sent</div>
          </div>
          <div className="shrink-0 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-lg text-center min-w-[80px]">
            <div className="text-lg font-black text-green-400">{replyRate}%</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Reply Rate</div>
          </div>
          <div className="shrink-0 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-lg text-center min-w-[80px]">
            <div className="text-lg font-black text-emerald-400">{joinRate}%</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Join Rate</div>
          </div>
          {stats && Object.keys(stats.by_template).length > 0 && (
            Object.entries(stats.by_template).map(([tpl, data]) => (
              <div key={tpl} className="shrink-0 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-lg text-center min-w-[80px]">
                <div className="text-lg font-black text-white/60">{data.sent}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{tpl}</div>
              </div>
            ))
          )}
        </div>

        {/* Input Section */}
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Paste prospects, one per line:\n@handle, Dr. Name, City ST\n@handle, Dr. Name, 29650\n@handle | Dr. Name | Charlotte NC"}
            rows={6}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-white/20 focus:outline-none focus:border-neuro-orange font-mono resize-y"
          />

          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleCSVUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-base font-bold text-gray-300 flex items-center gap-2 min-h-[44px]"
            >
              <Upload className="w-4 h-4" /> CSV Upload
            </button>

            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-base text-gray-300 focus:outline-none focus:border-neuro-orange min-h-[44px]"
            >
              <option value="uncovered_short">Short</option>
              <option value="uncovered_full">Full</option>
            </select>
            <span className="text-[10px] text-gray-500 self-center">uncovered markets only</span>

            <button
              onClick={handleProcess}
              disabled={processing || !input.trim()}
              className="px-6 py-2.5 bg-neuro-orange text-white rounded-xl font-bold text-base disabled:opacity-50 flex items-center gap-2 min-h-[44px]"
            >
              {processing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                "Process"
              )}
            </button>

            <span className="text-xs text-gray-600">
              {input.split("\n").filter(Boolean).length} lines
            </span>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            {/* Filter buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Filter:</span>
              {([
                { key: "all" as FilterMode, label: `All (${results.length})` },
                { key: "uncovered" as FilterMode, label: `Uncovered (${results.filter(r => r.covering_doctors.length === 0).length})` },
                { key: "has_number" as FilterMode, label: `Has Number (${results.filter(r => r.headline_number !== null).length})` },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterMode(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    filterMode === key
                      ? "bg-neuro-orange text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="text-xs text-gray-600 ml-auto">
                Sorted by metro demand DESC
              </span>
            </div>

            {/* Table wrapper with horizontal scroll */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[900px] px-4 sm:px-0">
                {/* Header row */}
                <div className="grid grid-cols-[140px_120px_100px_70px_70px_70px_80px_80px_auto_70px_70px_60px] gap-2 px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-white/5">
                  <div className="sticky left-0 bg-[#0B1118] z-10">Handle</div>
                  <div>Name</div>
                  <div>City</div>
                  <div className="text-center">Local</div>
                  <div className="text-center">Metro</div>
                  <div className="text-center">State</div>
                  <div className="text-center">Tier</div>
                  <div className="text-center">Covering</div>
                  <div>Message</div>
                  <div className="text-center">Copy</div>
                  <div className="text-center">Follow Up</div>
                  <div className="text-center">Sent</div>
                </div>

                {/* Data rows */}
                {filteredResults.map((r) => {
                  const isSent = sentHandles.has(r.handle) || r.already_sent;
                  const isSending = sendingHandle === r.handle;
                  const isCopied = copiedHandle === r.handle;
                  const isExpanded = expandedRow === r.handle;
                  const isMessageExpanded = expandedMessage === r.handle;

                  return (
                    <div key={r.handle}>
                      <div
                        className={`grid grid-cols-[140px_120px_100px_70px_70px_70px_80px_80px_auto_70px_70px_60px] gap-2 px-3 py-2.5 border-b border-white/[0.03] items-center ${
                          r.already_sent
                            ? "opacity-50 bg-white/[0.01]"
                            : r.geocode_failed || r.tier_error
                              ? "bg-orange-500/[0.03]"
                              : ""
                        }`}
                      >
                        {/* Handle */}
                        <div className="sticky left-0 bg-[#0B1118] z-10">
                          <a
                            href={`https://instagram.com/${r.handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-pink-400 hover:text-pink-300 font-bold truncate block"
                          >
                            @{r.handle}
                          </a>
                          {r.already_sent && (
                            <span className="text-[10px] text-gray-500 font-bold">Already sent</span>
                          )}
                          {r.geocode_failed && (
                            <span className="text-[10px] text-orange-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Could not geocode
                            </span>
                          )}
                          {r.tier_error && (
                            <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Tier math error
                            </span>
                          )}
                        </div>

                        {/* Name */}
                        <div className="text-sm text-white truncate">{r.name}</div>

                        {/* City */}
                        <div className="text-xs text-gray-400 truncate">
                          {r.city ? `${r.city}${r.state ? `, ${r.state}` : ""}` : r.location || "-"}
                        </div>

                        {/* Local 30d */}
                        <div className={`text-center text-sm font-black ${r.local_30d >= 5 ? "text-green-400" : "text-gray-600"}`}>
                          {r.local_30d}
                        </div>

                        {/* Metro 30d */}
                        <div className={`text-center text-sm font-black ${r.metro_30d >= 5 ? "text-cyan-400" : "text-gray-600"}`}>
                          {r.metro_30d}
                        </div>

                        {/* State 90d */}
                        <div className={`text-center text-sm font-black ${r.state_90d >= 10 ? "text-purple-400" : "text-gray-600"}`}>
                          {r.state_90d}
                        </div>

                        {/* Tier + Template */}
                        <div className="text-center space-y-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${TIER_COLORS[r.tier]}`}>
                            {TIER_LABELS[r.tier]}
                          </span>
                          <span className="block text-[9px] text-gray-500 uppercase">
                            {r.template_used === 'uncovered_short' ? 'SHORT' : r.template_used === 'uncovered_full' ? 'FULL' : r.template_used === 'covered' ? 'COVERED' : r.template_used === 'no_number' ? 'NO NUMBER' : r.template_used.toUpperCase()}
                          </span>
                        </div>

                        {/* Covering Doctors */}
                        <div className="text-center">
                          {r.covering_doctors.length > 0 ? (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : r.handle)}
                              className="text-xs text-amber-400 font-bold flex items-center gap-1 justify-center w-full"
                            >
                              <Users className="w-3 h-3" />
                              {r.covering_doctors.length}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="text-xs text-red-400 font-bold">None</span>
                          )}
                        </div>

                        {/* Message preview */}
                        <div>
                          <button
                            onClick={() => setExpandedMessage(isMessageExpanded ? null : r.handle)}
                            className="text-xs text-gray-400 hover:text-white truncate block w-full text-left"
                          >
                            {r.message.slice(0, 60)}...
                          </button>
                        </div>

                        {/* Copy */}
                        <div className="text-center">
                          <button
                            onClick={() => handleCopy(r)}
                            disabled={r.already_sent}
                            className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center mx-auto ${
                              isCopied
                                ? "bg-green-500/20 text-green-400"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            } disabled:opacity-30 disabled:cursor-not-allowed`}
                          >
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Follow Up */}
                        <div className="text-center">
                          <button
                            onClick={() => handleCopyFollowUp(r)}
                            className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center mx-auto ${
                              copiedFollowUp === r.handle
                                ? "bg-green-500/20 text-green-400"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {copiedFollowUp === r.handle ? <Check className="w-4 h-4" /> : <Send className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Sent toggle */}
                        <div className="text-center">
                          {isSent ? (
                            <div className="p-2 text-emerald-400">
                              <Check className="w-4 h-4 mx-auto" />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSent(r)}
                              disabled={isSending || r.geocode_failed}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center mx-auto disabled:opacity-30"
                            >
                              {isSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded: covering doctors */}
                      {isExpanded && r.covering_doctors.length > 0 && (
                        <div className="px-4 py-2 bg-amber-500/[0.03] border-b border-white/[0.03]">
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                            Covering Doctors (within 30mi)
                          </div>
                          <div className="space-y-1">
                            {r.covering_doctors.map((d, i) => (
                              <div key={i} className="text-xs text-gray-300 flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-gray-600" />
                                <span className="font-bold">{d.name}</span>
                                <span className="text-gray-500">{d.city}</span>
                                <span className="text-gray-600">{d.distance}mi</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expanded: full message */}
                      {isMessageExpanded && (
                        <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.03]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                              Full Message ({r.template_used})
                            </span>
                            <button
                              onClick={() => handleCopy(r)}
                              className="text-xs text-neuro-orange hover:text-neuro-orange/80 font-bold flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                          <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                            {r.message}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {filteredResults.length === 0 && results.length > 0 && (
              <div className="text-center py-8 text-gray-600">
                <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-bold">No results match this filter</p>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !processing && (
          <div className="text-center py-16">
            <Target className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 font-bold mb-1">Cold DM Outreach Queue</p>
            <p className="text-gray-600 text-sm">
              Paste prospect handles with locations, choose a template, and process.
            </p>
            <p className="text-gray-700 text-xs mt-4">
              Each line: @handle, Dr. Name, City ST (comma/tab/pipe separated)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
