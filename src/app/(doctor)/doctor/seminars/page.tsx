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
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { onSeminarHostedAction, onCampaignCreatedAction } from "@/app/actions/automations";
import { getDoctorSeminars, createSeminarAction } from "./actions";

export default function SeminarsPage() {
  const [isHostingOpen, setIsHostingOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<any>(null);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [successState, setSuccessState] = useState<string | null>(null);
  const [mySeminars, setMySeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getDoctorSeminars();
      if (data && data.length > 0) setMySeminars(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleHostSeminar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await createSeminarAction(formData);
      setSuccessState("seminar");
      
      // Reload data
      const data = await getDoctorSeminars();
      setMySeminars(data);

      setTimeout(() => {
        setIsHostingOpen(false);
        setSuccessState(null);
        setIsSubmitting(false);
      }, 2000);
    } catch (err) {
      alert("Failed to create seminar");
      setIsSubmitting(false);
    }
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    onCampaignCreatedAction("dr-natalie", "Holiday Promotion");
    setSuccessState("campaign");
    setTimeout(() => {
      setIsCampaignOpen(false);
      setSuccessState(null);
    }, 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Seminar Hub</h1>
          <p className="text-neuro-gray mt-2 text-lg">Your event command center: host, track, and grow.</p>
        </div>
        <Link
          href="/host-a-seminar"
          className="bg-neuro-orange text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-neuro-orange-light transition-all transform hover:scale-105 flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          <span className="font-black uppercase tracking-widest text-sm">Host a Seminar</span>
        </Link>      </header>

      {/* Seminar Analytics */}
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
                  <p className="text-2xl font-black text-neuro-navy">124</p>
                  <span className="text-[10px] font-bold text-green-500">+12% vs last month</span>
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
                  <p className="text-2xl font-black text-neuro-navy">$32,450</p>
                  <span className="text-[10px] font-bold text-neuro-orange">Est. ROI: 8.4x</span>
               </div>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group">
            <div className="p-3 bg-purple-50 rounded-2xl">
               <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Network Rating</p>
               <p className="text-2xl font-black text-neuro-navy">4.9/5</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seminar List & Management */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-black text-neuro-navy">Active Listings</h2>
              <button className="text-xs font-bold text-gray-400 hover:text-neuro-navy">View Past Events</button>
           </div>
           
           {mySeminars.map((sem, i) => (
             <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm group hover:shadow-xl transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                   <div className="space-y-2">
                      <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 ${sem.is_approved ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-neuro-orange'} text-[9px] font-black rounded uppercase tracking-widest border ${sem.is_approved ? 'border-green-100' : 'border-neuro-orange/20'}`}>
                            {sem.is_approved ? 'Published' : 'Awaiting Approval'}
                         </span>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sem.dates}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors">{sem.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                         <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {sem.location}</span>
                         <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-neuro-orange rounded-full border border-orange-100 animate-pulse">
                               <Eye className="w-2.5 h-2.5" />
                               <span className="text-[8px] font-black uppercase">42 Students Watching</span>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-6 md:border-l md:border-gray-50 md:pl-6">
                      <div className="text-center">
                         <p className="text-xl font-black text-neuro-navy">{sem.registrations?.[0]?.count || 0}</p>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sold</p>
                      </div>
                      <div className="text-center">
                         <p className="text-xl font-black text-neuro-navy">{sem.page_views || 0}</p>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Views</p>
                      </div>
                      <div className="text-center">
                         <p className="text-xl font-black text-neuro-orange">{sem.clicks || 0}</p>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Clicks</p>
                      </div>
                      <div className="text-center">
                         <p className="text-xl font-black text-green-600">${(sem.registrations?.[0]?.count || 0) * (sem.price || 0)}</p>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Revenue</p>
                      </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                   <button className="py-3 bg-gray-50 text-neuro-navy font-bold rounded-xl text-xs hover:bg-gray-100 transition-colors">
                      Edit Details
                   </button>
                   <button className="py-3 bg-gray-50 text-neuro-navy font-bold rounded-xl text-xs hover:bg-gray-100 transition-colors">
                      Manage Attendees
                   </button>
                   <button 
                    onClick={() => setIsAnalyticsOpen(sem)}
                    className="py-3 bg-neuro-navy text-white font-bold rounded-xl text-xs hover:bg-neuro-navy-light transition-colors shadow-lg shadow-neuro-navy/10"
                   >
                      View Analytics
                   </button>
                </div>
             </div>
           ))}

           <div className="bg-neuro-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[80px] -mr-32 -mt-32"></div>
              <div className="relative z-10 flex items-center justify-between gap-6">
                 <div>
                    <h3 className="text-xl font-bold mb-2">Seminar Leaderboard</h3>
                    <p className="text-gray-400 text-xs max-w-sm">
                       See how your events compare to top-performing NeuroChiro seminars globally.
                    </p>
                 </div>
                 <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-colors backdrop-blur-md">
                    View Rankings
                 </button>
              </div>
           </div>
        </div>

        {/* Promotion Sidebar */}
        <div className="space-y-6">
           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h3 className="font-heading font-black text-lg text-neuro-navy mb-6">Promotion Center</h3>
              
              <div className="space-y-4 mb-8">
                 {[
                   { name: "Top of Feed", price: "$24/wk", icon: Sparkles, discount: "2.5x Visibility Lift" },
                   { name: "Email Blast", price: "$75/once", icon: Calendar, discount: "Avg. 15-20 Leads" },
                   { name: "Global Push", price: "$149/wk", icon: TrendingUp, discount: "Max ROI Multiplier" }
                 ].map((opt, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group cursor-pointer hover:border-neuro-orange transition-all">
                      <div className="flex items-center gap-3">
                         <opt.icon className="w-4 h-4 text-neuro-orange" />
                         <div>
                            <span className="text-sm font-bold text-neuro-navy block">{opt.name}</span>
                            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-1 rounded">{opt.discount}</span>
                         </div>
                      </div>
                      <span className="text-xs font-black text-gray-400">{opt.price}</span>
                   </div>
                 ))}
              </div>

              <button 
                onClick={() => setIsCampaignOpen(true)}
                className="w-full py-4 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all transform hover:scale-[1.02] shadow-xl"
              >
                 Create Campaign
              </button>
           </section>

           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h4 className="font-bold text-neuro-navy mb-2 text-sm uppercase tracking-widest">Student Insights</h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                 Top interests of students viewing your seminars:
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                 {["Pediatrics", "Scanning", "Business"].map((tag, i) => (
                   <span key={i} className="px-3 py-1 bg-neuro-cream rounded-full text-[9px] font-black uppercase text-neuro-navy">
                      {tag}
                   </span>
                 ))}
              </div>

              <div className="p-5 bg-neuro-orange/5 rounded-2xl border border-neuro-orange/10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-8 h-8 text-neuro-orange" />
                 </div>
                 <p className="text-[10px] font-black text-neuro-orange uppercase tracking-[0.2em] mb-2">Hormozi Sell-Out Hack</p>
                 <p className="text-xs font-bold text-neuro-navy leading-relaxed italic">
                    "82% of students viewing your events are searching for 'Clinical Certainty.' Rename your 2:00 PM slot to 'The Certainty Architecture' to increase conversion by 30%."
                 </p>
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
                  {/* Step 1: Event Details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-neuro-navy border-b border-gray-100 pb-2">1. Event Details</h4>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Seminar Title</label>
                      <input 
                        name="title"
                        required
                        placeholder="e.g. Advanced Vagal Assessment"
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Description</label>
                      <textarea 
                        name="description"
                        required
                        rows={3}
                        placeholder="What will attendees learn?"
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">City & Country</label>
                        <input 
                          name="location"
                          required
                          placeholder="e.g. London, UK"
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Dates</label>
                        <input 
                          name="dates"
                          required
                          placeholder="Oct 12-14, 2026"
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Registration Link</label>
                      <input 
                        type="url"
                        name="registration_link"
                        required
                        placeholder="https://..."
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all"
                      />
                    </div>

                    <div className="space-y-4 pt-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Target Audience</label>
                      <div className="flex gap-4 px-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" name="target_audience" value="Doctors" className="w-4 h-4 accent-neuro-orange" defaultChecked />
                          <span className="text-sm font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors">Doctors</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" name="target_audience" value="Students" className="w-4 h-4 accent-neuro-orange" defaultChecked />
                          <span className="text-sm font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors">Students</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Clinical Tags (Comma separated)</label>
                      <input 
                        name="tags"
                        placeholder="e.g. Pediatrics, Neurology, Vagus Nerve"
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Step 2: Promotional Tier Selection */}
                  <div className="space-y-4 pt-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-neuro-navy border-b border-gray-100 pb-2">2. Select Promotional Tier</h4>
                    <p className="text-[11px] text-neuro-orange font-bold mb-4">You are currently receiving discounted MEMBER PRICING.</p>
                    
                    <div className="space-y-3">
                      <label className="flex items-start gap-4 p-4 border-2 border-gray-100 rounded-2xl cursor-pointer hover:border-neuro-orange transition-all has-[:checked]:border-neuro-orange has-[:checked]:bg-neuro-orange/5">
                        <input type="radio" name="tier" value="basic" className="mt-1 accent-neuro-orange w-4 h-4" defaultChecked />
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-neuro-navy">Basic Listing</span>
                            <span className="font-black text-neuro-orange">$49</span>
                          </div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Standard directory appearance.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-4 p-4 border-2 border-gray-100 rounded-2xl cursor-pointer hover:border-neuro-orange transition-all has-[:checked]:border-neuro-orange has-[:checked]:bg-neuro-orange/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-bl-lg">Recommended</div>
                        <input type="radio" name="tier" value="featured" className="mt-1 accent-neuro-orange w-4 h-4" />
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-neuro-navy">Featured Event</span>
                            <span className="font-black text-neuro-orange">$149</span>
                          </div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Highlighted placement + Email blast.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-4 p-4 border-2 border-gray-100 rounded-2xl cursor-pointer hover:border-neuro-orange transition-all has-[:checked]:border-neuro-orange has-[:checked]:bg-neuro-orange/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-neuro-navy text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-bl-lg">Maximum Reach</div>
                        <input type="radio" name="tier" value="premium" className="mt-1 accent-neuro-orange w-4 h-4" />
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-neuro-navy">Premium Promotion</span>
                            <span className="font-black text-neuro-orange">$399</span>
                          </div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Homepage Carousel + Instagram Story.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 uppercase tracking-widest text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    Proceed to Payment Checkout
                  </button>
                </form>
              )}
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
                     <p className="text-xl font-black text-neuro-navy">{isAnalyticsOpen.registrations}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Conv. Rate</p>
                     <p className="text-xl font-black text-green-600">{isAnalyticsOpen.details.conversions}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Watch</p>
                     <p className="text-xl font-black text-blue-600">{isAnalyticsOpen.details.avgWatchTime}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Views</p>
                     <p className="text-xl font-black text-neuro-navy">{isAnalyticsOpen.views}</p>
                  </div>
               </div>

               <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center min-h-[200px] text-center">
                  <PieChart className="w-12 h-12 text-gray-200 mb-4" />
                  <h4 className="font-bold text-neuro-navy">Regional Interest</h4>
                  <p className="text-xs text-gray-500 mt-1">Most interest from the <span className="text-neuro-orange font-bold">{isAnalyticsOpen.details.regionalInterest}</span> region.</p>
               </div>

               <button 
                onClick={() => setIsAnalyticsOpen(null)}
                className="w-full py-4 bg-neuro-navy text-white font-black rounded-xl hover:bg-neuro-navy-light transition-colors"
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
                  <h3 className="font-bold">Create Marketing Campaign</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Boost your visibility</p>
                </div>
              </div>
              <button onClick={() => setIsCampaignOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8">
              {successState === "campaign" ? (
                <div className="py-12 text-center space-y-4 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold text-neuro-navy">Campaign Launched!</h4>
                  <p className="text-gray-500">Your campaign is now active and boosting your reach.</p>
                </div>
              ) : (
                <form onSubmit={handleCreateCampaign} className="space-y-6">
                  <div className="space-y-4">
                     <p className="text-xs text-gray-500 leading-relaxed">Select your boost targets and confirm to launch your NeuroChiro ecosystem campaign.</p>
                     <div className="space-y-2">
                        {["Student Radar Boost", "Doctor Directory Top-of-Feed", "Global Event Blast"].map((target, i) => (
                           <label key={i} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:border-neuro-orange transition-all">
                              <span className="text-sm font-bold text-neuro-navy">{target}</span>
                              <input type="checkbox" className="w-4 h-4 accent-neuro-orange" />
                           </label>
                        ))}
                     </div>
                  </div>
                  <div className="p-4 bg-neuro-orange/5 rounded-2xl border border-neuro-orange/10 flex items-center justify-between">
                     <span className="text-xs font-black text-neuro-navy uppercase">Total Budget</span>
                     <span className="text-lg font-black text-neuro-orange">$249.00</span>
                  </div>
                  <button className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 uppercase tracking-widest text-sm">
                    Launch Campaign
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
