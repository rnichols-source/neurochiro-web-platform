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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[150] bg-[#0F1A24] border-t border-white/[0.06] px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && item.href !== "#" && pathname.startsWith(item.href));
          
          const Content = (
            <div className="flex flex-col items-center justify-center flex-1 h-full gap-1 relative w-full">
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300 relative",
                isActive ? "text-[#D66829] bg-[#D66829]/10" : "text-white/40"
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
                isActive ? "text-white" : "text-white/40"
              )}>
                {item.name}
              </span>
              {isActive && !item.isMenuTrigger && (
                <motion.div 
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 w-8 h-1 bg-[#D66829] rounded-b-full"
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
