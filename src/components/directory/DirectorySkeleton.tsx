"use client";

import { MapPin, Search, Filter } from "lucide-react";

export default function DirectorySkeleton() {
  return (
    <div className="min-h-screen bg-neuro-cream">
      {/* Search Header Skeleton */}
      <div className="bg-neuro-navy pt-32 pb-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-14 bg-white/10 rounded-2xl animate-pulse" />
          <div className="w-full md:w-64 h-14 bg-white/10 rounded-2xl animate-pulse" />
          <div className="w-full md:w-32 h-14 bg-neuro-orange/20 rounded-2xl animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Results Column Skeleton */}
        <div className="lg:col-span-7 space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
          
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex gap-6">
              <div className="w-24 h-24 rounded-[2rem] bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-6 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-50 rounded animate-pulse" />
                <div className="flex gap-2 pt-2">
                  <div className="h-4 w-20 bg-gray-50 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-50 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map Column Skeleton */}
        <div className="lg:col-span-5 h-[600px] sticky top-32 rounded-[2.5rem] bg-gray-100 animate-pulse overflow-hidden flex items-center justify-center">
          <p className="text-gray-300 font-black uppercase tracking-widest text-xs">Syncing Global Nodes...</p>
        </div>
      </div>
    </div>
  );
}
