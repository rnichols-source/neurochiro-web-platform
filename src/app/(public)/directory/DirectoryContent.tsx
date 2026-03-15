"use client";

import dynamic from "next/dynamic";
import { Search, MapPin, Filter, Star, ShieldCheck, ArrowRight, Zap, Globe, Heart, Sparkles, X, Target, Calendar } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import SmartMatchWizard from "@/components/directory/SmartMatchWizard";
import { useRegion } from "@/context/RegionContext";
import { useSearchParams } from "next/navigation";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getDoctors } from "./actions";
import { submitLeadAction } from "@/app/actions/leads";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dynamically import the map with SSR disabled to prevent server-side crashes
const GlobalNetworkMap = dynamic(() => import("@/components/map/GlobalNetworkMap"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Global Map...</p>
    </div>
  )
});

export default function DirectoryContent({ initialData }: { initialData: { doctors: any[], total: number } }) {
  // ... state ...
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // 🛡️ Defer map loading until scroll or mount delay to improve TBT
  useEffect(() => {
    const timer = setTimeout(() => setShowMap(true), 1500);
    return () => clearTimeout(timer);
  }, []);

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
  
  // 🛡️ Debounced Search Effect
  useEffect(() => {
    if (searchQuery === searchParams.get("search")) return; // Skip initial sync
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [totalCount, setTotalCount] = useState(initialData.total);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.doctors.length < initialData.total);

  const fetchDoctors = async (query?: string, isLoadMore = false) => {
    setLoading(true);
    const nextPage = isLoadMore ? page + 1 : 1;
    const limit = 20; // Chunk size for manageable loading
    
    try {
      const result = await getDoctors({ 
        regionCode: region.code,
        searchQuery: query || searchQuery,
        limit: limit,
        page: nextPage
      });
      
      if (isLoadMore) {
        setDoctors(prev => [...prev, ...result.doctors]);
      } else {
        setDoctors(result.doctors);
      }
      
      setTotalCount(result.total);
      setPage(nextPage);
      // Determine if more remain using the result total
      const currentLoadedCount = isLoadMore ? (doctors.length + result.doctors.length) : result.doctors.length;
      setHasMore(currentLoadedCount < result.total);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch if region changes
  useEffect(() => {
    if (region.code) {
      setPage(1);
      fetchDoctors(searchQuery, false);
    }
  }, [region.code]);

  // Handle Search Execution
  const handleSearch = () => {
    setPage(1);
    fetchDoctors(searchQuery, false);
  };

  // Sync with context if location query changes
  useEffect(() => {
    if (locationQuery) {
      setLastLocation(locationQuery);
    }
  }, [locationQuery]);

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
          console.error("Error reverse geocoding:", error);
          setLocationQuery("Current Location");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please check your permissions.");
        setIsLocating(false);
      }
    );
  };

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [matchCriteria, setMatchCriteria] = useState<string[] | null>(null);

  // Update state if URL params change
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
    return doctors.filter(doc => {
      // 1. If smart match criteria exists, prioritize those tags
      if (matchCriteria && matchCriteria.length > 0) {
        const hasTag = (doc.specialties || []).some((s: any) => 
          matchCriteria.some(c => (s || "").toLowerCase().includes(c.toLowerCase()))
        );
        if (!hasTag) return false;
      }

      const matchesName = 
        (doc.first_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        (doc.last_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.clinic_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.specialties || []).some((s: any) => (s || "").toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesLocation = 
        (doc.city || "").toLowerCase().includes(locationQuery.toLowerCase()) ||
        (doc.state || "").toLowerCase().includes(locationQuery.toLowerCase()) ||
        (doc.zip_code || "").includes(locationQuery) ||
        (doc.address || "").toLowerCase().includes(locationQuery.toLowerCase());

      const nameCondition = searchQuery === "" ? true : matchesName;
      const locationCondition = locationQuery === "" ? true : matchesLocation;

      return nameCondition && locationCondition;
    });
  }, [searchQuery, locationQuery, matchCriteria, doctors]);

  return (
    <div className="min-h-screen bg-neuro-cream">
      {/* Smart Match Floating Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] md:bottom-12">
        <button 
          onClick={() => setIsWizardOpen(true)}
          className="bg-neuro-navy text-white px-8 py-4 rounded-full shadow-2xl hover:bg-neuro-navy-light transition-all transform hover:scale-105 flex items-center gap-3 border border-white/10 group"
        >
          <div className="w-8 h-8 bg-neuro-orange rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-black uppercase tracking-widest text-[10px]">Smart Match Wizard</span>
        </button>
      </div>

      <SmartMatchWizard 
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={(criteria) => setMatchCriteria(criteria)}
      />

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
          
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-[2.5rem] p-2 flex flex-col md:flex-row gap-2 shadow-2xl">
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
                <button 
                  onClick={handleUseLocation}
                  disabled={isLocating}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-neuro-orange transition-all"
                  title="Use my current location"
                >
                  <motion.div
                    animate={isLocating ? { rotate: 360 } : { rotate: 0 }}
                    transition={isLocating ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                  >
                    <Target className={cn("w-5 h-5", isLocating && "animate-pulse")} />
                  </motion.div>
                </button>
              </div>
              <button 
                onClick={handleSearch}
                className="bg-neuro-navy text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-neuro-navy-light transition-all shadow-lg"
              >
                Search
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-4">
                <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px] drop-shadow-sm">Clinical concierge</p>
                <button 
                  onClick={() => setIsWizardOpen(true)}
                  className="group flex items-center gap-3 px-8 py-4 bg-neuro-orange text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 transform hover:-translate-y-1"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  Start Smart Match Wizard
                </button>
              </div>
              <div className="hidden md:block w-px h-12 bg-white/10 mx-4"></div>
              <div className="flex flex-col items-center gap-4">
                <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px] drop-shadow-sm">For Educators</p>
                <Link 
                  href="/host-a-seminar"
                  className="group flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all shadow-xl transform hover:-translate-y-1"
                >
                  <Calendar className="w-4 h-4 text-neuro-orange" />
                  Promote Your Seminar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Map + Grid */}
      <main className="max-w-7xl mx-auto px-8 -mt-16 relative z-20 pb-20">
        
        {matchCriteria && (
          <div className="mb-12 bg-white border border-neuro-orange/20 p-6 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-neuro-orange/10 rounded-2xl flex items-center justify-center text-neuro-orange">
                <Sparkles className="w-8 h-8 fill-current" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-black text-neuro-navy">Top Smart Matches Found</h2>
                <p className="text-gray-500 text-sm">We've filtered results for: <span className="font-bold text-neuro-orange capitalize">{matchCriteria.join(", ")}</span></p>
              </div>
            </div>
            <button 
              onClick={() => setMatchCriteria(null)}
              className="px-6 py-3 border-2 border-gray-100 hover:border-red-100 hover:text-red-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
              aria-label="Clear smart match filters"
            >
              <X className="w-4 h-4" /> Clear Matches
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Map Section */}
          <div className="lg:col-span-7">
            <div className="bg-slate-200 rounded-[3rem] p-2 shadow-xl border border-gray-100 h-[700px] sticky top-8 overflow-hidden relative group">
               {showMap ? (
                 <GlobalNetworkMap 
                   key={region.code} 
                   externalSearchQuery={searchQuery} 
                   onSearchChange={setSearchQuery}
                   externalLocationQuery={locationQuery} 
                   initialDoctors={initialData.doctors}
                 />
               ) : (
                 <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Preparing Map Experience...</p>
                 </div>
               )}
            </div>
          </div>

          {/* Listings Section */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between mb-2">
               <div>
                 <h2 className="text-xl font-heading font-black text-neuro-navy">Verified Clinics in {region.label}</h2>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Showing {doctors.length} of {totalCount} specialists</p>
               </div>
               <button className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-neuro-navy transition-colors">
                  <Filter className="w-4 h-4" /> Filter
               </button>
            </div>

            {filteredDoctors.length > 0 ? (
              <>
                {filteredDoctors.map((doc, i) => (
                  <div key={`${doc.id}-${i}`} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="relative w-14 h-14 rounded-2xl bg-neuro-navy overflow-hidden shadow-lg border border-white/10">
                              <Image 
                                src={doc.photo_url || "/fallback-avatar.png"} 
                                alt={`Dr. ${doc.first_name} ${doc.last_name}`}
                                fill
                                className="object-cover"
                                sizes="56px"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/fallback-avatar.png";
                                }}
                              />
                          </div>
                          <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h3 className="font-bold text-lg text-neuro-navy group-hover:text-neuro-orange transition-colors">
                                  {`Dr. ${doc.first_name || ''} ${doc.last_name || ''}`.replace(/^Dr\.\s+Dr\./i, 'Dr.').trim().replace(/\s+/g, ' ') || 'Neuro Specialist'}
                                </h3>
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                              </div>
                              <p className="text-xs text-gray-500 font-medium">{doc.clinic_name || 'Private Practice'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button 
                            onClick={() => toggleSave(doc.id)}
                            className={`p-2 rounded-full transition-colors ${isSaved("doctors", doc.id) ? 'bg-neuro-orange/10 text-neuro-orange' : 'bg-gray-50 text-gray-300 hover:text-neuro-orange'}`}
                          >
                              <Heart className={`w-5 h-5 ${isSaved("doctors", doc.id) ? 'fill-current' : ''}`} />
                          </button>
                          <div className="flex items-center gap-1 text-neuro-orange">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span className="text-sm font-black text-neuro-navy">{doc.rating || "5.0"}</span>
                              {doc.review_count && (
                                <span className="text-[10px] text-gray-400 font-bold ml-1">({doc.review_count})</span>
                              )}
                          </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {doc.bio}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(doc.specialties || []).slice(0, 2).map((s: string, j: number) => (
                            <span key={j} className="px-3 py-1 bg-neuro-cream rounded-full text-[9px] font-black uppercase text-neuro-navy border border-neuro-navy/5">
                                {s}
                            </span>
                          ))}
                          {doc.specialties?.length > 2 && (
                            <span className="px-3 py-1 bg-gray-50 rounded-full text-[9px] font-black uppercase text-gray-400">
                                +{doc.specialties.length - 2} More
                          </span>
                          )}
                        </div>
                        <Link 
                          href={`/directory/${doc.slug || doc.id}`}
                          className="w-full py-4 bg-gray-50 group-hover:bg-neuro-navy group-hover:text-white text-neuro-navy font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-gray-100 group-hover:border-neuro-navy"
                        >
                          View Profile <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <button 
                    onClick={() => fetchDoctors(searchQuery, true)}
                    disabled={loading}
                    className="w-full py-6 border-2 border-neuro-navy/10 rounded-[2.5rem] flex items-center justify-center gap-3 text-neuro-navy font-black uppercase tracking-widest text-[10px] hover:bg-neuro-navy hover:text-white transition-all disabled:opacity-50 group shadow-sm hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-neuro-navy group-hover:border-white border-t-transparent animate-spin rounded-full"></div>
                    ) : (
                      <Sparkles className="w-4 h-4 text-neuro-orange" />
                    )}
                    {loading ? "Syncing Global Nodes..." : "Show More Specialists"}
                  </button>
                )}
              </>
            ) : (
              <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 p-12 text-center shadow-sm" role="status">
                <div className="w-20 h-20 bg-neuro-cream rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-10 h-10 text-gray-300 animate-pulse" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-heading font-black text-neuro-navy mb-2">Expanding the Network</h3>
                <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                  We haven't mapped a verified specialist in this specific region yet. Try searching a nearby city or help us grow.
                </p>
                
                {notifySuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-emerald-50 text-emerald-700 rounded-3xl border border-emerald-100 font-bold flex items-center justify-center gap-3"
                  >
                    <ShieldCheck className="w-5 h-5" /> Success! We'll notify you soon.
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    <form onSubmit={handleNotifyMe} className="max-w-md mx-auto space-y-3">
                      <label htmlFor="notify-email" className="sr-only">Email address for notification</label>
                      <input 
                        id="notify-email"
                        type="email" 
                        name="email"
                        required 
                        placeholder="Enter email for area alerts..."
                        className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 outline-none font-medium min-h-[56px]"
                        aria-label="Email address for notification"
                      />
                      <button 
                        type="submit"
                        disabled={notifying}
                        className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-neuro-orange-dark transition-all disabled:opacity-50 shadow-lg shadow-neuro-orange/20 min-h-[56px]"
                      >
                        {notifying ? "Subscribing..." : "Notify Me via Email"}
                      </button>
                    </form>
                    
                    <div className="pt-6 border-t border-gray-50">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4">Are you a doctor in this area?</p>
                      <Link 
                        href="/register?role=doctor"
                        className="inline-flex items-center gap-2 text-neuro-orange font-bold hover:gap-3 transition-all text-sm"
                      >
                        Join the Global Directory <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button className="w-full py-6 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400 hover:border-neuro-orange hover:text-neuro-orange transition-all group">
               <Globe className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
               <span className="font-bold">Explore Global Network</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
