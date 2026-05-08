/**
 * ChiroScore — Universal Candidate Rating (0-100)
 * Pure computation module. No Supabase calls.
 */

export interface ChiroScoreInput {
  profile: {
    fullName: string | null;
    school: string | null;
    graduationYear: number | null;
    locationCity: string | null;
    interests: string[] | null;
    skills: string[] | null;
    resumeUrl: string | null;
    avatarUrl: string | null;
  };
  certifications: { count: number; verifiedCount: number };
  academy: { completedModules: number; totalModules: number };
  career: {
    hasFinancialPlan: boolean;
    hasContract: boolean;
    interviewPrepModules: number;
  };
  community: {
    seminarsAttended: number;
  };
  jobMarket: {
    applicationsSubmitted: number;
    interviewsReached: number;
  };
  employerRatings: {
    avgRating: number; // 0-5
    count: number;
  };
}

export interface ChiroScoreBreakdown {
  score: number; // 0-100 raw score for this category
  weight: number; // 0-1
  label: string;
  href: string; // link to improve
}

export interface ChiroScoreResult {
  totalScore: number; // 0-100
  breakdown: Record<string, ChiroScoreBreakdown>;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  topRecommendation: { category: string; label: string; href: string } | null;
}

export function computeChiroScore(input: ChiroScoreInput): ChiroScoreResult {
  const breakdown: Record<string, ChiroScoreBreakdown> = {};

  // 1. Profile Strength (15%)
  let profileScore = 0;
  if (input.profile.fullName) profileScore += 15;
  if (input.profile.school) profileScore += 15;
  if (input.profile.graduationYear) profileScore += 10;
  if (input.profile.locationCity) profileScore += 15;
  if (input.profile.interests && input.profile.interests.length > 0) profileScore += 15;
  if (input.profile.skills && input.profile.skills.length > 0) profileScore += 10;
  if (input.profile.resumeUrl) profileScore += 10;
  if (input.profile.avatarUrl) profileScore += 10;
  breakdown.profile = { score: profileScore, weight: 0.15, label: 'Profile Strength', href: '/student/profile' };

  // 2. Education & Certifications (20%)
  let eduScore = 0;
  if (input.profile.school) eduScore += 30;
  if (input.profile.graduationYear) eduScore += 10;
  // Certifications: each cert adds points, verified adds more
  const certPoints = Math.min(input.certifications.count * 10, 40);
  const verifiedBonus = Math.min(input.certifications.verifiedCount * 5, 20);
  eduScore += certPoints + verifiedBonus;
  eduScore = Math.min(eduScore, 100);
  breakdown.education = { score: eduScore, weight: 0.20, label: 'Education & Certs', href: '/student/techniques' };

  // 3. Academy Progress (15%)
  const academyScore = input.academy.totalModules > 0
    ? Math.round((input.academy.completedModules / input.academy.totalModules) * 100)
    : 0;
  breakdown.academy = { score: Math.min(academyScore, 100), weight: 0.15, label: 'Academy Progress', href: '/student/academy' };

  // 4. Career Readiness (15%)
  let careerScore = 0;
  if (input.career.hasFinancialPlan) careerScore += 30;
  if (input.career.hasContract) careerScore += 30;
  if (input.career.interviewPrepModules >= 10) careerScore += 40;
  else if (input.career.interviewPrepModules >= 5) careerScore += 25;
  else if (input.career.interviewPrepModules > 0) careerScore += 10;
  breakdown.career = { score: Math.min(careerScore, 100), weight: 0.15, label: 'Career Readiness', href: '/student/contract-lab' };

  // 5. Community Engagement (15%)
  let communityScore = 0;
  if (input.community.seminarsAttended >= 5) communityScore = 100;
  else if (input.community.seminarsAttended >= 3) communityScore = 75;
  else if (input.community.seminarsAttended >= 1) communityScore = 40;
  breakdown.community = { score: communityScore, weight: 0.15, label: 'Community', href: '/student/seminars' };

  // 6. Job Market Activity (10%)
  let jobScore = 0;
  const appPoints = Math.min(input.jobMarket.applicationsSubmitted * 15, 60);
  const interviewPoints = Math.min(input.jobMarket.interviewsReached * 20, 40);
  jobScore = appPoints + interviewPoints;
  breakdown.jobMarket = { score: Math.min(jobScore, 100), weight: 0.10, label: 'Job Market', href: '/student/jobs' };

  // 7. Employer Ratings (10%)
  let employerScore = 0;
  if (input.employerRatings.count > 0) {
    employerScore = Math.round((input.employerRatings.avgRating / 5) * 100);
  }
  breakdown.employer = { score: employerScore, weight: 0.10, label: 'Employer Ratings', href: '/student/jobs' };

  // Calculate weighted total
  let totalScore = 0;
  for (const cat of Object.values(breakdown)) {
    totalScore += cat.score * cat.weight;
  }
  totalScore = Math.round(totalScore);

  // Grade
  const grade = totalScore >= 90 ? 'A' : totalScore >= 75 ? 'B' : totalScore >= 60 ? 'C' : totalScore >= 45 ? 'D' : 'F';

  // Top recommendation — find lowest category
  let topRecommendation: ChiroScoreResult['topRecommendation'] = null;
  let lowestScore = 101;
  for (const [, cat] of Object.entries(breakdown)) {
    if (cat.score < lowestScore) {
      lowestScore = cat.score;
      topRecommendation = { category: cat.label, label: `Improve your ${cat.label}`, href: cat.href };
    }
  }

  return { totalScore, breakdown, grade, topRecommendation };
}
