"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  ExternalLink, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Award, 
  LayoutGrid,
  ChevronRight,
  Sparkles,
  Store,
  CheckCircle2,
  BadgePercent,
  Heart,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Vendor, VendorCategory } from "@/types/vendor";
import VendorOnboarding from "@/components/vendor/VendorOnboarding";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { getVendors, trackVendorClick } from "./actions";
import { useEffect } from "react";
const MOCK_VENDORS: Vendor[] = [
  {
    id: "1",
    slug: "neural-pulse-tech",
    name: "NeuralPulse Technologies",
    logo_url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=100&h=100",
    tier: "featured_partner",
    categories: ["Neurological Tech"],
    short_description: "Next-generation thermal scanning and surface EMG built for high-volume tonal practices.",
    full_description: "NeuralPulse provides the most accurate nervous-system assessment tools in the profession...",
    website_url: "https://neuralpulse.tech",
    demo_url: "/marketplace/neural-pulse-tech/demo",
    benefits: ["Wireless syncing", "Patient-facing reports", "Direct NeuroChiro integration"],
    is_partner: true
  },
  {
    id: "2",
    slug: "chiro-grow-agency",
    name: "ChiroGrow Marketing",
    logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&h=100",
    tier: "professional",
    categories: ["Marketing"],
    short_description: "Nervous-system focused digital marketing. We don't just find patients; we find your ideal practice members.",
    full_description: "ChiroGrow specializes in high-intent lead generation...",
    website_url: "https://chirogrow.io",
    benefits: ["Verified lead tracking", "Philosophy-aligned ads"],
    is_partner: false
  },
  {
    id: "3",
    slug: "apex-ehr",
    name: "Apex Practice Systems",
    logo_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=100&h=100",
    tier: "featured_partner",
    categories: ["Practice Management", "EHR Systems"],
    short_description: "The EHR built specifically for Neuro-Chiropractors. Fast, paperless, and incredibly intuitive.",
    full_description: "Apex EHR was built from the ground up to support high-volume clinics...",
    website_url: "https://apexehr.com",
    demo_url: "/marketplace/apex-ehr/demo",
    benefits: ["3-second SOAP notes", "Integrated billing", "Patient app"],
    is_partner: true
  }
];

const CATEGORIES: VendorCategory[] = [
  'Neurological Tech', 
  'Practice Management', 
  'EHR Systems', 
  'Marketing', 
  'Equipment', 
  'Supplements', 
  'Financial Services', 
  'Consulting'
];

