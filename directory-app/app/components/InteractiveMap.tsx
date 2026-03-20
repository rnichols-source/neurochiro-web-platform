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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283],
      zoom: 3,
    });

    map.current.on('style.load', () => {
      map.current!.addSource('doctors', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      map.current!.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'doctors',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#00b09b', 10, '#00b09b', 30, '#00b09b'],
          'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 30, 25]
        }
      });

      map.current!.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'doctors',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: { 'text-color': '#ffffff' }
      });

      map.current!.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'doctors',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#00b09b',
          'circle-radius': 6,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!map.current || !map.current.getSource('doctors')) return;

    const geojson = {
      type: 'FeatureCollection',
      features: doctors.map((doctor: any) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [doctor.lng, doctor.lat]
        },
        properties: { id: doctor.id }
      }))
    };

    (map.current.getSource('doctors') as mapboxgl.GeoJSONSource).setData(geojson as any);
  }, [doctors]);

  // Expose flyTo function
  useEffect(() => {
    if (onFlyTo) {
      onFlyTo((lng: any, lat: any) => {
        map.current!.flyTo({
          center: [lng, lat],
          zoom: 14,
          essential: true,
        });
      });
    }
  }, [onFlyTo]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
