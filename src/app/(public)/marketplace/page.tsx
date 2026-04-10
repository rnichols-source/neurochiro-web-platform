"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Store, ArrowRight, ShoppingBag, Zap } from "lucide-react";
import Link from "next/link";
import { getVendors } from "./actions";
import Footer from "@/components/landing/Footer";

export default function MarketplacePage() {
  const [vendors, setVendors] = useState<any[]>([]);
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
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-20 w-60 h-60 bg-neuro-orange rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">Tools &amp; Products</p>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4">
            Marketplace
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Trusted products and tools for nervous system chiropractors. Everything you need to grow your practice and serve your patients better.
          </p>
          <Link
            href="/marketplace/apply"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-colors text-sm"
          >
            List Your Product <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Vendors */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Store className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neuro-navy mb-2">Marketplace coming soon</h3>
            <p className="text-gray-400 text-sm mb-6">We&apos;re onboarding trusted vendors for the chiropractic community.</p>
            <Link href="/marketplace/apply" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm inline-flex items-center gap-2">
              Apply to List <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {vendors.map((vendor, i) => (
              <div
                key={vendor.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all ${i === 0 ? 'border-neuro-orange' : 'border-gray-100'}`}
              >
                {/* Featured badge */}
                {(vendor.tier === 'featured' || i === 0) && (
                  <div className="bg-neuro-orange px-4 py-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-black uppercase tracking-widest">Featured Vendor</span>
                  </div>
                )}

                <div className="p-6 md:p-8">
                  {/* Categories */}
                  {vendor.categories && vendor.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {vendor.categories.map((cat: string, j: number) => (
                        <span key={j} className="px-3 py-1 bg-neuro-orange/5 text-neuro-orange text-xs font-bold rounded-lg border border-neuro-orange/10">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Logo + Name */}
                  <div className="flex items-center gap-4 mb-3">
                    {vendor.logo_url && (
                      <img src={vendor.logo_url} alt={vendor.name} className="w-14 h-14 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100" />
                    )}
                    <h2 className="text-2xl md:text-3xl font-heading font-black text-neuro-navy">
                      {vendor.name}
                    </h2>
                  </div>

                  {vendor.short_description && (
                    <p className="text-gray-500 mb-4">{vendor.short_description}</p>
                  )}

                  {vendor.full_description && (
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                      {vendor.full_description}
                    </p>
                  )}

                  {/* Discount */}
                  {vendor.discount_code && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-green-700">{vendor.discount_description || 'Exclusive discount for NeuroChiro members'}</p>
                        <p className="text-xs text-green-600">Code: <span className="font-mono font-bold">{vendor.discount_code}</span></p>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex gap-3">
                    {vendor.website_url && (
                      <a
                        href={vendor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange/90 transition-colors flex items-center gap-2"
                      >
                        Visit Website <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {vendor.slug && (
                      <Link
                        href={`/marketplace/${vendor.slug}`}
                        className="px-6 py-3 bg-gray-100 text-neuro-navy font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors"
                      >
                        Learn More
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Vendor CTA */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-heading font-black text-white mb-4">Sell to Chiropractors?</h2>
          <p className="text-gray-400 mb-8">Get your products in front of nervous system specialists worldwide. List your products in the NeuroChiro marketplace.</p>
          <Link href="/marketplace/apply" className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
            Apply to List <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
