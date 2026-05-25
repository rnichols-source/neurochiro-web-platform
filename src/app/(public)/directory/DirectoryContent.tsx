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

const BottomSheet = dynamic(() => import("@/components/directory/BottomSheet"), { ssr: false });
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
  const [isMobile, setIsMobile] = useState(false);

  // Map interaction state
  const [selectedDoctor, setSelectedDoctor] = useState<Record<string, any> | null>(null);
  const [hoveredDoctorId, setHoveredDoctorId] = useState<string | null>(null);
  const [sheetSnap, setSheetSnap] = useState<'peek' | 'half' | 'full'>('peek');
  const mapIframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  const handleSearch = useCallback(() => {
    setPage(1);
    fetchDoctors(searchQuery, locationQuery, false);
    if (locationQuery) setLastLocation(locationQuery);
  }, [searchQuery, locationQuery]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, locationQuery, handleSearch]);

  // Re-fetch if region changes
  useEffect(() => {
    setPage(1);
    fetchDoctors(searchQuery, locationQuery, false);
  }, [region.code]);

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

  // Map interaction handlers
  const handleMarkerClick = useCallback((doctor: Record<string, any>) => {
    setSelectedDoctor(doctor);
  }, []);

  const handleMarkerDeselect = useCallback(() => {
    setSelectedDoctor(null);
  }, []);

  const handleCardHover = useCallback((docId: string | null) => {
    setHoveredDoctorId(docId);
  }, []);

  const handleCardTap = useCallback((docId: string) => {
    // On mobile, send select-marker to fly to pin
    const iframe = document.getElementById('network-map-iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'select-marker', doctorId: docId }, window.location.origin);
    }
  }, []);

  // Doctor list content — shared between desktop sidebar and mobile bottom sheet
  const doctorListJSX = (
    <>
      {loading && doctors.length === 0 ? (
        <div className="space-y-4">{[1,2,3,4,5].map(i => <DoctorCardSkeleton key={i} />)}</div>
      ) : filteredDoctors.length > 0 ? (
        <>
          {isFallback && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-4">
              <div className="flex items-center gap-3 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Suggested Specialists</p></div>
              <p className="text-xs text-amber-600 ml-7">We didn&apos;t find exact matches. Here are some verified specialists.</p>
            </div>
          )}
          {filteredDoctors.map((doc, i) => (
            <div
              key={`${doc.id}-${i}`}
              onClick={() => handleCardTap(doc.id.toString())}
              className="cursor-pointer"
            >
              <DoctorCard
                doc={doc}
                index={i}
                onHover={handleCardHover}
              />
            </div>
          ))}
          {hasMore && <div ref={loadMoreRef} className="py-4 flex justify-center">{loading && <RefreshCw className="w-5 h-5 text-neuro-orange animate-spin" />}</div>}
        </>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center">
          <Globe className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-neuro-navy mb-2">No Doctors Found</h3>
          <p className="text-gray-500 text-sm mb-6">Try a nearby city or clear your search.</p>
          <button onClick={resetFilters} className="px-6 py-3 bg-neuro-navy text-white rounded-xl font-bold text-xs uppercase tracking-widest"><RotateCcw className="w-3 h-3 inline mr-2" /> Reset Filters</button>
          {!notifySuccess ? (
            <form onSubmit={handleNotifyMe} className="max-w-sm mx-auto pt-6 mt-6 border-t border-gray-100">
              <p className="text-sm font-bold text-neuro-navy mb-3">Get notified when we add a doctor near you</p>
              <div className="flex gap-2">
                <input type="email" name="email" required placeholder="you@email.com" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
                <button type="submit" disabled={notifying} className="px-5 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm">{notifying ? '...' : 'Notify Me'}</button>
              </div>
            </form>
          ) : (
            <div className="pt-6 mt-6 border-t border-gray-100"><p className="text-sm font-bold text-green-600">We&apos;ll let you know when a doctor joins near you!</p></div>
          )}
        </div>
      )}
    </>
  );

  // ── MOBILE: Apple Maps full-screen experience ──
  if (isMobile) {
    const searchBarCollapsed = sheetSnap === 'full';

    return (
      <div className="fixed inset-0 z-0">
        <SmartMatchWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onComplete={(criteria) => setMatchCriteria(criteria)} />

        {/* Full-screen map */}
        <div className="absolute inset-0">
          <GlobalNetworkMap
            key={region.code}
            externalSearchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            externalLocationQuery={locationQuery}
            initialDoctors={initialData.doctors}
            listDoctors={filteredDoctors}
            highlightedDoctorId={hoveredDoctorId}
            onMarkerClick={handleMarkerClick}
            onMarkerDeselect={handleMarkerDeselect}
          />
        </div>

        {/* Floating search bar — collapses when sheet is full */}
        <AnimatePresence>
          {!searchBarCollapsed && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute top-0 left-0 right-0 z-[100] pt-[env(safe-area-inset-top)]"
            >
              <div className="px-4 pt-3">
                <div ref={searchRef} className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/50 p-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" placeholder="Search doctors..." className="w-full pl-9 pr-3 py-2.5 bg-gray-100/60 border-none focus:outline-none text-neuro-navy font-medium text-[15px] rounded-xl placeholder:text-gray-400"
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setAcFocusField('search')} />
                    </div>
                    <div className="relative" style={{ width: '130px' }}>
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neuro-orange" />
                      <input type="text" placeholder="Location..." className="w-full pl-9 pr-10 py-2.5 bg-gray-100/60 border-none focus:outline-none text-neuro-navy font-medium text-[15px] rounded-xl placeholder:text-gray-400"
                        value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} onFocus={() => setAcFocusField('location')} />
                      <button onClick={handleUseLocation} disabled={isLocating} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200/60 rounded-lg text-gray-400">
                        <Target className={cn("w-4 h-4", isLocating && "animate-spin")} />
                      </button>
                    </div>
                  </div>
                  {/* Specialty pills */}
                  <div className="mt-1.5 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-1.5 pb-0.5">
                      {SPECIALTY_FILTERS.map((specialty) => (
                        <button key={specialty} onClick={() => { if (activeSpecialty === specialty) { setActiveSpecialty(null); setSearchQuery(""); } else { setActiveSpecialty(specialty); setSearchQuery(specialty); } }}
                          className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border",
                            activeSpecialty === specialty ? "bg-neuro-orange text-white border-neuro-orange" : "bg-gray-100/60 text-gray-600 border-transparent")}>
                          {specialty}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Autocomplete */}
                  {showAutocomplete && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 mt-2 max-h-[40vh] overflow-y-auto">
                      {autocomplete.cities.length > 0 && autocomplete.cities.map((c: any, i: number) => (
                        <button key={i} onClick={() => { setLocationQuery(c.city ? `${c.city}, ${c.state}` : c.state); setShowAutocomplete(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-neuro-orange flex-shrink-0" /> {c.city ? `${c.city}, ${c.state}` : c.state}
                          <span className="text-xs text-gray-400 ml-auto">{c.count}</span>
                        </button>
                      ))}
                      {autocomplete.doctors.length > 0 && autocomplete.doctors.map((d: any, i: number) => (
                        <Link key={i} href={`/directory/${d.slug}`} onClick={() => setShowAutocomplete(false)} className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded bg-neuro-navy flex items-center justify-center"><span className="text-white text-[10px] font-bold">{d.name?.[4] || '?'}</span></div>
                          <span className="font-bold text-neuro-navy">{d.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact search pill when sheet is full — tap to collapse sheet */}
        <AnimatePresence>
          {searchBarCollapsed && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="fixed top-[env(safe-area-inset-top)] left-4 right-4 z-[300] mt-3"
              onClick={() => {
                // This is just visual — the sheet controls snap
              }}
            >
              <div className="bg-white/90 backdrop-blur-2xl rounded-full shadow-lg border border-white/50 px-4 py-2.5 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 truncate flex-1">
                  {searchQuery || locationQuery
                    ? [searchQuery, locationQuery].filter(Boolean).join(' in ')
                    : 'Search doctors...'}
                </span>
                {(searchQuery || locationQuery) && (
                  <button onClick={(e) => { e.stopPropagation(); handleClearSearch(); }} className="p-1 text-gray-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Bottom Sheet */}
        <BottomSheet
          header={
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-black text-neuro-navy">{filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'}</h2>
                {(searchQuery || locationQuery) && <button onClick={handleClearSearch} className="text-xs font-bold text-neuro-orange flex items-center gap-1"><X className="w-3 h-3" /> Clear</button>}
              </div>
              {(searchQuery || locationQuery) && <p className="text-[11px] text-gray-400 mt-0.5">{searchQuery && locationQuery ? `${searchQuery} in ${locationQuery}` : searchQuery || locationQuery}</p>}
            </div>
          }
          selectedDoctor={selectedDoctor}
          onDismissPreview={() => {
            setSelectedDoctor(null);
            const iframe = document.getElementById('network-map-iframe') as HTMLIFrameElement;
            iframe?.contentWindow?.postMessage({ type: 'deselect-marker' }, window.location.origin);
          }}
          onSnapChange={setSheetSnap}
        >
          <div className="space-y-3 pb-8">{doctorListJSX}</div>
        </BottomSheet>
      </div>
    );
  }

  // ── DESKTOP: Full layout with header, filters, map + list ──
  return (
    <div className="min-h-dvh bg-neuro-cream">
      <SmartMatchWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onComplete={(criteria) => setMatchCriteria(criteria)} />

      {/* Search Header */}
      <header className="bg-neuro-navy text-white pt-20 pb-32 px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-3xl md:text-6xl font-heading font-black mb-2 md:mb-6 text-white drop-shadow-xl">
            Find a <span className="text-neuro-orange">NeuroChiro</span> Doctor.
          </h1>
          <p className="text-white/80 text-sm md:text-xl max-w-2xl mx-auto mb-6 md:mb-12 font-medium hidden md:block">
            The global network of elite chiropractic clinics focused on the nervous system.
          </p>

          <div ref={searchRef} className="max-w-4xl mx-auto space-y-8 sticky top-[72px] z-30 bg-neuro-navy pt-4 pb-2 md:relative md:top-0 md:bg-transparent md:pt-0 md:pb-0">
            <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl border border-gray-100">
              <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Doctor, clinic, or specialty..."
                  className="w-full pl-14 pr-10 py-3.5 md:py-5 bg-transparent border-none focus:outline-none text-neuro-navy font-medium text-base md:text-lg"
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
                  placeholder="City, state, or zip..."
                  className="w-full pl-14 pr-16 py-3.5 md:py-5 bg-transparent border-none focus:outline-none text-neuro-navy font-medium text-base md:text-lg"
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
                className="bg-neuro-navy text-white px-8 md:px-10 py-3.5 md:py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs md:text-sm hover:bg-neuro-navy-light transition-all shadow-lg disabled:opacity-70"
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
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 md:p-4 space-y-3 max-h-[60vh] overflow-y-auto">
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
            <div className="flex gap-2 justify-start md:justify-center flex-nowrap md:flex-wrap items-center overflow-x-auto scrollbar-hide pb-1">
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
      <main className="max-w-7xl mx-auto px-8 -mt-16 relative z-20 pb-24">
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
                  highlightedDoctorId={hoveredDoctorId}
                  onMarkerClick={handleMarkerClick}
                  onMarkerDeselect={handleMarkerDeselect}
                />
              </div>
            </div>
          </div>

          {/* Listings */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-heading font-black text-neuro-navy">
                  {searchQuery || locationQuery ? `Results` : `Verified Clinics`}
                  <span className="text-neuro-orange ml-2">({filteredDoctors.length})</span>
                </h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  {searchQuery || locationQuery
                    ? `${filteredDoctors.length} ${filteredDoctors.length === 1 ? 'doctor' : 'doctors'} found${locationQuery ? ` near ${locationQuery}` : ''}${searchQuery ? ` for "${searchQuery}"` : ''}`
                    : `${totalCount}+ specialists in the network`}
                </p>
              </div>
            </div>
            {doctorListJSX}
          </div>
        </div>
      </main>
    </div>
  );
}
