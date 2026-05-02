"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Mail, Search, Plus, Upload, Copy, Check, ChevronDown, ChevronRight,
  Loader2, Trash2, MessageSquare, Users, Target, TrendingUp, Zap,
  Clock, CheckCircle2, XCircle, ArrowRight, Send, Filter, X,
  Edit3, ExternalLink, Instagram, Globe, Phone, Building2, User,
  FileText, Clipboard, RotateCcw, AlertCircle,
} from "lucide-react";
import {
  getProspects, getPipelineStats, getDailyQueue, addProspect,
  bulkAddProspects, updateProspectStatus, updateProspect, deleteProspect,
  getDMScripts, getProspectStates, preBuildProfile, findProspectEmail,
  type Prospect, type ProspectStatus,
} from "./actions";

const STATUS_CONFIG: Record<ProspectStatus, { label: string; color: string; bg: string; icon: any }> = {
  new: { label: "New", color: "text-blue-400", bg: "bg-blue-500/10", icon: Plus },
  contacted: { label: "Contacted", color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Send },
  followed_up: { label: "Followed Up", color: "text-orange-400", bg: "bg-orange-500/10", icon: RotateCcw },
  responded: { label: "Responded", color: "text-purple-400", bg: "bg-purple-500/10", icon: MessageSquare },
  interested: { label: "Interested", color: "text-cyan-400", bg: "bg-cyan-500/10", icon: Target },
  signed_up: { label: "Signed Up", color: "text-green-400", bg: "bg-green-500/10", icon: CheckCircle2 },
  not_interested: { label: "Not Interested", color: "text-gray-500", bg: "bg-gray-500/10", icon: XCircle },
};

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

