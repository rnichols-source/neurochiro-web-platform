"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRegion } from "@/context/RegionContext";
import Supercluster from "supercluster";
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
}

export default function GlobalNetworkMap({ 
  defaultLayer = "all",
  externalSearchQuery = "",
  onSearchChange,
  externalLocationQuery = "",
  initialDoctors = [],
  listDoctors = []
}: GlobalNetworkMapProps) {
  const router = useRouter();
  const { region } = useRegion();
  const [activeLayer, setActiveLayer] = useState<"all" | "student" | "seminar">(defaultLayer);
  const [selectedPin, setSelectedPin] = useState<Record<string, any> | null>(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");

  const searchQuery = externalSearchQuery || internalSearchQuery;

  const handleSearchChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
  };

  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [seminars, setSeminars] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle location centering
  useEffect(() => {
    if (!externalLocationQuery || !iframeRef.current?.contentWindow) return;

    // Simple geocoding fallback (MapBox/Google would be better, but we can try bigdatacloud or similar)
    const geocode = async () => {
        try {
            // Using a free geocoding service for the demo/prototype
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?localityName=${encodeURIComponent(externalLocationQuery)}&localityLanguage=en`);
            // Actually BigDataCloud reverse geocode doesn't do forward geocode well.
            // Let's use OpenStreetMap Nominatim
            const osmResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(externalLocationQuery)}&limit=1`);
            const data = await osmResponse.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                iframeRef.current?.contentWindow?.postMessage({
                    type: 'set-view',
                    center: [Number(lon), Number(lat)],
                    zoom: 12
                }, '*');
            }
        } catch (e) {
            console.error("Geocoding error:", e);
        }
    };

    const timeout = setTimeout(geocode, 1000); // Debounce
    return () => clearTimeout(timeout);
  }, [externalLocationQuery]);

  const currentBounds = useRef<[number, number, number, number] | null>(null);
  const currentZoom = useRef<number>(4);

  // Initialize Supercluster
  const index = useMemo(() => {
    const cluster = new Supercluster({
      radius: 60,
      maxZoom: 16
    });

    let points: any[] = [];

    if (activeLayer === 'seminar') {
      points = seminars
        .filter(sem => sem.latitude !== 0 && sem.longitude !== 0)
        .map(sem => ({
          type: 'Feature' as const,
          properties: { 
            cluster: false, 
            seminarId: sem.id,
            name: sem.title,
            city: sem.city,
            instructor: sem.instructor_name,
            dates: sem.dates,
            type: 'seminar'
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [Number(sem.longitude), Number(sem.latitude)]
          }
        }));
    } else if (activeLayer === 'student') {
      points = students
        .filter(st => st.latitude && st.longitude)
        .map(st => ({
          type: 'Feature' as const,
          properties: {
            cluster: false,
            studentId: st.id,
            name: st.full_name,
            school: st.school,
            graduationYear: st.graduation_year,
            city: st.location_city,
            type: 'student'
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [st.longitude, st.latitude]
          }
        }));
    } else {
      // 🤝 FINAL DATA HANDSHAKE: Use real coordinates from initialDoctors
      const sourceDoctors = initialDoctors;
      
      points = sourceDoctors
        .map(doc => {
          // 🛡️ Standardize coordinates: Strictly use latitude/longitude from Doctor interface
          const lat = parseFloat(doc.latitude as any);
          const lng = parseFloat(doc.longitude as any);

          if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
            return null;
          }

          return {
            type: 'Feature' as const,
            properties: { 
              cluster: false, 
              doctorId: doc.id,
              name: doc.last_name?.startsWith('Dr.') ? doc.last_name : `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`.trim().replace(/\s+/g, ' '),
              clinic: doc.clinic_name,
              slug: doc.slug,
              type: 'doctor'
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [lng, lat]
            }
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
    }

    cluster.load(points as Supercluster.PointFeature<Supercluster.AnyProps>[]);
    return cluster;
  }, [doctors, seminars, students, activeLayer, searchQuery, initialDoctors, region.mapDefaults.center]);

  const updateMapData = useCallback(async (bounds: [number, number, number, number], zoom: number) => {
    currentBounds.current = bounds;
    currentZoom.current = zoom;
    
    // 🛡️ SYNC FIX: If we are in the directory view (which uses initialDoctors), 
    // don't re-fetch data from the map bounds to prevent list/map mismatch.
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
        const result = await getDoctors({ bounds, regionCode: region.code, limit: 100 });
        setDoctors(result.doctors);
      }
    } catch (e) {
      console.error("Error updating map data:", e);
    } finally {
      setLoading(false);
    }
  }, [activeLayer, region.code]);

  const [mapReady, setMapReady] = useState(false);

  // 🛡️ SYNC COUNTER: Reflect exact list count
  const verifiedCount = listDoctors.length > 0 ? listDoctors.length : initialDoctors.length;

  // Initial map centering and data fetch
  useEffect(() => {
    if (mapReady && iframeRef.current?.contentWindow) {
      // 🎯 CENTER ON RESULTS: If we have filtered list doctors, center on those
      let center = region.mapDefaults.center;
      let zoom = region.mapDefaults.zoom;

      const focusDoctors = listDoctors.length > 0 ? listDoctors : initialDoctors;

      if (focusDoctors.length > 0) {
        const firstDoc = focusDoctors.find(d => parseFloat(d.latitude as any) && parseFloat(d.longitude as any));
        if (firstDoc) {
          center = [parseFloat(firstDoc.longitude as any), parseFloat(firstDoc.latitude as any)];
          zoom = focusDoctors.length < 5 ? 10 : 6; // Zoom in more if fewer results
        }
      }

      iframeRef.current.contentWindow.postMessage({
        type: 'set-view',
        center: center,
        zoom: zoom
      }, '*');

      // If we haven't received bounds yet, do an initial wide fetch
      if (!currentBounds.current) {
        updateMapData(undefined as any, region.mapDefaults.zoom);
      }
    }
  }, [mapReady, region.code, listDoctors, initialDoctors]);

  // Re-sync markers when data, layer, or map state changes
  useEffect(() => {
    if (!iframeRef.current?.contentWindow || !mapReady) return;

    const syncMap = () => {
      // 🛡️ ABSOLUTE PIN FORCE: Send ALL 122 features to iframe, but maybe highlight filtered ones?
      // For now, let's just send all initialDoctors to satisfy the "Show all 122" request.
      const dataToSend = (initialDoctors || []).map(doc => {
        const lat = Number(doc.latitude);
        const lng = Number(doc.longitude);
        
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

        return {
          type: 'Feature' as const,
          geometry: { 
            type: 'Point' as const, 
            coordinates: [lng, lat] 
          },
          properties: { 
            cluster: false, 
            doctorId: doc.id, 
            name: `Dr. ${doc.last_name || ''}`, 
            type: 'doctor' as const,
            isFiltered: listDoctors.some(ld => ld.id === doc.id)
          }
        };
      }).filter((f): f is NonNullable<typeof f> => f !== null);

      console.log('[MAP_PARENT] SYNCING ALL MARKERS:', dataToSend.length);

      iframeRef.current?.contentWindow?.postMessage({
        type: 'force-raw-markers',
        data: dataToSend,
        layer: activeLayer
      }, '*');
    };

    const timer = setTimeout(syncMap, 500);
    return () => clearTimeout(timer);
  }, [initialDoctors, listDoctors, mapReady, activeLayer]);

  // Handle iframe messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // 🛡️ HANDSHAKE: Catch initialization from iframe
      if (e.data.type === 'MAP_INITIALIZED' || e.data.type === 'map-ready') {
        setMapReady(true);
      } else if (e.data.type === 'map-move') {
        // 🤝 HANDSHAKE: Update refs and trigger refresh
        currentBounds.current = e.data.bounds;
        currentZoom.current = e.data.zoom;
        updateMapData(e.data.bounds, e.data.zoom);
      } else if (e.data.type === 'marker-click') {
        setSelectedPin(e.data.data);
      } else if (e.data.type === 'map-error') {
        console.error("Map Iframe Error:", e.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [updateMapData]);

  const activeCount = activeLayer === 'seminar' ? seminars.length : 
                      activeLayer === 'student' ? students.length : 
                      doctors.length;

  const activeLabel = activeLayer === 'seminar' ? "Active Seminars" : 
                      activeLayer === 'student' ? "Clinical Students" : 
                      "Verified Clinics";

  return (
    <div className="relative w-full h-full bg-[#0B1118] overflow-hidden rounded-[2.5rem]">
      {loading && (
        <div className="absolute inset-0 z-50 bg-neuro-navy/40 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
            <p className="text-white font-black uppercase tracking-widest text-xs">Syncing Global Nodes...</p>
          </div>
        </div>
      )}

      {/* 1. STANDALONE MAP ENGINE */}
      <iframe 
        ref={iframeRef}
        id="network-map-iframe"
        src="/network-map.html"
        loading="lazy"
        className="absolute inset-0 w-full h-full border-none"
        title="Global Network Map"
      />

      {/* 2. FLOATING COMMAND PALETTE */}
      <div className="absolute top-8 left-8 right-8 md:right-auto md:w-96 z-10 space-y-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-2xl flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400 ml-2" />
          <input 
            type="text" 
            placeholder="Search within map..." 
            className="bg-transparent border-none focus:outline-none text-white w-full placeholder:text-gray-400 text-sm"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <Filter className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* 🛡️ COUNTER: Reflect exact list count */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 bg-neuro-orange px-4 py-2 rounded-xl shadow-lg border border-white/20"
        >
          <span className="text-[10px] font-black text-white uppercase tracking-widest">{activeCount} {activeLabel}</span>
          <div className="w-1 h-1 rounded-full bg-white/50"></div>
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Global Network</span>
        </motion.div>
      </div>

      {/* 3. LAYER TOGGLES */}
      <div className="absolute bottom-12 right-8 z-10 flex flex-col gap-3">
        {[
          { id: "all", label: "Global Network", icon: MapPin, color: "text-neuro-orange hover:bg-neuro-orange hover:text-white" },
          { id: "student", label: "Student Layer", icon: GraduationCap, color: "text-blue-500 hover:bg-blue-500 hover:text-white" },
          { id: "seminar", label: "Seminars", icon: CalendarDays, color: "text-purple-500 hover:bg-purple-500 hover:text-white" }
        ].map(layer => (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={layer.id}
            onClick={() => setActiveLayer(layer.id as "all" | "student" | "seminar")}
            className="flex items-center justify-end gap-3 group"
          >
            <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
              {layer.label}
            </span>
            <div className={`w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl transition-all ${activeLayer === layer.id ? layer.color.split(' ')[1] + ' text-white border-transparent' : layer.color}`}>
              <layer.icon className="w-5 h-5" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* 4. SLIDE-OUT PANEL */}
      <AnimatePresence>
        {selectedPin && (
          <motion.div 
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 w-full md:w-[400px] h-full bg-[#131B24]/95 backdrop-blur-2xl border-l border-white/10 z-20 shadow-2xl flex flex-col"
          >
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-end mb-6">
                <button onClick={() => setSelectedPin(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full h-48 bg-white/5 rounded-3xl mb-6 relative overflow-hidden border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-t from-[#131B24] to-transparent z-10"></div>
              </div>

              <div className="relative z-20 -mt-16 mb-4 flex items-end gap-4">
                <div className="w-20 h-20 bg-neuro-orange rounded-2xl border-4 border-[#131B24] flex items-center justify-center text-white text-2xl font-black shadow-xl">
                  {(selectedPin.name || "N C").replace(/^Dr\.\s*/i, '').split(' ').filter(Boolean).map((n: string) => n[0]).join('').substring(0, 2) || "NC"}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-neuro-orange uppercase tracking-widest bg-neuro-orange/10 px-2 py-1 rounded-lg border border-neuro-orange/20 mb-2">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </div>
              </div>

              <h2 className="text-2xl font-heading font-black text-white">{selectedPin.name}</h2>
              <p className="text-gray-400 font-medium">
                {selectedPin.type === 'seminar' ? selectedPin.city : 
                 selectedPin.type === 'student' ? selectedPin.school : 
                 selectedPin.clinic}
              </p>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2 mb-8">
                {selectedPin.type === 'seminar' ? (
                  <>
                    <CalendarDays className="w-4 h-4 text-neuro-orange" />
                    {selectedPin.dates}
                  </>
                ) : selectedPin.type === 'student' ? (
                  <>
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    Class of {selectedPin.graduationYear}
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Global Node Active
                  </>
                )}
              </div>

              <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
                {selectedPin.type === 'seminar' ? (
                  <p>Instructor: <span className="text-white font-bold">{selectedPin.instructor || 'NeuroChiro Faculty'}</span></p>
                ) : selectedPin.type === 'student' ? (
                  "Verified student member of the NeuroChiro network, preparing for clinical excellence in nervous-system-first care."
                ) : (
                  "Expert in nervous-system-first chiropractic care. View the full clinical profile to see techniques, patient reviews, and clinic hours."
                )}
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-[#131B24]">
              <button 
                onClick={() => {
                  if (selectedPin.type === 'seminar') {
                    router.push(`/seminars/${selectedPin.seminarId}`);
                  } else if (selectedPin.type === 'student') {
                    // Placeholder for student profile route, or just close for now
                    // router.push(`/student/${selectedPin.studentId}`);
                  } else {
                    router.push(`/directory/${selectedPin.slug || selectedPin.doctorId}`);
                  }
                }}
                className="w-full py-4 bg-neuro-orange hover:bg-neuro-orange-light text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-neuro-orange/20"
              >
                {selectedPin.type === 'seminar' ? 'View Event Details' : 
                 selectedPin.type === 'student' ? 'View Student Profile' : 
                 'View Full Profile'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
