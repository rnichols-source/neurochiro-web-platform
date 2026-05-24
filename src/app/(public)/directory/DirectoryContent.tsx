"use client";

import dynamic from "next/dynamic";
import { Search, MapPin, Filter, Star, ShieldCheck, ArrowRight, Zap, Globe, Heart, Sparkles, X, Target, Calendar, RefreshCw, AlertTriangle, RotateCcw, List, Map as MapIcon, ChevronDown } from "lucide-react";
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

const GlobalNetworkMap = dynamic(() => import("@/components/map/GlobalNetworkMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 animate-pulse flex items-center justify-center">
      <p className="text-gray-400 font-semibold text-sm">Loading map...</p>
    </div>
  )
});

const BottomSheet = dynamic(() => import("@/components/directory/BottomSheet"), { ssr: false });

import DoctorCard from "@/components/directory/DoctorCard";
import SmartMatchWizard from "@/components/directory/SmartMatchWizard";

const SPECIALTY_FILTERS = [
  "Migraines", "Back Pain", "Sciatica", "Pediatric", "Prenatal",
  "Sports", "Torque Release", "Upper Cervical", "Gonstead",
  "Network Spinal", "Activator", "Functional Neurology",
];

export default function DirectoryContent({ initialData }: { initialData: { doctors: any[], total: number } }) {
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [matchCriteria, setMatchCriteria] = useState<string[] | null>(null);
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const resetFilters = () => {
    setSearchQuery("");
    setLocationQuery("");
    setMatchCriteria(null);
    setActiveSpecialty(null);
    fetchDoctors("", "");
  };

  const handleNotifyMe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotifying(true);
    const formData = new FormData(e.currentTarget);
    formData.append('location', locationQuery || "Unknown");
    formData.append('source', 'directory_zero_state');
    const result = await submitLeadAction(formData);
    if (result.success) setNotifySuccess(true);
    setNotifying(false);
  };

  const { region } = useRegion();
  const searchParams = useSearchParams();
  const { toggleSave: globalToggleSave, isSaved, lastLocation, setLastLocation } = useUserPreferences();

  const hasSearchParam = !!(searchParams.get("search") || searchParams.get("q"));
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || searchParams.get("q") || "");
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") || searchParams.get("zip") || (hasSearchParam ? "" : lastLocation) || "");
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
    const limit = 200;
    try {
      const searchQ = (query !== undefined ? query : searchQuery).trim();
      const locationQ = (loc !== undefined ? loc : locationQuery).trim();
      const response = await fetch(`/api/directory/search?q=${encodeURIComponent(searchQ)}&location=${encodeURIComponent(locationQ)}&region=${region.code}&limit=${limit}&page=${nextPage}`);
      const result = await response.json();
      if (result.error && !result.doctors?.length) return;
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

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, locationQuery]);

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
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
          const data = await response.json();
          setLocationQuery(data.city || data.locality || "Current Location");
        } catch { setLocationQuery("Current Location"); }
        finally { setIsLocating(false); }
      },
      () => { setIsLocating(false); }
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

  const toggleSave = (id: string) => globalToggleSave("doctors", id);

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
        (doc.region_code || "").toLowerCase().includes(q) ||
        (doc.specialties || []).some((s: string) => (s || "").toLowerCase().includes(q)) ||
        (doc.bio || "").toLowerCase().includes(q);
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
    setActiveSpecialty(null);
    setPage(1);
    fetchDoctors("", "", false);
  };

  // ── Doctor List Content (shared between desktop sidebar and mobile bottom sheet) ──
  const doctorListContent = (
    <>
      {loading && doctors.length === 0 ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <DoctorCardSkeleton key={i} />)}
        </div>
      ) : filteredDoctors.length > 0 ? (
        <>
          {isFallback && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-4">
              <div className="flex items-center gap-3 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Suggested Specialists</p>
              </div>
              <p className="text-xs text-amber-600 ml-7">We didn&apos;t find exact matches. Here are some verified specialists.</p>
            </div>
          )}
          {filteredDoctors.map((doc, i) => (
            <DoctorCard key={`${doc.id}-${i}`} doc={doc} index={i} />
          ))}
        </>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center">
          <Globe className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-neuro-navy mb-2">No Doctors Found</h3>
          <p className="text-gray-500 text-sm mb-6">Try a nearby city or clear your search.</p>
          <button onClick={resetFilters} className="px-6 py-3 bg-neuro-navy text-white rounded-xl font-bold text-xs uppercase tracking-widest">
            <RotateCcw className="w-3 h-3 inline mr-2" /> Reset Filters
          </button>
          {!notifySuccess ? (
            <form onSubmit={handleNotifyMe} className="max-w-sm mx-auto pt-6 mt-6 border-t border-gray-100">
              <p className="text-sm font-bold text-neuro-navy mb-3">Get notified when we add a doctor near you</p>
              <div className="flex gap-2">
                <input type="email" name="email" required placeholder="you@email.com" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
                <button type="submit" disabled={notifying} className="px-5 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm">{notifying ? '...' : 'Notify Me'}</button>
              </div>
            </form>
          ) : (
            <div className="pt-6 mt-6 border-t border-gray-100">
              <p className="text-sm font-bold text-green-600">We&apos;ll let you know when a doctor joins near you!</p>
            </div>
          )}
        </div>
      )}
    </>
  );

  // ── Sheet header for mobile ──
  const sheetHeader = (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-neuro-navy">
          {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'}
        </h2>
        {(searchQuery || locationQuery) && (
          <button onClick={handleClearSearch} className="text-xs font-bold text-neuro-orange flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      {(searchQuery || locationQuery) && (
        <p className="text-xs text-gray-500 mt-0.5">
          {searchQuery && locationQuery ? `${searchQuery} in ${locationQuery}` : searchQuery || locationQuery}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh bg-neuro-cream">
      <SmartMatchWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onComplete={(criteria) => setMatchCriteria(criteria)} />

      {/* ════════════════════════════════════════════════════════
          MOBILE: Full-screen Apple Maps experience
          ════════════════════════════════════════════════════════ */}
      {isMobile ? (
        <div className="fixed inset-0 z-0">
          {/* Full-screen map */}
          <div className="absolute inset-0">
            <GlobalNetworkMap
              key={region.code}
              externalSearchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              externalLocationQuery={locationQuery}
              initialDoctors={initialData.doctors}
              listDoctors={filteredDoctors}
            />
          </div>

          {/* Floating search bar — Apple Maps style */}
          <div className="absolute top-0 left-0 right-0 z-[100] pt-[env(safe-area-inset-top)] bg-gradient-to-b from-white/90 via-white/60 to-transparent pb-6">
            <div className="px-4 pt-3">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-2">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search doctors..."
                      className="w-full pl-9 pr-3 py-3 bg-gray-100/80 border-none focus:outline-none text-neuro-navy font-medium text-[15px] rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neuro-orange" />
                    <input
                      type="text"
                      placeholder="Location..."
                      className="w-full pl-9 pr-10 py-3 bg-gray-100/80 border-none focus:outline-none text-neuro-navy font-medium text-[15px] rounded-xl"
                      style={{ width: '140px' }}
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                    />
                    <button onClick={handleUseLocation} disabled={isLocating} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg text-gray-400">
                      <Target className={cn("w-4 h-4", isLocating && "animate-spin")} />
                    </button>
                  </div>
                </div>

                {/* Specialty pills */}
                <div className="mt-2 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-1.5 pb-1">
                    {SPECIALTY_FILTERS.map((specialty) => (
                      <button
                        key={specialty}
                        onClick={() => {
                          if (activeSpecialty === specialty) {
                            setActiveSpecialty(null);
                            setSearchQuery("");
                          } else {
                            setActiveSpecialty(specialty);
                            setSearchQuery(specialty);
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border",
                          activeSpecialty === specialty
                            ? "bg-neuro-orange text-white border-neuro-orange"
                            : "bg-gray-100/80 text-gray-600 border-gray-200/50"
                        )}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sheet — Apple Maps style */}
          <BottomSheet header={sheetHeader}>
            <div className="space-y-4 pb-8">
              {doctorListContent}
            </div>
          </BottomSheet>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════
           DESKTOP: Search header + side-by-side map/list
           ════════════════════════════════════════════════════════ */
        <>
          {/* Search Header */}
          <header className="bg-neuro-navy text-white pt-20 pb-32 px-8 relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10 text-center">
              <h1 className="text-5xl md:text-6xl font-heading font-black mb-6 text-white drop-shadow-xl">
                Find a <span className="text-neuro-orange">NeuroChiro</span> Doctor.
              </h1>
              <p className="text-white/80 text-xl max-w-2xl mx-auto mb-12 font-medium">
                The global network of elite chiropractic clinics focused on the nervous system.
              </p>

              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white rounded-2xl p-2 flex flex-row gap-2 shadow-2xl border border-gray-100">
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
                  <div className="w-px h-10 bg-gray-100 self-center"></div>
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

              {/* Specialty Filters */}
              <div className="max-w-4xl mx-auto mt-6 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pb-2 justify-center flex-wrap">
                  {SPECIALTY_FILTERS.map((specialty) => (
                    <button
                      key={specialty}
                      onClick={() => {
                        if (activeSpecialty === specialty) {
                          setActiveSpecialty(null);
                          setSearchQuery("");
                        } else {
                          setActiveSpecialty(specialty);
                          setSearchQuery(specialty);
                        }
                      }}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                        activeSpecialty === specialty
                          ? "bg-neuro-orange text-white border-neuro-orange"
                          : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20 hover:text-white"
                      )}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content: Map + Grid */}
          <main className="max-w-7xl mx-auto px-8 -mt-16 relative z-20 pb-20">
            <div className="lg:grid lg:grid-cols-12 gap-8">
              {/* Map */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl p-1.5 shadow-xl border border-gray-100 h-[700px] lg:sticky lg:top-8 overflow-hidden">
                  <div className="w-full h-full rounded-xl overflow-hidden">
                    <GlobalNetworkMap
                      key={region.code}
                      externalSearchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      externalLocationQuery={locationQuery}
                      initialDoctors={initialData.doctors}
                      listDoctors={filteredDoctors}
                    />
                  </div>
                </div>
              </div>

              {/* Listings */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-heading font-black text-neuro-navy">Verified Clinics ({totalCount}+ in network)</h2>
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
                {doctorListContent}
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
}
