"use client";
import UpgradeGate from "@/components/doctor/UpgradeGate";

import { useState, useMemo, useEffect } from "react";
import { Search, Copy, Check, Edit3, X, FileText, Mail, Share2, Layers, Sparkles, Lock, Zap } from "lucide-react";
import { createDoctorSubscriptionCheckout, hasPurchased } from "../purchase-actions";

// Will import from content-data.ts once it's created
// For now, define the type
interface ContentItem {
  id: string;
  title: string;
  category: 'handout' | 'template' | 'social' | 'sequence';
  tags: string[];
  description: string;
  content: string;
  createdAt: string;
}

const CATEGORY_META = {
  handout: { label: "Patient Handouts", icon: FileText, color: "text-blue-500 bg-blue-50" },
  template: { label: "Text/Email Templates", icon: Mail, color: "text-green-500 bg-green-50" },
  social: { label: "Social Media", icon: Share2, color: "text-purple-500 bg-purple-50" },
  sequence: { label: "Email Sequences", icon: Layers, color: "text-orange-500 bg-orange-50" },
};

const TABS = [
  { key: "all", label: "All" },
  { key: "handout", label: "Handouts" },
  { key: "template", label: "Templates" },
  { key: "social", label: "Social Media" },
  { key: "sequence", label: "Sequences" },
] as const;

const FREE_LIMIT = 5;

// Lazy import to avoid build issues if file doesn't exist yet
let CONTENT_LIBRARY: ContentItem[] = [];
try {
  CONTENT_LIBRARY = require("./content-data").CONTENT_LIBRARY;
} catch {
  // Content data not created yet
}

export default function ContentLibraryPage() {
  return (
    <UpgradeGate feature="Content Library" requiredTier="growth" description="Access ready-to-use patient education content, social media templates, and practice resources.">
      <ContentLibraryContent />
    </UpgradeGate>
  );
}

function ContentLibraryContent() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    hasPurchased('content-library').then(setIsSubscribed).catch(() => {});
  }, []);

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);

  const filtered = useMemo(() => {
    let items = CONTENT_LIBRARY;
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

  const isLocked = (index: number) => !isSubscribed && index >= FREE_LIMIT;

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  const handleCopyEdited = async (id: string) => {
    await navigator.clipboard.writeText(editContent);
    setCopiedId(id);
    setEditingId(null);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-black text-neuro-navy flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-neuro-orange" /> Content Library
        </h1>
        <p className="text-gray-500 text-sm mt-1">Pre-written patient education content. Find it, copy it, send it. Done.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search content..."
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

      {/* Subscription CTA (if not subscribed and scrolled past free items) */}
      {!isSubscribed && filtered.length > FREE_LIMIT && (
        <div className="bg-neuro-navy rounded-xl p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-neuro-orange flex-shrink-0" />
            <div>
              <p className="text-white font-bold text-sm">Unlock all {CONTENT_LIBRARY.length} pieces of content</p>
              <p className="text-gray-400 text-xs">New content added every month. Cancel anytime.</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const result = await createDoctorSubscriptionCheckout('Patient Education Content Library', 2900, '/doctor/content-library');
              if (result.url) window.location.href = result.url;
              else alert(result.error);
            }}
            className="px-5 py-2.5 bg-neuro-orange text-white rounded-lg font-bold text-xs hover:bg-neuro-orange/90 transition-colors whitespace-nowrap"
          >
            $29/month
          </button>
        </div>
      )}

      {/* Content Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 font-bold">No content found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, index) => {
            const locked = isLocked(index);
            const meta = CATEGORY_META[item.category];
            const isNew = item.createdAt > thirtyDaysAgo;
            const isExpanded = expandedId === item.id;
            const isEditing = editingId === item.id;
            const Icon = meta.icon;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border border-gray-100 transition-all ${
                  locked ? "opacity-60" : "hover:border-gray-200 hover:shadow-sm"
                }`}
              >
                {/* Card Header — always visible */}
                <button
                  onClick={() => {
                    if (locked) return;
                    setExpandedId(isExpanded ? null : item.id);
                    setEditingId(null);
                  }}
                  disabled={locked}
                  className="w-full text-left p-4 flex items-start gap-3"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    {locked ? <Lock className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${locked ? "text-gray-400" : "text-neuro-navy"}`}>{item.title}</h3>
                      {isNew && !locked && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-neuro-orange bg-neuro-orange/10 px-1.5 py-0.5 rounded">New</span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${locked ? "text-gray-300" : "text-gray-500"}`}>{item.description}</p>
                    <div className="flex gap-1.5 mt-2">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                  {locked && (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded flex-shrink-0">PRO</span>
                  )}
                </button>

                {/* Expanded Content */}
                {isExpanded && !locked && (
                  <div className="border-t border-gray-100 p-4">
                    {isEditing ? (
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
                          className="w-full h-64 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange resize-y font-mono"
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
                        <div className="bg-gray-50 rounded-xl p-4 mb-3 max-h-96 overflow-y-auto">
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
