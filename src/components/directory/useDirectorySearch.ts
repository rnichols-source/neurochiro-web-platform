"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRegion } from "@/context/RegionContext";
import { REGIONS, RegionCode } from "@/lib/regions";
import { countryMeta } from "@/lib/directory-countries";

export interface DirectoryDoctor {
  id: string;
  first_name?: string;
  last_name?: string;
  clinic_name?: string;
  slug?: string;
  city?: string;
  state?: string;
  country?: string;
  photo_url?: string;
  phone?: string;
  booking_url?: string;
  specialties?: string[];
  distance_miles?: number | null;
  accepting_new_patients?: boolean;
  verification_status?: "pending" | "verified" | "hidden";
  latitude?: number;
  longitude?: number;
}

export interface CountryOption {
  code: string;
  label: string;
  flag: string;
  count: number;
}

export interface SearchFilters {
  specialties: string[];
  newPatients: boolean;
  telehealth: boolean;
  walkins: boolean;
  radius: number;
  sort: "distance" | "name";
  name: string;
}

const EMPTY_FILTERS: SearchFilters = {
  specialties: [],
  newPatients: false,
  telehealth: false,
  walkins: false,
  radius: 0,
  sort: "distance",
  name: "",
};

function isRegionCode(code: string): code is RegionCode {
  return code in REGIONS;
}

