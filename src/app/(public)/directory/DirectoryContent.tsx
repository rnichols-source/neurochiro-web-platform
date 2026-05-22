"use client";

import dynamic from "next/dynamic";
import NextImage from "next/image";
import { Search, MapPin, Filter, Star, ShieldCheck, ArrowRight, Zap, Globe, Heart, Sparkles, X, Target, Calendar, RefreshCw, AlertTriangle, RotateCcw, List, Map as MapIcon, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import SmartMatchWizard from "@/components/directory/SmartMatchWizard";

const SPECIALTY_FILTERS = [
  "Migraines",
  "Back Pain",
  "Sciatica",
  "Pediatric",
  "Prenatal",
  "Sports",
  "Torque Release",
  "Upper Cervical",
  "Gonstead",
  "Network Spinal",
  "Activator",
  "Functional Neurology",
];

export default function DirectoryContent({ initialData }: { initialData: { doctors: any[], total: number } }) {
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [matchCriteria, setMatchCriteria] = useState<string[] | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list');
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterNewPatients, setFilterNewPatients] = useState(false);
  const [filterTelehealth, setFilterTelehealth] = useState(false);
  const [filterWalkins, setFilterWalkins] = useState(false);
  const [filterRadius, setFilterRadius] = useState(0); // 0 = no limit
  const [sortBy, setSortBy] = useState('tier');
  const activeFilterCount = [filterNewPatients, filterTelehealth, filterWalkins, filterRadius > 0].filter(Boolean).length + (activeSpecialty ? 1 : 0);

  // Geolocation
  const [userLat, setUserLat] = useState(0);
  const [userLng, setUserLng] = useState(0);
  const hasUserCoords = userLat !== 0 && userLng !== 0;

  // Autocomplete
  const [autocomplete, setAutocomplete] = useState<{cities: any[], doctors: any[], specialties: string[]}>({ cities: [], doctors: [], specialties: [] });
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [acFocusField, setAcFocusField] = useState<'search' | 'location' | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

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

      const params = new URLSearchParams({
        q: searchQ,
        location: locationQ,
        region: region.code,
        limit: String(limit),
        page: String(nextPage),
        sort: sortBy,
      });
      if (hasUserCoords) {
        params.set('lat', String(userLat));
        params.set('lng', String(userLng));
      }
      if (filterRadius > 0) params.set('radius', String(filterRadius));
      if (filterNewPatients) params.set('new_patients', 'true');
      if (filterTelehealth) params.set('telehealth', 'true');
      if (filterWalkins) params.set('walkins', 'true');
      if (activeSpecialty) params.set('specialties', activeSpecialty);

      const response = await fetch(`/api/directory/search?${params.toString()}`);
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

  // Autocomplete
  useEffect(() => {
    const q = acFocusField === 'location' ? locationQuery : searchQuery;
    if (!q || q.length < 2 || !acFocusField) {
      setAutocomplete({ cities: [], doctors: [], specialties: [] });
      setShowAutocomplete(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const type = acFocusField === 'location' ? 'location' : 'all';
        const res = await fetch(`/api/directory/autocomplete?q=${encodeURIComponent(q)}&type=${type}`);
        const data = await res.json();
        setAutocomplete(data);
        setShowAutocomplete(data.cities.length > 0 || data.doctors.length > 0 || data.specialties.length > 0);
      } catch { setShowAutocomplete(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, locationQuery, acFocusField]);

  // Close autocomplete on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowAutocomplete(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-detect location on first visit
  useEffect(() => {
    if (searchParams.get('q') || searchParams.get('search') || searchParams.get('location') || lastLocation) return;
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    const asked = localStorage.getItem('nc_geo_asked');
    if (asked) return;
    localStorage.setItem('nc_geo_asked', '1');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setSortBy('distance');
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
          const data = await res.json();
          const city = data.city || data.locality || '';
          if (city) { setLocationQuery(city); setLastLocation(city); }
        } catch {}
      },
      () => {},
      { timeout: 5000 }
    );
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) fetchDoctors(undefined, undefined, true); },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page]);

  // Re-fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchDoctors(searchQuery, locationQuery, false);
  }, [filterNewPatients, filterTelehealth, filterWalkins, filterRadius, sortBy, activeSpecialty]);

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
    setPage(1);
    fetchDoctors("", "", false);
  };

  return (
    <div className="min-h-dvh bg-neuro-cream">
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

      <SmartMatchWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onComplete={(criteria) => setMatchCriteria(criteria)} />

      {/* Search Header */}
      <header className="bg-neuro-navy text-white pt-20 pb-32 px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-heading font-black mb-6 text-white drop-shadow-xl">
            Find a <span className="text-neuro-orange">NeuroChiro</span> Doctor.
          </h1>
          <p className="text-white/80 text-xl max-w-2xl mx-auto mb-12 font-medium">
            The global network of elite chiropractic clinics focused on the nervous system.
          </p>
          
          <div ref={searchRef} className="max-w-4xl mx-auto space-y-8 sticky top-[72px] z-30 bg-neuro-navy pt-4 pb-2 md:relative md:top-0 md:bg-transparent md:pt-0 md:pb-0">
            <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl border border-gray-100">
              <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Doctor name, clinic, condition, or specialty..."
                  className="w-full pl-14 pr-10 py-5 bg-transparent border-none focus:outline-none text-neuro-navy font-medium text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setAcFocusField('search')}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setShowAutocomplete(false); handleSearch(); } }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="w-px h-10 bg-gray-100 self-center hidden md:block"></div>
              <div className="flex-1 relative group">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neuro-orange" />
                <input
                  type="text"
                  placeholder="City, state, or zip — e.g. Hartford, CT"
                  className="w-full pl-14 pr-16 py-5 bg-transparent border-none focus:outline-none text-neuro-navy font-medium text-lg"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onFocus={() => setAcFocusField('location')}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setShowAutocomplete(false); handleSearch(); } }}
                />
                {locationQuery ? (
                  <button onClick={() => setLocationQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-gray-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleUseLocation} disabled={isLocating} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-neuro-orange transition-all" title="Use my location">
                    <motion.div animate={isLocating ? { rotate: 360 } : { rotate: 0 }} transition={isLocating ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}>
                      <Target className={cn("w-5 h-5", isLocating && "animate-pulse")} />
                    </motion.div>
                  </button>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                disabled={loading}
                className="bg-neuro-navy text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-neuro-navy-light transition-all shadow-lg disabled:opacity-70"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Search'}
              </motion.button>
            </div>

            {/* Active search pills */}
            {(searchQuery || locationQuery) && (
              <div className="flex items-center gap-2 justify-center flex-wrap">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/80 text-xs font-bold rounded-full border border-white/20">
                    <Search className="w-3 h-3" /> {searchQuery}
                    <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {locationQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neuro-orange/20 text-neuro-orange text-xs font-bold rounded-full border border-neuro-orange/30">
                    <MapPin className="w-3 h-3" /> {locationQuery}
                    <button onClick={() => setLocationQuery("")} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                <button onClick={handleClearSearch} className="text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest ml-2">Clear All</button>
              </div>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showAutocomplete && (
            <div className="max-w-4xl mx-auto -mt-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 space-y-3">
                {autocomplete.cities.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Locations</p>
                    {autocomplete.cities.map((c, i) => (
                      <button key={i} onClick={() => { setLocationQuery(c.city ? `${c.city}, ${c.state}` : c.state); setShowAutocomplete(false); handleSearch(); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors">
                        <MapPin className="w-4 h-4 text-neuro-orange flex-shrink-0" />
                        <span className="text-sm font-medium text-neuro-navy">{c.city ? `${c.city}, ${c.state}` : c.state}</span>
                        <span className="text-xs text-gray-400 ml-auto">{c.count} {c.count === 1 ? 'doctor' : 'doctors'}</span>
                      </button>
                    ))}
                  </div>
                )}
                {autocomplete.doctors.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Doctors</p>
                    {autocomplete.doctors.map((d, i) => (
                      <Link key={i} href={`/directory/${d.slug}`} onClick={() => setShowAutocomplete(false)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-neuro-navy overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {d.photo_url ? <img src={d.photo_url} alt="" className="w-full h-full object-cover" /> :
                            <span className="text-white text-xs font-bold">{d.name?.[4] || '?'}</span>}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neuro-navy">{d.name}</p>
                          <p className="text-xs text-gray-400">{d.clinic} · {d.location}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {autocomplete.specialties.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {autocomplete.specialties.map((s, i) => (
                        <button key={i} onClick={() => { setActiveSpecialty(s); setSearchQuery(s); setShowAutocomplete(false); }}
                          className="px-3 py-1.5 bg-neuro-orange/10 text-neuro-orange text-xs font-bold rounded-lg border border-neuro-orange/20 hover:bg-neuro-orange/20 transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="max-w-4xl mx-auto mt-4">
            <div className="flex gap-2 justify-center flex-wrap items-center">
              {/* Filter Toggle */}
              <button onClick={() => setShowFilters(!showFilters)}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border",
                  showFilters || activeFilterCount > 0
                    ? "bg-neuro-orange text-white border-neuro-orange"
                    : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20")}>
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                {activeFilterCount > 0 && <span className="w-5 h-5 bg-white text-neuro-orange rounded-full flex items-center justify-center text-[10px] font-black">{activeFilterCount}</span>}
              </button>

              {/* Quick Specialty Filters */}
              {SPECIALTY_FILTERS.slice(0, 8).map((specialty) => (
                <button key={specialty}
                  onClick={() => {
                    if (activeSpecialty === specialty) { setActiveSpecialty(null); setSearchQuery(""); }
                    else { setActiveSpecialty(specialty); setSearchQuery(specialty); }
                  }}
                  className={cn("px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                    activeSpecialty === specialty
                      ? "bg-neuro-orange text-white border-neuro-orange"
                      : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20 hover:text-white")}>
                  {specialty}
                </button>
              ))}
            </div>

            {/* Expanded Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mt-3 border border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Toggles */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filterNewPatients} onChange={(e) => setFilterNewPatients(e.target.checked)} className="w-4 h-4 accent-neuro-orange rounded" />
                        <span className="text-white text-xs font-bold">Accepting New Patients</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filterTelehealth} onChange={(e) => setFilterTelehealth(e.target.checked)} className="w-4 h-4 accent-neuro-orange rounded" />
                        <span className="text-white text-xs font-bold">Telehealth Available</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filterWalkins} onChange={(e) => setFilterWalkins(e.target.checked)} className="w-4 h-4 accent-neuro-orange rounded" />
                        <span className="text-white text-xs font-bold">Walk-Ins Welcome</span>
                      </label>

                      {/* Radius */}
                      <div>
                        <span className="text-white text-xs font-bold block mb-1">Distance: {filterRadius > 0 ? `${filterRadius} mi` : 'Any'}</span>
                        <select value={filterRadius} onChange={(e) => setFilterRadius(parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs font-bold focus:outline-none">
                          <option value="0" className="text-black">Any distance</option>
                          <option value="5" className="text-black">Within 5 miles</option>
                          <option value="10" className="text-black">Within 10 miles</option>
                          <option value="25" className="text-black">Within 25 miles</option>
                          <option value="50" className="text-black">Within 50 miles</option>
                          <option value="100" className="text-black">Within 100 miles</option>
                        </select>
                      </div>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                      <span className="text-white/50 text-xs font-bold">Sort by:</span>
                      {[
                        { value: 'tier', label: 'Featured' },
                        { value: 'distance', label: 'Nearest' },
                        { value: 'name', label: 'Name A-Z' },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setSortBy(opt.value)}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            sortBy === opt.value ? "bg-neuro-orange text-white" : "text-white/60 hover:text-white")}>
                          {opt.label}
                        </button>
                      ))}
                      {activeFilterCount > 0 && (
                        <button onClick={() => { setFilterNewPatients(false); setFilterTelehealth(false); setFilterWalkins(false); setFilterRadius(0); setActiveSpecialty(null); setSortBy('tier'); }}
                          className="text-xs text-white/40 hover:text-white font-bold ml-auto">Clear All Filters</button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
            <div className="bg-slate-200 rounded-2xl p-2 shadow-xl border border-gray-100 h-[500px] lg:h-[700px] lg:sticky lg:top-8 overflow-hidden relative group">
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
                 <h2 className="text-xl font-heading font-black text-neuro-navy">
                   {searchQuery || locationQuery ? `Results` : `Verified Clinics`}
                   <span className="text-neuro-orange ml-2">({filteredDoctors.length})</span>
                 </h2>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                   {searchQuery || locationQuery
                     ? `${filteredDoctors.length} ${filteredDoctors.length === 1 ? 'doctor' : 'doctors'} found${locationQuery ? ` near ${locationQuery}` : ''}${searchQuery ? ` for "${searchQuery}"` : ''}`
                     : `${totalCount}+ specialists in the network`
                   }
                 </p>
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
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-6">
                      <div className="flex items-center gap-3 mb-1">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                          Suggested Specialists
                        </p>
                      </div>
                      <p className="text-xs text-amber-600 ml-7">We didn&apos;t find exact matches. Here are some verified specialists you might like.</p>
                    </div>
                  )}
                </div>
                {filteredDoctors.map((doc, i) => (
                  <DoctorCard key={`${doc.id}-${i}`} doc={doc} index={i} />
                ))}
                {/* Infinite scroll trigger */}
                {hasMore && <div ref={loadMoreRef} className="py-4 flex justify-center">{loading && <RefreshCw className="w-5 h-5 text-neuro-orange animate-spin" />}</div>}
              </>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-6 animate-pulse" />
                  <h3 className="text-2xl font-black text-neuro-navy mb-2">No Doctors Found</h3>
                  <p className="text-gray-500 text-sm mb-8">We don&apos;t have a verified specialist in this area yet. Try a nearby city or clear your search.</p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetFilters}
                    className="px-8 py-4 bg-neuro-navy text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 mx-auto shadow-lg shadow-neuro-navy/20 mb-8"
                  >
                    <RotateCcw className="w-4 h-4 text-neuro-orange" /> Reset All Filters
                  </motion.button>

                  {/* Email Capture for Zero Results */}
                  {!notifySuccess ? (
                    <form onSubmit={handleNotifyMe} className="max-w-sm mx-auto pt-6 border-t border-gray-100">
                      <p className="text-sm font-bold text-neuro-navy mb-3">Get notified when we add a doctor near you</p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="you@email.com"
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange"
                        />
                        <button
                          type="submit"
                          disabled={notifying}
                          className="px-5 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange/90 transition-colors disabled:opacity-50"
                        >
                          {notifying ? '...' : 'Notify Me'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="pt-6 border-t border-gray-100">
                      <p className="text-sm font-bold text-green-600">We&apos;ll let you know when a doctor joins near you!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