export default function MarketplacePage() {
  const router = useRouter();
  const { toggleSave, isSaved } = useUserPreferences();
  const [activeCategory, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);
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

  const handleTrackClick = async (vendorId: string, type: 'website' | 'discount' | 'profile') => {
    await trackVendorClick(vendorId, type);
  };

  const filteredVendors = vendors.filter(v => {
    const categories = v.categories || [];
    const matchesCategory = activeCategory === "All" || categories.includes(activeCategory as any);
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (v.short_description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPartners = vendors.filter(v => v.tier === 'featured_partner');

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20 overflow-x-hidden">
      
      {/* Onboarding Wizard Overlay */}
      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
            <VendorOnboarding onClose={() => setIsWizardOpen(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8 relative z-10">
            <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] block border border-neuro-orange/20 px-4 py-1.5 rounded-full w-max mx-auto">NeuroChiro Ecosystem</span>
            <h1 className="text-5xl md:text-5xl font-heading font-black text-neuro-navy leading-[1.05] max-w-4xl mx-auto">
              The Tools to <br/>
              <span className="text-neuro-orange text-glow">Build Your Practice.</span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
              Discover verified vendors, technology, and services hand-picked for nervous-system-first chiropractic clinics.
            </p>
            
            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 max-w-2xl mx-auto mt-12 transform hover:scale-[1.02] transition-all">
               <Search className="w-6 h-6 text-gray-400 ml-3" />
               <input 
                 type="text" 
                 placeholder="Search technology, EHRs, equipment..." 
                 className="flex-1 p-2 bg-transparent outline-none text-md font-bold text-neuro-navy"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               <button 
                  onClick={() => setIsWizardOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-6 py-3 bg-neuro-navy text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-neuro-navy-light transition-colors"
               >
                  Vendor Signup <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Partners Section */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-heading font-black text-neuro-navy flex items-center gap-2 uppercase tracking-tight">
                <Sparkles className="w-6 h-6 text-neuro-orange" /> Featured Partners
             </h2>
             <div className="h-px flex-1 bg-gray-200 mx-8 hidden md:block"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {featuredPartners.map(vendor => (
               <Link key={vendor.id} href={`/marketplace/${vendor.slug}`}>
                 <motion.div 
                   whileHover={{ y: -5 }}
                   className="bg-neuro-navy text-white rounded-2xl p-10 relative overflow-hidden group border border-white/10 shadow-2xl"
                 >
                    
                    <div className="relative z-10 flex flex-col h-full">
                       <div className="flex items-start justify-between mb-8">
                          <img loading="lazy" decoding="async" src={vendor.logo_url} alt={vendor.name} className="w-16 h-16 rounded-2xl object-cover bg-white" />
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-neuro-orange/20">
                             <Award className="w-3 h-3" /> Official Partner
                          </div>
                       </div>
                       
                       <h3 className="text-3xl font-black mb-4 text-white group-hover:text-neuro-orange transition-colors">{vendor.name}</h3>
                       <p className="text-gray-300 font-medium mb-8 line-clamp-2">{vendor.short_description}</p>
                       
                       <div className="mt-auto flex flex-wrap gap-3">
                          {vendor.benefits.map(b => (
                            <span key={b} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                               <CheckCircle2 className="w-3 h-3 text-neuro-orange" /> {b}
                            </span>
                          ))}
                       </div>
                    </div>
                 </motion.div>
               </Link>
             ))}
          </div>
        </div>
      </section>

      {/* Main Marketplace Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              {/* Category Sidebar */}
              <div className="lg:col-span-1 space-y-8">
                 <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm sticky top-32">
                    <div className="flex items-center gap-2 mb-8 pb-4 border-b border-gray-100">
                       <LayoutGrid className="w-5 h-5 text-neuro-orange" />
                       <h3 className="font-bold text-neuro-navy uppercase tracking-widest text-xs">Categories</h3>
                    </div>
                    <div className="space-y-2">
                       {["All", ...CATEGORIES].map(cat => (
                         <button 
                           key={cat}
                           onClick={() => setActiveFilter(cat)}
                           className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${activeCategory === cat ? 'bg-neuro-orange text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                         >
                           {cat}
                           <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${activeCategory === cat ? 'opacity-100' : ''}`} />
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Vendor List */}
              <div className="lg:col-span-3 space-y-6">
                 <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Showing {filteredVendors.length} vendors</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-neuro-navy bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                       <Filter className="w-3 h-3" /> Sort: Relevance
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredVendors.map(vendor => (
                       <div 
                          key={vendor.id} 
                          onClick={() => router.push(`/marketplace/${vendor.slug}`)}
                          className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-neuro-orange transition-all group h-full flex flex-col cursor-pointer"
                       >
                          <div className="flex items-center gap-4 mb-6">
                             <img loading="lazy" decoding="async" src={vendor.logo_url} alt={vendor.name} className="w-12 h-12 rounded-xl object-cover" />
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                   <h4 className="font-bold text-neuro-navy text-lg group-hover:text-neuro-orange transition-colors truncate">{vendor.name}</h4>
                                   {vendor.is_partner && (
                                      <div className="flex items-center gap-1 px-2 py-0.5 bg-neuro-orange/10 text-neuro-orange text-xs font-black uppercase tracking-widest rounded-full shrink-0">
                                         <BadgePercent className="w-2.5 h-2.5" /> Pro Perk
                                      </div>
                                   )}
                                </div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{vendor.categories[0]}</p>
                             </div>
                          </div>
                          <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1">
                             {vendor.short_description}
                          </p>

                          {/* Discount Display */}
                          {vendor.is_partner && (
                             <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden">
                                   <div className="text-center">
                                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Exclusive Reward</p>
                                      <div className="bg-white px-4 py-2 rounded-xl border-2 border-dashed border-neuro-orange/30 inline-block mb-3">
                                         <span className="font-mono font-black text-neuro-orange text-sm">{(vendor as any).discount_code || 'NEUROPRO'}</span>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTrackClick(vendor.id, 'discount');
                                          alert(`Reward Claimed! Use code: ${(vendor as any).discount_code || 'NEUROPRO'} at checkout.`);
                                        }}
                                        className="w-full py-2.5 bg-neuro-navy text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-neuro-navy-light transition-colors"
                                      >
                                         Claim My Reward
                                      </button>
                                   </div>
                             </div>
                          )}

                          <div className="pt-6 border-t border-gray-50 flex items-center justify-between mt-auto">
                             <span className="text-[10px] font-black text-neuro-navy uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                View Profile <ArrowRight className="w-3 h-3" />
                             </span>
                             <div className="flex items-center gap-3">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSave("vendors", vendor.id);
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${isSaved("vendors", vendor.id) ? 'bg-neuro-orange/10 text-neuro-orange' : 'bg-gray-50 text-gray-400 hover:text-neuro-orange'}`}
                                >
                                   <Heart className={`w-4 h-4 ${isSaved("vendors", vendor.id) ? 'fill-current' : ''}`} />
                                </button>
                                <a 
                                  href={vendor.website_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                  className="p-2 bg-gray-50 hover:bg-neuro-orange/10 text-gray-400 hover:text-neuro-orange rounded-lg transition-colors"
                                >
                                   <ExternalLink className="w-4 h-4" />
                                </a>
                                {vendor.tier === 'professional' && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
                 
                 {filteredVendors.length === 0 && (
                   <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                      <Store className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-neuro-navy">No vendors found in this category</h3>
                      <p className="text-gray-400 mt-2">Try adjusting your filters or search query.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </section>

      {/* CTA: Vendor Signup */}
      <section className="py-20 px-6">
         <div className="max-w-5xl mx-auto">
            <div className="bg-neuro-navy rounded-2xl p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-neuro-orange/20 via-transparent to-transparent pointer-events-none"></div>
               <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                  <h2 className="text-4xl md:text-6xl font-heading font-black leading-tight">
                    Put Your Brand <br/>
                    <span className="text-neuro-orange">In Front of the Best.</span>
                  </h2>
                  <p className="text-gray-300 text-lg md:text-xl leading-relaxed font-medium">
                     NeuroChiro doctors are high-volume, tech-savvy clinical leaders. Join the marketplace to grow your brand in the nervous-system-first ecosystem.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                     <button 
                        onClick={() => setIsWizardOpen(true)}
                        className="px-10 py-5 bg-neuro-orange hover:bg-neuro-orange-light text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl transition-all transform hover:scale-105"
                     >
                        Become a Vendor Partner
                     </button>
                     <button 
                        onClick={() => router.push('/marketplace/pricing')}
                        className="px-10 py-5 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all backdrop-blur-sm"
                     >
                        View Vendor Pricing
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}