export default function OutreachPage() {
  // ── State ──
  const [activeTab, setActiveTab] = useState<"queue" | "prospects" | "scripts">("queue");
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [queue, setQueue] = useState<{ newProspects: Prospect[]; followUps: Prospect[] }>({ newProspects: [], followUps: [] });
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [prospectStates, setProspectStates] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Prospect | null>(null);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prospectsRes, statsRes, queueRes, statesRes] = await Promise.all([
        getProspects({ state: stateFilter, status: statusFilter, search: searchQuery }),
        getPipelineStats(stateFilter),
        getDailyQueue(10),
        getProspectStates(),
      ]);
      setProspects(prospectsRes.prospects);
      setStats(statsRes);
      setQueue(queueRes);
      setProspectStates(statesRes);
      setScripts(await getDMScripts());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [stateFilter, statusFilter, searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Copy Script ──
  const copyScript = (template: string, prospect?: Prospect) => {
    let text = template;
    if (prospect) {
      text = text.replace(/\{name\}/g, prospect.name.split(" ")[0] || prospect.name);
      text = text.replace(/\{city\}/g, prospect.city);
      text = text.replace(/\{state\}/g, prospect.state);
      text = text.replace(/\{clinic_name\}/g, prospect.clinic_name || prospect.name);
      // Extract profile link from notes if pre-built
      const linkMatch = prospect.notes?.match(/neurochiro\.co\/directory\/[\w-]+/);
      const profileLink = linkMatch ? linkMatch[0] : "neurochiro.co";
      text = text.replace(/\{profile_link\}/g, profileLink);
    }
    navigator.clipboard.writeText(text);
    setCopiedScript(template);
    setTimeout(() => setCopiedScript(null), 2000);
    showToast("Copied to clipboard");
  };

  // ── Mark Contacted ──
  const markContacted = async (prospect: Prospect, scriptId?: string) => {
    const nextStatus: ProspectStatus = prospect.status === "new" ? "contacted" :
      prospect.status === "contacted" ? "followed_up" :
      prospect.status === "followed_up" ? "followed_up" : prospect.status;
    await updateProspectStatus(prospect.id, nextStatus, undefined, scriptId);
    fetchData();
    showToast(`${prospect.name} marked as ${STATUS_CONFIG[nextStatus].label}`);
  };

  // ── Status Change ──
  const changeStatus = async (prospect: Prospect, newStatus: ProspectStatus) => {
    await updateProspectStatus(prospect.id, newStatus);
    fetchData();
    showToast(`${prospect.name} → ${STATUS_CONFIG[newStatus].label}`);
  };

  const queueTotal = queue.newProspects.length + queue.followUps.length;
  const conversionRate = stats && (stats.contacted + stats.followed_up + stats.responded + stats.interested + stats.signed_up + stats.not_interested) > 0
    ? Math.round((stats.signed_up / (stats.contacted + stats.followed_up + stats.responded + stats.interested + stats.signed_up + stats.not_interested)) * 100)
    : 0;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-xl text-sm font-bold shadow-2xl ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">Outreach</h1>
          <p className="text-gray-400 mt-1">Find chiropractors. Send DMs. Grow the network.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImportModal(true)} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-neuro-orange rounded-xl text-sm font-bold text-white hover:bg-neuro-orange-light transition-all flex items-center gap-2 shadow-lg shadow-neuro-orange/20">
            <Plus className="w-4 h-4" /> Add Prospect
          </button>
        </div>
      </div>

      {/* Pipeline Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {(Object.keys(STATUS_CONFIG) as ProspectStatus[]).map((status) => {
            const config = STATUS_CONFIG[status];
            const count = stats[status] || 0;
            return (
              <button
                key={status}
                onClick={() => { setStatusFilter(statusFilter === status ? "all" : status); setActiveTab("prospects"); }}
                className={`p-4 rounded-xl border transition-all ${statusFilter === status ? "border-neuro-orange bg-neuro-orange/10" : "border-white/5 bg-white/[0.02] hover:bg-white/5"}`}
              >
                <p className={`text-2xl font-black ${config.color}`}>{count}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{config.label}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Conversion Rate Bar */}
      {stats && stats.total > 0 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-neuro-orange" />
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Conversion Rate</p>
              <p className="text-xl font-black text-white">{conversionRate}%</p>
            </div>
          </div>
          <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neuro-orange to-green-500 rounded-full transition-all" style={{ width: `${conversionRate}%` }} />
          </div>
          <p className="text-sm text-gray-400 font-bold">{stats.signed_up} signed up out of {stats.total} total</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-1">
        {[
          { id: "queue" as const, label: "Daily Queue", icon: Zap, badge: queueTotal },
          { id: "prospects" as const, label: "All Prospects", icon: Users, badge: stats?.total || 0 },
          { id: "scripts" as const, label: "DM Scripts", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 rounded-t-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.id ? "bg-white/5 text-white border-b-2 border-neuro-orange" : "text-gray-500 hover:text-gray-300"}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
            {tab.badge !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-black">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════ DAILY QUEUE TAB ═══════════ */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-neuro-orange animate-spin" /></div>
          ) : queueTotal === 0 ? (
            <div className="text-center py-20">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-black text-white mb-2">All caught up!</p>
              <p className="text-gray-500">No DMs to send today. Add more prospects or check back tomorrow.</p>
            </div>
          ) : (
            <>
              {/* Follow-ups due */}
              {queue.followUps.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-yellow-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Follow-Ups Due ({queue.followUps.length})
                  </h3>
                  <div className="space-y-2">
                    {queue.followUps.map((p) => (
                      <QueueCard key={p.id} prospect={p} scripts={scripts} onCopy={copyScript} onMarkDone={markContacted} onStatusChange={changeStatus} onViewDetails={setShowDetailModal} onRefresh={fetchData} />
                    ))}
                  </div>
                </div>
              )}
              {/* New prospects to contact */}
              {queue.newProspects.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Send className="w-4 h-4" /> New Prospects to Contact ({queue.newProspects.length})
                  </h3>
                  <div className="space-y-2">
                    {queue.newProspects.map((p) => (
                      <QueueCard key={p.id} prospect={p} scripts={scripts} onCopy={copyScript} onMarkDone={markContacted} onStatusChange={changeStatus} onViewDetails={setShowDetailModal} onRefresh={fetchData} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════ ALL PROSPECTS TAB ═══════════ */}
      {activeTab === "prospects" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, handle, city, clinic..."
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange w-80"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-neuro-orange"
            >
              <option value="all">All States</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-neuro-orange"
            >
              <option value="all">All Statuses</option>
              {(Object.keys(STATUS_CONFIG) as ProspectStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          {/* Prospect Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-neuro-orange animate-spin" /></div>
          ) : prospects.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-lg font-black text-white mb-2">No prospects yet</p>
              <p className="text-gray-500 mb-4">Add prospects manually or import a CSV to get started.</p>
              <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm">Add Your First Prospect</button>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/5">
                      <th className="text-left px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Name</th>
                      <th className="text-left px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Location</th>
                      <th className="text-left px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Handle</th>
                      <th className="text-left px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                      <th className="text-left px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Follow-Up</th>
                      <th className="text-right px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {prospects.map((p) => {
                      const config = STATUS_CONFIG[p.status];
                      return (
                        <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-5 py-3">
                            <p className="text-sm font-bold text-white">{p.name}</p>
                            {p.clinic_name && <p className="text-xs text-gray-500">{p.clinic_name}</p>}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-400">{p.city}{p.state ? `, ${p.state}` : ""}</td>
                          <td className="px-5 py-3">
                            {p.instagram_handle ? (
                              <span className="text-sm text-neuro-orange font-bold">@{p.instagram_handle.replace("@", "")}</span>
                            ) : (
                              <span className="text-xs text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${config.bg} ${config.color}`}>
                              <config.icon className="w-3 h-3" /> {config.label}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {p.follow_up_at ? (
                              <span className={`text-xs font-bold ${new Date(p.follow_up_at) <= new Date() ? "text-red-400" : "text-gray-500"}`}>
                                {new Date(p.follow_up_at).toLocaleDateString()}
                              </span>
                            ) : <span className="text-xs text-gray-600">—</span>}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setShowDetailModal(p)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg" title="Details">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {p.status === "new" && (
                                <button onClick={() => markContacted(p)} className="p-2 text-neuro-orange hover:bg-neuro-orange/10 rounded-lg" title="Mark Contacted">
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {(p.status === "contacted" || p.status === "followed_up") && (
                                <button onClick={() => changeStatus(p, "responded")} className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-lg" title="Mark Responded">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {p.status === "responded" && (
                                <button onClick={() => changeStatus(p, "signed_up")} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg" title="Mark Signed Up">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ DM SCRIPTS TAB ═══════════ */}
      {activeTab === "scripts" && (
        <div className="space-y-4">
          {["first_contact", "follow_up", "response", "objection", "email"].map((category) => {
            const categoryScripts = scripts.filter((s) => s.category === category);
            if (categoryScripts.length === 0) return null;
            const categoryLabels: Record<string, string> = { first_contact: "First Contact", follow_up: "Follow-Ups", response: "Responses", objection: "Objection Handling", email: "Email Scripts" };
            return (
              <div key={category}>
                <h3 className="text-sm font-black text-neuro-orange uppercase tracking-widest mb-3">{categoryLabels[category]}</h3>
                <div className="space-y-3">
                  {categoryScripts.map((script) => (
                    <div key={script.id} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedScript(expandedScript === script.id ? null : script.id)}
                        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">{script.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{script.description}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedScript === script.id ? "rotate-180" : ""}`} />
                      </button>
                      {expandedScript === script.id && (
                        <div className="px-5 pb-5 border-t border-white/5 pt-4">
                          <div className="bg-white/5 rounded-xl p-5 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                            {script.template}
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            <button
                              onClick={() => copyScript(script.template)}
                              className="px-4 py-2 bg-neuro-orange rounded-lg text-sm font-bold text-white flex items-center gap-2 hover:bg-neuro-orange-light transition-all"
                            >
                              {copiedScript === script.template ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              {copiedScript === script.template ? "Copied!" : "Copy Script"}
                            </button>
                            <p className="text-xs text-gray-600">Replace <span className="text-neuro-orange font-mono">{"{name}"}</span>, <span className="text-neuro-orange font-mono">{"{city}"}</span>, <span className="text-neuro-orange font-mono">{"{state}"}</span> before sending</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ ADD PROSPECT MODAL ═══════════ */}
      {showAddModal && <AddProspectModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); fetchData(); showToast("Prospect added"); }} />}

      {/* ═══════════ IMPORT CSV MODAL ═══════════ */}
      {showImportModal && <ImportCSVModal onClose={() => setShowImportModal(false)} onImported={(count) => { setShowImportModal(false); fetchData(); showToast(`${count} prospects imported`); }} />}

      {/* ═══════════ DETAIL/EDIT MODAL ═══════════ */}
      {showDetailModal && (
        <ProspectDetailModal
          prospect={showDetailModal}
          scripts={scripts}
          onClose={() => setShowDetailModal(null)}
          onCopy={copyScript}
          onStatusChange={async (status) => { await changeStatus(showDetailModal, status); setShowDetailModal(null); }}
          onDelete={async () => { await deleteProspect(showDetailModal.id); setShowDetailModal(null); fetchData(); showToast("Prospect deleted"); }}
          onSave={async (data) => { await updateProspect(showDetailModal.id, data); setShowDetailModal(null); fetchData(); showToast("Prospect updated"); }}
        />
      )}
    </div>
  );
}

// ── Queue Card Component ──
function QueueCard({ prospect, scripts, onCopy, onMarkDone, onStatusChange, onViewDetails, onRefresh }: {
  prospect: Prospect;
  scripts: any[];
  onCopy: (template: string, prospect: Prospect) => void;
  onMarkDone: (prospect: Prospect, scriptId?: string) => void;
  onStatusChange: (prospect: Prospect, status: ProspectStatus) => void;
  onViewDetails: (prospect: Prospect) => void;
  onRefresh: () => void;
}) {
  const [showScripts, setShowScripts] = useState(false);
  const [building, setBuilding] = useState(false);
  const [findingEmail, setFindingEmail] = useState(false);
  const isFollowUp = prospect.status === "contacted" || prospect.status === "followed_up";
  const relevantScripts = scripts.filter((s) => isFollowUp ? s.category === "follow_up" : s.category === "first_contact");
  const hasProfile = prospect.notes?.includes("neurochiro.co/directory/");
  const profileLink = prospect.notes?.match(/neurochiro\.co\/directory\/[\w-]+/)?.[0];

  const handleFindEmail = async () => {
    setFindingEmail(true);
    try {
      const result = await findProspectEmail(prospect.id);
      if (result.success && result.email) {
        alert(result.alreadyHad ? `Already has email: ${result.email}` : `Found email: ${result.email}`);
        onRefresh();
      } else {
        alert(result.error || "No email found");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
    setFindingEmail(false);
  };

  const handlePreBuild = async () => {
    setBuilding(true);
    try {
      const result = await preBuildProfile(prospect.id);
      setBuilding(false);
      if (result.success && result.profileUrl) {
        navigator.clipboard.writeText(result.profileUrl);
        onRefresh();
        alert(`Profile created!${result.emailSent ? ' Initial email sent automatically!' : ' No email on file — DM them manually.'}\n\nLink copied: ${result.profileUrl}`);
      } else {
        alert(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setBuilding(false);
      alert(`Error: ${err.message || 'Failed to pre-build profile'}`);
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:bg-white/[0.03] transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-neuro-orange/10 flex items-center justify-center text-neuro-orange font-black text-sm">
            {prospect.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{prospect.name}</p>
            {prospect.clinic_name && <p className="text-xs text-neuro-orange font-bold">{prospect.clinic_name}</p>}
            <p className="text-xs text-gray-500">
              {prospect.city}, {prospect.state}
              {prospect.instagram_handle && <span className="ml-2 text-pink-400">IG: @{prospect.instagram_handle.replace("@", "")}</span>}
              {(prospect as any).facebook && <span className="ml-2 text-blue-400">FB</span>}
              {prospect.email && <span className="ml-2 text-green-400">Email</span>}
              {prospect.phone && <span className="ml-2 text-yellow-400">Phone</span>}
              {!prospect.instagram_handle && !(prospect as any).facebook && !prospect.email && !prospect.phone && <span className="ml-2 text-red-400">No contact info</span>}
            </p>
            {hasProfile && profileLink && (
              <p className="text-xs text-green-400 font-bold mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Profile live: {profileLink}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!prospect.email && prospect.website && (
            <button onClick={handleFindEmail} disabled={findingEmail} className="px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 flex items-center gap-1.5 disabled:opacity-50">
              {findingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
              {findingEmail ? "Finding..." : "Find Email"}
            </button>
          )}
          {!hasProfile && (
            <button onClick={handlePreBuild} disabled={building} className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-xs font-bold text-green-400 hover:bg-green-500/20 flex items-center gap-1.5 disabled:opacity-50">
              {building ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {building ? "Building..." : "Pre-Build Profile"}
            </button>
          )}
          <button onClick={() => setShowScripts(!showScripts)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 flex items-center gap-1.5">
            <Copy className="w-3 h-3" /> {showScripts ? "Hide Scripts" : "Copy DM"}
          </button>
          <button onClick={() => onMarkDone(prospect)} className="px-3 py-2 bg-neuro-orange rounded-lg text-xs font-bold text-white hover:bg-neuro-orange-light flex items-center gap-1.5">
            <Check className="w-3 h-3" /> {isFollowUp ? "Followed Up" : "Contacted"}
          </button>
          <button onClick={() => onStatusChange(prospect, "not_interested")} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg" title="Skip — not a good fit">
            <XCircle className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onViewDetails(prospect)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {showScripts && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
          {!hasProfile && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-2">
              <p className="text-xs font-bold text-yellow-400">Click "Pre-Build Profile" first — then copy a DM script with their profile link auto-filled.</p>
            </div>
          )}
          {relevantScripts.map((script) => (
            <div key={script.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
              <div>
                <p className="text-xs font-bold text-white">{script.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{script.description}</p>
              </div>
              <button onClick={() => onCopy(script.template, prospect)} className="px-3 py-1.5 bg-neuro-orange/10 text-neuro-orange rounded-lg text-xs font-bold hover:bg-neuro-orange/20 flex items-center gap-1">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
          ))}
        </div>
      )}
      {prospect.notes && !hasProfile && <p className="mt-3 text-xs text-gray-500 italic">Note: {prospect.notes}</p>}
    </div>
  );
}

// ── Add Prospect Modal ──
function AddProspectModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = await addProspect({
      name: form.get("name") as string,
      instagram_handle: form.get("instagram_handle") as string || undefined,
      facebook: form.get("facebook") as string || undefined,
      email: form.get("email") as string || undefined,
      website: form.get("website") as string || undefined,
      phone: form.get("phone") as string || undefined,
      clinic_name: form.get("clinic_name") as string || undefined,
      city: form.get("city") as string,
      state: form.get("state") as string,
      notes: form.get("notes") as string || undefined,
    });
    setSaving(false);
    if (result.success) onAdded();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0F172A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Add Prospect</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="name" required placeholder="Full Name *" className="col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
            <input name="instagram_handle" placeholder="@instagram" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
            <input name="facebook" placeholder="Facebook page URL" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
            <input name="email" type="email" placeholder="Email" className="col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
            <input name="clinic_name" placeholder="Clinic / Office Name" className="col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
            <input name="city" required placeholder="City *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
            <select name="state" required className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-neuro-orange">
              <option value="">State *</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input name="phone" placeholder="Phone" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
            <input name="website" placeholder="Website" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange" />
          </div>
          <textarea name="notes" placeholder="Notes (optional)" rows={2} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange resize-none" />
          <button type="submit" disabled={saving} className="w-full py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? "Adding..." : "Add Prospect"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Import CSV Modal ──
function ImportCSVModal({ onClose, onImported }: { onClose: () => void; onImported: (count: number) => void }) {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setPreview(rows.slice(0, 100));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    const prospects = preview.map((row) => ({
      name: row.name || row.full_name || row.doctor || "",
      instagram_handle: row.instagram || row.instagram_handle || row.ig || "",
      email: row.email || "",
      website: row.website || row.url || "",
      phone: row.phone || "",
      clinic_name: row.clinic || row.clinic_name || row.practice || "",
      city: row.city || "",
      state: row.state || "",
    })).filter((p) => p.name && p.city);

    const result = await bulkAddProspects(prospects);
    setImporting(false);
    if (result.success) onImported(result.count);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#0F172A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Import CSV</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <p className="text-sm font-bold text-white mb-2">CSV Format Required:</p>
            <p className="text-xs text-gray-400 font-mono">name, instagram, email, website, phone, clinic, city, state</p>
            <p className="text-xs text-gray-600 mt-2">Headers are flexible — we'll match: name/full_name/doctor, instagram/ig/instagram_handle, clinic/clinic_name/practice, etc.</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white file:mr-4 file:bg-neuro-orange file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:text-sm file:font-bold" />
          {preview.length > 0 && (
            <>
              <p className="text-sm text-gray-400">{preview.length} rows found. Preview:</p>
              <div className="max-h-48 overflow-auto bg-white/5 rounded-xl p-4 text-xs text-gray-300 font-mono space-y-1">
                {preview.slice(0, 5).map((row, i) => (
                  <div key={i}>{row.name || row.full_name} — {row.city}, {row.state} {row.instagram ? `(@${row.instagram})` : ""}</div>
                ))}
                {preview.length > 5 && <div className="text-gray-600">... and {preview.length - 5} more</div>}
              </div>
              <button onClick={handleImport} disabled={importing} className="w-full py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? "Importing..." : `Import ${preview.length} Prospects`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Prospect Detail Modal ──
function ProspectDetailModal({ prospect, scripts, onClose, onCopy, onStatusChange, onDelete, onSave }: {
  prospect: Prospect;
  scripts: any[];
  onClose: () => void;
  onCopy: (template: string, prospect: Prospect) => void;
  onStatusChange: (status: ProspectStatus) => void;
  onDelete: () => void;
  onSave: (data: Partial<Prospect>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(prospect.notes || "");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0F172A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0F172A] z-10">
          <h3 className="text-lg font-black text-white">{prospect.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Info */}
          <div className="space-y-3">
            {prospect.clinic_name && <div className="flex items-center gap-3 text-sm text-gray-300"><Building2 className="w-4 h-4 text-gray-500" /> {prospect.clinic_name}</div>}
            <div className="flex items-center gap-3 text-sm text-gray-300"><Globe className="w-4 h-4 text-gray-500" /> {prospect.city}, {prospect.state}</div>
            {prospect.instagram_handle && <div className="flex items-center gap-3 text-sm text-neuro-orange font-bold"><Instagram className="w-4 h-4" /> @{prospect.instagram_handle.replace("@", "")}</div>}
            {prospect.email && <div className="flex items-center gap-3 text-sm text-gray-300"><Mail className="w-4 h-4 text-gray-500" /> {prospect.email}</div>}
            {prospect.phone && <div className="flex items-center gap-3 text-sm text-gray-300"><Phone className="w-4 h-4 text-gray-500" /> {prospect.phone}</div>}
            {prospect.website && <div className="flex items-center gap-3 text-sm text-gray-300"><Globe className="w-4 h-4 text-gray-500" /> {prospect.website}</div>}
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as ProspectStatus[]).map((status) => {
                const config = STATUS_CONFIG[status];
                const isActive = prospect.status === status;
                return (
                  <button
                    key={status}
                    onClick={() => onStatusChange(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${isActive ? `${config.bg} ${config.color} ring-1 ring-current` : "bg-white/5 text-gray-500 hover:bg-white/10"}`}
                  >
                    <config.icon className="w-3 h-3" /> {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this prospect..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange resize-none"
            />
            {notes !== (prospect.notes || "") && (
              <button onClick={() => onSave({ notes })} className="mt-2 px-4 py-2 bg-neuro-orange rounded-lg text-xs font-bold text-white">Save Notes</button>
            )}
          </div>

          {/* Quick DM Copy */}
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Quick Copy DM</p>
            <div className="space-y-2">
              {scripts.filter((s) => s.category === "first_contact").slice(0, 3).map((script) => (
                <button
                  key={script.id}
                  onClick={() => onCopy(script.template, prospect)}
                  className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <span className="text-xs font-bold text-white">{script.name}</span>
                  <Copy className="w-3.5 h-3.5 text-neuro-orange" />
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Timeline</p>
            <div className="space-y-2 text-xs text-gray-500">
              <p>Added: {new Date(prospect.created_at).toLocaleDateString()}</p>
              {prospect.contacted_at && <p>First contacted: {new Date(prospect.contacted_at).toLocaleDateString()}</p>}
              {prospect.follow_up_count > 0 && <p>Follow-ups sent: {prospect.follow_up_count}</p>}
              {prospect.responded_at && <p>Responded: {new Date(prospect.responded_at).toLocaleDateString()}</p>}
              {prospect.signed_up_at && <p className="text-green-400 font-bold">Signed up: {new Date(prospect.signed_up_at).toLocaleDateString()}</p>}
            </div>
          </div>

          {/* Delete */}
          <button onClick={() => { if (confirm("Delete this prospect?")) onDelete(); }} className="w-full py-2 text-red-500 text-xs font-bold hover:bg-red-500/10 rounded-lg transition-all flex items-center justify-center gap-2">
            <Trash2 className="w-3 h-3" /> Delete Prospect
          </button>
        </div>
      </div>
    </div>
  );
}
