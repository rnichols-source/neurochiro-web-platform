"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Store, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Vendor } from "@/types/vendor";
import { getVendors } from "./actions";

export default function MarketplacePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVendors() {
      const data = await getVendors();
      if (data && data.length > 0) {
        setVendors(data as any);
      }
      setLoading(false);
    }
    loadVendors();
  }, []);

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      {/* Hero */}
      <section className="pt-12 pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] block border border-neuro-orange/20 px-4 py-1.5 rounded-full w-max mx-auto">
            Marketplace
          </span>
          <h1 className="text-5xl font-heading font-black text-neuro-navy leading-tight">
            Marketplace
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto">
            Products and services for nervous system chiropractors. Discover
            verified vendors, technology, and tools for your practice.
          </p>
        </div>
      </section>

      {/* Vendor Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <p className="text-center text-gray-400 py-20">
              Loading vendors...
            </p>
          ) : vendors.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <Store className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-neuro-navy">
                No vendors listed yet
              </h3>
              <p className="text-gray-400 mt-2">
                Check back soon as new vendors join the marketplace.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/marketplace/${vendor.slug}`}
                  className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-neuro-orange transition-all group flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {vendor.logo_url && (
                      <img
                        loading="lazy"
                        decoding="async"
                        src={vendor.logo_url}
                        alt={vendor.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    )}
                    <h3 className="font-bold text-neuro-navy text-lg group-hover:text-neuro-orange transition-colors">
                      {vendor.name}
                    </h3>
                  </div>
                  {vendor.short_description && (
                    <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1">
                      {vendor.short_description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <span className="text-[10px] font-black text-neuro-navy uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Profile <ArrowRight className="w-3 h-3" />
                    </span>
                    {vendor.website_url && (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(vendor.website_url, "_blank");
                        }}
                        className="p-2 bg-gray-50 hover:bg-neuro-orange/10 text-gray-400 hover:text-neuro-orange rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
