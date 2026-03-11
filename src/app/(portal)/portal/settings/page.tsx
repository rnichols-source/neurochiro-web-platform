"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  MapPin, 
  Star,
  Settings as SettingsIcon,
  ChevronRight,
  Activity,
  Calendar,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle2,
  Brain,
  Zap,
  Briefcase,
  Building2,
  Search,
  Phone,
  Mail,
  Heart,
  Dna,
  History,
  Sparkles,
  Trophy,
  ShieldCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationSettings from "@/components/layout/NotificationSettings";

export default function IdentityPage() {
  const [activeTab, setActiveTab] = useState("Health Profile");
  const router = useRouter();

  const tabs = [
    { label: "Personal Info", icon: User },
    { label: "Health Profile", icon: Shield },
    { label: "Careers", icon: Briefcase },
    { label: "Notifications", icon: Bell },
    { label: "Billing & Plans", icon: CreditCard },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 text-neuro-navy">
      
      {/* Segmented Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Main Profile & Health Content */}
        <div className="lg:col-span-8 space-y-6">
           
           {/* Profile Hero Block (Navy) */}
           <section className="bg-neuro-navy p-8 md:p-12 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[100px] pointer-events-none"></div>
              <div className="absolute bottom-0 right-10 opacity-10">
                 <Zap className="w-48 h-48" />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                 <div className="relative">
                    <div className="w-32 h-32 rounded-[2rem] bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center text-white text-4xl font-black shadow-2xl shrink-0 transition-transform group-hover:scale-105 duration-500">
                       JD
                    </div>
                    <button 
                      onClick={() => alert("Launching profile image editor...")}
                      className="absolute -bottom-2 -right-2 w-12 h-12 bg-neuro-orange text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-4 border-neuro-navy group"
                    >
                       <SettingsIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                 </div>
                 <div className="text-center md:text-left space-y-4">
                    <div className="space-y-1">
                       <span className="text-[10px] font-black uppercase text-neuro-orange tracking-[0.4em]">Patient Identity</span>
                       <h1 className="text-5xl font-heading font-black tracking-tight">Jane Doe</h1>
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                       <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Active Member</span>
                       </div>
                       <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Since Jan 2026</span>
                    </div>
                 </div>
              </div>

              <div className="mt-12 flex gap-4 relative z-10">
                 <button 
                  onClick={() => alert("Generating secure Health ID QR code...")}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                 >
                    View Health ID
                 </button>
                 <button 
                  onClick={() => alert("Opening secure sharing options...")}
                  className="px-6 py-3 bg-neuro-orange text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-neuro-orange/20"
                 >
                    Share Profile
                 </button>
              </div>
           </section>

           {/* Content Sections (Segmented) */}
           <AnimatePresence mode="wait">
              {activeTab === "Health Profile" ? (
                <motion.div 
                  key="health-profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                   {/* Neural Snapshot Card */}
                   <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neuro-orange/10 rounded-2xl flex items-center justify-center">
                               <Shield className="w-6 h-6 text-neuro-orange" />
                            </div>
                            <h3 className="text-2xl font-heading font-black text-neuro-navy">Neural Snapshot</h3>
                         </div>
                         <button 
                          onClick={() => alert("Redirecting to goal alignment wizard...")}
                          className="px-5 py-2.5 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-xl hover:text-neuro-orange transition-colors"
                         >
                          Update Goal
                         </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                         <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:border-neuro-orange/20 transition-all">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Regulation Goal</p>
                            <p className="font-black text-neuro-navy text-xl">Anxiety & Stress</p>
                            <p className="text-xs text-gray-400 mt-2 font-medium">Prioritizing Parasympathetic Recovery</p>
                         </div>
                         <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:border-neuro-orange/20 transition-all">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Care Frequency</p>
                            <p className="font-black text-neuro-navy text-xl">Weekly (Phase 1)</p>
                            <p className="text-xs text-gray-400 mt-2 font-medium">Integration & Neural Priming</p>
                         </div>
                      </div>
                   </section>

                   {/* Latest Scans Segment */}
                   <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                               <Heart className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-heading font-black text-neuro-navy">Latest Scans</h3>
                         </div>
                         <button 
                          onClick={() => alert("Loading historical neural scan data...")}
                          className="text-[10px] font-black uppercase tracking-widest text-neuro-orange hover:underline"
                         >
                          View History
                         </button>
                      </div>
                      
                      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6`}>
                         {[
                           { name: "Thermal Scan", date: "Feb 12", score: "88", color: "text-blue-500" },
                           { name: "HRV Scan", date: "Feb 12", score: "74", color: "text-green-500" },
                           { name: "sEMG Scan", date: "Jan 28", score: "91", color: "text-neuro-orange" }
                         ].map((scan) => (
                           <div key={scan.name} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-center">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{scan.name}</p>
                              <p className={`text-4xl font-black mb-1 ${scan.color}`}>{scan.score}</p>
                              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{scan.date}</p>
                           </div>
                         ))}
                      </div>
                   </section>

                   {/* Practitioners Card */}
                   <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                               <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-heading font-black text-neuro-navy">Care Journey</h3>
                         </div>
                         <span className="px-4 py-1.5 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-gray-100">2 Practitioners</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {[
                           { name: "Dr. Sarah Miller", clinic: "NeuroFlow Health", rating: 4.9, img: "bg-blue-50" },
                           { name: "Dr. Mark Thorne", clinic: "Spine & Brain Center", rating: 5.0, img: "bg-orange-50" },
                         ].map((doc) => (
                           <div key={doc.name} className="flex flex-col p-8 bg-white border border-gray-100 hover:border-neuro-orange/30 rounded-[2rem] transition-all cursor-pointer group shadow-sm hover:shadow-xl relative overflow-hidden">
                              <div className="flex items-center justify-between mb-8">
                                 <div className={`w-16 h-16 rounded-2xl ${doc.img} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <User className="w-8 h-8 text-neuro-navy opacity-20" />
                                 </div>
                                 <div className="flex items-center gap-1 text-neuro-orange font-black text-sm">
                                    <Star className="w-4 h-4 fill-current" /> {doc.rating}
                                 </div>
                              </div>
                              <div>
                                 <h4 className="text-xl font-black text-neuro-navy group-hover:text-neuro-orange transition-colors mb-1">{doc.name}</h4>
                                 <p className="text-xs text-gray-400 flex items-center gap-2 font-bold uppercase tracking-widest"><MapPin className="w-3 h-3 text-neuro-orange" /> {doc.clinic}</p>
                              </div>
                              <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                 <span className="text-[10px] font-black text-neuro-navy uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-2">
                                    View Clinic <ArrowRight className="w-3 h-3" />
                                 </span>
                              </div>
                           </div>
                         ))}
                      </div>
                   </section>
                </motion.div>
              ) : activeTab === "Personal Info" ? (
                <motion.div 
                   key="personal-info"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="space-y-6"
                >
                   {/* Contact Information */}
                   <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                               <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-heading font-black text-neuro-navy">Contact Details</h3>
                         </div>
                         <button 
                          onClick={() => alert("Launching contact information editor...")}
                          className="px-5 py-2.5 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-xl hover:text-neuro-orange transition-colors"
                         >
                          Edit
                         </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Email Address</label>
                            <p className="text-neuro-navy font-bold flex items-center gap-2">jane.doe@example.com <CheckCircle2 className="w-4 h-4 text-green-500" /></p>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Phone Number</label>
                            <p className="text-neuro-navy font-bold flex items-center gap-2">+1 (555) 000-0000 <CheckCircle2 className="w-4 h-4 text-green-500" /></p>
                         </div>
                         <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Primary Address</label>
                            <p className="text-neuro-navy font-bold">123 Clinical Way, Austin, TX 78701</p>
                         </div>
                      </div>
                   </section>

                   {/* Demographic Details */}
                   <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                               <Dna className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-heading font-black text-neuro-navy">Demographics</h3>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                         {[
                           { label: "Date of Birth", value: "Jan 1, 1990" },
                           { label: "Gender", value: "Female" },
                           { label: "Weight", value: "145 lbs" },
                           { label: "Height", value: "5'7\"" }
                         ].map(item => (
                            <div key={item.label} className="space-y-1">
                               <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.label}</label>
                               <p className="text-neuro-navy font-black">{item.value}</p>
                            </div>
                         ))}
                      </div>
                   </section>

                   {/* Emergency Contact */}
                   <section className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-between group cursor-pointer hover:border-neuro-orange/30 transition-all">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                            <Phone className="w-5 h-5 text-red-500" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-neuro-navy">Emergency Contact</p>
                            <p className="text-xs font-bold text-gray-400">Not set yet</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => alert("Opening emergency contact modal...")}
                        className="px-6 py-3 bg-neuro-navy text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-neuro-orange transition-all"
                      >
                        Add Contact
                      </button>
                   </section>
                </motion.div>
              ) : activeTab === "Careers" ? (
                <motion.div 
                  key="careers"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                   {/* Career Intro Card */}
                   <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neuro-orange/10 rounded-2xl flex items-center justify-center text-neuro-orange">
                               <Briefcase className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-heading font-black text-neuro-navy">CA Career Hub</h3>
                         </div>
                         <button 
                          onClick={() => alert("Launching secure resume uploader...")}
                          className="px-5 py-2.5 bg-neuro-navy text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-neuro-orange transition-all"
                         >
                          Upload Resume
                         </button>
                      </div>
                      <p className="text-gray-400 font-medium leading-relaxed max-w-2xl mb-8">
                         Looking to enter the chiropractic field? Explore Chiropractic Assistant (CA) roles at top-tier NeuroChiro clinics. Build your clinical experience while helping patients heal.
                      </p>
                      <div className="flex flex-wrap gap-3">
                         {["Full-Time", "Part-Time", "Entry Level", "Neuro-Certified"].map(tag => (
                            <span key={tag} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-neuro-navy">{tag}</span>
                         ))}
                      </div>
                   </section>

                   {/* Job Listings Grid */}
                   <div className="grid grid-cols-1 gap-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-4">Available CA Roles</h4>
                      {[
                        { title: "Lead Chiropractic Assistant", clinic: "Vitality Brain & Body", loc: "Austin, TX", salary: "$22-28/hr", type: "Full-Time" },
                        { title: "Clinical Support Specialist", clinic: "Apex Neuro-Spine", loc: "Denver, CO", salary: "$19-25/hr", type: "Part-Time" },
                        { title: "Front Desk CA (Bilingual)", clinic: "Flow Chiropractic", loc: "Miami, FL", salary: "$20-24/hr", type: "Full-Time" }
                      ].map((job) => (
                        <div key={job.title + job.clinic} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-neuro-orange/30 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer">
                           <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-neuro-orange/5 transition-colors">
                                 <Building2 className="w-6 h-6 text-gray-300 group-hover:text-neuro-orange" />
                              </div>
                              <div>
                                 <h5 className="font-black text-neuro-navy group-hover:text-neuro-orange transition-colors">{job.title}</h5>
                                 <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs font-bold text-gray-400">{job.clinic}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.loc}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                              <div className="text-right hidden sm:block">
                                 <p className="text-xs font-black text-neuro-navy">{job.salary}</p>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{job.type}</p>
                              </div>
                              <button 
                                onClick={() => alert(`Redirecting to full details for ${job.title}...`)}
                                className="px-6 py-3 bg-gray-50 hover:bg-neuro-navy hover:text-white text-neuro-navy rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                View Details
                              </button>
                           </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => router.push("/jobs")}
                        className="w-full py-4 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 text-[10px] font-black uppercase tracking-widest hover:border-neuro-orange hover:text-neuro-orange transition-all flex items-center justify-center gap-2"
                      >
                         <Search className="w-4 h-4" /> Browse 14 More Openings
                      </button>
                   </div>
                </motion.div>
              ) : activeTab === "Notifications" ? (
                <motion.div 
                  key="notifications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                   <NotificationSettings />
                </motion.div>
              ) : activeTab === "Billing & Plans" ? (
                <motion.div 
                  key="billing-plans"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                   {/* Plan Overview */}
                   <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neuro-orange/10 rounded-2xl flex items-center justify-center">
                               <ShieldCheck className="w-6 h-6 text-neuro-orange" />
                            </div>
                            <h3 className="text-2xl font-heading font-black text-neuro-navy">Membership Overview</h3>
                         </div>
                         <span className="px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100 animate-pulse">Active Status</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-gray-50 pb-10 mb-10">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Plan</p>
                          <p className="text-3xl font-black text-neuro-navy">Patient Standard</p>
                          <p className="text-xs text-gray-400 font-medium">Free Lifetime Neural Access</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</p>
                          <p className="text-3xl font-black text-neuro-navy">$0<span className="text-sm font-normal text-gray-400">/forever</span></p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-100 group">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Trophy className="w-7 h-7 text-neuro-orange" />
                          </div>
                          <div>
                            <h4 className="font-black text-neuro-navy uppercase tracking-tight">Council of Elders Access</h4>
                            <p className="text-xs text-gray-500 max-w-xs">Gain exclusive access to the NeuroChiro inner circle and clinical roundtables.</p>
                          </div>
                        </div>
                        <button className="px-8 py-4 bg-neuro-navy text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-neuro-navy-light transition-all shadow-xl">
                          Upgrade to Council
                        </button>
                      </div>
                   </section>

                   {/* Payment Methods */}
                   <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                      <h3 className="text-xl font-black text-neuro-navy mb-8 flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-blue-500" /> Payment Methods
                      </h3>
                      <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                        <Lock className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                        <p className="text-sm text-gray-400 font-medium">No payment methods on file.</p>
                        <button 
                          onClick={() => alert("Launching Stripe onboarding...")}
                          className="mt-4 text-[10px] font-black uppercase tracking-widest text-neuro-orange hover:underline"
                        >
                          Add Method
                        </button>
                      </div>
                   </section>

                   {/* Transaction History */}
                   <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                      <h3 className="text-xl font-black text-neuro-navy mb-8 flex items-center gap-3">
                        <History className="w-6 h-6 text-gray-400" /> Billing History
                      </h3>
                      <div className="space-y-4">
                        {[
                          { date: "Jan 01, 2026", amount: "$0.00", type: "Plan Activation" }
                        ].map((tx, i) => (
                          <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <div>
                              <p className="text-sm font-black text-neuro-navy">{tx.type}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tx.date}</p>
                            </div>
                            <span className="font-black text-neuro-navy">{tx.amount}</span>
                          </div>
                        ))}
                      </div>
                   </section>
                </motion.div>
              ) : null}
           </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Stats & Nav Segmented Blocks */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* Profile Strength Block */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center md:text-left relative overflow-hidden">
              <div className="flex flex-col items-center md:items-start gap-4 relative z-20">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Profile Strength</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-neuro-navy">85</span>
                    <span className="text-xl font-black text-neuro-orange">%</span>
                 </div>
                 <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mt-4">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: "85%" }}
                       className="h-full bg-neuro-orange"
                    ></motion.div>
                 </div>
                 <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">Almost there! Complete your health profile.</p>
              </div>
           </section>

           {/* Account Navigation Block */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 px-2">Account Management</h3>
              <nav className="space-y-2">
                {tabs.map((item) => (
                  <button 
                    key={item.label}
                    onClick={() => setActiveTab(item.label)}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all group ${
                      activeTab === item.label 
                        ? "bg-neuro-navy text-white shadow-xl shadow-neuro-navy/20" 
                        : "text-gray-400 hover:bg-gray-50 hover:text-neuro-navy"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className={`w-5 h-5 ${activeTab === item.label ? 'text-neuro-orange' : 'group-hover:text-neuro-orange'}`} />
                      <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.label ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                  </button>
                ))}
              </nav>
           </section>

           {/* Latest Reports Segment */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 px-2">Recent Reports</h3>
              <div className={`space-y-4`}>
                 {[
                   { title: "Initial Consultation", date: "Jan 15, 2026", icon: FileText, color: "text-blue-500" },
                   { title: "Progress Report", date: "Feb 10, 2026", icon: History, color: "text-green-500" }
                 ].map(report => (
                    <div key={report.title} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-gray-50 rounded-xl transition-all">
                       <div className="flex items-center gap-4">
                          <report.icon className={`w-5 h-5 ${report.color}`} />
                          <div>
                             <p className="text-xs font-black text-neuro-navy">{report.title}</p>
                             <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{report.date}</p>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-neuro-orange transition-colors" />
                    </div>
                 ))}
              </div>
           </section>

           {/* Plan Status Block (Navy) */}
           <section className="bg-neuro-navy p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-neuro-orange/10 blur-[80px] pointer-events-none"></div>
              <div className="relative z-10">
                 <span className="text-[10px] font-black uppercase text-neuro-orange tracking-[0.3em] mb-6 block">Care Status</span>
                 <h3 className="text-2xl font-heading font-black mb-2">Patient Access</h3>
                 <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed">
                    Full neurological tracking and clinical hub access is free for all patients.
                 </p>
                 
                 <div className="space-y-4 mb-10">
                    {[
                       { name: "Digital Health ID", active: true },
                       { name: "Full Scan History", active: true },
                       { name: "Clinic Booking", active: true },
                       { name: "Educational Hub", active: true }
                    ].map(f => (
                       <div key={f.name} className={`flex items-center gap-3`}>
                          <div className="p-1 bg-neuro-orange/20 rounded-full">
                             <CheckCircle2 className="w-3 h-3 text-neuro-orange" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{f.name}</span>
                       </div>
                    ))}
                 </div>

                 <div className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
                    Active Free Account <ShieldCheck className="w-4 h-4 text-neuro-orange" />
                 </div>
              </div>
           </section>

        </div>

      </div>
    </div>
  );
}
