"use client";

import { 
  Calendar, 
  Plus, 
  MapPin, 
  Clock, 
  Tag, 
  Search, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  BarChart3,
  Users,
  Award,
  X,
  Check,
  Mail,
  DollarSign,
  Globe,
  PieChart,
  Loader2,
  Star,
  Eye,
  Zap,
  Target,
  Download,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { onSeminarHostedAction, onCampaignCreatedAction } from "@/app/actions/automations";
import { 
  getDoctorSeminars, 
  createSeminarAction, 
  getSeminarAnalytics, 
  createSeminarCampaignAction,
  getSeminarAttendees,
  exportAttendeesToCSV,
  updateSeminarAction
} from "./actions";

export default function SeminarsPage() {
  const [isHostingOpen, setIsHostingOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState<any>(null);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isCampaignOpen, setIsCampaignOpen] = useState<any>(null);
  const [successState, setSuccessState] = useState<string | null>(null);
  const [mySeminars, setMySeminars] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Campaign options state
  const [campaignOptions, setCampaignOptions] = useState({
    topOfFeed: true,
    studentRadar: false,
    globalPush: false
  });

  useEffect(() => {
    async function load() {
      const [seminars, stats] = await Promise.all([
        getDoctorSeminars(),
        getSeminarAnalytics()
      ]);
      setMySeminars(seminars);
      setAnalytics(stats);
      setLoading(false);
    }
    load();
  }, []);

  const handleHostSeminar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createSeminarAction(formData);
      if (result.success) {
        setSuccessState("seminar");
        
        // Reload data and WAIT for it
        const [seminars, stats] = await Promise.all([
          getDoctorSeminars(),
          getSeminarAnalytics()
        ]);
        setMySeminars(seminars);
        setAnalytics(stats);

        // Success message then close
        setTimeout(() => {
          setIsHostingOpen(false);
          setSuccessState(null);
          setIsSubmitting(false);
        }, 1500);
      } else {
        alert((result as any).error || "Failed to create seminar");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert(err.message || "Failed to create seminar");
      setIsSubmitting(false);
    }
  };

  const handleUpdateSeminar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await updateSeminarAction(isEditOpen.id, formData);
      if (result.success) {
        // Reload data
        const seminars = await getDoctorSeminars();
        setMySeminars(seminars);
        setIsEditOpen(null);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert(err.message || "Failed to update seminar");
      setIsSubmitting(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!isCampaignOpen) return;
    setIsSubmitting(true);
    try {
      const result = await createSeminarCampaignAction(isCampaignOpen.id, campaignOptions);
      if ('error' in result && result.error) {
        alert(result.error);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert(err.message || "Failed to initiate campaign checkout");
      setIsSubmitting(false);
    }
  };

  const handleDownloadCSV = async (seminarId: string) => {
    const csvContent = await exportAttendeesToCSV(seminarId);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${seminarId}.csv`;
    a.click();
  };

  useEffect(() => {
    if (isAttendeesOpen) {
      getSeminarAttendees(isAttendeesOpen.id).then(setAttendees);
    } else {
      setAttendees([]);
    }
  }, [isAttendeesOpen]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  const totalBudget = (campaignOptions.topOfFeed ? 99 : 0) + 
                     (campaignOptions.studentRadar ? 75 : 0) + 
                     (campaignOptions.globalPush ? 149 : 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Seminar Hub</h1>
          <p className="text-neuro-gray mt-2 text-lg">Your event command center: host, track, and grow.</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/host-a-seminar"
            className="px-6 py-4 bg-white border border-gray-200 text-neuro-navy font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            View Hosting Packages
          </Link>
          <button
            onClick={() => setIsHostingOpen(true)}
            className="bg-neuro-orange text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-neuro-orange-light transition-all transform hover:scale-105 flex items-center gap-3"
          >
            <Plus className="w-5 h-5" />
            <span className="font-black uppercase tracking-widest text-sm">Host a Seminar</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 bg-neuro-orange/10 text-neuro-orange">
               <TrendingUp className="w-3 h-3" />
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl">
               <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Clinical Authority Index</p>
               <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-neuro-navy">{analytics?.authorityIndex || 0}</p>
               </div>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group">
            <div className="p-3 bg-green-50 rounded-2xl">
               <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gross Revenue (YTD)</p>
               <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-neuro-navy">${(analytics?.grossRevenue || 0).toLocaleString()}</p>
                  <span className="text-[10px] font-bold text-neuro-orange">Verified Income</span>
               </div>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group">
            <div className="p-3 bg-purple-50 rounded-2xl">
               <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Event Rating</p>
               <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-neuro-navy">{analytics?.avgRating || "N/A"}</p>
               </div>
            </div>
         </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seminar List */}
        <div className="lg:col-span-2 space-y-6">
           {mySeminars.map((s, i) => (
             <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-start gap-6">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-neuro-navy font-black text-xl">
                   {s.title.substring(0,2).toUpperCase()}
                </div>
                <div className="flex-1">
                   <h3 className="font-bold text-lg text-neuro-navy mb-1">{s.title}</h3>
                   <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {s.dates}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {s.location}</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => setIsAnalyticsOpen(s)} className="p-3 hover:bg-gray-50 rounded-xl transition-colors"><BarChart3 className="w-4 h-4 text-gray-400" /></button>
                   <button onClick={() => setIsAttendeesOpen(s)} className="p-3 hover:bg-gray-50 rounded-xl transition-colors"><Users className="w-4 h-4 text-gray-400" /></button>
                   <button onClick={() => setIsEditOpen(s)} className="px-6 py-3 bg-neuro-navy text-white font-black rounded-xl hover:bg-neuro-navy-light transition-all text-[10px] uppercase tracking-widest">Edit</button>
                </div>
             </div>
           ))}
           
           <div className="p-8 bg-neuro-navy rounded-[2.5rem] text-white flex items-center justify-between shadow-xl">
                 <div>
                    <h3 className="text-xl font-bold mb-2">Seminar Leaderboard</h3>
                    <p className="text-gray-400 text-xs max-w-sm">
                       See how your events compare to top-performing NeuroChiro seminars globally.
                    </p>
                 </div>
                 <Link
                  href="/doctor/analytics"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all backdrop-blur-md flex items-center justify-center"
                 >
                    View Rankings
                 </Link>
           </div>
        </div>

        {/* Promotion Sidebar */}
        <div className="space-y-6">
           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-neuro-orange" />
                <h3 className="font-heading font-black text-lg text-neuro-navy">Promotion Center</h3>
              </div>
              
              <div className="space-y-4 mb-8">
                 {[
                   { name: "Top of Feed", price: "$99/wk", icon: Sparkles, discount: "Estimated ROI: 8x", badge: null },
                   { name: "15-25 Target Student Leads", price: "$75/once", icon: Mail, discount: "Estimated ROI: 12x", badge: "90% of Sell-Outs Use This" },
                   { name: "Global Push", price: "$149/wk", icon: TrendingUp, discount: "Max ROI Multiplier", badge: null }
                 ].map((opt, i) => (
                   <div 
                    key={i} 
                    className="relative p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all"
                   >
                      {opt.badge && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-neuro-navy text-white text-[7px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full shadow-lg z-10 whitespace-nowrap">
                           {opt.badge}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <opt.icon className="w-4 h-4 text-neuro-orange" />
                           <div>
                              <span className="text-[11px] font-black text-neuro-navy block leading-tight">{opt.name}</span>
                              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-1 rounded">{opt.discount}</span>
                           </div>
                        </div>
                        <span className="text-xs font-black text-gray-400 group-hover:text-neuro-orange transition-colors">{opt.price}</span>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-4 bg-neuro-orange/5 rounded-2xl border border-neuro-orange/10 mb-6">
                 <p className="text-[10px] text-neuro-navy font-bold leading-relaxed">
                    <Zap className="w-3 h-3 text-neuro-orange inline mr-1 mb-0.5" />
                    Boosted events see an average <span className="text-neuro-orange">450% increase</span> in registration clicks.
                 </p>
              </div>

              <button 
                onClick={() => {
                  if (mySeminars.length > 0) setIsCampaignOpen(mySeminars[0]);
                  else alert("Host a seminar first to create a campaign.");
                }}
                className="w-full py-4 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all transform hover:scale-[1.02] shadow-xl"
              >
                 Launch Campaign
              </button>
           </section>

           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h4 className="font-bold text-neuro-navy mb-2 text-sm uppercase tracking-widest">Student Insights</h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                 Demand Harvest: Use these "answer keys" to sell out your next event.
              </p>
              
              <div className="space-y-4">
                 <div className="p-5 bg-neuro-orange/5 rounded-2xl border border-neuro-orange/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Sparkles className="w-8 h-8 text-neuro-orange" />
                    </div>
                    <p className="text-[9px] font-black text-neuro-orange uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                       <Zap className="w-3 h-3 fill-current" /> Sell-Out Hack #1
                    </p>
                    <p className="text-xs font-bold text-neuro-navy leading-relaxed italic">
                       "82% of students viewing your events are searching for 'Clinical Certainty.' Rename your 2:00 PM slot to 'The Certainty Architecture' to increase conversion by 30%."
                    </p>
                 </div>
              </div>
           </section>
        </div>
      </div>

      {/* HOST SEMINAR MODAL */}
      {isHostingOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neuro-orange/20 rounded-2xl flex items-center justify-center text-neuro-orange">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">Host a New Seminar</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Share your clinical expertise</p>
                </div>
              </div>
              <button onClick={() => setIsHostingOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8">
              {successState === "seminar" ? (
                <div className="py-12 text-center space-y-4 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold text-neuro-navy">Seminar Draft Saved!</h4>
                  <p className="text-gray-500">Your seminar has been saved to your drafts.</p>
                </div>
              ) : (
                <form onSubmit={handleHostSeminar} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-neuro-navy border-b border-gray-100 pb-2">1. Event Details</h4>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Seminar Title</label>
                      <input name="title" required placeholder="e.g. Advanced Vagal Assessment" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Description</label>
                      <textarea name="description" required rows={3} placeholder="What will attendees learn?" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Location</label>
                        <input name="location" required placeholder="e.g. London, UK" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Dates</label>
                        <input name="dates" required placeholder="Oct 12-14, 2026" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Registration Link (External URL)</label>
                        <input name="registration_link" required placeholder="https://eventbrite.com/your-event" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Price ($)</label>
                          <input type="number" name="price" required placeholder="299" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Capacity</label>
                          <input type="number" name="max_capacity" required placeholder="50" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                       </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 uppercase tracking-widest text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save & Proceed"}
                  </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT SEMINAR MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neuro-orange/20 rounded-2xl flex items-center justify-center text-neuro-orange">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">Edit Seminar</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Update Listing Details</p>
                </div>
              </div>
              <button onClick={() => setIsEditOpen(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
               <form onSubmit={handleUpdateSeminar} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Seminar Title</label>
                      <input name="title" defaultValue={isEditOpen.title} required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Description</label>
                      <textarea name="description" defaultValue={isEditOpen.description} required rows={3} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Location</label>
                        <input name="location" defaultValue={isEditOpen.location} required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Dates</label>
                        <input name="dates" defaultValue={isEditOpen.dates} required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Registration Link</label>
                      <input name="registration_link" defaultValue={isEditOpen.registration_link} required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Price ($)</label>
                          <input type="number" name="price" defaultValue={isEditOpen.price} required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Capacity</label>
                          <input type="number" name="max_capacity" defaultValue={isEditOpen.max_capacity} required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all" />
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                     <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-neuro-orange text-white font-black rounded-xl hover:bg-neuro-orange-light transition-all shadow-lg uppercase tracking-widest text-[10px]">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Changes"}
                     </button>
                     <button type="button" onClick={() => setIsEditOpen(null)} className="flex-1 py-4 bg-gray-50 text-neuro-navy font-black rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest text-[10px]">
                        Cancel
                     </button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE ATTENDEES MODAL */}
      {isAttendeesOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neuro-orange/20 rounded-2xl flex items-center justify-center text-neuro-orange">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">Attendees - {isAttendeesOpen.title}</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Roster Management</p>
                </div>
              </div>
              <button onClick={() => setIsAttendeesOpen(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
               {attendees.length === 0 ? (
                 <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center min-h-[300px] text-center">
                    <Users className="w-12 h-12 text-gray-200 mb-4" />
                    <h4 className="font-bold text-neuro-navy">No registrations yet</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">Once students and doctors register for this event, they will appear in this roster.</p>
                 </div>
               ) : (
                 <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                    <table className="w-full text-left">
                       <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                          <tr>
                             <th className="pb-4 pl-2">Name</th>
                             <th className="pb-4">Role</th>
                             <th className="pb-4">Email</th>
                             <th className="pb-4 text-right pr-2">Paid</th>
                          </tr>
                       </thead>
                       <tbody className="text-xs">
                          {attendees.map((a: any, i: number) => (
                            <tr key={i} className="border-b border-gray-50 group hover:bg-gray-50/50 transition-colors">
                               <td className="py-4 pl-2 font-bold text-neuro-navy">{a.profile?.full_name}</td>
                               <td className="py-4 capitalize text-gray-500">{a.profile?.role}</td>
                               <td className="py-4 text-gray-400">{a.profile?.email}</td>
                               <td className="py-4 text-right pr-2 font-black text-green-600">${a.amount_paid}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
               <div className="flex gap-4">
                  <button
                    onClick={() => handleDownloadCSV(isAttendeesOpen.id)}
                    disabled={attendees.length === 0}
                    className="flex-1 py-4 bg-gray-50 text-neuro-navy font-black rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     <Download className="w-3.5 h-3.5" /> Export to CSV
                  </button>
                  <button
                   onClick={() => setIsAttendeesOpen(null)}
                   className="flex-1 py-4 bg-neuro-navy text-white font-black rounded-xl hover:bg-neuro-navy-light transition-colors uppercase tracking-widest text-[10px]"
                  >
                     Close Roster
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ANALYTICS MODAL */}
      {isAnalyticsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neuro-orange/20 rounded-2xl flex items-center justify-center text-neuro-orange">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">{isAnalyticsOpen.title} - Analytics</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Performance Intelligence</p>
                </div>
              </div>
              <button onClick={() => setIsAnalyticsOpen(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Registrations</p>
                     <p className="text-xl font-black text-neuro-navy">{isAnalyticsOpen.registrations?.[0]?.count || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Clicks</p>
                     <p className="text-xl font-black text-neuro-orange">{isAnalyticsOpen.clicks || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Conv. Rate</p>
                     <p className="text-xl font-black text-green-600">
                       {isAnalyticsOpen.page_views > 0 ? Math.round(((isAnalyticsOpen.registrations?.[0]?.count || 0) / isAnalyticsOpen.page_views) * 100) : 0}%
                     </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Views</p>
                     <p className="text-xl font-black text-neuro-navy">{isAnalyticsOpen.page_views || 0}</p>
                  </div>
               </div>

               <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center min-h-[200px] text-center">
                  <PieChart className="w-12 h-12 text-gray-200 mb-4" />
                  <h4 className="font-bold text-neuro-navy">Attendee Demographics</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm">Detailed attendee mapping and regional interest data accumulates after your first 10 verified registrations.</p>
               </div>
               <button 
                onClick={() => setIsAnalyticsOpen(null)}
                className="w-full py-4 bg-neuro-navy text-white font-black rounded-xl hover:bg-neuro-navy-light transition-colors shadow-lg"
               >
                  Close Insights
               </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {isCampaignOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neuro-orange/20 rounded-2xl flex items-center justify-center text-neuro-orange">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">Boost: {isCampaignOpen.title}</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Targeted Visibility Engine</p>
                </div>
              </div>
              <button onClick={() => setIsCampaignOpen(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
               <div className="space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed">Boost your seminar's performance by targeting the exact audience segments looking for your clinical expertise.</p>
                  
                  <div className="space-y-3">
                     <label className="flex items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:border-neuro-orange transition-all has-[:checked]:border-neuro-orange has-[:checked]:bg-neuro-orange/5 group">
                        <div className="flex items-center gap-3">
                           <Sparkles className="w-4 h-4 text-neuro-orange" />
                           <div>
                              <span className="text-sm font-bold text-neuro-navy block">Top of Feed Placement</span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pin to top of directory</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-xs font-black text-neuro-navy group-hover:text-neuro-orange">$99</span>
                           <input 
                             type="checkbox" 
                             className="w-5 h-5 accent-neuro-orange rounded-md" 
                             checked={campaignOptions.topOfFeed}
                             onChange={(e) => setCampaignOptions(prev => ({ ...prev, topOfFeed: e.target.checked }))}
                           />
                        </div>
                     </label>

                     <label className="flex items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:border-neuro-orange transition-all has-[:checked]:border-neuro-orange has-[:checked]:bg-neuro-orange/5 group">
                        <div className="flex items-center gap-3">
                           <Target className="w-4 h-4 text-neuro-orange" />
                           <div>
                              <span className="text-sm font-bold text-neuro-navy block">Student Radar Boost</span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Direct Student Notification</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-xs font-black text-neuro-navy group-hover:text-neuro-orange">$75</span>
                           <input 
                             type="checkbox" 
                             className="w-5 h-5 accent-neuro-orange rounded-md" 
                             checked={campaignOptions.studentRadar}
                             onChange={(e) => setCampaignOptions(prev => ({ ...prev, studentRadar: e.target.checked }))}
                           />
                        </div>
                     </label>

                     <label className="flex items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:border-neuro-orange transition-all has-[:checked]:border-neuro-orange has-[:checked]:bg-neuro-orange/5 group">
                        <div className="flex items-center gap-3">
                           <Globe className="w-4 h-4 text-neuro-orange" />
                           <div>
                              <span className="text-sm font-bold text-neuro-navy block">Global Push Notification</span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">All mobile app users</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-xs font-black text-neuro-navy group-hover:text-neuro-orange">$149</span>
                           <input 
                             type="checkbox" 
                             className="w-5 h-5 accent-neuro-orange rounded-md" 
                             checked={campaignOptions.globalPush}
                             onChange={(e) => setCampaignOptions(prev => ({ ...prev, globalPush: e.target.checked }))}
                           />
                        </div>
                     </label>
                  </div>
               </div>

               <div className="p-6 bg-neuro-orange text-white rounded-3xl flex items-center justify-between shadow-xl shadow-neuro-orange/20">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Campaign Total</span>
                    <p className="text-2xl font-black">${totalBudget.toLocaleString()}.00</p>
                  </div>
                  <button 
                    onClick={handleLaunchCampaign}
                    disabled={isSubmitting || totalBudget === 0}
                    className="px-8 py-3 bg-white text-neuro-orange font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-lg flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Launch Now"}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
