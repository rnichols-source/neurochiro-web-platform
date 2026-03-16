"use client";

import { 
  ArrowLeft,
  PieChart,
  Activity,
  Globe,
  Settings,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import ROIDashboard from "@/components/doctor/ROIDashboard";
import { ROIData } from "@/types/analytics";
import { useDoctorTier } from "@/context/DoctorTierContext";
import { getDoctorROIData } from "../dashboard/actions";

export default function DoctorAnalytics() {
  const [period, setPeriod] = useState<'7D' | '1M' | '3M' | '1Y'>('1M');
  const { tier, setTier } = useDoctorTier();
  const [roiData, setRoiData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadROIData() {
      setLoading(true);
      const data = await getDoctorROIData(period);
      if (data) {
        setRoiData(data as ROIData);
      }
      setLoading(false);
    }
    loadROIData();
  }, [period]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 text-neuro-navy">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link href="/doctor/dashboard" className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-neuro-orange transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Command Center
          </Link>
          <h1 className="text-4xl font-heading font-black">Practice ROI Dashboard</h1>
          <p className="text-gray-500 mt-2">Measuring the clinical and financial impact of your NeuroChiro presence.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white p-1 rounded-2xl border border-gray-100 flex shadow-sm">
            {["7D", "1M", "3M", "1Y"].map(t => (
              <button 
                key={t} 
                onClick={() => setPeriod(t as any)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === t ? 'bg-neuro-navy text-white shadow-lg' : 'bg-transparent text-gray-400 hover:text-neuro-navy'}`}
              >
                {t}
              </button>
            ))}
          </div>
          
          {/* Dev Tier Toggle - In production this is based on actual subscription */}
          <div className="bg-neuro-orange/10 p-1 rounded-2xl border border-neuro-orange/20 flex shadow-sm">
            {(["starter", "growth", "pro"] as const).map(t => (
              <button 
                key={t} 
                onClick={() => setTier(t)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tier === t ? 'bg-neuro-orange text-white' : 'text-neuro-orange hover:bg-neuro-orange/5'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
           <Loader2 className="w-10 h-10 text-neuro-orange animate-spin mb-4" />
           <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Aggregating Clinical Data...</p>
        </div>
      ) : roiData ? (
        <>
          <ROIDashboard 
            tier={tier} 
            data={roiData} 
            onUpgrade={() => console.log("Trigger Upgrade Flow")}
          />

          {tier !== 'starter' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Patient Acquisition Channels */}
              <section className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-heading font-black flex items-center gap-2">
                     <PieChart className="w-5 h-5 text-neuro-orange" /> Acquisition Channels
                   </h3>
                   <button className="text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:underline flex items-center gap-1">
                     View Details <Settings className="w-3 h-3" />
                   </button>
                </div>
                <div className="space-y-6">
                  {roiData.patient_acquisition.map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span>{c.source}</span>
                        <span className="text-gray-400">{c.count}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${i === 0 ? 'bg-neuro-navy' : i === 1 ? 'bg-neuro-orange' : i === 2 ? 'bg-blue-500' : 'bg-purple-500'}`} 
                          style={{ width: `${c.count}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Engagement Heatmap */}
              <section className="bg-neuro-navy rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[100px]"></div>
                <h3 className="text-xl font-heading font-black mb-8 flex items-center gap-2 relative z-10">
                  <Activity className="w-5 h-5 text-neuro-orange" /> Lead Velocity Heatmap
                </h3>
                <div className="aspect-[2/1] bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center relative z-10">
                  <Globe className="w-16 h-16 text-white/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {loading ? "Processing Global Traffic..." : "Aggregating Regional Insights..."}
                     </p>
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Top Referral Source</p>
                    <p className="text-sm font-bold">Denver Health Network</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Highest Conversion</p>
                    <p className="text-sm font-bold">Mobile / Instagram</p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
           <p className="text-sm font-bold text-gray-400">No performance data available for this period.</p>
        </div>
      )}
    </div>
  );
}