export function useDirectorySearch(options: {
  initialDoctors: DirectoryDoctor[];
  forcedRegion?: RegionCode;
}) {
  const { initialDoctors, forcedRegion } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { region, setRegion } = useRegion();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipUrl = useRef(true);

  const initialCountry = (
    forcedRegion ||
    searchParams.get("country") ||
    searchParams.get("region") ||
    "US"
  ).toUpperCase();

  const [country, setCountry] = useState(initialCountry === "GB" ? "UK" : initialCountry);
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [locationSource, setLocationSource] = useState<"gps" | "typed" | "none">(
    searchParams.get("location") ? "typed" : "none"
  );
  const [gpsLabel, setGpsLabel] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    ...EMPTY_FILTERS,
    specialties: (searchParams.get("specialties") || "").split(",").map((s) => s.trim()).filter(Boolean),
    newPatients: searchParams.get("new_patients") === "true" || searchParams.get("new_patients") === "1",
    radius: Number(searchParams.get("radius") || 0) || 0,
    sort: searchParams.get("sort") === "name" ? "name" : "distance",
    name: searchParams.get("q") || "",
  });
  const [view, setView] = useState<"list" | "map">(searchParams.get("view") === "map" ? "map" : "list");
  const [doctors, setDoctors] = useState<DirectoryDoctor[]>(initialDoctors);
  const [nearest, setNearest] = useState<DirectoryDoctor[]>([]);
  const [locationLabel, setLocationLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [unknownPlace, setUnknownPlace] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [hasSearched, setHasSearched] = useState(initialDoctors.length > 0 || !!searchParams.get("location"));
  const [locating, setLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [popularCities, setPopularCities] = useState<{ label: string; count: number }[]>([]);
  const [suggestions, setSuggestions] = useState<{ cities: { city: string; state: string; count: number }[]; doctors: { name: string; slug: string; clinic?: string; location?: string; photo_url?: string }[] }>({ cities: [], doctors: [] });
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const toastUndo = useRef<{ country: string; location: string } | null>(null);

  const distanceUnit: "mi" | "km" = country === "US" ? "mi" : "km";
  const placeholder = (isRegionCode(country) ? REGIONS[country].searchPlaceholder : null) || "City, ZIP or postcode";
  const countryInfo = countryMeta(country);

  const buildParams = useCallback((
    nextLocation: string,
    nextCountry: string,
    nextFilters: SearchFilters,
    source: "gps" | "typed" | "none",
    nextCoords: { lat: number; lng: number } | null,
    label: string,
    bounds?: string,
  ) => {
    const params = new URLSearchParams();
    params.set("country", nextCountry);
    params.set("region", nextCountry);
    if (nextLocation) params.set("location", nextLocation);
    if (nextFilters.name) params.set("q", nextFilters.name);
    if (nextFilters.specialties.length) params.set("specialties", nextFilters.specialties.join(","));
    if (nextFilters.newPatients) params.set("new_patients", "true");
    if (nextFilters.telehealth) params.set("telehealth", "true");
    if (nextFilters.walkins) params.set("walkins", "true");
    if (nextFilters.radius > 0) params.set("radius", String(nextFilters.radius));
    if (nextFilters.sort) params.set("sort", nextFilters.sort);
    if (bounds) params.set("bounds", bounds);
    if (source === "gps" && nextCoords && (!nextLocation || nextLocation === label)) {
      params.set("lat", String(nextCoords.lat));
      params.set("lng", String(nextCoords.lng));
      params.set("loc_src", "gps");
      params.set("gps_label", label);
    }
    return params;
  }, []);

  const runSearch = useCallback(async (override?: {
    location?: string;
    country?: string;
    filters?: SearchFilters;
    source?: "gps" | "typed" | "none";
    coords?: { lat: number; lng: number } | null;
    gpsLabel?: string;
    bounds?: string;
  }) => {
    const nextLocation = override?.location ?? location;
    const nextCountry = override?.country ?? country;
    const nextFilters = override?.filters ?? filters;
    const source = override?.source ?? locationSource;
    const nextCoords = override?.coords === undefined ? coords : override.coords;
    const label = override?.gpsLabel ?? gpsLabel;
    setLoading(true);
    setError(false);
    setSuggestion("");
    try {
      const params = buildParams(nextLocation, nextCountry, nextFilters, source, nextCoords, label, override?.bounds);
      const response = await fetch(`/api/directory/search?${params.toString()}`);
      if (!response.ok) throw new Error("search failed");
      const data = await response.json();
      if (data.error && !(data.doctors || []).length) {
        setError(true);
        setDoctors([]);
        setNearest([]);
        return;
      }
      setDoctors(data.doctors || []);
      setNearest(data.nearest || []);
      setLocationLabel(data.locationLabel || (nextLocation ? `Near ${nextLocation}` : ""));
      setUnknownPlace(!!data.unknownPlace);
      setSearchCenter(data.center || null);
      setHasSearched(true);
      if (data.unknownPlace && nextLocation) {
        const hint = await fetch(`/api/directory/autocomplete?q=${encodeURIComponent(nextLocation.split(",")[0])}&type=location&country=${encodeURIComponent(nextCountry)}`).then((r) => r.json()).catch(() => null);
        const top = hint?.cities?.[0];
        if (top?.city) setSuggestion(top.state ? `${top.city}, ${top.state}` : top.city);
      }
      if (data.resolvedCountry && data.resolvedCountry !== nextCountry) {
        toastUndo.current = { country: nextCountry, location: nextLocation };
        setCountry(data.resolvedCountry);
        if (isRegionCode(data.resolvedCountry)) setRegion(data.resolvedCountry);
        const meta = countryMeta(data.resolvedCountry);
        setToast(`Showing results in ${meta.flag} ${meta.label}`);
      }
    } catch {
      setError(true);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [location, country, filters, locationSource, coords, gpsLabel, buildParams, setRegion]);

  useEffect(() => {
    const urlCountry = searchParams.get("country") || searchParams.get("region");
    if (forcedRegion || urlCountry) return;
    if (region.code && region.code !== country) setCountry(region.code);
    // Only adopt the saved region once, before the patient picks a country.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region.code]);

  useEffect(() => {
    const shouldSearch = !!(searchParams.get("location") || searchParams.get("q") || searchParams.get("specialties") || forcedRegion);
    if (shouldSearch) void runSearch();
    // Mount only. Later searches are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipUrl.current) {
      skipUrl.current = false;
      const urlLocation = searchParams.get("location") || "";
      const urlCountry = (searchParams.get("country") || searchParams.get("region") || "US").toUpperCase();
      if (location === urlLocation && country === urlCountry) return;
    }
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (country) params.set("country", country);
    if (filters.specialties.length) params.set("specialties", filters.specialties.join(","));
    if (filters.newPatients) params.set("new_patients", "1");
    if (filters.radius) params.set("radius", String(filters.radius));
    if (filters.sort !== "distance") params.set("sort", filters.sort);
    if (view === "map") params.set("view", "map");
    if (filters.name) params.set("q", filters.name);
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [location, country, filters, view, pathname, router, searchParams]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/directory/countries")
      .then((r) => r.json())
      .then((data) => { if (!cancelled && Array.isArray(data)) setCountries(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/directory/countries?cities=1&country=${encodeURIComponent(country)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setPopularCities(data.cities || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [country]);

  useEffect(() => {
    if (location.trim().length < 2) {
      setSuggestions({ cities: [], doctors: [] });
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/directory/autocomplete?q=${encodeURIComponent(location.trim())}&type=all&country=${encodeURIComponent(country)}`)
        .then((r) => r.json())
        .then((data) => {
          setSuggestions({ cities: data.cities || [], doctors: data.doctors || [] });
          setSuggestOpen(true);
        })
        .catch(() => setSuggestOpen(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [location, country]);

  useEffect(() => {
    const key = `nc_dir_scroll:${pathname}${window.location.search}`;
    const saved = sessionStorage.getItem(key);
    if (saved && listRef.current) listRef.current.scrollTop = Number(saved);
  }, [pathname, doctors.length]);

  const rememberScroll = () => {
    const key = `nc_dir_scroll:${pathname}${window.location.search}`;
    if (listRef.current) sessionStorage.setItem(key, String(listRef.current.scrollTop));
  };

  const typeLocation = (value: string) => {
    setLocation(value);
    setLocationSource("typed");
    setCoords(null);
    setGpsLabel("");
    setGeoMessage("");
    setHeaderCollapsed(false);
  };

  const submitLocation = (value = location) => {
    setSuggestOpen(false);
    setLocation(value);
    setLocationSource("typed");
    setCoords(null);
    void runSearch({ location: value, source: "typed", coords: null, gpsLabel: "" });
  };

  const chooseCountry = (code: string) => {
    setCountry(code);
    setLocation("");
    setLocationSource("none");
    setCoords(null);
    setGpsLabel("");
    if (isRegionCode(code)) setRegion(code);
    void runSearch({ country: code, location: "", source: "none", coords: null });
  };

  const undoToast = () => {
    const prev = toastUndo.current;
    setToast(null);
    if (!prev) return;
    setCountry(prev.country);
    setLocation(prev.location);
    if (isRegionCode(prev.country)) setRegion(prev.country);
    void runSearch({ country: prev.country, location: prev.location, source: "typed", coords: null });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage("Location is off. Type your city or ZIP instead");
      inputRef.current?.focus();
      return;
    }
    setLocating(true);
    setGeoMessage("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        let label = "Current location";
        try {
          const data = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`).then((r) => r.json());
          const city = data.city || data.locality || "Current location";
          const state = String(data.principalSubdivisionCode || "").split("-").pop() || "";
          label = state ? `${city}, ${state}` : city;
        } catch { /* keep the generic label */ }
        const next = { lat, lng };
        setCoords(next);
        setGpsLabel(label);
        setLocation(label);
        setLocationSource("gps");
        setLocating(false);
        setHasSearched(true);
        void runSearch({ location: label, source: "gps", coords: next, gpsLabel: label });
      },
      () => {
        setLocating(false);
        setGeoMessage("Location is off. Type your city or ZIP instead");
        inputRef.current?.focus();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const applyFilters = (next: SearchFilters) => {
    setFilters(next);
    void runSearch({ filters: next });
  };

  const toggleSpecialty = (specialty: string) => {
    const specialties = filters.specialties.includes(specialty)
      ? filters.specialties.filter((item) => item !== specialty)
      : [...filters.specialties, specialty];
    const next = { ...filters, specialties };
    setFilters(next);
    void runSearch({ filters: next });
  };

  const searchThisArea = (bounds: [number, number, number, number]) => {
    void runSearch({ bounds: bounds.join(","), source: "typed", coords: null });
  };

  const showHero = !hasSearched && !location && !forcedRegion && doctors.length === 0;

  return {
    country,
    countryInfo,
    countries,
    popularCities,
    location,
    locationSource,
    placeholder,
    distanceUnit,
    filters,
    view,
    setView,
    doctors,
    nearest,
    locationLabel,
    loading,
    error,
    unknownPlace,
    suggestion,
    locating,
    geoMessage,
    toast,
    setToast,
    undoToast,
    suggestions,
    suggestOpen,
    setSuggestOpen,
    headerCollapsed,
    setHeaderCollapsed,
    searchCenter,
    coords,
    showHero,
    hasSearched,
    bindList: (node: HTMLDivElement | null) => {
      listRef.current = node;
    },
    bindInput: (node: HTMLInputElement | null) => {
      inputRef.current = node;
    },
    typeLocation,
    submitLocation,
    chooseCountry,
    useMyLocation,
    applyFilters,
    toggleSpecialty,
    searchThisArea,
    runSearch,
    rememberScroll,
    retry: () => runSearch(),
  };
}
