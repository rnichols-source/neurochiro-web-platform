"use client";

import dynamic from "next/dynamic";
import NextImage from "next/image";
import { Search, MapPin, Filter, Star, ShieldCheck, ArrowRight, Zap, Globe, Heart, Sparkles, X, Target, Calendar, RefreshCw, AlertTriangle, RotateCcw, List, Map as MapIcon } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRegion } from "@/context/RegionContext";
import { useSearchParams } from "next/navigation";
import { getDoctors } from "./actions";
import { DoctorCardSkeleton } from "@/components/directory/DirectorySkeleton";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { submitLeadAction } from "@/app/actions/leads";
// Lazy load map for performance
const GlobalNetworkMap = dynamic(() => import("@/components/map/GlobalNetworkMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs text-center px-4">Initializing Global Map...</p>
    </div>
  )
});

import DoctorCard from "@/components/directory/DoctorCard";

export default function DirectoryContent({ initialData }: { initialData: { doctors: any[], total: number } }) {
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [matchCriteria, setMatchCriteria] = useState<string[] | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list');

  const resetFilters = () => {
    setSearchQuery("");
    setLocationQuery("");
    setMatchCriteria(null);
    fetchDoctors("", "");
  };

  const handleNotifyMe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotifying(true);
    const formData = new FormData(e.currentTarget);
    formData.append('location', locationQuery || "Unknown");
    formData.append('source', 'directory_zero_state');
    
    const result = await submitLeadAction(formData);
    if (result.success) {
      setNotifySuccess(true);
    }
    setNotifying(false);
  };

  const { region } = useRegion();
  const searchParams = useSearchParams();
  const { toggleSave: globalToggleSave, isSaved, lastLocation, setLastLocation } = useUserPreferences();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") || lastLocation || "");
  const [isLocating, setIsLocating] = useState(false);
  
  const [doctors, setDoctors] = useState<any[]>(initialData.doctors);
  const [isFallback, setIsFallback] = useState(false);
  const [totalCount, setTotalCount] = useState(initialData.total);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.doctors.length < initialData.total);

  const fetchDoctors = async (query?: string, loc?: string, isLoadMore = false) => {
    setLoading(true);
    const nextPage = isLoadMore ? page + 1 : 1;
    const limit = 20;
    
    try {
      // Use the new Failsafe API Route
      const searchQ = (query !== undefined ? query : searchQuery).trim();
      const locationQ = (loc !== undefined ? loc : locationQuery).trim();
      const response = await fetch(`/api/directory/search?q=${encodeURIComponent(searchQ)}&location=${encodeURIComponent(locationQ)}&region=${region.code}&limit=${limit}&page=${nextPage}`);
      const result = await response.json();
      
      if (result.error && !result.doctors?.length) {
        console.warn("Search API returned error, but we're staying in skeleton/loading mode");
        return;
      }

      setIsFallback(!!result.isFallback);

      if (isLoadMore) {
        setDoctors(prev => [...prev, ...result.doctors]);
      } else {
        setDoctors(result.doctors);
      }
      
      setTotalCount(result.total);
      setPage(nextPage);
      const currentLoadedCount = isLoadMore ? (doctors.length + result.doctors.length) : result.doctors.length;
      setHasMore(currentLoadedCount < result.total);
    } catch (error) {
      console.error("Directory request failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, locationQuery]);

  // Re-fetch if region changes
  useEffect(() => {
    setPage(1);
    fetchDoctors(searchQuery, locationQuery, false);
  }, [region.code]);

  const handleSearch = () => {
    setPage(1);
    fetchDoctors(searchQuery, locationQuery, false);
    if (locationQuery) setLastLocation(locationQuery);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
          const data = await response.json();
          const city = data.city || data.locality || "Current Location";
          setLocationQuery(city);
        } catch (error) {
          setLocationQuery("Current Location");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        alert("Unable to retrieve your location.");
        setIsLocating(false);
      }
    );
  };

  useEffect(() => {
    const search = searchParams.get("search");
    const loc = searchParams.get("location");
    const wizardParam = searchParams.get("wizard");
    if (search) setSearchQuery(search);
    if (loc) setLocationQuery(loc);
    if (wizardParam === "open") setIsWizardOpen(true);
  }, [searchParams]);

  const toggleSave = (id: string) => {
    globalToggleSave("doctors", id);
  };

  const filteredDoctors = useMemo(() => {
    if (isFallback) return doctors;

    const q = (searchQuery || "").trim().toLowerCase();
    const l = (locationQuery || "").trim().toLowerCase();

    return doctors.filter(doc => {
      if (matchCriteria && matchCriteria.length > 0) {
        const hasTag = (doc.specialties || []).some((s: any) => 
          matchCriteria.some(c => (s || "").toLowerCase().includes(c.toLowerCase()))
        );
        if (!hasTag) return false;
      }

      const matchesName = 
        (doc.first_name || "").toLowerCase().includes(q) || 
        (doc.last_name || "").toLowerCase().includes(q) ||
        (doc.clinic_name || "").toLowerCase().includes(q) ||
        (doc.region_code || "").toLowerCase().includes(q);
      
      const matchesLocation = 
        (doc.city || "").toLowerCase().includes(l) ||
        (doc.state || "").toLowerCase().includes(l) ||
        (doc.country || "").toLowerCase().includes(l) ||
        (doc.address || "").toLowerCase().includes(l);

      return (q === "" || matchesName) && (l === "" || matchesLocation);
    });
  }, [searchQuery, locationQuery, matchCriteria, doctors]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setLocationQuery("");
    setMatchCriteria(null);
    setPage(1);
    fetchDoctors("", "", false);
  };

  return (
    <div className="min-h-screen bg-neuro-cream">
      {/* Smart Match Floating Button - Mothballed for Phase 1 Stability */}
      {/* <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] md:bottom-12">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsWizardOpen(true)}
          className="bg-neuro-navy text-white px-8 py-4 rounded-full shadow-2xl hover:bg-neuro-navy-light transition-all flex items-center gap-3 border border-white/10 group"
        >
          <div className="w-8 h-8 bg-neuro-orange rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-black uppercase tracking-widest text-[10px]">Smart Match Wizard</span>
        </motion.button>
      </div> */}

      {/* Mobile Toggle: Map vs List */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex bg-white rounded-full shadow-2xl p-1 border border-gray-100 lg:hidden">
        <button 
          onClick={() => setMobileView('list')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
            mobileView === 'list' ? "bg-neuro-navy text-white shadow-lg" : "text-gray-400"
          )}
        >
          <List className="w-4 h-4" /> List
        </button>
        <button 
          onClick={() => setMobileView('map')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
            mobileView === 'map' ? "bg-neuro-navy text-white shadow-lg" : "text-gray-400"
          )}
        >
          <MapIcon className="w-4 h-4" /> Map
        </button>
      </div>

      {/* <SmartMatchWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onComplete={(criteria) => setMatchCriteria(criteria)} /> */}

      {/* Search Header */}
      <header className="bg-neuro-navy text-white pt-20 pb-32 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-neuro-orange/10 blur-[120px] -mr-48 -mt-48"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-heading font-black mb-6 text-white drop-shadow-xl">
            Find a <span className="text-neuro-orange">NeuroChiro</span> Doctor.
          </h1>
          <p className="text-white/80 text-xl max-w-2xl mx-auto mb-12 font-medium">
            The global network of elite chiropractic clinics focused on the nervous system.
          </p>
          
          <div className="max-w-4xl mx-auto space-y-8 sticky top-4 z-[100] md:relative md:top-0">
            <div className="bg-white rounded-[2.5rem] p-2 flex flex-col md:flex-row gap-2 shadow-2xl border border-gray-100">
              <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Doctor name, clinic, or specialty..." 
                  className="w-full pl-14 pr-4 py-5 bg-transparent border-none focus:outline-none text-neuro-navy font-medium text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="w-px h-10 bg-gray-100 self-center hidden md:block"></div>
              <div className="flex-1 relative group">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neuro-orange" />
                <input 
                  type="text" 
                  placeholder={`City, ${region.terminology.state}, or ${region.terminology.postalCode}...`} 
                  className="w-full pl-14 pr-16 py-5 bg-transparent border-none focus:outline-none text-neuro-navy font-medium text-lg"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleUseLocation} disabled={isLocating} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-neuro-orange transition-all">
                  <motion.div animate={isLocating ? { rotate: 360 } : { rotate: 0 }} transition={isLocating ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}>
                    <Target className={cn("w-5 h-5", isLocating && "animate-pulse")} />
                  </motion.div>
                </button>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch} 
                className="bg-neuro-navy text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-neuro-navy-light transition-all shadow-lg"
              >
                Search
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Map + Grid */}
      <main className="max-w-7xl mx-auto px-8 -mt-16 relative z-20 pb-20">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
          
          {/* Map Section */}
          <div className={cn(
            "lg:col-span-7",
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          )}>
            <div className="bg-slate-200 rounded-[3rem] p-2 shadow-xl border border-gray-100 h-[500px] lg:h-[700px] lg:sticky lg:top-8 overflow-hidden relative group">
               {showMap ? <GlobalNetworkMap key={region.code} externalSearchQuery={searchQuery} onSearchChange={setSearchQuery} externalLocationQuery={locationQuery} initialDoctors={initialData.doctors} listDoctors={filteredDoctors} /> : <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center"><p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Preparing Map...</p></div>}
            </div>
          </div>

          {/* Listings Section */}
          <div className={cn(
            "lg:col-span-5 space-y-6",
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          )}>
            <div className="flex items-center justify-between mb-2">
               <div>
                 <h2 className="text-xl font-heading font-black text-neuro-navy">Verified Clinics</h2>
                 <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Showing {filteredDoctors.length} specialists</p>
                    {(searchQuery || locationQuery || (matchCriteria && matchCriteria.length > 0)) && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button onClick={handleClearSearch} className="text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:underline flex items-center gap-1">
                          <X className="w-2.5 h-2.5" /> Clear All
                        </button>
                      </>
                    )}
                 </div>
               </div>
            </div>

            {loading && doctors.length === 0 ? (
               <div className="space-y-4">
                 {[1,2,3,4,5].map(i => <DoctorCardSkeleton key={i} />)}
               </div>
            ) : filteredDoctors.length > 0 ? (
              <>
                <div className="mb-4">
                  {(searchQuery || locationQuery) && !isFallback && (
                    <p className="text-xs font-bold text-gray-500">
                      Showing results for: <span className="text-neuro-navy">{(searchQuery && locationQuery) ? `${searchQuery} in ${locationQuery}` : (searchQuery || locationQuery)}</span>
                    </p>
                  )}
                  {isFallback && (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3 mb-6">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                        Top Verified Specialists (Fallback Network)
                      </p>
                    </div>
                  )}
                </div>
                {filteredDoctors.map((doc, i) => (
                  <DoctorCard key={`${doc.id}-${i}`} doc={doc} index={i} />
                ))}
              </>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 p-12 text-center">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-6 animate-pulse" />
                  <h3 className="text-2xl font-black text-neuro-navy mb-2">Expanding the Network</h3>
                  <p className="text-gray-500 text-sm mb-8">We haven't mapped a verified specialist in this specific area yet. Try searching a nearby city or reset your filters.</p>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetFilters}
                    className="px-8 py-4 bg-neuro-navy text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 mx-auto shadow-lg shadow-neuro-navy/20"
                  >
                    <RotateCcw className="w-4 h-4 text-neuro-orange" /> Reset All Filters
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
