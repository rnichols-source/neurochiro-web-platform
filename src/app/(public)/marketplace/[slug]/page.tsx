import { ExternalLink, ArrowLeft, ShoppingBag, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import Footer from "@/components/landing/Footer";

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

export default async function VendorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-28 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/marketplace" className="text-xs text-gray-400 hover:text-white transition-colors mb-6 inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> All Marketplace
          </Link>

          <div className="flex items-center gap-5 mt-4 mb-4">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt={vendor.name} className="w-16 h-16 rounded-xl object-contain bg-white p-2" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-black text-neuro-orange">
                {vendor.name?.[0]}
              </div>
            )}
            <div>
              {vendor.categories && vendor.categories[0] && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neuro-orange">{vendor.categories[0]}</span>
              )}
              <h1 className="text-3xl md:text-4xl font-heading font-black text-white">{vendor.name}</h1>
            </div>
          </div>

          {vendor.short_description && (
            <p className="text-gray-400 text-lg">{vendor.short_description}</p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {vendor.full_description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed">{vendor.full_description}</p>
              </div>
            )}

            {/* Categories */}
            {vendor.categories && vendor.categories.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {vendor.categories.map((cat: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-neuro-orange/5 text-neuro-orange text-sm font-bold rounded-xl border border-neuro-orange/10">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
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

              {/* Discount */}
              {vendor.discount_code && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-bold text-green-700">Member Discount</p>
                  </div>
                  <p className="text-xs text-green-600 mb-2">{vendor.discount_description || 'Exclusive for NeuroChiro members'}</p>
                  <code className="block text-center px-4 py-2 bg-white rounded-lg text-green-700 font-mono font-bold text-lg border border-green-200">
                    {vendor.discount_code}
                  </code>
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

              <p className="text-xs text-gray-400 text-center">
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                Verified NeuroChiro vendor
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
