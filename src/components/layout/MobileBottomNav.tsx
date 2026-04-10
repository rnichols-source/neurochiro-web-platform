"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LucideIcon } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  isMenuTrigger?: boolean;
  badge?: number;
}

interface MobileBottomNavProps {
  items: NavItem[];
  onMenuClick?: () => void;
}

export default function MobileBottomNav({ items, onMenuClick }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[150] bg-white border-t border-gray-100 px-2 pb-safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && item.href !== "#" && pathname.startsWith(item.href));
          
          const Content = (
            <div className="flex flex-col items-center justify-center flex-1 h-full gap-1 relative w-full">
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300 relative",
                isActive ? "text-neuro-orange bg-neuro-orange/5" : "text-gray-400"
              )}>
                <item.icon className="w-6 h-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-tighter transition-colors",
                isActive ? "text-neuro-navy" : "text-gray-400"
              )}>
                {item.name}
              </span>
              {isActive && !item.isMenuTrigger && (
                <motion.div 
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 w-8 h-1 bg-neuro-orange rounded-b-full"
                />
              )}
            </div>
          );

          if (item.isMenuTrigger) {
            return (
              <button 
                key={item.name} 
                onClick={onMenuClick}
                className="flex-1 h-full"
              >
                {Content}
              </button>
            );
          }

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex-1 h-full"
            >
              {Content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
