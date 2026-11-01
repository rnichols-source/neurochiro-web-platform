"use client";

import { Settings, Eye, MousePointerClick, Users, ExternalLink, Tag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { updateVendorProfile } from "@/app/actions/vendors";
import { VENDOR_CATEGORY_OPTIONS } from "@/types/vendor";
import SynapsePanel from "./synapse-panel";
import type { VendorSynapse } from "./synapse-actions";

type Dash = {
  profile: {
    name: string;
    role: string | null;
    website_url: string;
    short_description: string;
    categories: string[];
    slug: string | null;
  };
  stats: {
    views: number;
    clicks: number;
    engagement: number;
    networkDoctors: number;
  };
};

export default function DashboardClient({
  data,
  synapse,
}: {
  data: Dash | null;
  synapse: VendorSynapse | { error: string };
}) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    companyName: data?.profile.name || "",
    website: data?.profile.website_url || "",
    shortDescription: data?.profile.short_description || "",
    category: data?.profile.categories?.[0] || "software",
  });
  const [profileSaveStatus, setProfileSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileSaveStatus("saving");
    const result = await updateVendorProfile(profileForm);
    if (result.success) {
      setProfileSaveStatus("saved");
      setTimeout(() => { setProfileSaveStatus("idle"); setIsEditingProfile(false); }, 1500);
    } else {
      setProfileSaveStatus("idle");
    }
  };

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neuro-cream p-6 text-center">
        <p className="text-sm text-neuro-navy">Sign in with the vendor account to open this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh space-y-8 bg-neuro-cream p-4 text-neuro-navy md:p-10">
      <header>
        <h1 className="font-heading text-3xl font-black md:text-4xl">Vendor Dashboard</h1>
        <p className="mt-2 text-gray-500">Manage your Synapse seat, perks, and listing.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat label="Profile Views" value={data.stats.views} icon={<Eye className="h-6 w-6" />} />
        <Stat label="Outbound Clicks" value={data.stats.clicks} icon={<MousePointerClick className="h-6 w-6" />} />
        <Stat label="Offer Engagement" value={data.stats.engagement} icon={<Tag className="h-6 w-6" />} />
        <Stat label="Network Reach" value={data.stats.networkDoctors} hint="verified doctors" icon={<Users className="h-6 w-6" />} />
      </div>

      {data.profile.slug ? (
        <Link href={`/marketplace/${data.profile.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-100 bg-white px-5 text-sm font-bold">
          <ExternalLink className="h-4 w-4" /> View public profile
        </Link>
      ) : null}

      <SynapsePanel initial={synapse} />

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <button type="button" onClick={() => setIsEditingProfile(!isEditingProfile)} className="flex min-h-11 w-full items-center justify-between p-6 hover:bg-gray-50">
          <span className="flex items-center gap-3 font-heading text-lg font-black"><Settings className="h-5 w-5 text-gray-400" /> Edit public profile</span>
          <span className="text-xs text-gray-400">{isEditingProfile ? "Close" : "Expand"}</span>
        </button>
        {isEditingProfile ? (
          <form onSubmit={handleProfileSave} className="space-y-4 border-t border-gray-100 p-6">
            <input required value={profileForm.companyName} onChange={(event) => setProfileForm({ ...profileForm, companyName: event.target.value })} className="min-h-11 w-full rounded-xl border bg-gray-50 px-3 text-sm font-bold" />
            <input required type="url" value={profileForm.website} onChange={(event) => setProfileForm({ ...profileForm, website: event.target.value })} className="min-h-11 w-full rounded-xl border bg-gray-50 px-3 text-sm font-bold" />
            <select value={profileForm.category} onChange={(event) => setProfileForm({ ...profileForm, category: event.target.value })} className="min-h-11 w-full rounded-xl border bg-gray-50 px-3 text-sm font-bold">
              {VENDOR_CATEGORY_OPTIONS.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
            </select>
            <textarea rows={2} value={profileForm.shortDescription} onChange={(event) => setProfileForm({ ...profileForm, shortDescription: event.target.value })} className="w-full rounded-xl border bg-gray-50 p-3 text-sm" />
            <button type="submit" className="min-h-11 rounded-xl bg-[#D66829] px-6 text-sm font-bold text-white">
              {profileSaveStatus === "saving" ? "Saving..." : profileSaveStatus === "saved" ? "Saved" : "Save profile"}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function Stat({ label, value, hint, icon }: { label: string; value: number; hint?: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-2xl font-black">{value.toLocaleString()}</p>
        {hint ? <p className="text-[10px] text-gray-400">{hint}</p> : null}
      </div>
      {icon}
    </div>
  );
}
