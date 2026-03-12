"use client";

import { motion } from "framer-motion";
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  Globe, 
  ShieldCheck,
  Star,
  MessageSquare,
  BarChart3,
  Clock,
  X,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function HostLandingPage() {
  const [user, setUser] = useState<any>(null);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  const templates = [
    {
      title: "The Neuro-Scanning Blueprint",
      description: "Master the architecture of clinical certainty through objective scanning technology.",
      demandHook: "150 students in your region ready for this topic",
      estimatedRevenue: "$30,000",
      timeToSet: "45 seconds"
    },
    {
      title: "Pediatric Practice ROI",
      description: "How to build a high-volume pediatric practice that runs on neurological integrity.",
      demandHook: "85 students viewing similar events this week",
      estimatedRevenue: "$22,000",
      timeToSet: "30 seconds"
    }
  ];

  const tiers = [
    {
      name: "Single Event Listing",
      price: { doctor: "$149", external: "$299", label: "/ event" },
      description: "Best for doctors running a single seminar or workshop.",
      features: [
        "Marketplace Listing",
        "Event Description Page",
        "Location + Map Integration",
        "Instructor Profile Link",
        "CTA Registration Link",
        "Visibility for 30 Days"
      ],
      cta: "Get Started",
      featured: false
    },
    {
      name: "Multi Event Package",
      price: { doctor: "$599", external: "$899", label: "/ package" },
      description: "For educators hosting multiple seminars annually.",
      features: [
        "Up to 5 Seminar Listings",
        "Listings Live for 6 Months",
        "Featured Placement in Search",
        "Email Highlight to Audience",
        "Analytics Dashboard Access",
        "Bulk Management Tools"
      ],
      cta: "Scale Your Reach",
      featured: true
    },
    {
      name: "Educator Network",
      price: { doctor: "$1,200", external: "$2,500", label: "/ year" },
      description: "Annual membership for regular seminar companies.",
      features: [
        "Unlimited Seminar Listings",
        "Priority Placement Globally",
        "Featured Educator Profile",
        "Marketing & Design Support",
        "Advanced Analytics Suite",
        "Recruitment Integration",
        "Monthly Email Promotion"
      ],
      cta: "Join the Network",
      featured: false
    }
  ];

  const destination = user ? "/doctor/seminars" : "/register?role=doctor&redirect=/doctor/seminars";

  return (
    <div className="min-h-screen bg-[#0B1118] text-white pt-32 pb-40 overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-neuro-orange/5 blur-[150px] -mr-40 -mt-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] -ml-40 -mb-40 pointer-events-none"></div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 relative z-10 text-center mb-32">
        {user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 inline-block p-1 rounded-3xl bg-gradient-to-r from-neuro-orange/20 via-orange-500/20 to-neuro-orange/20 border border-neuro-orange/30"
          >
            <div className="bg-[#0B1118] px-8 py-4 rounded-[1.4rem] flex flex-col md:flex-row items-center gap-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neuro-orange/10 flex items-center justify-center text-neuro-orange">
                     <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <div className="text-left">
                     <p className="text-xs font-black uppercase tracking-widest text-neuro-orange">Growth Perk Unlocked</p>
                     <p className="text-sm font-bold text-white">Seminar-in-a-Box Access</p>
                  </div>
               </div>
               <div className="h-px md:h-10 w-full md:w-px bg-white/10" />
               <button 
                onClick={() => setIsCloneModalOpen(true)}
                className="px-6 py-3 bg-white text-neuro-navy font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2"
               >
                  Clone Your Last Sell-Out <ArrowRight className="w-3 h-3" />
               </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
        >
          <span className="w-2 h-2 rounded-full bg-neuro-orange animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange">Educator Network</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-heading font-black tracking-tighter leading-[0.9] mb-12"
        >
          Scale Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neuro-orange to-orange-400">Clinical Impact.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed mb-16"
        >
          Join the world's most elite marketplace for nervous-system-first chiropractic education. Attract the right students and doctors to your next seminar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-6"
        >
          <Link 
            href={destination}
            className="px-12 py-6 bg-neuro-orange text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-neuro-orange-light transition-all shadow-2xl shadow-neuro-orange/30 flex items-center gap-3 group"
          >
            {user ? "Host Your Next Event" : "Start Hosting Now"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/learn"
            className="px-12 py-6 bg-white/5 border border-white/10 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center gap-3"
          >
            View Case Studies
          </Link>
        </motion.div>
      </section>

      {/* CLONE TEMPLATES MODAL */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-[#0B1118]/80">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#151C26] rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-white/10"
          >
            <div className="p-10 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black text-white mb-2">Seminar-in-a-Box</h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Set up your next $30k event in 45 seconds</p>
              </div>
              <button 
                onClick={() => setIsCloneModalOpen(false)}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
               {templates.map((template, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] group hover:border-neuro-orange transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                       <Sparkles className="w-12 h-12 text-neuro-orange" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                       <div className="px-3 py-1 bg-neuro-orange/20 text-neuro-orange rounded-full text-[8px] font-black uppercase tracking-widest">
                          1-Click Template
                       </div>
                       <div className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-[8px] font-black uppercase tracking-widest">
                          High Conversion
                       </div>
                    </div>
                    <h4 className="text-xl font-black text-white mb-3">{template.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed mb-6">{template.description}</p>
                    
                    <div className="space-y-4 mb-8">
                       <div className="flex items-center gap-3">
                          <Target className="w-4 h-4 text-neuro-orange" />
                          <p className="text-xs font-bold text-white">{template.demandHook}</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <p className="text-xs font-bold text-gray-400">Est. Revenue: <span className="text-white">{template.estimatedRevenue}</span></p>
                       </div>
                       <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <p className="text-xs font-bold text-gray-400">Setup Time: <span className="text-white">{template.timeToSet}</span></p>
                       </div>
                    </div>

                    <Link 
                      href="/doctor/seminars?clone=true"
                      className="w-full py-4 bg-neuro-orange text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-neuro-orange-light transition-all flex items-center justify-center gap-2"
                    >
                       Deploy Template <Zap className="w-3 h-3 fill-current" />
                    </Link>
                 </div>
               ))}
            </div>

            <div className="p-10 bg-white/[0.02] border-t border-white/5 text-center">
               <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                  Harvesting pre-existing demand in your region
               </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pricing Tiers */}
      <section className="max-w-7xl mx-auto px-8 relative z-10 mb-40">
        <div className="text-center mb-20">
          <h2 className="text-3xl font-heading font-black mb-4">Promotional Marketplace Tiers</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Verified members receive 50% discount on all listings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-10 rounded-[3rem] border transition-all flex flex-col ${
                tier.featured 
                ? "bg-white/5 border-neuro-orange shadow-[0_32px_64px_-16px_rgba(214,104,41,0.2)]" 
                : "bg-white/[0.02] border-white/10 hover:border-white/20"
              }`}
            >
              {tier.featured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">{tier.name}</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">{tier.description}</p>
              </div>

              <div className="mb-10 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{tier.price.doctor}</span>
                  <span className="text-lg font-bold text-gray-500">{tier.price.label}</span>
                  <span className="text-[10px] font-black text-neuro-orange uppercase tracking-widest ml-2">Member Price</span>
                </div>
                <div className="flex items-baseline gap-2 opacity-50">
                  <span className="text-xl font-bold text-gray-500">{tier.price.external}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">External Host</span>
                </div>
              </div>

              <div className="space-y-4 mb-12 flex-1">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className={`w-4 h-4 ${tier.featured ? 'text-neuro-orange' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Link 
                href={destination}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 ${
                  tier.featured 
                  ? "bg-neuro-orange text-white shadow-lg shadow-neuro-orange/20 hover:bg-neuro-orange-light" 
                  : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust & Stats */}
      <section className="max-w-5xl mx-auto px-8 py-24 bg-white/5 border border-white/10 rounded-[4rem] text-center relative overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: "Active Students", value: "2,500+", icon: Users },
            { label: "Global Locations", value: "15+", icon: Globe },
            { label: "Trust Score", value: "99%", icon: ShieldCheck },
            { label: "Monthly Views", value: "45k+", icon: TrendingUp }
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <stat.icon className="w-6 h-6 text-neuro-orange mx-auto mb-4" />
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
