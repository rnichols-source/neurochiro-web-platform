"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";

interface BottomSheetProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  onSnapChange?: (snap: 'peek' | 'half' | 'full') => void;
}

// Apple Maps snap points
const SNAP_PEEK = 0.15;   // 15% — just the handle + search bar
const SNAP_HALF = 0.45;   // 45% — search + results
const SNAP_FULL = 0.93;   // 93% — full screen

export default function BottomSheet({ children, header, onSnapChange }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [windowHeight, setWindowHeight] = useState(0);
  const [currentSnap, setCurrentSnap] = useState<'peek' | 'half' | 'full'>('half');

  useEffect(() => {
    const update = () => setWindowHeight(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const sheetHeight = useMotionValue(0);
  const borderRadius = useTransform(sheetHeight, [windowHeight * SNAP_HALF, windowHeight * SNAP_FULL], [14, 0]);

  // Set initial height once windowHeight is known
  useEffect(() => {
    if (windowHeight > 0) {
      sheetHeight.set(windowHeight * SNAP_HALF);
    }
  }, [windowHeight]);

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
    onSnapChange?.(point);
  }, [windowHeight, sheetHeight, onSnapChange]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const current = sheetHeight.get();
    const peekH = windowHeight * SNAP_PEEK;
    const halfH = windowHeight * SNAP_HALF;
    const fullH = windowHeight * SNAP_FULL;

    if (velocity < -500) {
      if (current < halfH) snapTo('half');
      else snapTo('full');
      return;
    }
    if (velocity > 500) {
      if (current > halfH) snapTo('half');
      else snapTo('peek');
      return;
    }

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
      className="fixed bottom-0 left-0 right-0 z-[200] flex flex-col will-change-transform lg:hidden"
      style={{
        height: sheetHeight,
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
        background: 'rgba(28, 28, 30, 0.88)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: '0 -2px 40px rgba(0,0,0,0.3)',
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
        {/* Handle bar — Apple Maps style */}
        <div className="flex justify-center pt-[10px] pb-[6px]">
          <div className="w-[36px] h-[5px] rounded-full bg-white/30" />
        </div>

        {/* Header content (search, pills, etc.) */}
        {header && (
          <div className="px-4 pb-2">
            {header}
          </div>
        )}
      </motion.div>

      {/* Scrollable list */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </motion.div>
  );
}
