"use client";

import { 
  Users, 
  GraduationCap, 
  Target, 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  BarChart3,
  MousePointerClick,
  ChevronRight,
  UserPlus,
  X
} from "lucide-react";
import { useState } from "react";
import { onBroadcastDispatchedAction } from "@/app/actions/automations";

export default function TalentIntelligence() {
  const [activeTab, setActiveTab] = useState('Students');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const students = [
    { name: "Raymond Nichols", school: "Life University", grad: "2027", status: "Paid", matches: 12, engagement: 98, email: "ray@example.com", joined: "Jan 2024" },
    { name: "Sarah Miller", school: "Palmer College", grad: "2026", status: "Free", matches: 8, engagement: 85, email: "sarah@example.com", joined: "Mar 2024" },
    { name: "James Wilson", school: "Logan University", grad: "2025", status: "Paid", matches: 15, engagement: 92, email: "james@example.com", joined: "Feb 2024" }
  ];

  const handleBroadcast = () => {
    onBroadcastDispatchedAction("super-admin", { title: "Talent Network Update", type: "Talent" });
    alert("Talent network broadcast dispatched.");
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-neuro-orange">
            <Target className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Marketplace Governance</span>
          </div>
          <h1 className="text-4xl font-heading font-black text-white">Talent Intelligence</h1>
          <p className="text-gray-400 mt-2 text-lg font-medium">Monitor student engagement, clinical matches, and account verification.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleBroadcast}
            className="px-8 py-4 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-sm hover:bg-white/5 transition-all"
          >
            Broadcast to Talent
          </button>
          <button 
            onClick={() => setIsAuditModalOpen(true)}
            className="bg-neuro-orange text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-neuro-orange-light transition-all transform hover:scale-105 flex items-center gap-3 active:scale-95"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="font-black uppercase tracking-widest text-sm">System Audit</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation & Filters */}
        <div className="space-y-6">
          <nav className="bg-white/5 border border-white/5 rounded-[2rem] p-2">
            {['Students', 'Doctors', 'Vendors'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-neuro-orange text-white shadow-lg' : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <section className="bg-white/5 border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Filter Results</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase">Search by Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Users..." 
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-neuro-orange text-white" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase">Member Status</label>
                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none appearance-none">
                  <option>All Statuses</option>
                  <option>Paid (Premium)</option>
                  <option>Free (Lite)</option>
                  <option>Pending</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* User Table */}
        <div className="lg:col-span-3 space-y-8">
          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">User Details</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Engagement</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Matches</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((student, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-neuro-navy flex items-center justify-center text-neuro-orange font-black text-xl">
                            {student.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-white text-lg">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.school} • {student.grad}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          student.status === 'Paid' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm font-bold text-white">{student.engagement}%</span>
                          <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-neuro-orange" style={{ width: `${student.engagement}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center font-bold text-white">
                        {student.matches}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => setSelectedStudent(student)}
                          className="p-3 hover:bg-neuro-orange hover:text-white rounded-xl transition-all text-gray-500"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-white/5 border-t border-white/5 text-center">
              <button className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Load More Users</button>
            </div>
          </section>
        </div>
      </div>

      {/* STUDENT DETAIL MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-[#0A0D14] rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-neuro-navy flex items-center justify-center text-neuro-orange font-black text-3xl shadow-xl">
                  {selectedStudent.name[0]}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{selectedStudent.name}</h3>
                  <p className="text-xs font-black text-neuro-orange uppercase tracking-[0.2em] mt-1">{selectedStudent.school} • Class of {selectedStudent.grad}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500">
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Member Since</p>
                  <p className="text-lg font-bold text-white">{selectedStudent.joined}</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Matches</p>
                  <p className="text-lg font-bold text-white">{selectedStudent.matches}</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Status</p>
                  <p className="text-lg font-bold text-green-500">{selectedStudent.status}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Administrative Control</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button className="py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <MousePointerClick className="w-4 h-4" /> Reset Engagement
                  </button>
                  <button className="py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase text-white hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center gap-2">
                    Suspend Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
