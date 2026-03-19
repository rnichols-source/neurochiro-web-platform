"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, DollarSign, Clock, Search, Filter, ArrowRight, Building2, Globe } from "lucide-react";
import Link from "next/link";
import { useRegion } from "@/context/RegionContext";

export default function PublicJobs() {
  const { region } = useRegion();
  const [filter, setFilter] = useState("all");

  const jobs = useMemo(() => [
    {
      id: 1,
      title: "Lead Associate Chiropractor",
      clinic: "Vitality Neuro-Life",
      location: "Denver, CO",
      type: "Full-time",
      salary: "$80k - $120k",
      posted: "2 days ago",
      region_code: "US"
    },
    {
      id: 2,
      title: "Pediatric Focused Associate",
      clinic: "The Neural Hive",
      location: "Austin, TX",
      type: "Full-time",
      salary: "$75k - $110k",
      posted: "1 week ago",
      region_code: "US"
    },
    {
      id: 3,
      title: "Clinical Director",
      clinic: "Sydney Neuro-Life",
      location: "Sydney, NSW",
      type: "Full-time",
      salary: "$120k - $180k",
      posted: "3 days ago",
      region_code: "AU"
    },
    {
      id: 4,
      title: "Associate Chiropractor",
      clinic: "Melbourne Wellness",
      location: "Melbourne, VIC",
      type: "Part-time",
      salary: "$60k - $90k",
      posted: "5 days ago",
      region_code: "AU"
    }
  ], []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => j.region_code === region.code);
  }, [region.code, jobs]);

  return (
    <div className="min-h-screen bg-neuro-cream pb-32">
      {/* Header */}
      <header className="bg-neuro-navy text-white pt-32 pb-24 px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          <span className="text-neuro-orange-light font-black uppercase tracking-[0.4em] text-xs">Clinical Career Marketplace</span>
          <h1 className="text-5xl md:text-7xl font-heading font-black text-white">
            Find Your Next <br />
            <span className="text-neuro-orange">Opportunity.</span>
          </h1>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto font-medium">
            The world's leading job board for nervous-system-first chiropractic practices in {region.label}.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 -mt-12 relative z-20">
        
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-4 mb-12">
           <div className="flex-1 relative w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by role, technique, or clinic..."
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-neuro-orange/30 rounded-2xl focus:outline-none transition-all font-medium text-neuro-navy"
              />
           </div>
           <button className="w-full md:w-auto px-10 py-4 bg-neuro-navy text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neuro-navy-light transition-all">
              Search Jobs
           </button>
        </div>

        {/* Listings */}
        <div className="space-y-4">
           {filteredJobs.length > 0 ? (
             filteredJobs.map((job) => (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 key={job.id}
                 className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center justify-between gap-8"
               >
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-2xl bg-neuro-cream flex items-center justify-center text-neuro-navy">
                        <Building2 className="w-8 h-8 opacity-20" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors mb-1">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                           <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {job.clinic}</span>
                           <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 md:text-right">
                     <div>
                        <p className="text-lg font-black text-neuro-navy">{job.salary}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{job.type}</p>
                     </div>
                     <Link 
                       href={`/register?role=student&job=${job.id}`}
                       className="px-8 py-4 bg-neuro-cream hover:bg-neuro-orange hover:text-white text-neuro-navy font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-sm"
                     >
                        Apply Now
                     </Link>
                  </div>
               </motion.div>
             ))
           ) : (
             <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-neuro-navy">No Jobs in {region.label}</h3>
                <p className="text-gray-400">Expand your search or check back soon.</p>
             </div>
           )}
        </div>

        {/* Support Section */}
        <section className="mt-24 bg-neuro-orange rounded-[4rem] p-12 text-white relative overflow-hidden text-center shadow-2xl">
           <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
           <div className="relative z-10 max-w-xl mx-auto space-y-6">
              <h2 className="text-3xl font-heading font-black">Looking to hire?</h2>
              <p className="font-medium opacity-90">
                Post your opportunities to our global network of nervous-system focused students and associates.
              </p>
              <Link href="/register?role=doctor" className="inline-block px-10 py-4 bg-neuro-navy text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neuro-navy-light transition-all shadow-xl">
                 Post a Job
              </Link>
           </div>
        </section>
      </main>
    </div>
  );
}
