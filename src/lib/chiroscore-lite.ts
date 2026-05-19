/**
 * ChiroScore Lite — Simplified 5-question quiz for booth kiosk
 * Pure computation. No DB calls.
 * Maps 5 quick answers to a 0-100 score with 5-category breakdown.
 */

export interface ChiroScoreLiteInput {
  school: string;
  graduationYear: string; // "2026" | "2027" | "2028" | "2029+" | "graduated"
  techniques: string[];
  externships: string; // "0" | "1" | "2" | "3+"
  careerGoal: string; // "associate" | "own_practice" | "research" | "undecided"
}

export interface ChiroScoreLiteCategory {
  label: string;
  score: number; // 0-100
  maxScore: number;
}

export interface ChiroScoreLiteResult {
  totalScore: number; // 0-100
  grade: string; // A-F
  categories: ChiroScoreLiteCategory[];
  topRecommendation: string;
}

const SCHOOL_TIERS: Record<string, number> = {
  "Palmer College": 95,
  "Life University": 90,
  "Sherman College": 90,
  "Parker University": 85,
  "Logan University": 85,
  "Cleveland University": 85,
  "Northwestern Health Sciences": 85,
  "National University of Health Sciences": 85,
  "Life Chiropractic College West": 90,
  "New York Chiropractic College": 85,
  "Palmer West": 90,
  "Southern California University": 80,
  "University of Western States": 80,
  "Texas Chiropractic College": 80,
  "Canadian Memorial": 85,
  "D'Youville University": 80,
  "Keiser University": 80,
  "University of Bridgeport": 80,
};

export function computeChiroScoreLite(input: ChiroScoreLiteInput): ChiroScoreLiteResult {
  // 1. Education (25 pts)
  const schoolScore = SCHOOL_TIERS[input.school] || 70;
  const educationScore = Math.round(schoolScore * 0.25);

  // 2. Career Readiness (25 pts) — based on graduation proximity + goal clarity
  let readinessBase = 0;
  switch (input.graduationYear) {
    case "graduated": readinessBase = 90; break;
    case "2026": readinessBase = 80; break;
    case "2027": readinessBase = 60; break;
    case "2028": readinessBase = 40; break;
    case "2029+": readinessBase = 25; break;
  }
  const goalBonus = input.careerGoal === "own_practice" ? 15
    : input.careerGoal === "associate" ? 10
    : input.careerGoal === "research" ? 10
    : 0;
  const readinessScore = Math.min(100, readinessBase + goalBonus);
  const careerScore = Math.round(readinessScore * 0.25);

  // 3. Clinical Skills (20 pts) — based on techniques known
  const techCount = input.techniques.length;
  const clinicalBase = techCount >= 6 ? 100
    : techCount >= 4 ? 80
    : techCount >= 2 ? 55
    : techCount >= 1 ? 30
    : 10;
  const clinicalScore = Math.round(clinicalBase * 0.20);

  // 4. Experience (20 pts) — externships
  let expBase = 0;
  switch (input.externships) {
    case "3+": expBase = 100; break;
    case "2": expBase = 75; break;
    case "1": expBase = 45; break;
    case "0": expBase = 10; break;
  }
  const experienceScore = Math.round(expBase * 0.20);

  // 5. Ambition (10 pts) — combo of goal + techniques + externships
  const ambitionBase = (goalBonus > 0 ? 40 : 10) + (techCount >= 3 ? 30 : 10) + (input.externships !== "0" ? 30 : 10);
  const ambitionScore = Math.round(Math.min(100, ambitionBase) * 0.10);

  const totalScore = educationScore + careerScore + clinicalScore + experienceScore + ambitionScore;

  // Grade
  const grade = totalScore >= 90 ? "A" : totalScore >= 80 ? "A-"
    : totalScore >= 70 ? "B+" : totalScore >= 60 ? "B"
    : totalScore >= 50 ? "B-" : totalScore >= 40 ? "C+"
    : totalScore >= 30 ? "C" : totalScore >= 20 ? "D" : "F";

  // Recommendation
  let topRecommendation = "";
  if (input.externships === "0") topRecommendation = "Get hands-on experience — externships are the #1 way to boost your score.";
  else if (techCount < 3) topRecommendation = "Learn more techniques — doctors want associates who can adapt to their practice style.";
  else if (input.careerGoal === "undecided") topRecommendation = "Clarify your career goal — knowing what you want helps you get there faster.";
  else topRecommendation = "You're on a strong path. Keep building your clinical skills and networking.";

  return {
    totalScore,
    grade,
    categories: [
      { label: "Education", score: Math.round((educationScore / 25) * 100), maxScore: 100 },
      { label: "Career Readiness", score: Math.round((careerScore / 25) * 100), maxScore: 100 },
      { label: "Clinical Skills", score: Math.round((clinicalScore / 20) * 100), maxScore: 100 },
      { label: "Experience", score: Math.round((experienceScore / 20) * 100), maxScore: 100 },
      { label: "Ambition", score: Math.round((ambitionScore / 10) * 100), maxScore: 100 },
    ],
    topRecommendation,
  };
}
