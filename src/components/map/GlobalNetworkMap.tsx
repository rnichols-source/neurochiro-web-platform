"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRegion } from "@/context/RegionContext";
import {
  Search,
  MapPin,
  GraduationCap,
  CalendarDays,
  Filter,
  X,
  ArrowRight,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { getDoctors, getStudentsForMap } from "@/app/(public)/directory/actions";
import { getSeminarsForMap } from "@/app/(public)/seminars/actions";
import { Doctor } from "@/types/directory";

interface GlobalNetworkMapProps {
  defaultLayer?: "all" | "student" | "seminar";
  externalSearchQuery?: string;
  onSearchChange?: (q: string) => void;
  externalLocationQuery?: string;
  initialDoctors?: Doctor[];
  listDoctors?: Doctor[];
  highlightedDoctorId?: string | null;
  onMarkerClick?: (doctor: Record<string, any>) => void;
  onMarkerDeselect?: () => void;
}

export default function GlobalNetworkMap({
  defaultLayer = "all",
  externalSearchQuery = "",
  onSearchChange,
  externalLocationQuery = "",
  initialDoctors = [],
  listDoctors = [],
  highlightedDoctorId = null,
  onMarkerClick,
  onMarkerDeselect,
}: GlobalNetworkMapProps) {
  const router = useRouter();
  const { region } = useRegion();
  const [activeLayer, setActiveLayer] = useState<"all" | "student" | "seminar">(defaultLayer);
  const [selectedPin, setSelectedPin] = useState<Record<string, any> | null>(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");

  const searchQuery = externalSearchQuery || internalSearchQuery;

  const handleSearchChange = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    else setInternalSearchQuery(val);
  };

  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [seminars, setSeminars] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Send highlight command to iframe
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type: 'highlight-marker',
      doctorId: highlightedDoctorId || null
    }, window.location.origin);
  }, [highlightedDoctorId]);

  // Handle location centering
  useEffect(() => {
    if (!externalLocationQuery || !iframeRef.current?.contentWindow) return;
    const geocode = async () => {
      try {
        const osmResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(externalLocationQuery)}&limit=1`);
        const data = await osmResponse.json();
        if (data && data.length > 0) {
          iframeRef.current?.contentWindow?.postMessage({
            type: 'set-view',
            center: [Number(data[0].lon), Number(data[0].lat)],
            zoom: 12
          }, window.location.origin);
        }
      } catch (e) {
        console.error("Geocoding error:", e);
      }
    };
    const timeout = setTimeout(geocode, 1000);
    return () => clearTimeout(timeout);
  }, [externalLocationQuery]);

  const currentBounds = useRef<[number, number, number, number] | null>(null);
  const currentZoom = useRef<number>(4);

  const updateMapData = useCallback(async (bounds: [number, number, number, number], zoom: number) => {
    currentBounds.current = bounds;
    currentZoom.current = zoom;
    if (initialDoctors.length > 0 && activeLayer === 'all') return;

    setLoading(true);
    try {
      if (activeLayer === 'seminar') {
        const result = await getSeminarsForMap(bounds);
        setSeminars(result);
      } else if (activeLayer === 'student') {
        const result = await getStudentsForMap({ bounds, limit: 100 });
        setStudents(result);
      } else {
        const result = await getDoctors({ bounds, regionCode: region.code, limit: 500 });
        setDoctors(result.doctors);
      }
    } catch (e) {
      console.error("Error updating map data:", e);
    } finally {
      setLoading(false);
    }
  }, [activeLayer, region.code, initialDoctors.length]);

  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (mapReady) return;
    const interval = setInterval(() => {
      iframeRef.current?.contentWindow?.postMessage({ type: 'is-ready' }, window.location.origin);
    }, 1000);
    return () => clearInterval(interval);
  }, [mapReady]);

  // Set initial view when map is ready (only once per region change)
  const initialViewSent = useRef(false);
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    // Only send initial view once — markers handle fit-to-bounds
    if (!initialViewSent.current) {
      initialViewSent.current = true;
      iframeRef.current.contentWindow.postMessage({
        type: 'set-view',
        center: region.mapDefaults.center,
        zoom: region.mapDefaults.zoom
      }, window.location.origin);
    }
  }, [mapReady, region.code]);

  // Build marker data — include extra props for preview card
  const buildMarkerData = useCallback(() => {
    return (initialDoctors || []).map(doc => {
      const lat = Number(doc.latitude);
      const lng = Number(doc.longitude);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
      const matched = (externalSearchQuery || externalLocationQuery) && listDoctors.length > 0
        ? listDoctors.some(ld => ld.id === doc.id)
        : true;
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
        properties: {
          doctorId: String(doc.id),
          name: `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`.trim(),
          slug: doc.slug || '',
          clinic: doc.clinic_name || '',
          city: doc.city || '',
          state: doc.state || '',
          photo_url: doc.photo_url || '',
          membership_tier: doc.membership_tier || '',
          matched: matched ? 1 : 0
        }
      };
    }).filter((f): f is NonNullable<typeof f> => f !== null);
  }, [initialDoctors, listDoctors, externalSearchQuery, externalLocationQuery]);

  // Sync markers to iframe — send once when ready, update without re-fitting on filter changes
  const hasSentInitialMarkers = useRef(false);
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    const dataToSend = buildMarkerData();
    if (dataToSend.length === 0) return;
    const isInitial = !hasSentInitialMarkers.current;
    hasSentInitialMarkers.current = true;
    iframeRef.current.contentWindow.postMessage({
      type: isInitial ? 'force-raw-markers' : 'update-markers',
      data: dataToSend,
    }, window.location.origin);
  }, [initialDoctors, listDoctors, mapReady, buildMarkerData]);

  // Handle iframe messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'MAP_INITIALIZED' || e.data.type === 'map-ready') {
        setMapReady(true);
      } else if (e.data.type === 'map-move') {
        currentBounds.current = e.data.bounds;
        currentZoom.current = e.data.zoom;
        updateMapData(e.data.bounds, e.data.zoom);
      } else if (e.data.type === 'marker-click') {
        setSelectedPin(e.data.data);
        onMarkerClick?.(e.data.data);
      } else if (e.data.type === 'marker-deselect') {
        setSelectedPin(null);
        onMarkerDeselect?.();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [updateMapData, onMarkerClick, onMarkerDeselect]);

  useEffect(() => {
    if (initialDoctors && initialDoctors.length > 0) setDoctors(initialDoctors);
  }, [initialDoctors]);

  // Public method: fly to a doctor on the map
  const flyToDoctor = useCallback((doctorId: string) => {
    iframeRef.current?.contentWindow?.postMessage({
      type: 'select-marker',
      doctorId
    }, window.location.origin);
  }, []);

  // Expose flyToDoctor via ref — but we'll use postMessage from parent instead

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      {loading && (
        <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-neuro-orange animate-spin" />
        </div>
      )}

      {/* Map iframe */}
      <iframe
        ref={iframeRef}
        id="network-map-iframe"
        src="/network-map.html"
        loading="lazy"
        className="absolute inset-0 w-full h-full border-none"
        title="Global Network Map"
      />

      {/* Layer toggles — desktop only */}
      <div className="absolute bottom-6 right-6 z-10 hidden lg:flex flex-col gap-2">
        {[
          { id: "all", label: "Doctors", icon: MapPin, bg: "bg-neuro-orange" },
          { id: "student", label: "Students", icon: GraduationCap, bg: "bg-blue-500" },
          { id: "seminar", label: "Seminars", icon: CalendarDays, bg: "bg-purple-500" }
        ].map(layer => (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={layer.id}
            onClick={() => setActiveLayer(layer.id as any)}
            className="flex items-center justify-end gap-2 group"
          >
            <span className="text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-2 py-1 rounded-md shadow-sm">
              {layer.label}
            </span>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all border-2 border-white ${activeLayer === layer.id ? layer.bg + ' text-white' : 'bg-white text-gray-400'}`}>
              <layer.icon className="w-4 h-4" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Selected pin slide-out — desktop only */}
      <AnimatePresence>
        {selectedPin && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 w-[360px] h-full bg-white/95 backdrop-blur-xl border-l border-gray-200 z-20 shadow-2xl hidden lg:flex flex-col"
          >
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-end mb-4">
                <button onClick={() => { setSelectedPin(null); onMarkerDeselect?.(); }} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar */}
              <div className="w-16 h-16 bg-neuro-navy rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg mb-4 overflow-hidden">
                {selectedPin.photo_url ? (
                  <img src={selectedPin.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (selectedPin.name || "NC").replace(/^Dr\.\s*/i, '').split(' ').filter(Boolean).map((n: string) => n[0]).join('').substring(0, 2)
                )}
              </div>

              <div className="flex items-center gap-1 text-[10px] font-bold text-neuro-orange uppercase tracking-widest mb-2">
                <ShieldCheck className="w-3 h-3" /> Verified
              </div>

              <h2 className="text-xl font-black text-neuro-navy">{selectedPin.name}</h2>
              <p className="text-gray-500 font-medium text-sm">{selectedPin.clinic}</p>

              <div className="flex items-center gap-2 text-sm text-gray-400 mt-2 mb-6">
                <MapPin className="w-4 h-4" />
                {[selectedPin.city, selectedPin.state].filter(Boolean).join(', ') || 'Location available on profile'}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed">
                Expert in nervous-system-first chiropractic care. View the full profile to see techniques, reviews, and clinic hours.
              </p>
            </div>

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => router.push(`/directory/${selectedPin.slug || selectedPin.doctorId}`)}
                className="w-full py-4 bg-neuro-orange hover:bg-neuro-orange/90 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                View Full Profile <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
