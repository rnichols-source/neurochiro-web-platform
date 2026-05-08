/**
 * Practice Milestone Badges — Gamification for doctors
 */

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'profile' | 'patients' | 'community' | 'growth';
  color: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'profile_complete', name: 'Profile Complete', description: 'Complete your profile to 100%', icon: 'User', category: 'profile', color: 'blue' },
  { id: 'first_100_views', name: 'First 100 Views', description: 'Reach 100 profile views', icon: 'Eye', category: 'growth', color: 'emerald' },
  { id: 'lead_magnet', name: 'Lead Magnet', description: 'Generate 10+ patient leads', icon: 'Users', category: 'patients', color: 'violet' },
  { id: 'seminar_host', name: 'Seminar Host', description: 'Host your first seminar', icon: 'Calendar', category: 'community', color: 'orange' },
  { id: 'hiring_pro', name: 'Hiring Pro', description: 'Post 3+ job listings', icon: 'Briefcase', category: 'growth', color: 'blue' },
  { id: 'ce_champion', name: 'CE Champion', description: 'Earn 20+ CE hours', icon: 'Award', category: 'community', color: 'emerald' },
  { id: 'chiromatch_participant', name: 'ChiroMatch Pioneer', description: 'Participate in a ChiroMatch cycle', icon: 'Shuffle', category: 'community', color: 'violet' },
  { id: 'top_10', name: 'Top 10', description: 'Rank in the top 10 in your city', icon: 'Trophy', category: 'growth', color: 'orange' },
  { id: 'review_star', name: 'Review Star', description: 'Average seminar rating of 4.5+', icon: 'Star', category: 'community', color: 'amber' },
  { id: 'community_builder', name: 'Community Builder', description: 'Send 5+ referrals', icon: 'Gift', category: 'growth', color: 'emerald' },
];

export function getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(b => b.id === badgeId);
}
