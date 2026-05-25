"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo, AnimatePresence } from "framer-motion";
import { MapPin, ChevronUp, X } from "lucide-react";
import Link from "next/link";

interface BottomSheetProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  selectedDoctor?: any | null;
  onDismissPreview?: () => void;
  onSnapChange?: (snap: 'peek' | 'half' | 'full') => void;
}

// Snap points as percentage from bottom of viewport
const SNAP_PEEK = 0.14;   // 14% — handle + count + preview peek
const SNAP_HALF = 0.50;   // 50% — half screen, scrollable list
const SNAP_FULL = 0.92;   // 92% — full screen (leave room for status bar)

export default function BottomSheet({ children, header, selectedDoctor, onDismissPreview, onSnapChange }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [windowHeight, setWindowHeight] = useState(0);
  const [currentSnap, setCurrentSnap] = useState<'peek' | 'half' | 'full'>('peek');

  useEffect(() => {
    const update = () => setWindowHeight(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const sheetHeight = useMotionValue(windowHeight * SNAP_PEEK);
  const borderRadius = useTransform(sheetHeight, [windowHeight * SNAP_HALF, windowHeight * SNAP_FULL], [20, 0]);
  const handleOpacity = useTransform(sheetHeight, [windowHeight * SNAP_HALF, windowHeight * SNAP_FULL], [1, 0.3]);
  const backdropOpacity = useTransform(sheetHeight, [windowHeight * SNAP_HALF, windowHeight * SNAP_FULL], [0, 0.15]);

  const snapTo = useCallback((point: 'peek' | 'half' | 'full') => {
    const targets = { peek: SNAP_PEEK, half: SNAP_HALF, full: SNAP_FULL };
    const target = windowHeight * targets[point];
    animate(sheetHeight, target, {
      type: "spring",
      stiffness: 500,
      damping: 45,
      mass: 0.7,
    });
    setCurrentSnap(point);
    onSnapChange?.(point);
  }, [windowHeight, sheetHeight, onSnapChange]);

  // Auto-expand to half when a pin is selected
  useEffect(() => {
    if (selectedDoctor && currentSnap === 'peek') {
      // Don't auto-expand, let preview card show above sheet
    }
  }, [selectedDoctor]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const current = sheetHeight.get();
    const peekH = windowHeight * SNAP_PEEK;
    const halfH = windowHeight * SNAP_HALF;
    const fullH = windowHeight * SNAP_FULL;

    // Fast swipe detection
    if (velocity < -600) {
      if (current < halfH) snapTo('half');
      else snapTo('full');
      return;
    }
    if (velocity > 600) {
      if (current > halfH) snapTo('half');
      else snapTo('peek');
      return;
    }

    // Snap to nearest
    const distances = [
      { point: 'peek' as const, dist: Math.abs(current - peekH) },
      { point: 'half' as const, dist: Math.abs(current - halfH) },
      { point: 'full' as const, dist: Math.abs(current - fullH) },
    ];
    distances.sort((a, b) => a.dist - b.dist);
    snapTo(distances[0].point);
  }, [windowHeight, sheetHeight, snapTo]);

  if (!windowHeight) return null;

  return (
    <>
      {/* Backdrop dim when full */}
      <motion.div
        className="fixed inset-0 bg-black pointer-events-none z-[199] lg:hidden"
        style={{ opacity: backdropOpacity }}
      />

      {/* Floating preview card when pin is selected and sheet is at peek */}
      <AnimatePresence>
        {selectedDoctor && currentSnap === 'peek' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="fixed left-4 right-4 z-[201] lg:hidden"
            style={{ bottom: windowHeight * SNAP_PEEK + 12 }}
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/50 p-4 flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl bg-neuro-navy flex-shrink-0 flex items-center justify-center overflow-hidden">
                {selectedDoctor.photo_url ? (
                  <img src={selectedDoctor.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-lg">
                    {(selectedDoctor.name || 'NC').replace(/^Dr\.\s*/i, '').charAt(0)}
                  </span>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-neuro-navy text-sm truncate">{selectedDoctor.name || 'Doctor'}</p>
                <p className="text-xs text-gray-500 truncate">{selectedDoctor.clinic || 'Private Practice'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-neuro-orange flex-shrink-0" />
                  <span className="text-[11px] text-gray-400 truncate">
                    {[selectedDoctor.city, selectedDoctor.state].filter(Boolean).join(', ') || 'View profile'}
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/directory/${selectedDoctor.slug || selectedDoctor.doctorId}`}
                  className="px-4 py-2 bg-neuro-orange text-white text-xs font-bold rounded-xl"
                >
                  View
                </Link>
                <button
                  onClick={onDismissPreview}
                  className="p-1.5 text-gray-300 hover:text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <motion.div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[200] bg-white flex flex-col will-change-transform lg:hidden"
        style={{
          height: sheetHeight,
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          boxShadow: '0 -4px 30px rgba(0,0,0,0.1)',
        }}
      >
        {/* Drag handle area */}
        <motion.div
          className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.05}
          dragMomentum={false}
          onDrag={(_, info) => {
            const newHeight = sheetHeight.get() - info.delta.y;
            const min = windowHeight * SNAP_PEEK * 0.85;
            const max = windowHeight * SNAP_FULL * 1.01;
            sheetHeight.set(Math.max(min, Math.min(max, newHeight)));
          }}
          onDragEnd={handleDragEnd}
        >
          {/* Handle bar — iOS style */}
          <div className="flex justify-center pt-2 pb-1">
            <motion.div
              className="w-9 h-[5px] rounded-full bg-gray-300/80"
              style={{ opacity: handleOpacity }}
            />
          </div>

          {/* Header content */}
          {header && (
            <div className="px-5 pb-2">
              {header}
            </div>
          )}

          {/* Pull-up hint at peek state */}
          {currentSnap === 'peek' && !selectedDoctor && (
            <div className="flex justify-center pb-1">
              <ChevronUp className="w-4 h-4 text-gray-300 animate-bounce" />
            </div>
          )}
        </motion.div>

        {/* Scrollable list */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-5 pb-safe"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </motion.div>
    </>
  );
}
