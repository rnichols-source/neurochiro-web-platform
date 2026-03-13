"use client";

import { motion } from "framer-motion";
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Moon, 
  Smile, 
  BookOpen,
  Calendar,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { getPatientDashboardData } from "./actions";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewPatient = searchParams.get('welcome') === 'true';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getPatientDashboardData();
      if (result) setData(result);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleReschedule = () => {
    alert("Opening scheduling calendar... You can choose a new time for your next adjustment.");
  };

  const handleArticleClick = (slug: string) => {
    router.push(`/portal/learn/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 text-neuro-navy">

      {isNewPatient && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neuro-orange p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Zap className="w-48 h-48" />
          </div>
          <div className="relative z-10 space-y-4 max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">Account Active</span>
            <h2 className="text-3xl md:text-4xl font-heading font-black">Your journey starts here.</h2>
            <p className="text-white/80 text-lg">Connect with a nervous-system-first specialist in your area to unlock personalized tracking, care plans, and direct clinic messaging.</p>
          </div>
          <button 
            onClick={() => router.push('/directory')}
            className="relative z-10 w-full md:w-auto px-10 py-5 bg-white text-neuro-orange font-black rounded-2xl hover:bg-gray-50 transition-all shadow-xl uppercase tracking-widest text-xs whitespace-nowrap flex items-center justify-center gap-3 group"
          >
            Find a Doctor <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      )}
      
      {/* Top Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 w-full items-stretch">
        {/* Daily Insight */}
        <div className="bg-neuro-navy p-10 md:p-14 rounded-[3rem] text-white relative overflow-hidden group min-w-0 shadow-2xl">
           <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-32 h-32" />
           </div>
           <div className="relative z-10 space-y-6">
              <div>
                <span className="text-neuro-orange font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Daily Insight</span>
                <h1 className="text-3xl md:text-4xl font-heading font-black leading-tight max-w-xl">
                  {data?.insights?.title}
                </h1>
              </div>
              <p className="text-gray-400 text-lg max-w-lg leading-relaxed">
                {data?.insights?.description}
              </p>
              <button 
                onClick={() => router.push('/portal/track')}
                className="px-10 py-4 bg-white/10 hover:bg-white/20 transition-all rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 flex items-center gap-3 group/btn"
              >
                View Sleep Insights <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>

        {/* Regulation Score */}
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
               <h3 className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] mb-6">Regulation Score</h3>
               <div className="flex items-baseline gap-3">
                  <span className="text-7xl font-heading font-black text-neuro-navy tracking-tighter">{data?.regulationScore}</span>
                  <div className="flex flex-col">
                    <span className="text-green-500 font-black flex items-center gap-1 text-sm">
                       <TrendingUp className="w-4 h-4" /> {data?.trend}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">vs Last Week</span>
                  </div>
               </div>
            </div>
            <div className="relative z-10 mt-12">
               <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-black text-neuro-navy uppercase tracking-widest">Current Pulse</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target: 90</span>
               </div>
               <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${data?.regulationScore}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-neuro-orange to-orange-400 rounded-full"
                  />
               </div>
            </div>
        </div>
      </div>

      {/* REST OF THE UI - MAINTAINED FROM ORIGINAL */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start w-full">
        
        {/* Left Column: Analytics & Journey */}
        <div className="space-y-8 min-w-0">
           {/* Neural Snapshot */}
           <div className="bg-white p-10 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-neuro-orange/10 rounded-xl">
                       <Activity className="w-5 h-5 text-neuro-orange" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold">Neural Snapshot</h3>
                       <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Biometric Trends</p>
                    </div>
                 </div>
                 <select className="bg-gray-50 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-neuro-orange/20">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                 </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { label: "Restoration", value: "92%", icon: Moon, color: "text-blue-500", bg: "bg-blue-50" },
                   { label: "Adaptability", value: "High", icon: Zap, color: "text-neuro-orange", bg: "bg-neuro-orange/10" },
                   { label: "State Shift", value: "Balanced", icon: Smile, color: "text-green-500", bg: "bg-green-50" }
                 ].map((stat, i) => (
                   <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 group hover:border-neuro-orange/30 transition-all cursor-pointer">
                      <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                         <stat.icon className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-xl font-black">{stat.value}</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Education Hub */}
           <div className="bg-white p-10 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                       <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold">Your Education Hub</h3>
                       <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Recommended for your journey</p>
                    </div>
                 </div>
                 <Link href="/portal/learn" className="text-xs font-black text-neuro-orange uppercase tracking-widest hover:underline">Browse All</Link>
              </div>

              <div className="space-y-4">
                 {[
                   { title: "Understanding Neural Plasticity", time: "5 min read", category: "Basics" },
                   { title: "The Role of the Vagus Nerve", time: "8 min read", category: "Advanced" },
                   { title: "Sleep Hygiene & Recovery", time: "4 min read", category: "Lifestyle" }
                 ].map((article, i) => (
                   <div key={i} className="flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 rounded-3xl transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-neuro-navy group-hover:text-white transition-all font-black">0{i+1}</div>
                         <div>
                            <span className="text-[8px] font-black text-neuro-orange uppercase tracking-[0.2em]">{article.category}</span>
                            <h4 className="text-sm font-bold">{article.title}</h4>
                         </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{article.time}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Column: Appointment & Support */}
        <div className="space-y-8">
           {/* Next Visit */}
           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10">
                 <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-500" /> Next Visit
                 </h3>
                 <div className="space-y-1 mb-8">
                    <p className="text-2xl font-black">{data?.nextAdjustment?.date}</p>
                    <p className="text-lg font-bold text-gray-400">{data?.nextAdjustment?.time}</p>
                    <p className="text-sm text-neuro-navy mt-4 flex items-center gap-2">
                       <Activity className="w-4 h-4 text-neuro-orange" /> {data?.nextAdjustment?.doctor}
                    </p>
                 </div>
                 <div className="flex flex-col gap-3">
                    <button className="w-full py-4 bg-neuro-navy text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-neuro-navy-light transition-all shadow-lg">
                       Check In Early
                    </button>
                    <button 
                      onClick={handleReschedule}
                      className="w-full py-4 bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-gray-100 hover:text-neuro-navy transition-all"
                    >
                       Reschedule
                    </button>
                 </div>
              </div>
           </div>

           {/* Wellness Streak */}
           <div className="bg-neuro-orange p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                 <Smile className="w-16 h-16" />
              </div>
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 fill-white" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Daily Log Streak</p>
                 </div>
                 <p className="text-5xl font-black mb-4 flex items-center gap-3">
                    12 <span className="text-xl">Days</span> 🔥
                 </p>
                 <p className="text-xs font-bold leading-relaxed opacity-90">
                    You're in the top 5% of consistent adaptors this month. Complete tomorrow's log to unlock your weekly trend analysis.
                 </p>
              </div>
           </div>

           {/* Clinic Contact */}
           <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Your Clinic</h3>
              <div className="space-y-4">
                 <p className="font-bold text-neuro-navy">West Side Neuro-Life</p>
                 <p className="text-xs text-gray-500 leading-relaxed">
                    123 Healing Way<br />
                    Denver, CO 80202
                 </p>
                 <button className="text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:underline">
                    Message Office
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

export default function PulseDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
