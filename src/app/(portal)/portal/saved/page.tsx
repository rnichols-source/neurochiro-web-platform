"use client";

import { useState } from "react";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { 
  Heart, 
  MapPin, 
  Briefcase, 
  Store, 
  Calendar, 
  BookOpen, 
  ArrowRight,
  Trash2,
  Search,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Live data integration pending for saved detail fetching
const LIVE_DOCTORS: any[] = [];
const LIVE_JOBS: any[] = [];
const LIVE_VENDORS: any[] = [];
const LIVE_SEMINARS: any[] = [];

export default function SavedPage() {
  const { saved, toggleSave } = useUserPreferences();
  const [activeTab, setActiveTab] = useState<keyof typeof saved>("doctors");

  const tabs = [
    { id: "doctors", label: "Doctors", icon: MapPin, count: saved.doctors.length },
    { id: "jobs", label: "Jobs", icon: Briefcase, count: saved.jobs.length },
    { id: "vendors", label: "Vendors", icon: Store, count: saved.vendors.length },
    { id: "seminars", label: "Seminars", icon: Calendar, count: saved.seminars.length },
    { id: "articles", label: "Articles", icon: BookOpen, count: saved.articles.length },
  ];

  const getSavedItems = () => {
    switch (activeTab) {
      case "doctors":
        return LIVE_DOCTORS.filter(d => saved.doctors.includes(d.id));
      case "jobs":
        return LIVE_JOBS.filter(j => saved.jobs.includes(j.id));
      case "vendors":
        return LIVE_VENDORS.filter(v => saved.vendors.includes(v.id));
      case "seminars":
        return LIVE_SEMINARS.filter(s => saved.seminars.includes(s.id));
      default:
        return [];
    }
  };

  const currentItems = getSavedItems();

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h1 className="text-4xl font-heading font-black text-neuro-navy">Saved Items</h1>
        <p className="text-gray-500 mt-2 text-lg">Your curated collection of clinics, careers, and resources.</p>
      </header>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all border",
              activeTab === tab.id 
                ? "bg-neuro-navy text-white border-neuro-navy shadow-lg" 
                : "bg-white text-gray-400 border-gray-100 hover:border-neuro-orange hover:text-neuro-navy"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={cn(
                "ml-1 px-2 py-0.5 rounded-full text-[10px] font-black",
                activeTab === tab.id ? "bg-neuro-orange text-white" : "bg-gray-100 text-gray-500"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {currentItems.map((item: any) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => toggleSave(activeTab, item.id.toString())}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-neuro-orange/10 rounded-2xl flex items-center justify-center text-neuro-orange">
                   {activeTab === 'doctors' && <MapPin className="w-6 h-6" />}
                   {activeTab === 'jobs' && <Briefcase className="w-6 h-6" />}
                   {activeTab === 'vendors' && <Store className="w-6 h-6" />}
                   {activeTab === 'seminars' && <Calendar className="w-6 h-6" />}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-neuro-navy">
                    {activeTab === 'doctors' ? `Dr. ${item.last_name}` : (item.name || item.title)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeTab === 'doctors' ? item.clinic_name : (item.category || item.clinic || item.date)}
                  </p>
                  {item.location && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {item.location}
                    </p>
                  )}
                </div>

                <Link 
                  href={
                    activeTab === 'doctors' ? `/directory/${item.slug}` :
                    activeTab === 'vendors' ? `/marketplace/${item.slug || item.id}` :
                    activeTab === 'jobs' ? `/careers` :
                    activeTab === 'seminars' ? `/seminars` : "#"
                  }
                  className="w-full py-4 bg-gray-50 group-hover:bg-neuro-navy group-hover:text-white text-neuro-navy font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {currentItems.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
            <Heart className="w-16 h-16 text-gray-100 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neuro-navy">No saved {activeTab} yet</h3>
            <p className="text-gray-400 mt-2">Items you save across the platform will appear here.</p>
            <Link 
              href={
                activeTab === 'doctors' ? '/directory' :
                activeTab === 'jobs' ? '/careers' :
                activeTab === 'vendors' ? '/marketplace' :
                activeTab === 'seminars' ? '/seminars' : '/'
              }
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-neuro-navy text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-neuro-orange transition-all"
            >
              Explore {activeTab} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
