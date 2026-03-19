"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smile, 
  Zap, 
  Moon, 
  Activity, 
  ShieldAlert,
  ChevronRight,
  Plus,
  X,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Brain,
  ArrowRight,
  Flame,
  Award,
  Sparkles,
  ArrowUp
} from "lucide-react";
import { useRouter } from "next/navigation";

// Sub-component to handle its own state and satisfy the Rules of Hooks
function StressorGroup({ group }: { group: any }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-gray-100 rounded-[2rem] overflow-hidden bg-gray-50/30">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
           <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isOpen ? 'bg-neuro-orange text-white shadow-lg shadow-neuro-orange/20' : 'bg-white text-gray-400 border border-gray-100'}`}>
              <Activity className="w-4 h-4" />
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neuro-navy">{group.category}</span>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{group.items.length} items</span>
           <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
              <ArrowUp className="w-4 h-4 text-gray-300" />
           </motion.div>
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-white px-4 pb-4"
          >
            <div className="space-y-2 pt-2">
              {group.items.map((s: any) => (
                <div key={s.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-2xl hover:border-neuro-orange/20 transition-all gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-[10px] font-black uppercase text-neuro-navy tracking-widest">{s.name}</span>
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {s.options.map((opt: string) => (
                      <button 
                        key={opt} 
                        type="button"
                        className="px-3 py-2 bg-white border border-gray-100 hover:border-neuro-orange hover:text-neuro-orange rounded-lg text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TrackPage() {
  const [activeMetric, setActiveMetric] = useState("mood");
  const [activeTimeframe, setActiveTimeframe] = useState("7D");
  const [isLogging, setIsLogging] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [streak] = useState(12);
  const router = useRouter();

  const metrics = [
    { id: "mood", label: "Mood", icon: Smile, color: "text-blue-500", bg: "bg-blue-50/50", current: "Optimal" },
    { id: "energy", label: "Energy", icon: Zap, color: "text-orange-500", bg: "bg-orange-50/50", current: "High" },
    { id: "sleep", label: "Sleep", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50/50", current: "7.5h" },
    { id: "stress", label: "Stress", icon: Activity, color: "text-green-500", bg: "bg-green-50/50", current: "Low" },
  ];

  const chartData: Record<string, number[]> = {
    "7D": [45, 62, 55, 88, 82, 75, 92],
    "30D": Array.from({length: 30}, () => Math.floor(Math.random() * 40) + 50),
    "90D": Array.from({length: 90}, () => Math.floor(Math.random() * 50) + 40),
  };

  const stressorCategories = [
    { 
      category: "Chemical Stressors", 
      items: [
        { name: "Processed Sugar", icon: "🍩", options: ["None", "Low", "Mod", "High"] },
        { name: "Caffeine", icon: "☕", options: ["None", "1-2", "3-4", "5+"] },
        { name: "Alcohol", icon: "🍷", options: ["None", "Low", "Mod", "High"] },
        { name: "Nicotine", icon: "🚬", options: ["None", "Low", "Mod", "High"] },
        { name: "Processed Foods", icon: "🍔", options: ["None", "Low", "Mod", "High"] },
        { name: "Dehydration", icon: "💧", options: ["None", "Low", "Mod", "High"] },
      ]
    },
    { 
      category: "Physical Stressors", 
      items: [
        { name: "Sitting Time", icon: "🪑", options: ["< 2h", "2-5h", "5-8h", "8h+"] },
        { name: "Lack of Movement", icon: "🐢", options: ["None", "Low", "Mod", "High"] },
        { name: "Intense Workout", icon: "🏋️", options: ["None", "Low", "Mod", "High"] },
        { name: "Poor Sleep Posture", icon: "🛌", options: ["None", "Low", "Mod", "High"] },
        { name: "Injury / Soreness", icon: "🤕", options: ["None", "Low", "Mod", "High"] },
      ]
    },
    { 
      category: "Mental & Emotional", 
      items: [
        { name: "Work Pressure", icon: "💼", options: ["None", "Low", "Mod", "High"] },
        { name: "Emotional Conflict", icon: "🗣️", options: ["None", "Low", "Mod", "High"] },
        { name: "Overwhelm", icon: "🤯", options: ["None", "Low", "Mod", "High"] },
        { name: "Anxiety", icon: "🧠", options: ["None", "Low", "Mod", "High"] },
        { name: "Poor Sleep Quality", icon: "😴", options: ["None", "Low", "Mod", "High"] },
      ]
    },
    { 
      category: "Environmental", 
      items: [
        { name: "Loud Environments", icon: "🔊", options: ["None", "Low", "Mod", "High"] },
        { name: "Long Commute", icon: "🚌", options: ["None", "Low", "Mod", "High"] },
        { name: "Screen Exposure", icon: "💻", options: ["None", "Low", "Mod", "High"] },
        { name: "Artificial Light", icon: "💡", options: ["None", "Low", "Mod", "High"] },
      ]
    },
    { 
      category: "Lifestyle", 
      items: [
        { name: "Late Blue Light", icon: "🌙", options: ["None", "<30m", "1h", "2h+"] },
        { name: "Irregular Sleep", icon: "⏰", options: ["None", "Low", "Mod", "High"] },
        { name: "Skipping Meals", icon: "🍽️", options: ["None", "Low", "Mod", "High"] },
        { name: "Low Sunlight", icon: "☀️", options: ["None", "Low", "Mod", "High"] },
        { name: "Social Media", icon: "📱", options: ["None", "Low", "Mod", "High"] },
      ]
    }
  ];

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Daily metrics saved! Your streak is now 13 days. Keep it up!");
    setIsLogging(false);
  };

  return (
    <div className="space-y-10 pb-20 text-neuro-navy relative">
      
      {/* Gamified Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-neuro-navy rounded-[2rem] text-white shadow-xl flex items-center gap-4 border border-white/10">
             <div className="w-12 h-12 bg-neuro-orange rounded-2xl flex items-center justify-center shadow-lg shadow-neuro-orange/20">
                <Flame className="w-7 h-7 text-neuro-navy" fill="currentColor" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Streak</p>
                <p className="text-2xl font-black">{streak} Days</p>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-4 p-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Award className="w-7 h-7 text-blue-500" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Level</p>
                <p className="text-xl font-black text-neuro-navy">Zen Master</p>
             </div>
          </div>
        </div>
        <button 
          onClick={() => setIsLogging(true)}
          className="w-full lg:w-auto px-10 py-5 bg-neuro-navy text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 shadow-2xl hover:bg-neuro-orange transition-all transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" /> Log Daily Entry
        </button>
      </div>

      {/* Metric Selector Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMetric(m.id)}
            className={`p-8 rounded-[2.5rem] border transition-all text-left group relative overflow-hidden ${
              activeMetric === m.id 
                ? "bg-white border-neuro-orange shadow-xl shadow-neuro-orange/10 scale-[1.02]" 
                : "bg-white border-gray-100 hover:border-gray-200 shadow-sm"
            }`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${m.bg} blur-3xl -mr-8 -mt-8 opacity-50`}></div>
            <m.icon className={`w-10 h-10 mb-6 transition-transform group-hover:scale-110 ${activeMetric === m.id ? m.color : "text-gray-300"}`} />
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{m.label}</span>
            <div className="flex items-center justify-between relative z-10">
               <span className="text-2xl font-black text-neuro-navy">
                  {m.current}
               </span>
               <div className={`p-1.5 rounded-lg transition-colors ${activeMetric === m.id ? 'bg-neuro-orange text-white' : 'bg-gray-50 text-gray-300'}`}>
                  <ChevronRight className="w-4 h-4" />
               </div>
            </div>
          </button>
        ))}
      </div>

      {/* Trends Visualizer */}
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col relative overflow-hidden">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 relative z-10">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange">Personal Trends</span>
                  <div className="h-px w-8 bg-neuro-orange/20"></div>
               </div>
               <h3 className="text-3xl font-heading font-black text-neuro-navy capitalize">{activeMetric} Progress</h3>
            </div>
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setShowWhatIf(!showWhatIf)}
                 className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${showWhatIf ? 'bg-neuro-orange/10 border-neuro-orange text-neuro-orange shadow-lg shadow-neuro-orange/10' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}
               >
                  <Sparkles className="w-4 h-4" /> "What If" Mode
               </button>
               <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                  {["7D", "30D", "90D"].map((t) => (
                    <button 
                      key={t} 
                      onClick={() => setActiveTimeframe(t)}
                      className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTimeframe === t ? "bg-neuro-navy text-white shadow-lg" : "text-gray-400 hover:text-neuro-navy"}`}
                    >
                      {t}
                    </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Chart Area */}
         <div className="h-80 w-full flex items-end gap-3 md:gap-6 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
               {[1,2,3,4].map(i => <div key={i} className="w-full h-px bg-neuro-navy"></div>)}
            </div>
            {chartData[activeTimeframe].slice(-14).map((val, i, arr) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-6 group relative h-full justify-end">
                 {showWhatIf && (
                   <motion.div initial={{ height: 0 }} animate={{ height: `${Math.min(val + 15, 100)}%` }} className="absolute bottom-12 w-full max-w-[40px] bg-neuro-orange/10 rounded-2xl border-2 border-dashed border-neuro-orange/30 pointer-events-none z-0" />
                 )}
                 <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-neuro-navy text-white text-[10px] font-black px-2 py-1 rounded-md pointer-events-none z-20">
                    {val}%
                 </div>
                 <motion.div initial={{ height: 0 }} animate={{ height: `${val}%` }} transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }} className={`w-full max-w-[40px] rounded-2xl transition-all duration-500 cursor-help relative z-10 ${i === arr.length - 1 ? "bg-gradient-to-t from-neuro-orange to-orange-400 shadow-[0_0_20px_rgba(255,114,33,0.3)]" : "bg-neuro-navy/5 hover:bg-neuro-navy/10"}`} />
                 {activeTimeframe === "7D" && <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Day {i+1}</span>}
              </div>
            ))}
         </div>
         {showWhatIf && (
           <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 text-center text-xs font-bold text-neuro-orange flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Showing potential improvement score.
           </motion.p>
         )}
      </div>

      {/* Clinical Timeline (Healing Journey) */}
      <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
         <div className="flex items-center justify-between mb-12">
            <div>
               <h3 className="text-2xl font-heading font-black text-neuro-navy">Clinical Timeline</h3>
               <p className="text-sm text-gray-500 mt-1">Visualization of care events and physiological regulation.</p>
            </div>
            <button className="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-neuro-navy font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-gray-100">Export Health Report</button>
         </div>

         <div className="relative">
            {/* Horizontal Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2"></div>
            
            <div className="grid grid-cols-4 md:grid-cols-7 gap-4 relative z-10">
               {[
                 { type: 'scan', date: 'Jan 12', label: 'Initial Scan', color: 'bg-neuro-navy' },
                 { type: 'log', date: 'Jan 15', label: 'Improved Sleep', color: 'bg-green-500' },
                 { type: 'adjustment', date: 'Feb 02', label: 'Pattern Break', color: 'bg-neuro-orange' },
                 { type: 'scan', date: 'Feb 14', label: 'Progress Scan', color: 'bg-neuro-navy' },
                 { type: 'log', date: 'Feb 20', label: 'Energy Peak', color: 'bg-green-500' },
                 { type: 'adjustment', date: 'Mar 01', label: 'Deep Regulation', color: 'bg-neuro-orange' },
                 { type: 'today', date: 'Mar 07', label: 'Today', color: 'bg-blue-500', active: true },
               ].map((event, i) => (
                 <div key={i} className="flex flex-col items-center gap-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{event.date}</span>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 cursor-pointer ${event.color} ${event.active ? "ring-4 ring-blue-100" : ""}`}>
                       {event.type === 'scan' && <Brain className="w-6 h-6" />}
                       {event.type === 'log' && <Smile className="w-6 h-6" />}
                       {event.type === 'adjustment' && <Zap className="w-6 h-6" />}
                       {event.type === 'today' && <Activity className="w-6 h-6" />}
                    </div>
                    <div className="text-center">
                       <p className="text-[9px] font-black text-neuro-navy uppercase tracking-tighter leading-tight">{event.label}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-stretch w-full">
         {/* Stressors Static View */}
         <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-xl">
                     <ShieldAlert className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-heading font-black text-neuro-navy">Lifestyle Stressors</h3>
               </div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Updates</span>
            </div>
            <div className="space-y-4 flex-1">
               {[
                 { name: "Screentime", impact: "High", color: "text-red-500", bg: "bg-red-50/30", icon: "📱", suggestion: "Set 8PM limit" },
                 { name: "Caffeine", impact: "Moderate", color: "text-orange-500", bg: "bg-orange-50/30", icon: "☕", suggestion: "Switch to tea" },
                 { name: "Activity", impact: "Optimal", color: "text-green-500", bg: "bg-green-50/30", icon: "🏃", suggestion: "Keep moving" },
               ].map((s) => (
                 <div key={s.name} className={`flex items-center justify-between p-6 ${s.bg} rounded-[2rem] border border-black/5 group hover:border-neuro-orange/20 transition-all cursor-pointer`}>
                    <div className="flex items-center gap-4">
                       <span className="text-2xl">{s.icon}</span>
                       <div>
                          <span className="font-black text-neuro-navy uppercase tracking-widest text-[10px] block mb-1">{s.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.suggestion}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${s.color}`}>{s.impact}</span>
                       <div className="w-2 h-2 rounded-full bg-white group-hover:bg-neuro-orange transition-colors"></div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Today's Win */}
         <div className="bg-neuro-navy p-12 rounded-[3rem] text-white relative overflow-hidden group shadow-2xl flex flex-col justify-between border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[100px] pointer-events-none group-hover:bg-neuro-orange/20 transition-all duration-700"></div>
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-neuro-orange rounded-2xl shadow-lg shadow-neuro-orange/20">
                     <Zap className="text-neuro-navy w-6 h-6" fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-black">Today's Win</h3>
                    <p className="text-[10px] font-black text-neuro-orange uppercase tracking-widest">+5 Regulation Points</p>
                  </div>
               </div>
               <p className="text-gray-300 leading-relaxed text-lg font-medium">Perform 60 seconds of 4-7-8 breathwork now to move your system into recovery mode.</p>
            </div>
            <div className="relative z-10 space-y-4 pt-10">
               <button onClick={() => alert("Breathwork session started...")} className="w-full py-5 bg-neuro-orange text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-neuro-orange/20 flex items-center justify-center gap-3">I'm Doing It Now <ArrowRight className="w-4 h-4" /></button>
               <p className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">12,432 others completing this today</p>
            </div>
         </div>
      </div>

      {/* Log Entry Modal */}
      <AnimatePresence>
        {isLogging && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLogging(false)} className="absolute inset-0 bg-neuro-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
              <div className="absolute top-0 left-0 w-full h-2 bg-neuro-orange"></div>
              <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-3xl font-heading font-black text-neuro-navy mb-2">Daily Log</h2>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">March 7, 2026</p>
                  </div>
                  <button onClick={() => setIsLogging(false)} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
                </div>
                <form onSubmit={handleLogSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["Mood", "Energy"].map((label) => (
                      <div key={label} className="space-y-3 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">{label} Level</label>
                        <input type="range" className="w-full accent-neuro-orange h-1.5 bg-white rounded-lg appearance-none cursor-pointer border border-gray-100" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-2">
                    {stressorCategories.map((group) => (
                      <StressorGroup key={group.category} group={group} />
                    ))}
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full py-5 bg-neuro-navy text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neuro-orange transition-all shadow-xl shadow-neuro-navy/10 flex items-center justify-center gap-3"><CheckCircle2 className="w-5 h-5" /> Save Daily Entry</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
