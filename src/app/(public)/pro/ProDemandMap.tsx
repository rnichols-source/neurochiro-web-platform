"use client";

import { useRef, useEffect } from "react";
import type { MapDoctor, MapDemandCity } from "./actions";

// Default views per country — used when no data or single pin
const COUNTRY_VIEWS: Record<string, { center: [number, number]; zoom: number }> = {
  US: { center: [-96, 38], zoom: 3.5 },
  CA: { center: [-96, 56], zoom: 3.2 },
  GB: { center: [-2, 54], zoom: 5.2 },
  NZ: { center: [172, -41], zoom: 5 },
  AU: { center: [134, -26], zoom: 3.8 },
};

const COUNTRY_LABELS: Record<string, string> = {
  US: "the United States",
  CA: "Canada",
  GB: "the United Kingdom",
  NZ: "New Zealand",
  AU: "Australia",
};

function fitBoundsForData(
  map: any,
  maplibregl: any,
  doctors: MapDoctor[],
  demandCities: MapDemandCity[],
  country: string
) {
  const allPoints = [
    ...doctors.map((d) => [d.lng, d.lat]),
    ...demandCities.map((d) => [d.lng, d.lat]),
  ];

  const view = COUNTRY_VIEWS[country] || COUNTRY_VIEWS.US;

  if (allPoints.length === 0) {
    // No data at all — show the whole country
    map.easeTo({ center: view.center, zoom: view.zoom, duration: 600 });
    return;
  }

  if (allPoints.length === 1) {
    // Single pin — centre on it at a reasonable country zoom, not street level
    const singleZoom = Math.min(view.zoom + 2, 8);
    map.easeTo({ center: allPoints[0], zoom: singleZoom, duration: 600 });
    return;
  }

  // Multiple points — fit bounds with padding
  const bounds = new maplibregl.LngLatBounds(allPoints[0], allPoints[0]);
  for (const p of allPoints) bounds.extend(p);

  map.fitBounds(bounds, {
    padding: { top: 40, bottom: 40, left: 40, right: 40 },
    maxZoom: 10,
    duration: 600,
  });
}

