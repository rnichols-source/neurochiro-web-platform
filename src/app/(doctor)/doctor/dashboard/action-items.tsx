"use client";

import Link from "next/link";
import { Bell, Users, Video, User, CheckCircle2 } from "lucide-react";

const ICON_MAP: Record<string, any> = { Bell, Users, Video, User };

interface ActionItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  href: string;
  icon: string;
}

const PRIORITY_STYLES = {
  high: "border-red-500/20 bg-red-500/5",
  medium: "border-neuro-orange/20 bg-neuro-orange/5",
  low: "border-white/[0.06] bg-white/[0.02]",
};

export default function ActionItems({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-5 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-400" />
        <p className="text-sm text-white/50">You&apos;re all caught up! No actions needed.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => {
        const Icon = ICON_MAP[item.icon] || Bell;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`rounded-xl border p-4 transition-all hover:border-neuro-orange/30 group ${PRIORITY_STYLES[item.priority]}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-neuro-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white group-hover:text-neuro-orange transition-colors">{item.title}</p>
                <p className="text-xs text-white/30 mt-0.5">{item.description}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
