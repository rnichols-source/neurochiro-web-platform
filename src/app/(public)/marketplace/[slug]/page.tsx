"use client";

import * as React from "react";
import { ExternalLink, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export default function VendorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);

  // TODO: fetch vendor from Supabase by slug
  const vendor = {
    name: "NeuralPulse Technologies",
    logo_url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=100&h=100",
    categories: ["Neurological Tech"],
    full_description:
      "NeuralPulse provides accurate nervous-system assessment tools for chiropractic professionals. Their wireless thermal scanning technology integrates with the NeuroChiro platform to deliver real-time patient reports.",
    website_url: "https://neuralpulse.tech",
    benefits: [
      "Wireless, high-speed thermal scanning",
      "Instant patient-facing educational reports",
      "Automated care plan recommendations",
      "Cloud-based dashboard for multi-clinic data",
    ],
  };

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20 text-neuro-navy">
      <div className="max-w-4xl mx-auto px-6">
        <Breadcrumbs className="mb-6" />

        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-neuro-orange transition-colors group mb-12"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Marketplace
        </Link>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center gap-10 bg-white p-10 md:p-12 rounded-2xl border border-gray-100 shadow-sm mb-8">
          <img
            loading="lazy"
            decoding="async"
            src={vendor.logo_url}
            alt={vendor.name}
            className="w-24 h-24 rounded-2xl object-cover border border-gray-100"
          />
          <div className="space-y-3">
            <span className="px-4 py-1.5 bg-neuro-navy/5 text-neuro-navy text-[10px] font-black uppercase tracking-widest rounded-full inline-block">
              {vendor.categories[0]}
            </span>
            <h1 className="text-4xl font-heading font-black">{vendor.name}</h1>
          </div>
        </header>

        {/* Description */}
        <section className="bg-white p-10 md:p-12 rounded-2xl border border-gray-100 shadow-sm mb-8">
          <h2 className="text-2xl font-heading font-black mb-6">About</h2>
          <p className="text-gray-500 text-lg leading-relaxed mb-10">
            {vendor.full_description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendor.benefits.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <CheckCircle2 className="w-5 h-5 text-neuro-orange shrink-0" />
                <span className="text-sm font-bold">{b}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Website Link */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <a
            href={vendor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all uppercase tracking-widest text-[10px]"
          >
            Visit Website <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
