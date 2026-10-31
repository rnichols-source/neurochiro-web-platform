"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Loader2, ChevronRight, MessageSquare, Phone, Mail, Calendar, CheckCircle2 } from "lucide-react";
import { getLeadPipeline, updateLeadStage, updateLeadNotes } from "./actions";
import UpgradeGate from "@/components/doctor/UpgradeGate";

const STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'converted', label: 'Converted' },
] as const;

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
  const openedStage = useRef(false);

  async function load() {
    setLoading(true);
    const result = await getLeadPipeline();
    setData(result);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!data || openedStage.current) return;
    openedStage.current = true;
    const counts = data.stageCounts || {};
    if (counts.new) return;
    const withLeads = STAGES.find((stage) => counts[stage.key] > 0);
    if (withLeads) setActiveTab(withLeads.key);
  }, [data]);

  async function handleStageChange(leadId: string, newStage: string, leadType?: string) {
    const result = await updateLeadStage(leadId, newStage, leadType);
    if (result?.error) alert(result.error);
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
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-portal-accent" aria-hidden />
            <h1 className="text-[26px] leading-8 font-bold text-portal-ink">Patient Leads</h1>
          </div>
          <p className="mt-1 text-[15px] leading-6 text-portal-ink-2">Track every lead from first contact to converted patient.</p>
        </div>
        {data?.conversionRate != null && (
          <div className="text-right">
            <p className="text-2xl font-bold text-portal-success">{data.conversionRate}%</p>
            <p className="text-sm text-portal-muted">Conversion rate</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STAGES.map(stage => (
          <button
            key={stage.key}
            type="button"
            onClick={() => setActiveTab(stage.key)}
            className={`min-h-11 px-3 rounded-lg text-center text-sm font-bold ${
              activeTab === stage.key
                ? 'bg-portal-ink text-white'
                : 'bg-white border border-portal-border text-portal-ink'
            }`}
          >
            {stage.label} ({stageCounts[stage.key as keyof typeof stageCounts] || 0})
          </button>
        ))}
      </div>

      {leads.filter((l: any) => (l.stage || 'new') === activeTab).length === 0 ? (
        <div className="bg-white border border-portal-border rounded-xl px-6 py-10 text-center">
          <p className="text-[15px] leading-6 text-portal-ink-2">No leads in this stage.</p>
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
                <div key={lead.id} className="bg-white rounded-xl border border-portal-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                    className="w-full min-h-11 p-4 text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-portal-accent-50 flex items-center justify-center text-portal-accent font-bold text-sm">
                        {(lead.first_name || '?')[0]}
                      </div>
                      <div>
                        <p className="font-bold text-portal-ink text-sm">{lead.first_name} {lead.last_name || ''}</p>
                        <div className="flex items-center gap-3 text-sm text-portal-muted">
                          <span className="capitalize">{lead.source || 'direct'}</span>
                          <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-portal-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-portal-border pt-3 space-y-3">
                      <div className="flex flex-wrap gap-3 text-sm text-portal-ink-2">
                        {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                        {lead.preferred_time && <span>Best time: {lead.preferred_time}</span>}
                        {lead.last_contacted_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Last contacted: {new Date(lead.last_contacted_at).toLocaleDateString()}</span>}
                      </div>

                      {/* Notes */}
                      {editingNotes?.id === lead.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingNotes?.notes || ''}
                            onChange={e => setEditingNotes({ id: lead.id, notes: e.target.value })}
                            rows={3}
                            className="w-full p-3 bg-white border border-portal-border rounded-xl text-portal-ink text-base resize-none focus:outline-none focus:border-portal-accent"
                            placeholder="Add notes about this lead..."
                          />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleSaveNotes(lead.id, editingNotes?.notes || '')} className="min-h-11 px-4 bg-portal-accent text-white text-sm font-bold rounded-lg">Save</button>
                            <button type="button" onClick={() => setEditingNotes(null)} className="min-h-11 px-4 text-portal-ink-2 text-sm font-bold">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingNotes({ id: lead.id, notes: lead.notes || '' })}
                          className="min-h-11 text-sm text-portal-ink-2 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> {lead.notes ? lead.notes.slice(0, 80) + (lead.notes.length > 80 ? '...' : '') : 'Add notes'}
                        </button>
                      )}

                      {/* Stage Actions */}
                      {nextStage && (
                        <button
                          type="button"
                          onClick={() => handleStageChange(lead.id, nextStage.key, lead._type)}
                          className="w-full min-h-11 bg-portal-ink text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2"
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
