"use client";

import { useState, useRef, useEffect } from "react";
import { useRegion } from "@/context/RegionContext";
import { REGIONS, RegionCode } from "@/lib/regions";
import { ChevronDown, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RegionSwitcher() {
  const { region, setRegion } = useRegion();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all text-white text-sm font-bold shadow-lg backdrop-blur-md"
      >
        <span className="text-lg leading-none">{region.flag}</span>
        <span className="hidden sm:inline uppercase tracking-widest text-[10px]">{region.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-56 bg-neuro-navy border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200] p-2"
          >
            <div className="px-3 py-2 mb-1">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Select Region</p>
            </div>
            {Object.values(REGIONS).map((r) => (
              <button
                key={r.code}
                onClick={() => {
                  setRegion(r.code as RegionCode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  region.code === r.code 
                    ? "bg-neuro-orange text-white" 
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl leading-none">{r.flag}</span>
                  <span className="text-xs font-bold">{r.label}</span>
                </div>
                {region.code === r.code && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full shadow-glow" />
                )}
              </button>
            ))}
            
            <div className="mt-2 pt-2 border-t border-white/5 px-3 py-2">
              <p className="text-[8px] text-gray-500 font-medium leading-tight">
                Data, pricing, and currency will update automatically.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
