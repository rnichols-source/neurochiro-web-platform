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
                dark
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
    return (
      <div className="fixed inset-0 z-[101] bg-black">
        <SmartMatchWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onComplete={(criteria) => setMatchCriteria(criteria)} />

        {/* Full-screen map — edge to edge, no chrome */}
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

        {/* Bottom Sheet — dark glass, Apple Maps style */}
        <BottomSheet
          onSnapChange={setSheetSnap}
          header={
            <div ref={searchRef}>
              {/* Search bar — fixed in drag handle, always visible even at peek */}
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input type="text" placeholder="Search doctors, clinics..." className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/5 focus:outline-none focus:border-white/20 text-white font-medium text-[15px] rounded-xl placeholder:text-white/35"
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setAcFocusField('search')} />
                </div>
                <div className="relative" style={{ width: '120px' }}>
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neuro-orange/80" />
                  <input type="text" placeholder="Location..." className="w-full pl-9 pr-9 py-2.5 bg-white/10 border border-white/5 focus:outline-none focus:border-white/20 text-white font-medium text-[15px] rounded-xl placeholder:text-white/35"
                    value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} onFocus={() => setAcFocusField('location')} />
                  <button onClick={handleUseLocation} disabled={isLocating} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-white/40 active:text-white/70">
                    <Target className={cn("w-3.5 h-3.5", isLocating && "animate-spin")} />
                  </button>
                </div>
              </div>

              {/* Autocomplete dropdown */}
              {showAutocomplete && (
                <div className="bg-[#2c2c2e] rounded-xl border border-white/10 p-2 mb-2 max-h-[30vh] overflow-y-auto">
                  {autocomplete.cities.map((c: any, i: number) => (
                    <button key={i} onClick={() => { setLocationQuery(c.city ? `${c.city}, ${c.state}` : c.state); setShowAutocomplete(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg flex items-center gap-2 text-sm text-white/80">
                      <MapPin className="w-4 h-4 text-neuro-orange flex-shrink-0" /> {c.city ? `${c.city}, ${c.state}` : c.state}
                      <span className="text-xs text-white/30 ml-auto">{c.count}</span>
                    </button>
                  ))}
                  {autocomplete.doctors.map((d: any, i: number) => (
                    <Link key={i} href={`/directory/${d.slug}`} onClick={() => setShowAutocomplete(false)} className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded bg-neuro-orange/20 flex items-center justify-center"><span className="text-neuro-orange text-[10px] font-bold">{d.name?.[4] || '?'}</span></div>
                      <span className="font-bold text-white/90">{d.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          }
        >
          {/* Specialty pills */}
          <div className="overflow-x-auto scrollbar-hide -mx-1 mb-3">
            <div className="flex gap-1.5 px-1">
              {SPECIALTY_FILTERS.map((specialty) => (
                <button key={specialty} onClick={() => { if (activeSpecialty === specialty) { setActiveSpecialty(null); setSearchQuery(""); } else { setActiveSpecialty(specialty); setSearchQuery(specialty); } }}
                  className={cn("px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all",
                    activeSpecialty === specialty ? "bg-neuro-orange text-white" : "bg-white/10 text-white/60")}>
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          {/* Result count */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <p className="text-[13px] font-bold text-white/90">{filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'}</p>
            {(searchQuery || locationQuery) && (
              <button onClick={handleClearSearch} className="text-[11px] font-bold text-neuro-orange flex items-center gap-1"><X className="w-3 h-3" /> Clear</button>
            )}
          </div>

          {/* Doctor list */}
          <div className="space-y-3 pb-8">{doctorListJSX}</div>
        </BottomSheet>
      </div>
    );
  }

  // ── DESKTOP: Full-screen map + floating glass sidebar ──
  return (
    <div className="fixed inset-0 pt-[72px]">
      <SmartMatchWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onComplete={(criteria) => setMatchCriteria(criteria)} />

      {/* Full-screen map */}
      <div className="absolute inset-0 pt-[72px]">
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

      {/* Floating glass sidebar */}
      <div className="absolute top-[88px] left-4 bottom-4 w-[420px] z-20 flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'rgba(28, 28, 30, 0.85)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>

        {/* Sidebar header — search */}
        <div className="flex-shrink-0 p-4 border-b border-white/10" ref={searchRef}>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" placeholder="Doctor, clinic, or specialty..."
                className="w-full pl-9 pr-8 py-2.5 bg-white/10 border border-white/5 focus:outline-none focus:border-white/20 text-white font-medium text-sm rounded-xl placeholder:text-white/35"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setAcFocusField('search')}
                onKeyDown={(e) => { if (e.key === 'Enter') { setShowAutocomplete(false); handleSearch(); } }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="relative" style={{ width: '140px' }}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neuro-orange/70" />
              <input type="text" placeholder="Location..."
                className="w-full pl-9 pr-9 py-2.5 bg-white/10 border border-white/5 focus:outline-none focus:border-white/20 text-white font-medium text-sm rounded-xl placeholder:text-white/35"
                value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)}
                onFocus={() => setAcFocusField('location')}
                onKeyDown={(e) => { if (e.key === 'Enter') { setShowAutocomplete(false); handleSearch(); } }} />
              {locationQuery ? (
                <button onClick={() => setLocationQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={handleUseLocation} disabled={isLocating} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <Target className={cn("w-4 h-4", isLocating && "animate-spin")} />
                </button>
              )}
            </div>
          </div>

          {/* Autocomplete */}
          {showAutocomplete && (
            <div className="bg-[#2c2c2e] rounded-xl border border-white/10 p-2 mb-3 max-h-[40vh] overflow-y-auto">
              {autocomplete.cities.length > 0 && autocomplete.cities.map((c, i) => (
                <button key={i} onClick={() => { setLocationQuery(c.city ? `${c.city}, ${c.state}` : c.state); setShowAutocomplete(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg flex items-center gap-2 text-sm text-white/80">
                  <MapPin className="w-4 h-4 text-neuro-orange flex-shrink-0" />
                  {c.city ? `${c.city}, ${c.state}` : c.state}
                  <span className="text-xs text-white/30 ml-auto">{c.count}</span>
                </button>
              ))}
              {autocomplete.doctors.length > 0 && autocomplete.doctors.map((d, i) => (
                <Link key={i} href={`/directory/${d.slug}`} onClick={() => setShowAutocomplete(false)}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-neuro-orange/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {d.photo_url ? <img src={d.photo_url} alt="" className="w-full h-full object-cover" /> :
                      <span className="text-neuro-orange text-xs font-bold">{d.name?.[4] || '?'}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/90">{d.name}</p>
                    <p className="text-xs text-white/40">{d.clinic} · {d.location}</p>
                  </div>
                </Link>
              ))}
              {autocomplete.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-2 pt-2">
                  {autocomplete.specialties.map((s, i) => (
                    <button key={i} onClick={() => { setActiveSpecialty(s); setSearchQuery(s); setShowAutocomplete(false); }}
                      className="px-2.5 py-1 bg-neuro-orange/15 text-neuro-orange text-xs font-bold rounded-lg hover:bg-neuro-orange/25 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Specialty pills + filters */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all",
                showFilters || activeFilterCount > 0 ? "bg-neuro-orange text-white" : "bg-white/10 text-white/60 hover:bg-white/15")}>
              <SlidersHorizontal className="w-3 h-3" /> Filters
              {activeFilterCount > 0 && <span className="w-4 h-4 bg-white text-neuro-orange rounded-full flex items-center justify-center text-[9px] font-black">{activeFilterCount}</span>}
            </button>
            {SPECIALTY_FILTERS.slice(0, 6).map((specialty) => (
              <button key={specialty}
                onClick={() => { if (activeSpecialty === specialty) { setActiveSpecialty(null); setSearchQuery(""); } else { setActiveSpecialty(specialty); setSearchQuery(specialty); } }}
                className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all",
                  activeSpecialty === specialty ? "bg-neuro-orange text-white" : "bg-white/10 text-white/60 hover:bg-white/15")}>
                {specialty}
              </button>
            ))}
          </div>

          {/* Expanded filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="bg-white/5 rounded-xl p-3 mt-2 border border-white/5 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={filterNewPatients} onChange={(e) => setFilterNewPatients(e.target.checked)} className="w-3.5 h-3.5 accent-neuro-orange rounded" />
                      <span className="text-white/70 text-[11px] font-bold">New Patients</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={filterTelehealth} onChange={(e) => setFilterTelehealth(e.target.checked)} className="w-3.5 h-3.5 accent-neuro-orange rounded" />
                      <span className="text-white/70 text-[11px] font-bold">Telehealth</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={filterWalkins} onChange={(e) => setFilterWalkins(e.target.checked)} className="w-3.5 h-3.5 accent-neuro-orange rounded" />
                      <span className="text-white/70 text-[11px] font-bold">Walk-Ins</span>
                    </label>
                    <select value={filterRadius} onChange={(e) => setFilterRadius(parseInt(e.target.value))}
                      className="px-2 py-1.5 bg-white/10 border border-white/10 rounded-lg text-white/70 text-[11px] font-bold focus:outline-none">
                      <option value="0" className="text-black">Any distance</option>
                      <option value="10" className="text-black">10 miles</option>
                      <option value="25" className="text-black">25 miles</option>
                      <option value="50" className="text-black">50 miles</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <span className="text-white/30 text-[10px] font-bold">Sort:</span>
                    {[{ value: 'tier', label: 'Featured' }, { value: 'distance', label: 'Nearest' }, { value: 'name', label: 'A-Z' }].map(opt => (
                      <button key={opt.value} onClick={() => setSortBy(opt.value)}
                        className={cn("px-2 py-1 rounded text-[10px] font-bold", sortBy === opt.value ? "bg-neuro-orange text-white" : "text-white/40 hover:text-white/70")}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Result count */}
        <div className="flex-shrink-0 px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
          <p className="text-[13px] font-bold text-white/80">{filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'}</p>
          {(searchQuery || locationQuery) && (
            <button onClick={handleClearSearch} className="text-[11px] font-bold text-neuro-orange flex items-center gap-1"><X className="w-3 h-3" /> Clear</button>
          )}
        </div>

        {/* Scrollable doctor list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {doctorListJSX}
        </div>
      </div>
    </div>
  );
}