export default function ProDemandMap({
  doctors,
  demandCities,
  country,
}: {
  doctors: MapDoctor[];
  demandCities: MapDemandCity[];
  country: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const maplibreRef = useRef<any>(null);
  const loadedRef = useRef(false);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || loadedRef.current) return;
    loadedRef.current = true;

    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
    script.onload = () => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(link);

      const maplibregl = (window as any).maplibregl;
      maplibreRef.current = maplibregl;

      const view = COUNTRY_VIEWS[country] || COUNTRY_VIEWS.US;
      const map = new maplibregl.Map({
        container: mapRef.current!,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: view.center,
        zoom: view.zoom,
        attributionControl: false,
        interactive: true,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.scrollZoom.disable();

      map.on("load", () => {
        mapInstanceRef.current = map;
        updateMapData(map, maplibregl, doctors, demandCities, country);
      });
    };

    document.head.appendChild(script);
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  // Update data and viewport when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl) return;
    updateMapData(map, maplibregl, doctors, demandCities, country);
  }, [doctors, demandCities, country]);

  const hasData = doctors.length > 0 || demandCities.length > 0;

  return (
    <div style={{ background: "#0D161D", padding: "0 0 16px", position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: "min(380px, 55vh)", borderRadius: 0 }} />

      {/* Zero-data overlay — shown on the map itself, not below it */}
      {!hasData && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "min(380px, 55vh)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(13, 22, 29, 0.85)",
              borderRadius: 10,
              padding: "24px 28px",
              maxWidth: 420,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "Archivo, sans-serif",
                fontSize: 15,
                color: "#93A0AC",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              I haven&rsquo;t had anyone ask me for a chiropractor in{" "}
              {COUNTRY_LABELS[country] || "this country"} yet. Most of my audience
              is in the US, and that&rsquo;s where the requests come from today.
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 660, margin: "12px auto 0", padding: "0 22px", display: "flex", gap: 20, justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "#93A0AC", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#D66829", display: "inline-block" }} />
          Member
        </span>
        <span style={{ fontSize: 12, color: "#93A0AC", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#06b6d4", display: "inline-block" }} />
          Patient demand
        </span>
      </div>
    </div>
  );
}

function updateMapData(
  map: any,
  maplibregl: any,
  doctors: MapDoctor[],
  demandCities: MapDemandCity[],
  country: string
) {
  // Close any open popups
  const popups = document.querySelectorAll(".maplibregl-popup");
  popups.forEach((p) => p.remove());

  const doctorGeoJSON = {
    type: "FeatureCollection",
    features: doctors.map((d) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [d.lng, d.lat] },
      properties: {},
    })),
  };

  const demandGeoJSON = {
    type: "FeatureCollection",
    features: demandCities.map((d) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [d.lng, d.lat] },
      properties: { city: d.city, state: d.state, count: d.count },
    })),
  };

  const firstLoad = !map.getSource("doctors");

  // Update or create sources
  if (map.getSource("doctors")) {
    map.getSource("doctors").setData(doctorGeoJSON);
  } else {
    map.addSource("doctors", {
      type: "geojson",
      data: doctorGeoJSON,
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 30,
    });
  }

  if (map.getSource("demand")) {
    map.getSource("demand").setData(demandGeoJSON);
  } else {
    map.addSource("demand", { type: "geojson", data: demandGeoJSON });
  }

  // Add layers and event handlers on first load only
  if (firstLoad) {
    map.addLayer({
      id: "doctor-clusters",
      type: "circle",
      source: "doctors",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#D66829",
        "circle-radius": ["step", ["get", "point_count"], 12, 5, 16, 15, 22],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
      },
    });

    map.addLayer({
      id: "doctor-cluster-count",
      type: "symbol",
      source: "doctors",
      filter: ["has", "point_count"],
      layout: { "text-field": "{point_count_abbreviated}", "text-size": 12, "text-font": ["Open Sans Bold"] },
      paint: { "text-color": "#fff" },
    });

    map.addLayer({
      id: "doctor-dots",
      type: "circle",
      source: "doctors",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#D66829",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 4, 8, 6, 14, 9],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
      },
    });

    map.addLayer({
      id: "demand-dots",
      type: "circle",
      source: "demand",
      paint: {
        "circle-color": "#06b6d4",
        "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 6, 3, 9, 10, 14, 20, 20],
        "circle-opacity": 0.7,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
      },
    });

    // Popups
    map.on("click", "demand-dots", (e: any) => {
      if (!e.features?.length) return;
      const p = e.features[0].properties;
      const coords = e.features[0].geometry.coordinates.slice();
      new maplibregl.Popup({ offset: 10, maxWidth: "200px", closeButton: true, focusAfterOpen: false })
        .setLngLat(coords)
        .setHTML(`<div style="padding:8px;font-family:-apple-system,system-ui,sans-serif;"><div style="font-size:14px;font-weight:700;color:#1E2D3B;">${p.city}, ${p.state}</div><div style="font-size:12px;color:#06b6d4;margin-top:4px;">${p.count} ${p.count === 1 ? "person" : "people"} looking</div></div>`)
        .addTo(map);
    });

    map.on("click", "doctor-dots", (e: any) => {
      if (!e.features?.length) return;
      const coords = e.features[0].geometry.coordinates.slice();
      new maplibregl.Popup({ offset: 10, maxWidth: "200px", closeButton: true, focusAfterOpen: false })
        .setLngLat(coords)
        .setHTML(`<div style="padding:8px;font-family:-apple-system,system-ui,sans-serif;"><div style="font-size:13px;font-weight:700;color:#D66829;">NeuroChiro member</div><div style="font-size:12px;color:#666;margin-top:4px;"><a href="/directory" style="color:#D66829;">Browse the directory</a></div></div>`)
        .addTo(map);
    });

    map.on("click", "doctor-clusters", (e: any) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ["doctor-clusters"] });
      if (!f.length) return;
      map.getSource("doctors").getClusterExpansionZoom(f[0].properties.cluster_id, (_: any, z: number) => {
        if (!_) map.easeTo({ center: f[0].geometry.coordinates, zoom: z });
      });
    });

    ["doctor-dots", "doctor-clusters", "demand-dots"].forEach((l) => {
      map.on("mouseenter", l, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", l, () => { map.getCanvas().style.cursor = ""; });
    });
  }

  // Recentre to fit the data
  fitBoundsForData(map, maplibregl, doctors, demandCities, country);
}
