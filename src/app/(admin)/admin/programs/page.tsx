"use client";

import { 
  GraduationCap, 
  Video, 
  Users, 
  Award, 
  TrendingUp, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  BarChart3,
  Calendar,
  DollarSign,
  Plus,
  X
} from "lucide-react";
import { useState } from "react";
import { onBroadcastDispatchedAction } from "@/app/actions/automations";

export default function ProgramOperations() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  const programs = [
    { name: "Clinical Mastermind", enrollment: 450, completion: "92%", revenue: "$85k", active: true, description: "Advanced clinical protocols for high-performance practices." },
    { name: "Seminar Series", enrollment: 820, completion: "75%", revenue: "$42k", active: true, description: "Monthly live seminars covering the latest in neuro-chiropractic research." }
  ];

  const handleProgramBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    onBroadcastDispatchedAction("super-admin", { title: "Program Update", type: "Program" });
    setIsBroadcastModalOpen(false);
    alert("Program-wide broadcast dispatched successfully.");
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-neuro-orange">
            <GraduationCap className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Curriculum Management</span>
          </div>
          <h1 className="text-4xl font-heading font-black text-white">Program Operations</h1>
          <p className="text-gray-400 mt-2 text-lg font-medium">Manage enrollment, curriculum delivery, and student outcomes.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setIsBroadcastModalOpen(true)}
            className="px-8 py-4 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-sm hover:bg-white/5 transition-all"
          >
            Broadcast to Students
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-neuro-orange text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-neuro-orange-light transition-all transform hover:scale-105 flex items-center gap-3 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="font-black uppercase tracking-widest text-sm">New Program</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Program Cards */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {programs.map((program, i) => (
              <section key={i} className="bg-white/5 border border-white/5 rounded-2xl p-8 hover:border-neuro-orange/30 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-neuro-navy flex items-center justify-center text-neuro-orange">
                    <Video className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest">Enrollment Open</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{program.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">{program.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Students</p>
                    <p className="text-xl font-black text-white">{program.enrollment}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Completion</p>
                    <p className="text-xl font-black text-white">{program.completion}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedProgram(program)}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-neuro-orange transition-all flex items-center justify-center gap-2"
                >
                  Manage Curriculum <ArrowRight className="w-4 h-4" />
                </button>
              </section>
            ))}
          </div>

          {/* Student Reviews / Activity */}
          <section className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-heading font-black text-white">Student Progress Logs</h3>
              <button 
                onClick={() => alert("Loading complete student activity logs...")}
                className="text-xs font-black text-neuro-orange uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/10"></div>
                    <div>
                      <p className="font-bold text-white">Student User #{i+1}</p>
                      <p className="text-xs text-gray-500">Completed: Module 4 - Tonal Integration</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">2 hours ago</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-8">
          <section className="bg-neuro-navy rounded-2xl p-10 shadow-2xl relative overflow-hidden">
            <h3 className="text-2xl font-heading font-black text-white mb-8">Unit Economics</h3>
            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Total Program Revenue</p>
                <p className="text-4xl font-black text-white">$127,450</p>
                <div className="flex items-center gap-2 mt-2 text-green-500 text-xs font-bold">
                  <TrendingUp className="w-4 h-4" /> +12% from last month
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-lg font-black text-white">1,270</p>
                  <p className="text-xs font-black text-gray-500 uppercase">Active Students</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-lg font-black text-white">84%</p>
                  <p className="text-xs font-black text-gray-500 uppercase">Avg Completion</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReviewModalOpen(true)}
                className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
              >
                <BarChart3 className="w-5 h-5 text-neuro-orange" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Full Financial Report</span>
              </button>
            </div>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-2xl p-8">
            <h3 className="text-lg font-black text-white mb-6">Action Required</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-neuro-orange" />
                  <span className="text-xs font-bold text-gray-400">14 Certificates Pending</span>
                </div>
                <button 
                  onClick={() => alert("Opening certificate signing module...")}
                  className="text-[10px] font-black uppercase text-white hover:text-neuro-orange transition-colors"
                >
                  Sign
                </button>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-gray-400">8 Preceptor Matches</span>
                </div>
                <button 
                  onClick={() => alert("Opening preceptor review dashboard...")}
                  className="text-[10px] font-black uppercase text-white hover:text-blue-500 transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* MODALS */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-[#0A0D14] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/10 p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white">Program Broadcast</h3>
              <button onClick={() => setIsBroadcastModalOpen(false)}><X className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleProgramBroadcast} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Message</label>
                <textarea rows={4} placeholder="Compose message to all enrolled students..." className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-neuro-orange"></textarea>
              </div>
              <button type="submit" className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-neuro-orange/20 mt-4">Dispatch to All Students</button>
            </form>
          </div>
        </div>
      )}

      {selectedProgram && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-[#0A0D14] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black text-white">{selectedProgram.name}</h3>
                <p className="text-xs font-black text-neuro-orange uppercase tracking-[0.2em] mt-1">Operational Control</p>
              </div>
              <button onClick={() => setSelectedProgram(null)}><X className="text-gray-500" /></button>
            </div>
            <div className="p-10 grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Enrolled Students</p>
                <p className="text-lg font-bold text-white">{selectedProgram.enrollment}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Revenue Generated</p>
                <p className="text-lg font-bold text-white">{selectedProgram.revenue}</p>
              </div>
              <div className="col-span-2 pt-6 border-t border-white/5 space-y-4">
                <button 
                  onClick={() => alert("Launching curriculum editor...")}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 text-neuro-orange" /> Edit Curriculum
                </button>
                <button 
                  onClick={() => alert("Opening program scheduler...")}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-blue-500" /> Manage Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
