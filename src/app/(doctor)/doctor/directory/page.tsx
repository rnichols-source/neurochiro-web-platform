"use client";

import { Search, MapPin, Filter, Star, ShieldCheck, ArrowRight, Sparkles, Network, UserPlus, MessageSquare, X, Check, Mail, User, Zap, Handshake } from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useDoctorTier } from "@/context/DoctorTierContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DirectoryExplorer() {
  const { tier } = useDoctorTier();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMessaging, setIsMessaging] = useState<string | null>(null);
  const [messageSent, setMessageSent] = useState(false);
  
  // New States for handshakes
  const [handshakesRemaining, setHandshakesRemaining] = useState(3);
  const [handshakeSentTo, setHandshakeSentTo] = useState<string | null>(null);
  
  // New States for requested buttons
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);

  const doctors = [
    {
      id: "dr-1",
      name: "Dr. Ryan Smith",
      clinic: "Summit Chiropractic",
      location: "Boulder, CO",
      specialties: ["Pediatrics", "Sports"],
      rating: 4.9,
      isVerified: true,
      isPartner: true,
      lookingForPartners: true
    },
    {
      id: "dr-2",
      name: "Dr. Amanda White",
      clinic: "The Neural Hive",
      location: "Austin, TX",
      specialties: ["Prenatal", "Neuro-Dev"],
      rating: 5.0,
      isVerified: true,
      isPartner: false,
      lookingForPartners: true
    },
    {
      id: "dr-3",
      name: "Dr. David Kim",
      clinic: "Pacific Neuro Health",
      location: "San Diego, CA",
      specialties: ["Neurology", "TBI"],
      rating: 4.8,
      isVerified: true,
      isPartner: true,
      lookingForPartners: false
    }
  ];

  const partnersLooking = useMemo(() => doctors.filter(d => d.lookingForPartners), []);

  const handleHandshake = (docName: string) => {
    if (tier === 'starter' && handshakesRemaining <= 0) {
      alert("You've used all your Golden Handshakes for this month. Upgrade to Growth for unlimited connections!");
      return;
    }
    
    setHandshakeSentTo(docName);
    if (tier === 'starter') {
      setHandshakesRemaining(prev => prev - 1);
    }
    
    setTimeout(() => {
      setHandshakeSentTo(null);
    }, 2000);
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => {
      setIsMessaging(null);
      setMessageSent(false);
    }, 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSent(true);
    setTimeout(() => {
      setIsInviteOpen(false);
      setInviteSent(false);
    }, 2000);
  };

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

      {/* Reciprocity Loop / Golden Handshakes */}
      <section className="bg-gradient-to-br from-neuro-navy to-neuro-navy-dark rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[100px] -mr-32 -mt-32"></div>
         <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-8">
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-neuro-orange">
                     <Sparkles className="w-5 h-5" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em]">Reciprocity Loop</span>
                  </div>
                  <h2 className="text-3xl font-heading font-black text-white">3 Doctors in your region are looking for referral partners.</h2>
                  <p className="text-gray-400 text-sm max-w-lg">One-click handshakes send a neuro-centric introduction to local docs to jumpstart your clinical network.</p>
               </div>
               
               {tier === 'starter' && (
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md flex items-center gap-6">
                     <div className="text-center">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Golden Handshakes</p>
                        <div className="flex items-center gap-2 justify-center">
                           <span className="text-3xl font-black text-neuro-orange">{handshakesRemaining}</span>
                           <span className="text-xs font-bold text-gray-400">/ 3 Left</span>
                        </div>
                     </div>
                     <div className="h-10 w-px bg-white/10"></div>
                     <Link href="/pricing" className="text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:underline flex items-center gap-1">
                        Get Unlimited <Zap className="w-3 h-3 fill-neuro-orange" />
                     </Link>
                  </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {partnersLooking.map((partner) => (
                  <div key={partner.id} className="p-5 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-neuro-navy border border-white/10 flex items-center justify-center font-black text-neuro-orange">
                           {partner.name.split(' ').slice(1).map(n => n[0]).join('')}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white group-hover:text-neuro-orange transition-colors">{partner.name}</p>
                           <p className="text-[10px] text-gray-500">{partner.location}</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => handleHandshake(partner.name)}
                        disabled={handshakeSentTo === partner.name}
                        className={cn(
                           "p-3 rounded-xl transition-all active:scale-90",
                           handshakeSentTo === partner.name 
                              ? "bg-green-500 text-white" 
                              : "bg-neuro-orange/10 text-neuro-orange hover:bg-neuro-orange hover:text-white"
                        )}
                     >
                        {handshakeSentTo === partner.name ? <Check className="w-5 h-5" /> : <Handshake className="w-5 h-5" />}
                     </button>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-neuro-orange/20 transition-colors cursor-pointer">
            <div className="p-3 bg-blue-50 rounded-2xl">
               <Network className="w-6 h-6 text-blue-600" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Partners</p>
               <p className="text-2xl font-black text-neuro-navy">12</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-neuro-orange/20 transition-colors cursor-pointer">
            <div className="p-3 bg-green-50 rounded-2xl">
               <ArrowRight className="w-6 h-6 text-green-600 -rotate-45" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Referrals Sent</p>
               <p className="text-2xl font-black text-neuro-navy">8</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-neuro-orange/20 transition-colors cursor-pointer">
            <div className="p-3 bg-orange-50 rounded-2xl">
               <ArrowRight className="w-6 h-6 text-neuro-orange rotate-45" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Referrals Received</p>
               <p className="text-2xl font-black text-neuro-navy">15</p>
            </div>
         </div>
      </div>

      {/* Search & Map Toggle */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctors by name, technique, or city..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => alert("Opening specialty filters...")}
            className="px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-neuro-navy hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
           >
              <Filter className="w-4 h-4 text-gray-400" /> Specialties
           </button>
           <Link href="/directory" className="px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-neuro-navy hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
              <MapPin className="w-5 h-5 text-neuro-orange" /> Map View
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDoctors.map((doc, i) => (
          <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
             {doc.isPartner && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                   Partner
                </div>
             )}
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-neuro-navy flex items-center justify-center text-white font-black text-xl">
                   {doc.name.split(' ').slice(1).map(n => n[0]).join('')}
                </div>
                <div>
                   <h3 className="font-bold text-lg text-neuro-navy flex items-center gap-1 group-hover:text-neuro-orange transition-colors">
                      {doc.name} {doc.isVerified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                   </h3>
                   <p className="text-xs text-gray-500">{doc.clinic}</p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                   <MapPin className="w-4 h-4 text-gray-400" /> {doc.location}
                </div>
                <div className="flex flex-wrap gap-2">
                   {doc.specialties.map((spec, j) => (
                     <span key={j} className="px-3 py-1 bg-neuro-cream rounded-full text-[9px] font-black uppercase text-neuro-navy">
                        {spec}
                     </span>
                   ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-50">
                   <button 
                    onClick={() => alert(`Viewing profile for ${doc.name}...`)}
                    className="py-2 bg-gray-50 text-neuro-navy text-[10px] font-black rounded-xl hover:bg-gray-100 transition-colors active:scale-95"
                   >
                      View Profile
                   </button>
                   <button 
                    onClick={() => setIsMessaging(doc.name)}
                    className="py-2 bg-neuro-navy text-white text-[10px] font-black rounded-xl hover:bg-neuro-navy-light transition-colors flex items-center justify-center gap-1 active:scale-95"
                   >
                      <MessageSquare className="w-3 h-3" /> Message
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* MY CONNECTIONS MODAL */}
      {isConnectionsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neuro-orange/20 rounded-2xl flex items-center justify-center text-neuro-orange">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">My Network Connections</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Active Clinical Partners</p>
                </div>
              </div>
              <button onClick={() => setIsConnectionsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {doctors.filter(d => d.isPartner).map(partner => (
                  <div key={partner.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neuro-navy rounded-xl flex items-center justify-center text-white font-bold text-xs">
                        {partner.name.split(' ').slice(1).map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neuro-navy">{partner.name}</p>
                        <p className="text-[10px] text-gray-500">{partner.clinic}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsMessaging(partner.name)}
                      className="p-2 hover:bg-neuro-orange/10 text-neuro-navy hover:text-neuro-orange rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVITE DOCTOR MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neuro-orange/20 rounded-2xl flex items-center justify-center text-neuro-orange">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">Invite a Doctor</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Expand the NeuroChiro Network</p>
                </div>
              </div>
              <button onClick={() => setIsInviteOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8">
              {inviteSent ? (
                <div className="py-12 text-center space-y-4 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold text-neuro-navy">Invitation Sent!</h4>
                  <p className="text-gray-500">We've sent a secure link to your colleague.</p>
                </div>
              ) : (
                <form onSubmit={handleSendInvite} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Doctor's Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        required
                        placeholder="Dr. Julian Reed"
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="email"
                        required
                        placeholder="doctor@clinic.com"
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all"
                      />
                    </div>
                  </div>
                  <button className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 uppercase tracking-widest text-sm">
                    Send Invitation
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messaging Modal */}
      {isMessaging && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neuro-orange rounded-2xl flex items-center justify-center font-black">
                  {isMessaging.split(' ').slice(1).map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold">Message {isMessaging}</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Direct Referral Inquiry</p>
                </div>
              </div>
              <button onClick={() => setIsMessaging(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8">
              {messageSent ? (
                <div className="py-12 text-center space-y-4 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold text-neuro-navy">Message Sent!</h4>
                  <p className="text-gray-500">Your referral inquiry has been delivered.</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Your Message</label>
                    <textarea 
                      required
                      placeholder="Hi Doctor, I have a patient moving to your area..."
                      className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 min-h-[150px] transition-all"
                    />
                  </div>
                  <button className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 uppercase tracking-widest text-sm">
                    Send Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
