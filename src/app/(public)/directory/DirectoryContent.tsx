"use client";
/* The search hook keeps scroll and focus refs beside its state. Reading that state during render is intentional. */
/* eslint-disable react-hooks/refs */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { RegionCode } from "@/lib/regions";
import { useDirectorySearch, type DirectoryDoctor } from "@/components/directory/useDirectorySearch";
import SearchHeader from "@/components/directory/SearchHeader";
import CountryPicker from "@/components/directory/CountryPicker";
import FiltersSheet from "@/components/directory/FiltersSheet";
import ResultsList from "@/components/directory/ResultsList";
import ViewTogglePill from "@/components/directory/ViewTogglePill";
import MapPeekCard, { type PeekDoctor } from "@/components/directory/MapPeekCard";

const GlobalNetworkMap = dynamic(() => import("@/components/map/GlobalNetworkMap"), { ssr: false });

export default function DirectoryContent({
  initialData,
  forcedRegion,
}: {
  initialData: { doctors: DirectoryDoctor[]; total: number };
  forcedRegion?: RegionCode;
}) {
  const search = useDirectorySearch({ initialDoctors: initialData.doctors, forcedRegion });
  const [countryOpen, setCountryOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.ncDirectory = "ready";
    return () => {
      delete document.documentElement.dataset.ncDirectory;
    };
  }, []);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [peek, setPeek] = useState<PeekDoctor | null>(null);
  const [searchArea, setSearchArea] = useState<[number, number, number, number] | null>(null);
  const [showArea, setShowArea] = useState(false);

  const summary = `📍 ${search.location || search.countryInfo.label} · ${search.doctors.length} doctors · Filters`;

  const header = (
    <SearchHeader
      collapsed={search.headerCollapsed}
      onExpand={() => search.setHeaderCollapsed(false)}
      location={search.location}
      placeholder={search.placeholder}
      countryFlag={search.countryInfo.flag}
      countryCode={search.country}
      summary={summary}
      locating={search.locating}
      suggestions={search.suggestions}
      suggestOpen={search.suggestOpen}
      filters={search.filters}
      inputRef={search.bindInput}
      onLocation={search.typeLocation}
      onSubmit={(value) => search.submitLocation(value)}
      onNearMe={search.useMyLocation}
      onClear={() => search.typeLocation("")}
      onCountry={() => setCountryOpen(true)}
      onFilters={() => setFiltersOpen(true)}
      onSpecialty={(pill) => {
        if (pill === "Accepting new patients") {
          search.applyFilters({ ...search.filters, newPatients: !search.filters.newPatients });
        } else {
          search.toggleSpecialty(pill);
        }
      }}
      onPickCity={(label) => search.submitLocation(label)}
      onPickDoctor={search.rememberScroll}
      onSearchAll={() => search.chooseCountry("ALL")}
    />
  );

  const list = (
    <div
      ref={search.bindList}
      onScroll={(event) => search.setHeaderCollapsed(event.currentTarget.scrollTop > 48)}
      className="flex-1 overflow-y-auto p-4 space-y-3"
    >
      {search.showHero ? (
        <div className="rounded-3xl bg-[#1c1c1e] p-5 text-white">
          <h1 className="text-2xl font-bold">Find a nervous-system chiropractor near you</h1>
          <button type="button" onClick={search.useMyLocation} className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-neuro-orange text-base font-bold">
            📍 {search.locating ? "Finding you..." : "Use my location"}
          </button>
          {search.geoMessage && <p className="mt-3 text-sm text-white/80">{search.geoMessage}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {search.popularCities.map((city) => (
              <button key={city.label} type="button" onClick={() => search.submitLocation(city.label)} className="min-h-11 rounded-full bg-white/10 px-3 text-sm font-semibold">
                {city.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ResultsList
          doctors={search.doctors}
          loading={search.loading}
          error={search.error}
          location={search.location}
          locationLabel={search.locationLabel}
          radius={search.filters.radius}
          unit={search.distanceUnit}
          unknownPlace={search.unknownPlace}
          suggestion={search.suggestion}
          nearest={search.nearest}
          onSuggest={(value) => search.submitLocation(value)}
          onWiden={() => search.applyFilters({ ...search.filters, radius: 100 })}
          onRetry={search.retry}
          onHover={setHoveredId}
          onNavigate={search.rememberScroll}
        />
      )}
    </div>
  );

  const map = (
    <div className="relative h-full min-h-[240px]">
      <GlobalNetworkMap
        patientMode
        initialDoctors={search.doctors}
        listDoctors={search.doctors}
        highlightedDoctorId={hoveredId}
        userLocation={search.locationSource === "gps" ? search.coords : null}
        emptyLabel={search.hasSearched && search.doctors.length === 0 ? "No doctors in this area yet" : ""}
        onMarkerClick={(doctor) => {
          setPeek({
            name: typeof doctor.name === "string" ? doctor.name : undefined,
            slug: typeof doctor.slug === "string" ? doctor.slug : undefined,
            doctorId: typeof doctor.doctorId === "string" ? doctor.doctorId : undefined,
            city: typeof doctor.city === "string" ? doctor.city : undefined,
            state: typeof doctor.state === "string" ? doctor.state : undefined,
            photo_url: typeof doctor.photo_url === "string" ? doctor.photo_url : undefined,
          });
          const id = doctor.doctorId || doctor.id;
          if (id) {
            setHoveredId(String(id));
            document.getElementById(`doctor-card-${id}`)?.scrollIntoView({ block: "nearest" });
          }
        }}
        onMarkerDeselect={() => setPeek(null)}
        onUserMove={(bounds) => { setSearchArea(bounds); setShowArea(true); }}
      />
      {showArea && searchArea && (
        <button
          type="button"
          onClick={() => { search.searchThisArea(searchArea); setShowArea(false); }}
          className="absolute left-1/2 top-4 z-20 min-h-11 -translate-x-1/2 rounded-full bg-white px-4 text-sm font-bold text-neuro-navy"
        >
          Search this area
        </button>
      )}
      {peek && <MapPeekCard doctor={peek} unit={search.distanceUnit} onClose={() => setPeek(null)} />}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[101] flex flex-col bg-black lg:hidden">
        <div className="shrink-0 space-y-2 px-3 pb-2 pt-[env(safe-area-inset-top)]">{header}</div>
        <div className="relative min-h-0 flex-1">
          <div className={search.view === "map" ? "absolute inset-0" : "pointer-events-none absolute inset-0 invisible"} aria-hidden={search.view !== "map"}>
            {map}
          </div>
          {search.view === "list" ? list : null}
        </div>
        <ViewTogglePill view={search.view} onChange={search.setView} />
      </div>

      <div className="fixed inset-0 hidden pt-[72px] lg:block">
        <div className="absolute inset-0 pt-[72px]">{map}</div>
        <div className="absolute bottom-4 left-4 top-[88px] z-20 flex w-[420px] flex-col overflow-hidden rounded-2xl bg-[rgba(28,28,30,0.92)] shadow-2xl">
          <div className="shrink-0 border-b border-white/10 p-4">{header}</div>
          {list}
        </div>
      </div>

      <CountryPicker open={countryOpen} onClose={() => setCountryOpen(false)} countries={search.countries} selected={search.country} onSelect={search.chooseCountry} />
      <FiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} value={search.filters} unit={search.distanceUnit} resultCount={search.doctors.length} onApply={search.applyFilters} />

      {search.toast && (
        <div className="fixed bottom-24 left-1/2 z-[230] flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-bold text-neuro-navy shadow-lg" role="status">
          <span>{search.toast} · </span>
          <button type="button" onClick={search.undoToast} className="min-h-11 text-neuro-orange">Undo</button>
        </div>
      )}
    </>
  );
}
