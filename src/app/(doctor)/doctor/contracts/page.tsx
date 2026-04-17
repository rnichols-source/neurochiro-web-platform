"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Search, Copy, Check, Edit3, X, FileText, Users, Building2, Puzzle, Shield, Zap, Lock, ChevronDown } from "lucide-react";

interface ContractTemplate {
  id: string;
  title: string;
  category: 'employment' | 'patient' | 'operations' | 'clause';
  tags: string[];
  description: string;
  content: string;
  price: number;
  wordCount: number;
  pageEstimate: number;
}

const CATEGORY_META = {
  employment: { label: "Employment & Associates", icon: Users, color: "text-blue-500 bg-blue-50" },
  patient: { label: "Patient Agreements", icon: Shield, color: "text-green-500 bg-green-50" },
  operations: { label: "Practice Operations", icon: Building2, color: "text-purple-500 bg-purple-50" },
  clause: { label: "Clause Library", icon: Puzzle, color: "text-orange-500 bg-orange-50" },
};

const TABS = [
  { key: "all", label: "All Templates" },
  { key: "employment", label: "Employment" },
  { key: "patient", label: "Patient" },
  { key: "operations", label: "Operations" },
  { key: "clause", label: "Clause Library" },
] as const;

// Lazy import templates
let ALL_TEMPLATES: ContractTemplate[] = [];
try {
  const emp = require("./contracts-employment");
  const po = require("./contracts-patient-ops");
  const cl = require("./contracts-clauses");
  ALL_TEMPLATES = [
    ...(emp.EMPLOYMENT_TEMPLATES || []),
    ...(po.PATIENT_TEMPLATES || []),
    ...(po.OPERATIONS_TEMPLATES || []),
    ...(cl.CLAUSE_LIBRARY || []),
  ];
} catch {
  // Files not created yet
}

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      try {
        const { data } = await (supabase as any)
          .from('course_purchases')
          .select('course_id')
          .eq('user_id', user.id);
        setPurchasedIds((data || []).map((r: any) => r.course_id));
      } catch {}
    });
  }, []);

  const hasBundled = purchasedIds.includes('contract-bundle');

  const filtered = useMemo(() => {
    let items = ALL_TEMPLATES;
    if (activeTab !== "all") {
      items = items.filter(item => item.category === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [activeTab, searchQuery]);

  const templates = filtered.filter(t => t.category !== 'clause');
  const clauses = filtered.filter(t => t.category === 'clause');
  const showTemplates = activeTab !== 'clause';
  const showClauses = activeTab === 'all' || activeTab === 'clause';

  const isUnlocked = (item: ContractTemplate) => {
    if (item.price === 0) return hasBundled; // Clauses are free with bundle
    return hasBundled || purchasedIds.includes(item.id);
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (item: ContractTemplate) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  const handleCopyEdited = async (id: string) => {
    await navigator.clipboard.writeText(editContent);
    setCopiedId(id);
    setEditingId(null);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalIndividualPrice = ALL_TEMPLATES
    .filter(t => t.category !== 'clause' && t.price > 0)
    .reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-black text-neuro-navy flex items-center gap-3">
          <FileText className="w-7 h-7 text-neuro-orange" /> Contract Templates
        </h1>
        <p className="text-gray-500 text-sm mt-1">Professionally drafted, chiropractic-specific legal templates. Customize and use.</p>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Disclaimer:</strong> These templates are provided for educational and reference purposes. They are not a substitute for legal advice from a licensed attorney in your jurisdiction. Laws vary by state, and you should have any contract reviewed by an attorney before use. NeuroChiro is not a law firm and does not provide legal services.
        </p>
      </div>

      {/* Bundle CTA */}
      {!hasBundled && (
        <div className="bg-neuro-navy rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-neuro-orange" />
                <span className="text-xs font-black uppercase tracking-widest text-neuro-orange">Complete Bundle</span>
              </div>
              <h2 className="text-xl font-black text-white mb-1">All 12 Templates + Clause Library</h2>
              <p className="text-gray-400 text-sm">Everything you need to legally protect your practice. Use forever.</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-3xl font-black text-white">$99</span>
                <span className="text-gray-400 line-through">${totalIndividualPrice}</span>
                <span className="bg-neuro-orange/20 text-neuro-orange text-xs font-black px-2 py-0.5 rounded-full">Save ${totalIndividualPrice - 99}</span>
              </div>
            </div>
            <button className="px-6 py-3 bg-neuro-orange text-white rounded-xl font-black text-sm hover:bg-neuro-orange/90 transition-colors whitespace-nowrap">
              Get the Bundle — $99
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-neuro-orange text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:text-neuro-navy hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Templates */}
      {showTemplates && templates.length > 0 && (
        <div className="space-y-3 mb-8">
          {templates.map(item => {
            const meta = CATEGORY_META[item.category];
            const Icon = meta.icon;
            const unlocked = isUnlocked(item);
            const isExpanded = expandedId === item.id;
            const isEditing = editingId === item.id;
            const previewLength = 300;
            const preview = item.content.slice(0, previewLength) + (item.content.length > previewLength ? '...' : '');

            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 transition-all hover:border-gray-200 hover:shadow-sm">
                {/* Header */}
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : item.id);
                    setEditingId(null);
                  }}
                  className="w-full text-left p-5 flex items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-neuro-navy">{item.title}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-bold text-gray-400">{item.wordCount.toLocaleString()} words</span>
                      <span className="text-[10px] font-bold text-gray-400">~{item.pageEstimate} pages</span>
                      <div className="flex gap-1.5">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {unlocked ? (
                      <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded">Owned</span>
                    ) : (
                      <span className="font-black text-neuro-navy">${item.price}</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5">
                    {unlocked ? (
                      isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-500">Customize before copying</p>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full h-96 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange resize-y font-mono leading-relaxed"
                          />
                          <button
                            onClick={() => handleCopyEdited(item.id)}
                            className="px-4 py-2 bg-neuro-orange text-white rounded-lg font-bold text-xs hover:bg-neuro-orange/90 transition-colors flex items-center gap-1.5"
                          >
                            {copiedId === item.id ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Customized</>}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="bg-gray-50 rounded-xl p-5 mb-3 max-h-[500px] overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{item.content}</pre>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCopy(item.id, item.content)}
                              className="px-4 py-2 bg-neuro-navy text-white rounded-lg font-bold text-xs hover:bg-neuro-navy/90 transition-colors flex items-center gap-1.5"
                            >
                              {copiedId === item.id ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Customize
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div>
                        <div className="bg-gray-50 rounded-xl p-5 mb-3 relative overflow-hidden">
                          <pre className="whitespace-pre-wrap text-sm text-gray-400 font-sans leading-relaxed">{preview}</pre>
                          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="px-5 py-2.5 bg-neuro-orange text-white rounded-lg font-bold text-xs hover:bg-neuro-orange/90 transition-colors flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" /> Unlock — ${item.price}
                          </button>
                          <span className="text-xs text-gray-400">or get all templates for $99</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Clause Library */}
      {showClauses && clauses.length > 0 && (
        <div>
          {activeTab === 'all' && (
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Puzzle className="w-4 h-4 text-neuro-orange" /> Clause Library
              <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full normal-case tracking-normal">Free with Bundle</span>
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clauses.map(item => {
              const unlocked = isUnlocked(item);
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id} className={`bg-white rounded-xl border border-gray-100 transition-all ${unlocked ? 'hover:border-gray-200' : 'opacity-60'}`}>
                  <button
                    onClick={() => {
                      if (!unlocked) return;
                      setExpandedId(isExpanded ? null : item.id);
                      setEditingId(null);
                    }}
                    disabled={!unlocked}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                        {unlocked ? <Puzzle className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-neuro-navy truncate">{item.title}</h4>
                        <p className="text-gray-400 text-xs truncate">{item.description}</p>
                      </div>
                    </div>
                  </button>
                  {isExpanded && unlocked && (
                    <div className="border-t border-gray-100 p-4">
                      <div className="bg-gray-50 rounded-xl p-4 mb-3 max-h-64 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans leading-relaxed">{item.content}</pre>
                      </div>
                      <button
                        onClick={() => handleCopy(item.id, item.content)}
                        className="px-3 py-1.5 bg-neuro-navy text-white rounded-lg font-bold text-[10px] hover:bg-neuro-navy/90 transition-colors flex items-center gap-1"
                      >
                        {copiedId === item.id ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Clause</>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 font-bold">No templates found. Try a different search or category.</p>
        </div>
      )}

      {/* Bottom Disclaimer */}
      <div className="mt-8 text-center">
        <p className="text-[10px] text-gray-300 max-w-lg mx-auto leading-relaxed">
          All templates include [BRACKETED PLACEHOLDERS] for customization. Replace all placeholders with your specific information before use. Have an attorney in your state review any contract before execution.
        </p>
      </div>
    </div>
  );
}
