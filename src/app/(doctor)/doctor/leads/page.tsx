"use client";

import { useState, useEffect } from "react";
import { Users, Loader2, ChevronRight, MessageSquare, Phone, Mail, Calendar, CheckCircle2 } from "lucide-react";
import { getLeadPipeline, updateLeadStage, updateLeadNotes } from "./actions";
import UpgradeGate from "@/components/doctor/UpgradeGate";

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-blue-500', border: 'border-blue-500/20' },
  { key: 'contacted', label: 'Contacted', color: 'bg-amber-500', border: 'border-amber-500/20' },
  { key: 'scheduled', label: 'Scheduled', color: 'bg-violet-500', border: 'border-violet-500/20' },
  { key: 'converted', label: 'Converted', color: 'bg-emerald-500', border: 'border-emerald-500/20' },
];

export default function LeadsPage() {
  return (
    <UpgradeGate feature="Patient Lead Pipeline" requiredTier="pro" description="Track and manage your patient leads through every stage of the conversion funnel.">
      <LeadsPipelineContent />
    </UpgradeGate>
  );
}

function LeadsPipelineContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('new');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ id: string; notes: string } | null>(null);

  async function load() {
    setLoading(true);
    const result = await getLeadPipeline();
    setData(result);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleStageChange(leadId: string, newStage: string) {
    await updateLeadStage(leadId, newStage);
    load();
  }

  async function handleSaveNotes(leadId: string, notes: string) {
    await updateLeadNotes(leadId, notes);
    setEditingNotes(null);
    load();
  }

  if (loading) {
    return <div className="p-10 flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  const leads = data?.leads || [];
  const stageCounts = data?.stageCounts || { new: 0, contacted: 0, scheduled: 0, converted: 0 };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-6 h-6 text-neuro-orange" />
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Patient Leads</h1>
          </div>
          <p className="text-white/30 text-sm">Track every lead from first contact to converted patient.</p>
        </div>
        {data?.conversionRate != null && (
          <div className="text-right">
            <p className="text-2xl font-black text-emerald-400">{data.conversionRate}%</p>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">Conversion Rate</p>
          </div>
        )}
      </div>

      {/* Stage Tabs */}
      <div className="flex gap-2">
        {STAGES.map(stage => (
          <button
            key={stage.key}
            onClick={() => setActiveTab(stage.key)}
            className={`flex-1 py-3 rounded-xl text-center text-sm font-bold transition-all ${
              activeTab === stage.key
                ? `${stage.color} text-white`
                : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
            }`}
          >
            {stage.label} ({stageCounts[stage.key as keyof typeof stageCounts]})
          </button>
        ))}
      </div>

      {/* Lead Cards */}
      {leads.filter((l: any) => (l.stage || 'new') === activeTab).length === 0 ? (
        <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-8 text-center">
          <p className="text-white/30 text-sm">No leads in this stage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads
            .filter((l: any) => (l.stage || 'new') === activeTab)
            .map((lead: any) => {
              const isExpanded = expandedLead === lead.id;
              const currentStageIdx = STAGES.findIndex(s => s.key === (lead.stage || 'new'));
              const nextStage = currentStageIdx < STAGES.length - 1 ? STAGES[currentStageIdx + 1] : null;

              return (
                <div key={lead.id} className="bg-[#162231] rounded-xl border border-white/[0.06] overflow-hidden">
                  <button
                    onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neuro-orange/10 flex items-center justify-center text-neuro-orange font-bold text-sm">
                        {(lead.first_name || '?')[0]}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{lead.first_name} {lead.last_name || ''}</p>
                        <div className="flex items-center gap-3 text-[10px] text-white/30">
                          <span className="capitalize">{lead.source || 'direct'}</span>
                          <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-white/20 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-3">
                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-3 text-xs text-white/40">
                        {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                        {lead.last_contacted_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Last contacted: {new Date(lead.last_contacted_at).toLocaleDateString()}</span>}
                      </div>

                      {/* Notes */}
                      {editingNotes?.id === lead.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingNotes?.notes || ''}
                            onChange={e => setEditingNotes({ id: lead.id, notes: e.target.value })}
                            rows={3}
                            className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm resize-none focus:outline-none focus:border-neuro-orange"
                            placeholder="Add notes about this lead..."
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveNotes(lead.id, editingNotes?.notes || '')} className="px-4 py-1.5 bg-neuro-orange text-white text-xs font-bold rounded-lg">Save</button>
                            <button onClick={() => setEditingNotes(null)} className="px-4 py-1.5 text-white/30 text-xs">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingNotes({ id: lead.id, notes: lead.notes || '' })}
                          className="text-xs text-white/30 hover:text-neuro-orange transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> {lead.notes ? lead.notes.slice(0, 80) + (lead.notes.length > 80 ? '...' : '') : 'Add notes'}
                        </button>
                      )}

                      {/* Stage Actions */}
                      {nextStage && (
                        <button
                          onClick={() => handleStageChange(lead.id, nextStage.key)}
                          className={`w-full py-2.5 ${nextStage.color} text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2`}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Move to {nextStage.label}
                        </button>
                      )}
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
