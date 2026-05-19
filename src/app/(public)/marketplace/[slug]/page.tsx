import {
  ExternalLink, ArrowLeft, ShoppingBag, CheckCircle2, Star, Zap, Globe,
  Share2, Copy, MapPin, Users, Eye, Award, ChevronDown, Play, Instagram,
  Linkedin, Youtube, Mail, Phone, Shield, Heart, TrendingUp, Package,
  HelpCircle, MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import Footer from "@/components/landing/Footer";
import CopyDiscountCode from "./copy-discount-code";
import VendorReviews from "./vendor-reviews";
import VendorUsedBy from "./vendor-used-by";
import VendorContent from "./vendor-content";
import VendorProducts from "./vendor-products";
import VendorContact from "./vendor-contact";
import VendorPageClient from "./vendor-page-client";

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
    .select('name, slug, logo_url, categories, short_description, tier')
    .eq('is_active', true)
    .neq('id', currentId)
    .overlaps('categories', categories)
    .limit(3);
  return data || [];
}

export default async function VendorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);

  if (!vendor) notFound();

  const related = await getRelatedVendors(vendor.categories || [], vendor.id);
  const v = vendor as any;
  const isPartner = v.tier === 'partner' || v.tier === 'featured_partner';
  const isGrowth = v.tier === 'growth';

  // Extended fields (JSONB or future columns)
  const bannerUrl = v.banner_url as string | null;
  const videoUrl = v.video_url as string | null;
  const socialLinks = {
    instagram: v.instagram_url as string | null,
    linkedin: v.linkedin_url as string | null,
    youtube: v.youtube_url as string | null,
  };
  const highlights = v.highlights as string[] | null;
  const faq = v.faq as { question: string; answer: string }[] | null;
  const team = v.team as { name: string; title: string; photo_url?: string; bio?: string }[] | null;
  const guarantees = v.guarantees as string[] | null;
  const stats = {
    views: v.profile_views || 0,
    clicks: v.website_clicks || 0,
    users: v.user_count || 0,
  };
  const phone = v.phone as string | null;
  const email = v.email as string | null;
  const founded = v.founded as string | null;
  const location = v.location as string | null;

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className={`text-white pt-28 pb-14 px-6 relative overflow-hidden ${bannerUrl ? '' : 'bg-neuro-navy'}`}>
        {bannerUrl && (
          <div className="absolute inset-0">
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-neuro-navy/80" />
          </div>
        )}
        {!bannerUrl && (
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-20 w-60 h-60 bg-neuro-orange rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
          </div>
        )}
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/marketplace" className="text-xs text-gray-400 hover:text-white transition-colors mb-6 inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Marketplace
          </Link>

          <div className="flex items-start gap-6 mt-4 mb-4">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt={vendor.name} className="w-24 h-24 rounded-2xl object-contain bg-white p-3 shadow-lg shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center text-4xl font-black text-neuro-orange shrink-0">
                {vendor.name?.[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                {vendor.categories?.[0] && (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neuro-orange">{vendor.categories[0]}</span>
                )}
                {isPartner && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neuro-orange/20 text-neuro-orange text-[10px] font-black rounded-full uppercase tracking-wider">
                    <Star className="w-3 h-3" /> NeuroChiro Partner
                  </span>
                )}
                {isGrowth && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-full uppercase tracking-wider">
                    <Zap className="w-3 h-3" /> Featured
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-white">{vendor.name}</h1>
              {vendor.short_description && (
                <p className="text-gray-300 mt-2 text-lg">{vendor.short_description}</p>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                {location && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <MapPin className="w-3.5 h-3.5 text-neuro-orange" /> {location}
                  </span>
                )}
                {founded && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Award className="w-3.5 h-3.5 text-neuro-orange" /> Est. {founded}
                  </span>
                )}
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-2 mt-4">
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    <Instagram className="w-4 h-4 text-white" />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    <Linkedin className="w-4 h-4 text-white" />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    <Youtube className="w-4 h-4 text-white" />
                  </a>
                )}
                {vendor.website_url && (
                  <a href={vendor.website_url} target="_blank" rel="noopener noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    <Globe className="w-4 h-4 text-white" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {(stats.views > 0 || stats.clicks > 0 || stats.users > 0) && (
        <div className="bg-neuro-navy border-t border-white/5">
          <div className="max-w-4xl mx-auto flex justify-center divide-x divide-white/10">
            {stats.views > 0 && (
              <div className="flex-1 text-center py-4">
                <div className="text-2xl font-black text-neuro-orange">{stats.views > 999 ? `${(stats.views / 1000).toFixed(1)}k` : stats.views}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Profile Views</div>
              </div>
            )}
            {stats.clicks > 0 && (
              <div className="flex-1 text-center py-4">
                <div className="text-2xl font-black text-neuro-orange">{stats.clicks}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Website Clicks</div>
              </div>
            )}
            {stats.users > 0 && (
              <div className="flex-1 text-center py-4">
                <div className="text-2xl font-black text-neuro-orange">{stats.users}+</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Doctors Using</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Showcase */}
      {videoUrl && (
        <section className="bg-neuro-navy py-10 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
              {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                <iframe
                  src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : videoUrl.includes('vimeo.com') ? (
                <iframe src={videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
              ) : (
                <video src={videoUrl} controls className="w-full h-full object-cover" />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Exclusive Offer */}
            {vendor.discount_code && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-black text-green-800">Exclusive NeuroChiro Offer</h2>
                </div>
                <p className="text-green-700 mb-4">{vendor.discount_description || 'Special pricing for NeuroChiro members only.'}</p>
                <CopyDiscountCode code={vendor.discount_code} />
              </div>
            )}

            {/* About */}
            {vendor.full_description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">About {vendor.name}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{vendor.full_description}</p>
              </div>
            )}

            {/* Why Choose Us / Highlights */}
            {highlights && highlights.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-black text-neuro-navy">Why {vendor.name}?</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights.map((h: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-green-50/50 rounded-xl p-4 border border-green-100">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guarantees */}
            {guarantees && guarantees.length > 0 && (
              <div className="bg-neuro-navy rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <Shield className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-white">Our Guarantee</h2>
                </div>
                <div className="space-y-3">
                  {guarantees.map((g: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <Shield className="w-4 h-4 text-neuro-orange shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">{g}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Products */}
            <VendorProducts vendorId={vendor.id} />

            {/* Categories */}
            {vendor.categories && vendor.categories.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {vendor.categories.map((cat: string, i: number) => (
                    <Link key={i} href={`/marketplace?category=${encodeURIComponent(cat)}`}
                      className="px-4 py-2 bg-neuro-orange/5 text-neuro-orange text-sm font-bold rounded-xl border border-neuro-orange/10 hover:bg-neuro-orange/10 transition-colors">
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Team */}
            {team && team.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <Users className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">Meet the Team</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {team.map((m: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
                      {m.photo_url ? (
                        <img src={m.photo_url} alt={m.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-neuro-navy/10 flex items-center justify-center text-neuro-navy font-bold text-sm shrink-0">
                          {m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-neuro-navy text-sm">{m.name}</p>
                        <p className="text-xs text-neuro-orange font-bold">{m.title}</p>
                        {m.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Used By Social Proof */}
            <VendorUsedBy vendorId={vendor.id} />

            {/* Content Hub */}
            <VendorContent vendorId={vendor.id} />

            {/* FAQ */}
            {faq && faq.length > 0 && (
              <VendorPageClient faq={faq} />
            )}

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

              {/* Quick info */}
              <div className="space-y-3">
                {location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 text-neuro-orange" /> {location}
                  </div>
                )}
                {founded && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Award className="w-4 h-4 text-neuro-orange" /> Founded {founded}
                  </div>
                )}
                {vendor.categories?.[0] && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Package className="w-4 h-4 text-neuro-orange" /> {vendor.categories.join(', ')}
                  </div>
                )}
              </div>

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

              {/* CTAs */}
              {vendor.website_url && (
                <a href={vendor.website_url} target="_blank" rel="noopener noreferrer"
                  className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors">
                  Visit Website <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {v.demo_url && (
                <a href={v.demo_url} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 bg-neuro-navy text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neuro-navy/90 transition-colors">
                  Request Demo <Globe className="w-4 h-4" />
                </a>
              )}

              {/* Contact info */}
              {(phone || email) && (
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  {phone && (
                    <a href={`tel:${phone}`} className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-neuro-navy bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Phone className="w-3.5 h-3.5" /> {phone}
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-neuro-navy bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Mail className="w-3.5 h-3.5" /> {email}
                    </a>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified NeuroChiro vendor
              </p>
            </div>

            {/* Contact Form */}
            <VendorContact vendorName={vendor.name} vendorId={vendor.id} />
          </div>
        </div>

        {/* Mid-page CTA */}
        {vendor.website_url && (
          <div className="mt-10 bg-neuro-navy rounded-2xl p-10 text-center">
            <h2 className="text-2xl font-heading font-black text-white mb-3">Ready to Get Started with {vendor.name}?</h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              {vendor.discount_code
                ? `Use code ${vendor.discount_code} for your exclusive NeuroChiro member discount.`
                : `Join 140+ nervous system chiropractors who trust NeuroChiro marketplace vendors.`}
            </p>
            <a href={vendor.website_url} target="_blank" rel="noopener noreferrer"
              className="px-10 py-4 bg-neuro-orange text-white font-bold rounded-xl text-lg inline-flex items-center gap-2 hover:bg-neuro-orange/90 transition-colors shadow-lg shadow-neuro-orange/20">
              Visit {vendor.name} <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        )}

        {/* Related Vendors */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-heading font-black text-neuro-navy mb-4">Related Vendors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r: any) => (
                <Link key={r.slug} href={`/marketplace/${r.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    {r.logo_url ? (
                      <img src={r.logo_url} alt={r.name} className="w-12 h-12 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-neuro-navy/5 flex items-center justify-center font-black text-neuro-orange text-lg">
                        {r.name?.[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-neuro-navy text-sm group-hover:text-neuro-orange transition-colors">{r.name}</h3>
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

      {/* Sticky Mobile CTA */}
      {vendor.website_url && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            {vendor.discount_code && (
              <p className="text-sm font-black text-green-700">{vendor.discount_code}</p>
            )}
            <p className="text-[10px] text-gray-400 font-bold uppercase">Member discount</p>
          </div>
          <a href={vendor.website_url} target="_blank" rel="noopener noreferrer"
            className="flex-1 max-w-[200px] py-3.5 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors">
            Visit Site <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
