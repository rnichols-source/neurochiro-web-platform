import { User, Eye, Users, Calendar, Briefcase, Award, Shuffle, Trophy, Star, Gift } from "lucide-react";
import { BADGE_DEFINITIONS } from "@/lib/badges";

const ICON_MAP: Record<string, any> = { User, Eye, Users, Calendar, Briefcase, Award, Shuffle, Trophy, Star, Gift };

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-50 text-blue-500 border-blue-200",
  emerald: "bg-emerald-50 text-emerald-500 border-emerald-200",
  violet: "bg-violet-50 text-violet-500 border-violet-200",
  orange: "bg-orange-50 text-orange-500 border-orange-200",
  amber: "bg-amber-50 text-amber-500 border-amber-200",
};

export default function PublicBadges({ badgeIds }: { badgeIds: string[] }) {
  if (!badgeIds.length) return null;

  const earnedBadges = BADGE_DEFINITIONS.filter((badge) => badgeIds.includes(badge.id));
  if (!earnedBadges.length) return null;

  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-gray-500 mb-2">Achievements</p>
      <div className="flex flex-wrap gap-2">
        {earnedBadges.map((badge) => {
          const Icon = ICON_MAP[badge.icon] || Award;
          const colors = COLOR_MAP[badge.color] || COLOR_MAP.blue;
          return (
            <div
              key={badge.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${colors}`}
              title={badge.description}
            >
              <Icon className="w-3.5 h-3.5" />
              {badge.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
