"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";

interface BottomSheetProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  selectedDoctor?: any | null;
  onDismissPreview?: () => void;
  onSnapChange?: (snap: 'peek' | 'half' | 'full') => void;
}

// Snap points as percentage from bottom of viewport
const SNAP_PEEK = 0.18;   // 18% — handle + search bar peek
const SNAP_HALF = 0.48;   // 48% — half screen, search + list visible
const SNAP_FULL = 0.94;   // 94% — full screen

export default function BottomSheet({ children, header, selectedDoctor, onDismissPreview, onSnapChange }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [windowHeight, setWindowHeight] = useState(0);
  const [currentSnap, setCurrentSnap] = useState<'peek' | 'half' | 'full'>('half');

  useEffect(() => {
    const update = () => setWindowHeight(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const sheetHeight = useMotionValue(windowHeight * SNAP_HALF);
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
