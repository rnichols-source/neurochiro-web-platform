import { ExternalLink, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";

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
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20 text-neuro-navy">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-neuro-orange transition-colors group mb-12"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Marketplace
        </Link>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center gap-10 bg-white p-10 md:p-12 rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="w-24 h-24 rounded-2xl bg-neuro-navy/5 flex items-center justify-center text-neuro-navy font-black text-2xl border border-gray-100">
            {vendor.name?.[0] || 'V'}
          </div>
          <div className="space-y-3">
            {vendor.categories && vendor.categories[0] && (
              <span className="px-4 py-1.5 bg-neuro-navy/5 text-neuro-navy text-[10px] font-black uppercase tracking-widest rounded-full inline-block">
                {vendor.categories[0]}
              </span>
            )}
            <h1 className="text-4xl font-heading font-black">{vendor.name}</h1>
            {vendor.short_description && (
              <p className="text-gray-500">{vendor.short_description}</p>
            )}
          </div>
        </header>

        {/* Description */}
        {vendor.full_description && (
          <section className="bg-white p-10 md:p-12 rounded-2xl border border-gray-100 shadow-sm mb-8">
            <h2 className="text-2xl font-heading font-black mb-6">About</h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              {vendor.full_description}
            </p>
          </section>
        )}

        {/* Discount */}
        {vendor.discount_code && (
          <section className="bg-neuro-orange/5 border border-neuro-orange/20 p-8 rounded-2xl mb-8">
            <h2 className="text-lg font-black text-neuro-navy mb-2">Exclusive Discount</h2>
            <p className="text-gray-500 text-sm mb-3">{vendor.discount_description || 'Use this code for a special offer:'}</p>
            <code className="px-4 py-2 bg-white rounded-lg text-neuro-orange font-black text-lg border border-neuro-orange/20">
              {vendor.discount_code}
            </code>
          </section>
        )}

        {/* Website Link */}
        {vendor.website_url && (
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
        )}
      </div>
    </div>
  );
}
