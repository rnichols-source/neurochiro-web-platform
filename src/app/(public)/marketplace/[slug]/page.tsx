import { ExternalLink, ArrowLeft, ShoppingBag, CheckCircle2, Star, Zap, Globe } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import Footer from "@/components/landing/Footer";
import CopyDiscountCode from "./copy-discount-code";
import VendorReviews from "./vendor-reviews";
import VendorUsedBy from "./vendor-used-by";

async function getVendorBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('vendors')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  return data;
}

async function getRelatedVendors(categories: string[], currentId: string) {
  if (!categories || categories.length === 0) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('vendors')
    .select('name, slug, logo_url, categories, short_description')
    .eq('is_active', true)
    .neq('id', currentId)
    .overlaps('categories', categories)
    .limit(3);
  return data || [];
}

export default async function VendorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);

  if (!vendor) {
    notFound();
  }

  const related = await getRelatedVendors(vendor.categories || [], vendor.id);

  const isPartner = vendor.tier === 'partner' || vendor.tier === 'featured_partner';
  const isGrowth = vendor.tier === 'growth';

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-28 pb-14 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/marketplace" className="text-xs text-gray-400 hover:text-white transition-colors mb-6 inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> All Marketplace
          </Link>

          <div className="flex items-start gap-5 mt-4 mb-4">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt={vendor.name} className="w-20 h-20 rounded-2xl object-contain bg-white p-2 shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-black text-neuro-orange">
                {vendor.name?.[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                {vendor.categories?.[0] && (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neuro-orange">{vendor.categories[0]}</span>
                )}
                {isPartner && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neuro-orange/20 text-neuro-orange text-[10px] font-black rounded-full uppercase tracking-wider">
                    <Star className="w-3 h-3" /> NeuroChiro Partner
                  </span>
                )}
                {isGrowth && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-full uppercase tracking-wider">
                    <Zap className="w-3 h-3" /> Growth
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-white">{vendor.name}</h1>
              {vendor.short_description && (
                <p className="text-gray-400 mt-2 text-lg">{vendor.short_description}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {vendor.full_description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{vendor.full_description}</p>
              </div>
            )}

            {/* Categories */}
            {vendor.categories && vendor.categories.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {vendor.categories.map((cat: string, i: number) => (
                    <Link
                      key={i}
                      href={`/marketplace?category=${encodeURIComponent(cat)}`}
                      className="px-4 py-2 bg-neuro-orange/5 text-neuro-orange text-sm font-bold rounded-xl border border-neuro-orange/10 hover:bg-neuro-orange/10 transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Used By Social Proof */}
            <VendorUsedBy vendorId={vendor.id} />

            {/* Reviews */}
            <VendorReviews vendorId={vendor.id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24 space-y-5">
              {/* Logo */}
              {vendor.logo_url && (
                <div className="flex justify-center p-4 bg-gray-50 rounded-xl">
                  <img src={vendor.logo_url} alt={vendor.name} className="h-16 object-contain" />
                </div>
              )}

              {/* Discount with Copy */}
              {vendor.discount_code && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-bold text-green-700">Member Discount</p>
                  </div>
                  <p className="text-xs text-green-600 mb-3">{vendor.discount_description || 'Exclusive for NeuroChiro members'}</p>
                  <CopyDiscountCode code={vendor.discount_code} />
                </div>
              )}

              {/* CTA */}
              {vendor.website_url && (
                <a
                  href={vendor.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors"
                >
                  Visit Website <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {(vendor as any).demo_url && (
                <a
                  href={(vendor as any).demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-neuro-navy text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neuro-navy-light transition-colors"
                >
                  Request Demo <Globe className="w-4 h-4" />
                </a>
              )}

              <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified NeuroChiro vendor
              </p>
            </div>
          </div>
        </div>

        {/* Related Vendors */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-heading font-black text-neuro-navy mb-4">Related Vendors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r: any) => (
                <Link
                  key={r.slug}
                  href={`/marketplace/${r.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {r.logo_url ? (
                      <img src={r.logo_url} alt={r.name} className="w-10 h-10 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-neuro-navy/5 flex items-center justify-center font-black text-neuro-orange">
                        {r.name?.[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-neuro-navy text-sm">{r.name}</h3>
                      {r.categories?.[0] && (
                        <span className="text-[10px] font-bold text-neuro-orange uppercase tracking-wider">{r.categories[0]}</span>
                      )}
                    </div>
                  </div>
                  {r.short_description && (
                    <p className="text-gray-400 text-xs line-clamp-2">{r.short_description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
