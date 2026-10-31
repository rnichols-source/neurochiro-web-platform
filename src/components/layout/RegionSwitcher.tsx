"use client";

import { useState, useRef, useEffect } from "react";
import { useRegion } from "@/context/RegionContext";
import { REGIONS, RegionCode } from "@/lib/regions";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RegionSwitcher({
  labeled = false,
  tone = "dark",
  compact = false,
}: {
  labeled?: boolean;
  tone?: "dark" | "light";
  /** In-field chip. Menu opens downward so it stays attached to the input. */
  compact?: boolean;
}) {
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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const light = tone === "light" || compact;
  const triggerClass = compact
    ? "flex h-11 min-w-11 items-center justify-center gap-0.5 rounded-xl px-2 text-neuro-navy"
    : light
      ? "flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-neuro-navy"
      : "flex min-h-11 items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all text-white text-sm font-bold shadow-lg backdrop-blur-md";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={labeled ? undefined : `Country: ${region.label}`}
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClass}
      >
        <span className="text-lg leading-none">{region.flag}</span>
        {labeled ? (
          <span className="text-sm font-bold">{region.label}</span>
        ) : compact ? null : (
          <span className="hidden sm:inline uppercase tracking-widest text-[10px]">{region.code}</span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            role="listbox"
            aria-label="Select region"
            className={`absolute right-0 z-[200] mt-2 max-h-[70vh] w-56 overflow-y-auto rounded-2xl border border-white/10 bg-neuro-navy p-2 shadow-2xl ${
              compact ? "" : "max-lg:bottom-full max-lg:top-auto max-lg:mb-2 max-lg:mt-0"
            }`}
          >
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Select Region</p>
            </div>
            {Object.values(REGIONS).map((r) => (
              <button
                key={r.code}
                type="button"
                role="option"
                aria-selected={region.code === r.code}
                onClick={() => {
                  setRegion(r.code as RegionCode);
                  setIsOpen(false);
                }}
                className={`w-full flex min-h-11 items-center justify-between p-3 rounded-xl transition-all ${
                  region.code === r.code
                    ? "bg-neuro-orange-ink text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl leading-none">{r.flag}</span>
                  <span className="text-xs font-bold">{r.label}</span>
                </div>
                {region.code === r.code && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            ))}

            <div className="mt-2 pt-2 border-t border-white/5 px-3 py-2">
              <p className="text-xs text-gray-300 font-medium leading-tight">
                Data, pricing, and currency will update automatically.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
