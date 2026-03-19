'use client';

import { useState, useRef, useCallback } from 'react';
import DoctorCard from '../components/DoctorCard';
import InteractiveMap from '../components/InteractiveMap';

const MOCK_DOCTORS = [
  { id: 1, name: "Dr. Elena Rivers", specialty: "Neuro-Structural", bio: "Advanced spinal cord neurology.", lat: 34.0522, lng: -118.2437 },
  { id: 2, name: "Dr. Marcus Thorne", specialty: "Pediatric Neurology", bio: "Expert in neuro-developmental.", lat: 40.7128, lng: -74.0060 },
  { id: 3, name: "Dr. Sarah Chen", specialty: "Trauma & Recovery", bio: "Specialized recovery protocols.", lat: 41.8781, lng: -87.6298 }
];

export default function SearchPage() {
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const flyToMap = useRef<((lng: number, lat: number) => void) | null>(null);

  const handleCardClick = (doctor: any) => {
    setSelectedDoctorId(doctor.id);
    if (flyToMap.current && doctor.lng && doctor.lat) {
      flyToMap.current(doctor.lng, doctor.lat);
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-64px)]">
      <div className="w-[400px] overflow-y-auto p-6 bg-gray-50 border-r border-gray-200">
        <h1 className="text-2xl font-bold mb-6">Find Your Doctor</h1>
        <div className="space-y-4">
          {MOCK_DOCTORS.map((doctor) => (
            <div 
              key={doctor.id} 
              onMouseEnter={() => {/* Logic to highlight pin on hover */}}
              onClick={() => handleCardClick(doctor)}
            >
              <DoctorCard doctor={doctor} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 relative">
        <InteractiveMap 
          doctors={MOCK_DOCTORS} 
          onFlyTo={(fn: (lng: number, lat: number) => void) => { flyToMap.current = fn }} 
        />
        {/* "Search in this area" button overlay */}
        <button className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg font-medium text-[#004a99] z-10 hover:shadow-xl transition-shadow">
          Search in this area
        </button>
      </div>
    </div>
  );
}
