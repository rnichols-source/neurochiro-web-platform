"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ExternalLink, Loader2, Eye, MousePointerClick, Tag, ChevronDown } from "lucide-react";
import { getVendors, toggleVendorActive, deleteVendor, updateVendorTier } from "./actions";

const TIERS = [
  { value: 'starter', label: 'Starter', color: 'bg-gray-100 text-gray-700' },
  { value: 'growth', label: 'Growth', color: 'bg-blue-100 text-blue-700' },
  { value: 'partner', label: 'Partner', color: 'bg-neuro-orange/10 text-neuro-orange' },
];

export default function AdminMarketplacePage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getVendors();
    setVendors(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(id: string, currentActive: boolean) {
    await toggleVendorActive(id, !currentActive);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this vendor permanently?")) return;
    await deleteVendor(id);
    load();
  }

  async function handleTierChange(id: string, tier: string) {
    await updateVendorTier(id, tier);
    load();
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const pending = vendors.filter(v => !v.is_active);
  const active = vendors.filter(v => v.is_active);

  // Aggregate stats
  const totalViews = active.reduce((s, v) => s + (v.profile_views || 0), 0);
  const totalClicks = active.reduce((s, v) => s + (v.website_clicks || 0), 0);
  const totalDiscounts = active.reduce((s, v) => s + (v.discount_clicks || 0), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-heading font-black text-neuro-navy">Marketplace — Vendor Management</h1>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Vendors</p>
            <p className="text-2xl font-black text-neuro-navy">{active.length}</p>
          </div>
          <Tag className="w-8 h-8 text-neuro-orange/30" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Profile Views</p>
            <p className="text-2xl font-black text-blue-600">{totalViews.toLocaleString()}</p>
          </div>
          <Eye className="w-8 h-8 text-blue-200" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Website Clicks</p>
            <p className="text-2xl font-black text-purple-600">{totalClicks.toLocaleString()}</p>
          </div>
          <MousePointerClick className="w-8 h-8 text-purple-200" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Discount Clicks</p>
            <p className="text-2xl font-black text-green-600">{totalDiscounts.toLocaleString()}</p>
          </div>
          <Tag className="w-8 h-8 text-green-200" />
        </div>
      </div>

      {/* Pending Approval */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-black text-yellow-600 uppercase tracking-widest mb-3">Pending Approval ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(v => (
              <div key={v.id} className="bg-white border-2 border-yellow-200 rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-neuro-navy">{v.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{v.short_description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {v.website_url && <a href={v.website_url} target="_blank" rel="noopener noreferrer" className="text-neuro-orange hover:underline flex items-center gap-1">{v.website_url} <ExternalLink className="w-3 h-3" /></a>}
                    {v.categories?.length > 0 && <span>{v.categories.join(", ")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(v.id, false)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Vendors */}
      <div>
        <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-3">Active Vendors ({active.length})</h2>
        {active.length === 0 ? (
          <p className="text-gray-400 text-sm">No active vendors yet.</p>
        ) : (
          <div className="space-y-3">
            {active.map(v => (
              <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-neuro-navy">{v.name}</h3>
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{v.short_description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {v.slug && <span>/marketplace/{v.slug}</span>}
                      {v.website_url && <a href={v.website_url} target="_blank" rel="noopener noreferrer" className="text-neuro-orange hover:underline flex items-center gap-1">Website <ExternalLink className="w-3 h-3" /></a>}
                      {v.categories?.length > 0 && <span>{v.categories.join(", ")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Tier Selector */}
                    <div className="relative">
                      <select
                        value={v.tier || 'starter'}
                        onChange={(e) => handleTierChange(v.id, e.target.value)}
                        className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                          TIERS.find(t => t.value === v.tier)?.color || TIERS[0].color
                        }`}
                      >
                        {TIERS.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                    </div>
                    <button
                      onClick={() => handleToggle(v.id, true)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200"
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="px-2 py-1.5 text-red-400 hover:text-red-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Vendor Stats Row */}
                <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Eye className="w-3 h-3" />
                    <span className="font-bold text-neuro-navy">{(v.profile_views || 0).toLocaleString()}</span> views
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MousePointerClick className="w-3 h-3" />
                    <span className="font-bold text-neuro-navy">{(v.website_clicks || 0).toLocaleString()}</span> clicks
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Tag className="w-3 h-3" />
                    <span className="font-bold text-neuro-navy">{(v.discount_clicks || 0).toLocaleString()}</span> discount
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
