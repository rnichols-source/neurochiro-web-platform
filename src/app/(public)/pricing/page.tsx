"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();

  useEffect(() => {
    // Default to doctor pricing as the primary entry point
    router.replace("/pricing/doctors");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-32">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neuro-orange"></div>
    </div>
  );
}
