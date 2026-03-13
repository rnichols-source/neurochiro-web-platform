"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Globe, 
  Award, 
  Star,
  Users,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  Instagram,
  Linkedin,
  Twitter,
  Mail
} from "lucide-react";
import Link from "next/link";
import { getHostProfile } from "./actions";

export default function HostProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getHostProfile(id);
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0B1118] flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-neuro-orange" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B1118] text-white pt-32 pb-40">
      <div className="max-w-7xl mx-auto px-8">
        
        <Link href="/seminars" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-12 group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Seminars
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          {/* LEFT COLUMN - Bio & Info */}
          <div className="lg:col-span-2 space-y-12">
            
            <header className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 bg-neuro-orange/10 border border-neuro-orange/20 text-neuro-orange text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-3.5 h-3.5" />
                  Verified Educator
                </span>
                {profile.is_verified && (
                  <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    NeuroChiro Partner
                  </span>
                )}
              </div>
              
              <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tight leading-tight">
                {profile.organization_name}
              </h1>
              
              <p className="text-xl text-gray-400 leading-relaxed font-medium">
                {profile.host_bio}
              </p>
            </header>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-8 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl">
               <div className="text-center">
                  <p className="text-3xl font-black text-white">{profile.seminars?.length || 0}</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Events Hosted</p>
               </div>
               <div className="text-center border-x border-white/5 px-8">
                  <p className="text-3xl font-black text-neuro-orange">{profile.rating || '5.0'}</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Avg Rating</p>
               </div>
               <div className="text-center">
                  <p className="text-3xl font-black text-white">Top 1%</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Global Tier</p>
               </div>
            </div>

            {/* Past Seminars Gallery / List */}
            <section className="space-y-8">
               <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold font-heading">Hosted Education</h2>
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Global Schedule</span>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {profile.seminars?.map((sem: any) => (
                   <div key={sem.id} className="p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:border-neuro-orange/40 transition-all group cursor-pointer">
                      <div className="flex items-center justify-between mb-4">
                         <span className="px-3 py-1 bg-white/10 text-white text-[9px] font-black rounded uppercase tracking-widest">
                            {sem.listing_tier}
                         </span>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sem.dates}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-4 group-hover:text-neuro-orange transition-colors">{sem.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                         <MapPin className="w-3.5 h-3.5 text-neuro-orange" />
                         {sem.location}
                      </div>
                   </div>
                 ))}
               </div>
            </section>
          </div>

          {/* RIGHT COLUMN - Host Card */}
          <div className="space-y-8">
            <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] sticky top-32">
              <div className="w-32 h-32 rounded-[2rem] bg-neuro-orange flex items-center justify-center text-5xl font-black text-white mb-8 mx-auto shadow-2xl shadow-neuro-orange/20 overflow-hidden">
                {profile.logo_url ? <img loading="lazy" decoding="async" src={profile.logo_url} className="w-full h-full object-cover" /> : profile.organization_name?.charAt(0)}
              </div>
              
              <div className="text-center space-y-2 mb-10">
                <h3 className="text-2xl font-bold">{profile.organization_name}</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                   <Globe className="w-3.5 h-3.5" /> Established Platform
                </p>
              </div>

              <div className="space-y-3 mb-10">
                <a 
                  href={profile.website_url || '#'} 
                  target="_blank"
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all"
                >
                  Visit Website
                </a>
                
                <div className="flex gap-2">
                  {profile.instagram_url && (
                    <a href={profile.instagram_url} target="_blank" className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a href={profile.twitter_url} target="_blank" className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <button className="w-full py-5 bg-neuro-orange text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-neuro-orange/20 hover:scale-[1.02] transition-all">
                  Follow Educator
                </button>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-4">
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-bold uppercase tracking-widest">Trust Score</span>
                    <span className="text-green-500 font-black">EXCEPTIONAL</span>
                 </div>
                 <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[98%] h-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]" />
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
