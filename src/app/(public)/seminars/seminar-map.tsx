"use client";

import dynamic from "next/dynamic";
import type { SeminarMapPin } from "@/lib/seminars/map-pins";

const GlobalNetworkMap = dynamic(() => import("@/components/map/GlobalNetworkMap"), { ssr: false });

export function SeminarMap({ pins }: { pins: SeminarMapPin[] }) {
  return <GlobalNetworkMap defaultLayer="seminar" seminarPins={pins} />;
}
