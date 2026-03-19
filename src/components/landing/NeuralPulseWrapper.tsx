"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const DynamicNeuralPulse = dynamic(() => import("./NeuralPulse"), {
  loading: () => <div className="h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>,
  ssr: false
});

export default function NeuralPulseWrapper() {
  return <DynamicNeuralPulse />;
}
