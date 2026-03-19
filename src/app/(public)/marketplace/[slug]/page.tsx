"use client";

import * as React from "react";
import { useState } from "react";
import { 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  ArrowLeft,
  Award,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  PlayCircle,
  Users,
  Zap,
  FileText,
  BadgePercent,
  Activity,
  Send,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDoctorTier } from "@/context/DoctorTierContext";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export default function VendorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const router = useRouter();
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  
  // Use DoctorTierContext to check access
  const { isPro } = useDoctorTier();
  
  // In a real app, fetch based on slug
  const vendor = {
    name: "NeuralPulse Technologies",
    logo_url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=100&h=100",
    tier: "featured_partner",
    categories: ["Neurological Tech"],
    full_description: "NeuralPulse provides the most accurate nervous-system assessment tools in the profession. Our patented wireless thermal scanning technology integrates directly with the NeuroChiro platform to provide real-time patient reports that drive care plan acceptance.",
    website_url: "https://neuralpulse.tech",
    demo_url: "#",
    benefits: [
      "Wireless, high-speed thermal scanning",
      "Instant patient-facing educational reports",
      "Automated care plan recommendations",
      "Cloud-based dashboard for multi-clinic data"
    ],
    testimonials: [
      { author: "Dr. Ryan Miller", clinic: "Vitality Chiro", text: "NeuralPulse changed our ROF process. Patients finally 'see' what we see." }
    ],
    perk: "15% Off Hardware + Free Implementation for NeuroChiro Premium Members",
    caseStudies: [
      { title: "Neuro-Scanning in Pediatric Care", description: "How Dr. Miller increased pediatric retention by 40% using objective thermal scans.", type: "PDF Report" },
      { title: "Efficiency at Scale", description: "Processing 200+ scans weekly with zero tech bottlenecks.", type: "Video Case" }
    ],
    integrationStatus: "Real-time Sync Enabled",
    techSpecs: ["iPad Pro Compatible", "EHR Direct-Sync", "Battery Life: 12hrs"]
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowLeadForm(false);
      alert("Interest submitted! NeuralPulse will contact you within 24 hours.");
    }, 1500);
  };

  const handleClaimOffer = () => {
    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setHasClaimed(true);
      alert(`Success! Your NeuroChiro Pro discount has been activated for ${vendor.name}. Our partner team will reach out to finalize the details.`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neuro-cream pt-24 pb-20 overflow-x-hidden text-neuro-navy">
      <div className="max-w-7xl mx-auto px-6">
        
        <Breadcrumbs className="mb-6" />

        {/* Navigation */}
        <div className="flex items-center justify-between mb-12">
           <Link href="/marketplace" className="inline-flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-neuro-orange transition-colors group">
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Marketplace
           </Link>
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Integration Status</span>
              <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 {vendor.integrationStatus}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* MAIN CONTENT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Header / Brand Identity */}
            <header className="flex flex-col md:flex-row md:items-center gap-10 bg-white p-10 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/5 rounded-full blur-[100px] -mr-16 -mt-16"></div>
               <img loading="lazy" decoding="async" src={vendor.logo_url} alt={vendor.name} className="w-32 h-32 rounded-[2.5rem] object-cover border border-gray-100 shadow-2xl relative z-10" />
               <div className="space-y-4 relative z-10">
                  <div className="flex flex-wrap items-center gap-3">
                     {vendor.tier === 'featured_partner' && (
                       <span className="px-4 py-1.5 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 shadow-lg shadow-neuro-orange/20">
                          <Award className="w-3 h-3" /> Official Partner
                       </span>
                     )}
                     <span className="px-4 py-1.5 bg-neuro-navy/5 text-neuro-navy text-[10px] font-black uppercase tracking-widest rounded-full">
                        {vendor.categories[0]}
                     </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-black">{vendor.name}</h1>
               </div>
            </header>

            {/* Member Exclusive Perk (Segmented Highlight with Access Control) */}
            {isPro ? (
              <section className="bg-neuro-navy p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border-4 border-neuro-orange/20">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/20 blur-[100px] pointer-events-none"></div>
                 <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-neuro-orange rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-neuro-orange/30">
                          <BadgePercent className="w-8 h-8 text-white" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-neuro-orange tracking-[0.3em]">Pro Tier Exclusive Perk</p>
                          <h3 className="text-xl md:text-2xl font-black text-white">{vendor.perk}</h3>
                       </div>
                    </div>
                    <button 
                      onClick={handleClaimOffer}
                      disabled={isClaiming || hasClaimed}
                      className="px-8 py-4 bg-white text-neuro-navy font-black rounded-2xl hover:bg-neuro-orange hover:text-white transition-all uppercase tracking-widest text-[10px] shadow-xl shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {isClaiming ? 'Processing...' : hasClaimed ? 'Offer Claimed' : 'Claim Offer'}
                    </button>
                 </div>
              </section>
            ) : (
              <section className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-gray-100 rounded-[1.5rem] flex items-center justify-center border border-gray-200">
                          <Lock className="w-8 h-8 text-gray-400" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Partner Offer Locked</p>
                          <h3 className="text-xl md:text-2xl font-black text-neuro-navy blur-[4px] select-none">15% Off Hardware + Free Implementation</h3>
                       </div>
                    </div>
                    <button 
                      onClick={() => router.push('/pricing')}
                      className="px-8 py-4 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-orange transition-all uppercase tracking-widest text-[10px] shadow-lg shrink-0 flex items-center gap-2"
                    >
                       Upgrade to Pro
                    </button>
                 </div>
              </section>
            )}

            {/* Product Overview */}
            <section className="bg-white p-10 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm">
               <div className="flex items-center gap-3 mb-8">
                  <Activity className="w-6 h-6 text-neuro-orange" />
                  <h2 className="text-2xl font-heading font-black">About the Tech</h2>
               </div>
               <p className="text-gray-500 text-lg leading-relaxed mb-10 font-medium">
                  {vendor.full_description}
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendor.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-neuro-orange/20 transition-all">
                       <CheckCircle2 className="w-5 h-5 text-neuro-orange shrink-0" />
                       <span className="text-sm font-black">{b}</span>
                    </div>
                  ))}
               </div>
            </section>

            {/* Clinical Evidence & Case Studies */}
            <section className="space-y-8">
               <div className="flex items-center justify-between px-4">
                  <h2 className="text-2xl font-heading font-black flex items-center gap-3">
                     <Zap className="w-6 h-6 text-neuro-orange" /> Clinical Impact
                  </h2>
                  <button className="text-[10px] font-black uppercase text-neuro-orange tracking-widest hover:underline">View Research</button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vendor.caseStudies.map((study, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                       <div className="flex items-center justify-between mb-6">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-neuro-orange transition-colors">
                             <FileText className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{study.type}</span>
                       </div>
                       <h4 className="text-xl font-black mb-2 group-hover:text-neuro-orange transition-colors">{study.title}</h4>
                       <p className="text-xs text-gray-400 font-medium leading-relaxed">{study.description}</p>
                       <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-2">
                             Access Study <ArrowRight className="w-3 h-3" />
                          </span>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* Testimonials */}
            <section className="bg-neuro-cream/30 p-10 md:p-12 rounded-[3rem] border border-neuro-navy/5">
               <h2 className="text-2xl font-heading font-black mb-10 text-center">Trusted by 450+ Clinics</h2>
               <div className="grid grid-cols-1 gap-6">
                  {vendor.testimonials.map((t, i) => (
                    <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm relative overflow-hidden group">
                       <MessageSquare className="w-12 h-12 text-neuro-orange/10 mb-6" />
                       <p className="text-xl font-medium italic text-neuro-navy leading-relaxed mb-10 relative z-10">"{t.text}"</p>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-neuro-navy rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg">RM</div>
                          <div>
                             <p className="font-black text-lg">{t.author}</p>
                             <p className="text-[10px] font-black uppercase tracking-widest text-neuro-orange">{t.clinic}</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          </div>

          {/* SIDEBAR COLUMN */}
          <div className="lg:col-span-4 space-y-6">
             
             {/* Growth & Conversion Card */}
             <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-xl sticky top-32 space-y-8">
                <div>
                   <h3 className="font-heading font-black text-xl mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-neuro-orange" /> Growth Tools
                   </h3>
                   <p className="text-xs text-gray-400 font-medium">Connect with the NeuralPulse clinical team.</p>
                </div>
                
                <div className="space-y-4">
                   <button 
                    onClick={() => setShowLeadForm(!showLeadForm)}
                    className="w-full py-5 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl shadow-neuro-navy/20 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                   >
                      <Calendar className="w-5 h-5 text-neuro-orange" /> {showLeadForm ? 'Cancel Request' : 'Book Live Demo'}
                   </button>
                   
                   <AnimatePresence>
                     {showLeadForm && (
                       <motion.form 
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         exit={{ opacity: 0, height: 0 }}
                         onSubmit={handleLeadSubmit}
                         className="space-y-4 pt-4 border-t border-gray-50"
                       >
                          <div className="space-y-1.5 text-left">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clinic Contact</label>
                             <input type="text" placeholder="Dr. Jane Doe" required className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-neuro-orange/20" />
                          </div>
                          <div className="space-y-1.5 text-left">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preferred Time</label>
                             <select className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-neuro-orange/20 appearance-none">
                                <option>Mornings (8am - 12pm)</option>
                                <option>Afternoons (1pm - 5pm)</option>
                                <option>Weekends</option>
                             </select>
                          </div>
                          <button 
                            disabled={isSubmitting}
                            className="w-full py-4 bg-neuro-orange text-white font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
                          >
                             {isSubmitting ? 'Sending...' : 'Send Interest'} <Send className="w-3.5 h-3.5" />
                          </button>
                       </motion.form>
                     )}
                   </AnimatePresence>

                   <a 
                     href={vendor.website_url} 
                     target="_blank" 
                     className="w-full py-5 bg-white border-2 border-neuro-navy/5 text-neuro-navy font-black rounded-2xl hover:border-neuro-orange transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                   >
                      Visit Website <ExternalLink className="w-4 h-4 text-gray-300" />
                   </a>
                </div>

                <div className="space-y-6 pt-8 border-t border-gray-50">
                   <div className="flex items-center gap-4 text-gray-500 group cursor-pointer">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-neuro-orange/5 transition-colors">
                         <PlayCircle className="w-6 h-6 group-hover:text-neuro-orange" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Video</p>
                         <p className="text-xs font-black group-hover:text-neuro-navy transition-colors">Watch Overview</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 text-gray-500 group cursor-pointer">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-neuro-orange/5 transition-colors">
                         <Users className="w-6 h-6 group-hover:text-neuro-orange" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reach</p>
                         <p className="text-xs font-black group-hover:text-neuro-navy transition-colors">450+ Clinics Active</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Compatibility / Tech Specs Segment */}
             <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Compatibility</h4>
                <div className="space-y-3">
                   {vendor.techSpecs.map(spec => (
                      <div key={spec} className="flex items-center gap-3 text-xs font-bold text-neuro-navy">
                         <CheckCircle2 className="w-4 h-4 text-green-500" /> {spec}
                      </div>
                   ))}
                </div>
             </div>

             {/* Partner Badge Explainer (Gradient) */}
             <div className="bg-gradient-to-br from-neuro-orange to-neuro-orange-dark rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                   <ShieldCheck className="w-12 h-12 mb-6 text-white" />
                   <h4 className="font-heading font-black text-xl mb-3">Verified Partner</h4>
                   <p className="text-white/80 text-xs leading-relaxed font-medium">
                      NeuralPulse is a clinicaly vetted NeuroChiro partner, ensuring alignment with tonal chiropractic philosophy and high-volume clinical systems.
                   </p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
