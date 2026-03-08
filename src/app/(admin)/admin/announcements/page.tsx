"use client";

import { 
  Megaphone, 
  Send, 
  Clock, 
  Users, 
  ShieldAlert, 
  Bell, 
  Globe, 
  Search,
  Filter,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { dispatchBroadcastAction, scheduleBroadcastAction } from "./actions";

export default function PlatformAnnouncements() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [successState, setSuccessState] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftAudience, setDraftAudience] = useState("All Platform Users");
  const [draftContent, setDraftContent] = useState("");
  const [switches, setSwitches] = useState({
    push: true,
    email: false,
    modal: false
  });

  const announcements = [
    { id: 1, title: "System Maintenance: Oct 20th", date: "Oct 12, 2025", type: "Critical", audience: "All Users", status: "Scheduled", content: "We will be performing scheduled system maintenance on October 20th from 2:00 AM to 4:00 AM EST. Some services may be unavailable during this time." },
    { id: 2, title: "New Mastermind Cohort Open", date: "Oct 10, 2025", type: "Success", audience: "Doctors", status: "Sent", content: "Applications for the 2026 NeuroChiro Mastermind cohort are now officially open. Apply through your doctor dashboard." },
    { id: 3, title: "AU Region Licensing Update", date: "Oct 08, 2025", type: "Info", audience: "Regional Admins", status: "Sent", content: "New licensing requirements for the Australia region have been updated. Please review the updated compliance documents." }
  ];

  const handleDispatch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const data = { title: draftTitle, audience: draftAudience, content: draftContent, logic: switches };
    dispatchBroadcastAction(data);
    setSuccessState("dispatched");
    setTimeout(() => {
      setSuccessState(null);
      setIsCreateModalOpen(false);
      setDraftTitle("");
      setDraftContent("");
    }, 2000);
  };

  const handleSchedule = () => {
    const data = { title: draftTitle, audience: draftAudience, content: draftContent, logic: switches };
    scheduleBroadcastAction(data);
    setSuccessState("scheduled");
    setTimeout(() => {
      setSuccessState(null);
      setIsCreateModalOpen(false);
    }, 2000);
  };

  const handleDelete = (title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      alert(`Announcement "${title}" has been deleted.`);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 text-white">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-neuro-orange">
            <Megaphone className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Communication Control</span>
          </div>
          <h1 className="text-4xl font-heading font-black">Platform Announcements</h1>
          <p className="text-gray-400 mt-2 text-lg font-medium">Broadcast critical updates across the NeuroChiro ecosystem.</p>
        </div>
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-neuro-orange text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-neuro-orange-light transition-all transform hover:scale-105 flex items-center gap-3 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="font-black uppercase tracking-widest text-sm">Create Broadcast</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed / Management */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-heading font-black">Recent Broadcasts</h3>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="Search logs..." className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-neuro-orange" />
                </div>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {announcements.map((a, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Bell className={`w-5 h-5 ${a.type === 'Critical' ? 'text-red-500' : a.type === 'Success' ? 'text-green-500' : 'text-blue-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${a.type === 'Critical' ? 'text-red-500' : a.type === 'Success' ? 'text-green-500' : 'text-blue-500'}`}>{a.type}</span>
                        <span className="text-[10px] text-gray-500">• {a.date}</span>
                      </div>
                      <h4 className="font-bold text-lg">{a.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">Target: {a.audience}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${a.status === 'Sent' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                      {a.status}
                    </span>
                    <button 
                      onClick={() => setSelectedAnnouncement(a)}
                      className="p-2 hover:text-neuro-orange transition-colors active:scale-90"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(a.title)}
                      className="p-2 hover:text-red-500 transition-colors active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => alert("Loading full communication log...")}
              className="w-full py-4 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors bg-white/5 active:bg-white/10"
            >
              View Full Communication Log
            </button>
          </section>

          {/* New Broadcast Draft */}
          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-heading font-black mb-8 flex items-center gap-2">
              <Plus className="w-5 h-5 text-neuro-orange" /> New Broadcast Draft
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Broadcast Title</label>
                  <input 
                    type="text" 
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="e.g. System Update V2" 
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neuro-orange transition-all text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Target Audience</label>
                  <select 
                    value={draftAudience}
                    onChange={(e) => setDraftAudience(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neuro-orange transition-all text-sm appearance-none"
                  >
                    <option>All Platform Users</option>
                    <option>Doctors Only</option>
                    <option>Students Only</option>
                    <option>Regional Admins</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Message Content</label>
                <textarea 
                  rows={4} 
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Compose your platform message..." 
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neuro-orange transition-all text-sm"
                ></textarea>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex gap-4">
                  <button 
                    onClick={handleSchedule}
                    className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors active:scale-95"
                  >
                    <Clock className="w-4 h-4" /> Schedule for Later
                  </button>
                  <button 
                    onClick={() => alert("Setting global coverage parameters...")}
                    className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors active:scale-95"
                  >
                    <Globe className="w-4 h-4" /> Global Coverage
                  </button>
                </div>
                <button 
                  onClick={() => handleDispatch()}
                  className="bg-neuro-orange text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-neuro-orange-light transition-all active:scale-95 shadow-lg shadow-neuro-orange/20"
                >
                  <Send className="w-4 h-4" /> Dispatch Now
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Reach & Analytics */}
        <div className="space-y-6">
          <section className="bg-neuro-navy rounded-[2rem] p-8 relative overflow-hidden shadow-2xl">
            <h3 className="text-xl font-heading font-black mb-6">Audience Reach</h3>
            <div className="space-y-6">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Impact</p>
                <p className="text-3xl font-black text-neuro-orange">14,245</p>
                <p className="text-[10px] text-green-500 font-bold mt-1">98% Delivery Rate</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <p className="text-lg font-black">8.4k</p>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Students</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <p className="text-lg font-black">2.1k</p>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Doctors</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-neuro-orange w-[85%]"></div>
              </div>
              <p className="text-[10px] text-gray-400 font-bold text-center uppercase">Email & Push Notifications Active</p>
            </div>
          </section>

          {/* Moderation Policies / Alert Logic */}
          <section className="bg-white/5 border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-xl font-heading font-black mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" /> Alert Logic
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Push to Mobile Devices</span>
                <div 
                  onClick={() => setSwitches({...switches, push: !switches.push})}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${switches.push ? 'bg-neuro-orange' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${switches.push ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Email All Subscribers</span>
                <div 
                  onClick={() => setSwitches({...switches, email: !switches.email})}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${switches.email ? 'bg-neuro-orange' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${switches.email ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Force In-App Modal</span>
                <div 
                  onClick={() => setSwitches({...switches, modal: !switches.modal})}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${switches.modal ? 'bg-neuro-orange' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${switches.modal ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-[#0A0D14] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-neuro-orange text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Create New Broadcast</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Platform-wide Communication</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8">
              {successState ? (
                <div className="py-12 text-center space-y-4 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10" />
                  </div>
                  <h4 className="text-2xl font-black">Broadcast {successState === 'dispatched' ? 'Sent' : 'Scheduled'}!</h4>
                  <p className="text-gray-400">The platform has processed your request successfully.</p>
                </div>
              ) : (
                <form onSubmit={handleDispatch} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Title</label>
                      <input 
                        required
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder="System Maintenance"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Target Audience</label>
                      <select 
                        value={draftAudience}
                        onChange={(e) => setDraftAudience(e.target.value)}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all appearance-none"
                      >
                        <option>All Platform Users</option>
                        <option>Doctors Only</option>
                        <option>Students Only</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Message</label>
                    <textarea 
                      required
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      rows={4}
                      placeholder="Enter your message here..."
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={handleSchedule}
                      className="flex-1 py-5 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 transition-all border border-white/10 uppercase tracking-widest text-sm"
                    >
                      Schedule
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-5 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 uppercase tracking-widest text-sm"
                    >
                      Dispatch Now
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-[#0A0D14] rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/10">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neuro-orange/20 rounded-2xl flex items-center justify-center text-neuro-orange">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">{selectedAnnouncement.title}</h3>
                  <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{selectedAnnouncement.status} • {selectedAnnouncement.date}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message Body</label>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-sm leading-relaxed text-gray-300">
                  {selectedAnnouncement.content}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Target Audience</p>
                  <p className="text-sm font-bold">{selectedAnnouncement.audience}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Priority Level</p>
                  <p className={`text-sm font-bold ${selectedAnnouncement.type === 'Critical' ? 'text-red-500' : 'text-blue-500'}`}>{selectedAnnouncement.type}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAnnouncement(null)}
                className="w-full py-4 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-all border border-white/10 uppercase tracking-widest text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* GLOBAL SUCCESS FEEDBACK (optional toast-like) */}
      {successState && !isCreateModalOpen && (
        <div className="fixed bottom-8 right-8 z-[300] bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-500">
           <Check className="w-5 h-5" />
           <span className="font-bold uppercase tracking-widest text-xs">Action Processed Successfully</span>
        </div>
      )}
    </div>
  );
}
