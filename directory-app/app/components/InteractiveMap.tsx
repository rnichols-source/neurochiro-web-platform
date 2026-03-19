'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

const CUSTOM_PIN_SVG = `
  <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 40 15 40C15 40 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#00b09b"/>
    <circle cx="15" cy="14" r="5" fill="white"/>
  </svg>
`;

export default function InteractiveMap({ doctors, onFlyTo }: { doctors: any; onFlyTo: any }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Clean, professional light style
      center: [-98.5795, 39.8283], // US Center
      zoom: 3,
    });

    // Add markers
    doctors.forEach((doctor) => {
      const el = document.createElement('div');
      el.innerHTML = CUSTOM_PIN_SVG;
      new mapboxgl.Marker(el)
        .setLngLat([doctor.lng, doctor.lat])
        .addTo(map.current);
    });
  }, [doctors]);

  // Expose flyTo function
  useEffect(() => {
    if (onFlyTo) {
      onFlyTo((lng, lat) => {
        map.current.flyTo({
          center: [lng, lat],
          zoom: 14,
          essential: true,
        });
      });
    }
  }, [onFlyTo]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
