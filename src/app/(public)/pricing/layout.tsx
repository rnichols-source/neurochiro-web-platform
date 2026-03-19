"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: "Patients", href: "/pricing/patients" },
    { name: "Students", href: "/pricing/students" },
    { name: "Doctors", href: "/pricing/doctors" },
  ];

  return (
    <div className="min-h-screen bg-neuro-cream pt-32 pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Unified Pricing Header */}
        <div className="text-center mb-16 space-y-4">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-xs">Membership Tiers</span>
          <h1 className="text-5xl md:text-7xl font-heading font-black text-neuro-navy">Invest in your <span className="text-neuro-orange">Evolution.</span></h1>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium">
            Choose the path that fits your clinical or personal journey.
          </p>
        </div>

        {/* Role Sub-Navigation (Tabs) */}
        <div className="flex justify-center mb-16">
          <div className="bg-white p-1.5 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href || (pathname === "/pricing" && tab.name === "Doctors");
              return (
                <Link 
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "px-8 py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-widest",
                    isActive ? "bg-neuro-navy text-white shadow-lg" : "text-gray-400 hover:text-neuro-navy"
                  )}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
