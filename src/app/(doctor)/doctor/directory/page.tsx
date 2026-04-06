"use client";

import { 
  Search, 
  MapPin, 
  Filter, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Network, 
  UserPlus, 
  MessageSquare, 
  X, 
  Check, 
  Mail, 
  User, 
  Zap, 
  Handshake,
  Loader2,
  Users,
  Clock
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  getReferralStats, 
  getReciprocityLoop, 
  getReferralDirectory, 
  requestConnection, 
  sendExternalInvite 
} from "./actions";

export default function ReferralNetworkPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  
  const [stats, setStats] = useState({ activePartners: 0, referralsSent: 0, referralsReceived: 0 });
  const [reciprocityLoop, setReciprocityLoop] = useState<any[]>([]);
  const [directory, setReferralDirectory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [s, loop, dir] = await Promise.all([
        getReferralStats(),
        getReciprocityLoop(),
        getReferralDirectory({ search: searchQuery, specialty: selectedSpecialty })
      ]);
      setStats(s);
      setReciprocityLoop(loop);
      setReferralDirectory(dir);
      setLoading(false);
    }
    loadData();
  }, [searchQuery, selectedSpecialty]);

  const handleHandshake = async (targetUserId: string) => {
    setActionLoading(targetUserId);
    try {
      await requestConnection(targetUserId);
      // Refresh data
      const [loop, dir] = await Promise.all([
        getReciprocityLoop(),
        getReferralDirectory({ search: searchQuery, specialty: selectedSpecialty })
      ]);
      setReciprocityLoop(loop);
      setReferralDirectory(dir);
    } catch (e) {
      alert("Failed to send handshake request");
    }
    setActionLoading(null);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSent(true);
    await sendExternalInvite(inviteEmail, "I'd like to connect with you on the NeuroChiro Referral Network.");
    setTimeout(() => {
      setIsInviteOpen(false);
      setInviteSent(false);
      setInviteEmail("");
    }, 2000);
  };

  const skeletons = Array(6).fill(0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Referral Network</h1>
          <p className="text-neuro-gray mt-2 text-lg">Connect, refer, and collaborate with the global NeuroChiro community.</p>
        </div>
        <div className="flex gap-3">
           <button
            onClick={() => setIsConnectionsOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-xl font-bold text-neuro-navy hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
           >
               <Network className="w-5 h-5 text-neuro-orange" /> My Connections
            </button>
            <button
             onClick={() => setIsInviteOpen(true)}
             className="flex items-center gap-2 px-6 py-3 bg-neuro-navy text-white font-bold rounded-xl hover:bg-neuro-navy-light transition-colors shadow-lg active:scale-95"
            >
               <UserPlus className="w-5 h-5" /> Invite Doctor
            </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: "Active Partners", value: stats.activePartners, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
           { label: "Referrals Sent", value: stats.referralsSent, icon: ArrowRight, color: "text-neuro-orange", bg: "bg-neuro-orange/10" },
           { label: "Referrals Received", value: stats.referralsReceived, icon: Sparkles, color: "text-green-600", bg: "bg-green-50" }
         ].map((kpi, i) => (
           <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
              <div className={`p-4 ${kpi.bg} rounded-2xl`}>
                 <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                 <p className="text-2xl font-black text-neuro-navy">{loading ? "..." : kpi.value}</p>
              </div>
           </div>
         ))}
      </div>

      {/* Reciprocity Loop Banner */}
      <section className="bg-neuro-navy rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-neuro-orange/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
               <Sparkles className="w-5 h-5 text-neuro-orange" />
               <span className="text-[10px] font-black uppercase tracking-widest text-neuro-orange">The Reciprocity Loop</span>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
               <div className="max-w-xl">
                  <h2 className="text-3xl font-heading font-black mb-4">Grow your clinical network locally.</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                     We've identified NeuroChiro peers within <span className="text-white font-bold">50 miles</span> of your clinic who are actively looking for referral partners.
                  </p>
               </div>

               <div className="flex -space-x-4 overflow-hidden">
                  {loading ? (
                    <div className="flex gap-2">
                      <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse"></div>
                      <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse"></div>
                    </div>
                  ) : reciprocityLoop.length > 0 ? (
                    reciprocityLoop.slice(0, 4).map((doc, i) => (
                      <div key={i} className="relative group cursor-pointer" title={`Dr. ${doc.last_name}`}>
                         <div className="w-14 h-14 rounded-full border-4 border-neuro-navy bg-gray-800 overflow-hidden group-hover:scale-110 transition-transform shadow-xl">
                            {doc.photo_url ? (
                              <img src={doc.photo_url} alt={doc.last_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-bold">{doc.last_name[0]}</div>
                            )}
                         </div>
                         <button 
                          onClick={() => handleHandshake(doc.user_id)}
                          disabled={actionLoading === doc.user_id}
                          className="absolute -bottom-1 -right-1 p-1.5 bg-neuro-orange rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            {actionLoading === doc.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Handshake className="w-3 h-3 text-white" />}
                         </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
                       <p className="text-xs font-bold text-gray-400 italic">No peers in your immediate area yet.</p>
                       <button onClick={() => setIsInviteOpen(true)} className="text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:underline">Invite a Local Peer</button>
                    </div>
                  )}
                  {reciprocityLoop.length > 4 && (
                    <div className="w-14 h-14 rounded-full border-4 border-neuro-navy bg-white/10 flex items-center justify-center text-xs font-black">
                       +{reciprocityLoop.length - 4}
                    </div>
                  )}
               </div>
            </div>
         </div>
      </section>

      {/* Directory Search & Filters */}
      <section className="space-y-6">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input 
                type="text" 
                placeholder="Search by name, technique, or city..." 
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-neuro-orange shadow-sm text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    className="pl-10 pr-8 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-neuro-orange shadow-sm text-sm appearance-none font-bold text-neuro-navy min-w-[200px]"
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                  >
                     <option>All Specialties</option>
                     <option>Pediatrics</option>
                     <option>Sports Performance</option>
                     <option>Prenatal</option>
                     <option>Functional Neurology</option>
                  </select>
               </div>
            </div>
         </div>

         {/* Doctor Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              skeletons.map((_, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm animate-pulse space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full"></div>
                      <div className="space-y-2">
                         <div className="h-4 w-32 bg-gray-100 rounded"></div>
                         <div className="h-3 w-24 bg-gray-100 rounded"></div>
                      </div>
                   </div>
                   <div className="h-24 bg-gray-50 rounded-2xl"></div>
                </div>
              ))
            ) : directory.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                 <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-neuro-navy">No doctors found</h3>
                 <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
              </div>
            ) : directory.map((doc, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                 {doc.isPartner && (
                   <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                      <ShieldCheck className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Active Partner</span>
                   </div>
                 )}
                 {doc.isPending && (
                   <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-neuro-orange rounded-full border border-neuro-orange/20">
                      <Clock className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Request Pending</span>
                   </div>
                 )}
                 
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-neuro-cream overflow-hidden border-2 border-gray-50 group-hover:border-neuro-orange transition-colors">
                       {doc.photo_url ? (
                         <img src={doc.photo_url} alt={doc.last_name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-neuro-navy font-bold">{doc.last_name[0]}</div>
                       )}
                    </div>
                    <div>
                       <h4 className="font-bold text-neuro-navy text-lg group-hover:text-neuro-orange transition-colors">Dr. {doc.first_name} {doc.last_name}</h4>
                       <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {doc.city}, {doc.state}</p>
                    </div>
                 </div>

                 <div className="space-y-4 mb-8">
                    <p className="text-xs text-gray-500 line-clamp-3 font-medium leading-relaxed italic">
                       "{doc.bio || 'Available for collaboration and referrals in the neuro-focused community.'}"
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                       {(doc.specialties || []).slice(0, 3).map((spec: string, j: number) => (
                         <span key={j} className="px-2.5 py-1 bg-neuro-cream text-neuro-navy text-[9px] font-black uppercase tracking-tighter rounded-lg border border-neuro-navy/5">{spec}</span>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <Link 
                      href={`/doctor/messages?to=${doc.user_id}`}
                      className="py-3 bg-gray-50 text-neuro-navy font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                       <MessageSquare className="w-3 h-3" /> Message
                    </Link>
                    {!doc.isPartner && !doc.isPending ? (
                      <button 
                        onClick={() => handleHandshake(doc.user_id)}
                        disabled={actionLoading === doc.user_id}
                        className="py-3 bg-neuro-orange text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-neuro-orange-light transition-all shadow-lg shadow-neuro-orange/10 flex items-center justify-center gap-2"
                      >
                         {actionLoading === doc.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Handshake className="w-3 h-3" /> Handshake</>}
                      </button>
                    ) : (
                      <a href={`/directory/${doc.slug}`} className="py-3 bg-white border border-gray-100 text-gray-400 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:border-neuro-orange/30 hover:text-neuro-orange transition-all">
                         <Star className={cn("w-3 h-3", doc.isPartner ? "text-neuro-orange fill-neuro-orange" : "text-gray-300")} /> View Profile
                      </a>
                    )}
                 </div>
              </div>
            ))}
         </div>
      </section>

      {/* INVITE MODAL */}
      <AnimatePresence>
        {isInviteOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neuro-orange/20 rounded-2xl flex items-center justify-center text-neuro-orange">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-tight">Invite Doctor</h3>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Grow the Network</p>
                  </div>
                </div>
                <button onClick={() => setIsInviteOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6 text-center">
                {inviteSent ? (
                  <motion.div initial={{ y: 10 }} animate={{ y: 0 }} className="py-12 flex flex-col items-center">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 border-4 border-green-100 shadow-xl">
                      <Check className="w-10 h-10" />
                    </div>
                    <h4 className="text-2xl font-black text-neuro-navy">Invitation Sent!</h4>
                    <p className="text-gray-500 text-sm mt-2">We've sent an access link to your peer.</p>
                  </motion.div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto font-medium">
                      Invite local doctors to join the NeuroChiro network. When they join, they'll automatically appear in your Reciprocity Loop.
                    </p>
                    <form onSubmit={handleSendInvite} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="email" 
                          required 
                          placeholder="doctor@clinic.com" 
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-neuro-orange text-sm font-bold"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl shadow-xl hover:bg-neuro-orange-dark transition-all uppercase tracking-widest text-xs">
                        Send Invite & Connect
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
