/**
 * Practice Health Score — Practice-level rating (0-100)
 * Pure computation module. No Supabase calls.
 */

export interface PracticeHealthInput {
  profile: {
    hasPhoto: boolean;
    hasBio: boolean;
    hasClinicName: boolean;
    hasSpecialties: boolean;
    hasLocation: boolean;
    hasWebsite: boolean;
    hasSocial: boolean;
    hasVideo: boolean;
  };
  engagement: {
    profileViews: number;
    patientLeads: number;
    confirmedPatients: number;
  };
  community: {
    seminarsHosted: number;
    ceHoursDelivered: number;
    referralsSent: number;
    chiroMatchPositions: number;
  };
  growth: {
    viewsTrend: number; // percentage change vs last period
    leadsThisMonth: number;
    jobsPosted: number;
    reviewCount: number;
  };
}

export interface PracticeHealthBreakdown {
  score: number;
  weight: number;
  label: string;
}

export interface PracticeHealthResult {
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    profileCompleteness: PracticeHealthBreakdown;
    patientEngagement: PracticeHealthBreakdown;
    communityActivity: PracticeHealthBreakdown;
    growthMetrics: PracticeHealthBreakdown;
  };
}

export function computePracticeHealth(input: PracticeHealthInput): PracticeHealthResult {
  // 1. Profile Completeness (25%)
  let profileScore = 0;
  if (input.profile.hasPhoto) profileScore += 15;
  if (input.profile.hasBio) profileScore += 15;
  if (input.profile.hasClinicName) profileScore += 15;
  if (input.profile.hasSpecialties) profileScore += 15;
  if (input.profile.hasLocation) profileScore += 10;
  if (input.profile.hasWebsite) profileScore += 10;
  if (input.profile.hasSocial) profileScore += 10;
  if (input.profile.hasVideo) profileScore += 10;

  // 2. Patient Engagement (25%)
  let engagementScore = 0;
  engagementScore += Math.min(input.engagement.profileViews * 0.5, 30);
  engagementScore += Math.min(input.engagement.patientLeads * 5, 40);
  engagementScore += Math.min(input.engagement.confirmedPatients * 10, 30);

  // 3. Community Activity (25%)
  let communityScore = 0;
  communityScore += Math.min(input.community.seminarsHosted * 20, 30);
  communityScore += Math.min(input.community.ceHoursDelivered * 2, 20);
  communityScore += Math.min(input.community.referralsSent * 5, 25);
  communityScore += Math.min(input.community.chiroMatchPositions * 15, 25);

  // 4. Growth Metrics (25%)
  let growthScore = 0;
  if (input.growth.viewsTrend > 20) growthScore += 30;
  else if (input.growth.viewsTrend > 0) growthScore += 15;
  growthScore += Math.min(input.growth.leadsThisMonth * 8, 30);
  growthScore += Math.min(input.growth.jobsPosted * 10, 20);
  growthScore += Math.min(input.growth.reviewCount * 5, 20);

  const breakdown = {
    profileCompleteness: { score: Math.min(Math.round(profileScore), 100), weight: 25, label: 'Profile' },
    patientEngagement: { score: Math.min(Math.round(engagementScore), 100), weight: 25, label: 'Patients' },
    communityActivity: { score: Math.min(Math.round(communityScore), 100), weight: 25, label: 'Community' },
    growthMetrics: { score: Math.min(Math.round(growthScore), 100), weight: 25, label: 'Growth' },
  };

  const totalScore = Math.round(
    (breakdown.profileCompleteness.score * 0.25) +
    (breakdown.patientEngagement.score * 0.25) +
    (breakdown.communityActivity.score * 0.25) +
    (breakdown.growthMetrics.score * 0.25)
  );

  const grade = totalScore >= 90 ? 'A' : totalScore >= 75 ? 'B' : totalScore >= 60 ? 'C' : totalScore >= 45 ? 'D' : 'F';

  return { totalScore, grade, breakdown };
}
