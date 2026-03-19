"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BreadcrumbsProps {
  className?: string;
  light?: boolean;
}

export default function Breadcrumbs({ className, light = false }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Don't show on homepage
  if (pathname === "/") return null;

  const pathSegments = pathname.split("/").filter((segment) => segment !== "");
  
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    
    return { label, href, isLast: index === pathSegments.length - 1 };
  });

  return (
    <nav className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", className)}>
      <Link 
        href="/" 
        className={cn(
          "flex items-center gap-1 transition-colors hover:text-neuro-orange",
          light ? "text-white/60" : "text-gray-400"
        )}
      >
        <Home className="w-3 h-3" />
        <span>Home</span>
      </Link>
      
      {breadcrumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-2">
          <ChevronRight className={cn("w-3 h-3", light ? "text-white/20" : "text-gray-300")} />
          {crumb.isLast ? (
            <span className={light ? "text-white" : "text-neuro-navy"}>
              {crumb.label}
            </span>
          ) : (
            <Link 
              href={crumb.href}
              className={cn(
                "transition-colors hover:text-neuro-orange",
                light ? "text-white/60" : "text-gray-400"
              )}
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
