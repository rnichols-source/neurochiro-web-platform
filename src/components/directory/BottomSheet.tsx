"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";

interface BottomSheetProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

// Snap points as percentage from bottom of viewport
const SNAP_PEEK = 0.12;   // 12% — just the handle + count
const SNAP_HALF = 0.45;   // 45% — half screen
const SNAP_FULL = 0.92;   // 92% — full screen (leave room for status bar)

export default function BottomSheet({ children, header }: BottomSheetProps) {
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

  const snapTo = useCallback((point: 'peek' | 'half' | 'full') => {
    const targets = { peek: SNAP_PEEK, half: SNAP_HALF, full: SNAP_FULL };
    const target = windowHeight * targets[point];
    animate(sheetHeight, target, {
      type: "spring",
      stiffness: 400,
      damping: 40,
      mass: 0.8,
    });
    setCurrentSnap(point);
  }, [windowHeight, sheetHeight]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const current = sheetHeight.get();
    const peekH = windowHeight * SNAP_PEEK;
    const halfH = windowHeight * SNAP_HALF;
    const fullH = windowHeight * SNAP_FULL;

    // Fast swipe detection
    if (velocity < -500) {
      // Swiping up fast
      if (current < halfH) snapTo('half');
      else snapTo('full');
      return;
    }
    if (velocity > 500) {
      // Swiping down fast
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
    <motion.div
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 z-[200] bg-white shadow-[0_-4px_30px_rgba(0,0,0,0.12)] flex flex-col will-change-transform lg:hidden"
      style={{
        height: sheetHeight,
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
      }}
    >
      {/* Drag handle area */}
      <motion.div
        className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDrag={(_, info) => {
          const newHeight = sheetHeight.get() - info.delta.y;
          const min = windowHeight * SNAP_PEEK * 0.8;
          const max = windowHeight * SNAP_FULL * 1.02;
          sheetHeight.set(Math.max(min, Math.min(max, newHeight)));
        }}
        onDragEnd={handleDragEnd}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2.5 pb-1">
          <motion.div
            className="w-10 h-[5px] rounded-full bg-gray-300"
            style={{ opacity: handleOpacity }}
          />
        </div>

        {/* Header content (count, search summary) */}
        {header && (
          <div className="px-5 pb-3">
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
  );
}
