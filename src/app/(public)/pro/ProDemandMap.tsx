"use client";

import { useRef, useEffect } from "react";
import type { MapDoctor, MapDemandCity } from "./actions";

export default function ProDemandMap({ doctors, demandCities }: { doctors: MapDoctor[]; demandCities: MapDemandCity[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
    script.onload = () => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(link);

      const maplibregl = (window as any).maplibregl;
      const map = new maplibregl.Map({
        container: mapRef.current!,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [-96, 38],
        zoom: 3.5,
        attributionControl: false,
        interactive: true,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.scrollZoom.disable();

      map.on("load", () => {
        mapInstanceRef.current = map;

        // Doctor dots (clustered, orange)
        map.addSource("doctors", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: doctors.map((d) => ({
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [d.lng, d.lat] },
              properties: {},
            })),
          },
          cluster: true,
          clusterMaxZoom: 12,
          clusterRadius: 30,
        });

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

        // Demand dots (cyan, sized by count)
        map.addSource("demand", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: demandCities.map((d) => ({
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [d.lng, d.lat] },
              properties: { city: d.city, state: d.state, count: d.count },
            })),
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

        // Click: demand dot popup
        map.on("click", "demand-dots", (e: any) => {
          if (!e.features?.length) return;
          const p = e.features[0].properties;
          const coords = e.features[0].geometry.coordinates.slice();
          new maplibregl.Popup({ offset: 10, maxWidth: "200px", closeButton: true, focusAfterOpen: false })
            .setLngLat(coords)
            .setHTML(`<div style="padding:8px;font-family:-apple-system,system-ui,sans-serif;"><div style="font-size:14px;font-weight:700;color:#1E2D3B;">${p.city}, ${p.state}</div><div style="font-size:12px;color:#06b6d4;margin-top:4px;">${p.count} ${p.count === 1 ? 'person' : 'people'} looking</div></div>`)
            .addTo(map);
        });

        // Click: doctor dot popup
        map.on("click", "doctor-dots", (e: any) => {
          if (!e.features?.length) return;
          const coords = e.features[0].geometry.coordinates.slice();
          new maplibregl.Popup({ offset: 10, maxWidth: "200px", closeButton: true, focusAfterOpen: false })
            .setLngLat(coords)
            .setHTML(`<div style="padding:8px;font-family:-apple-system,system-ui,sans-serif;"><div style="font-size:13px;font-weight:700;color:#D66829;">NeuroChiro member</div><div style="font-size:12px;color:#666;margin-top:4px;"><a href="/directory" style="color:#D66829;">Browse the directory</a></div></div>`)
            .addTo(map);
        });

        // Cluster expand
        map.on("click", "doctor-clusters", (e: any) => {
          const f = map.queryRenderedFeatures(e.point, { layers: ["doctor-clusters"] });
          if (!f.length) return;
          map.getSource("doctors").getClusterExpansionZoom(f[0].properties.cluster_id, (_: any, z: number) => {
            if (!_) map.easeTo({ center: f[0].geometry.coordinates, zoom: z });
          });
        });

        // Cursors
        ["doctor-dots", "doctor-clusters", "demand-dots"].forEach((l) => {
          map.on("mouseenter", l, () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", l, () => { map.getCanvas().style.cursor = ""; });
        });
      });
    };

    document.head.appendChild(script);
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []);

  return (
    <div style={{ background: "#0D161D", padding: "0 0 16px" }}>
      <div ref={mapRef} style={{ width: "100%", height: "min(380px, 55vh)", borderRadius: 0 }} />
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
