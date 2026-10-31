"use client";

import dynamic from "next/dynamic";

const GlobalNetworkMap = dynamic(() => import("@/components/map/GlobalNetworkMap"), { ssr: false });

export function SeminarMap() {
  return <GlobalNetworkMap defaultLayer="seminar" />;
}
