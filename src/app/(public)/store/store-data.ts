// ============================================================================
// Store Data — Public Product Catalog with Retail + Member Pricing
// ============================================================================

export type StoreAudience = "doctor" | "student" | "patient";

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: StoreCategory;
  audience: StoreAudience[];
  retailPrice: number; // cents
  memberPrice: number; // cents
  badge?: string;
  features: string[];
  billing: "one_time" | "monthly";
  popular?: boolean;
  bundleIds?: string[]; // products included in this bundle
}

export const AUDIENCE_INFO: Record<
  StoreAudience,
  { label: string; cta: string; tagline: string; memberLink: string }
> = {
  doctor: {
    label: "For Doctors",
    cta: "I'm a Doctor",
    tagline: "Everything you need to run a high-performance chiropractic practice",
    memberLink: "/pricing/doctors",
  },
  student: {
    label: "For Students",
    cta: "I'm a Student",
    tagline: "Graduate ready to practice — not just ready to pass boards",
    memberLink: "/pricing/students",
  },
  patient: {
    label: "For Patients",
    cta: "I'm a Patient",
    tagline: "Tools to stay connected to your health between visits",
    memberLink: "/pricing/patients",
  },
};

export type StoreCategory =
  | "courses"
  | "workshops"
  | "contracts"
  | "tools";

export const CATEGORY_INFO: Record<
  StoreCategory,
  { label: string; tagline: string; icon: string }
> = {
  courses: {
    label: "Academy Courses",
    tagline: "Step-by-step training for new and growing chiropractors",
    icon: "GraduationCap",
  },
  workshops: {
    label: "Workshop Kits",
    tagline: "Done-for-you community events that fill your schedule",
    icon: "Presentation",
  },
  contracts: {
    label: "Contract Templates",
    tagline: "Attorney-drafted, chiropractic-specific legal templates",
    icon: "FileText",
  },
  tools: {
    label: "Practice Tools",
    tagline: "The operating system for a high-performance practice",
    icon: "Wrench",
  },
};

export const STORE_PRODUCTS: StoreProduct[] = [
  // ── Academy Courses ────────────────────────────────────────────
  {
    id: "course-clinical-identity",
    name: "Building Your Clinical Identity",
    description:
      "Find your philosophy, build your brand, and create a 90-day game plan before graduation. 4 modules covering clinical identity, elevator pitch, online presence, and your first 90 days.",
    longDescription:
      "Find your philosophy, build your brand, and create a 90-day game plan before graduation. 4 modules covering clinical identity, elevator pitch, online presence, and your first 90 days.",
    category: "courses",
    audience: ["student"],
    retailPrice: 5900,
    memberPrice: 2900,
    features: [
      "4 in-depth modules",
      "90-day action plan template",
      "Brand-building worksheets",
      "Elevator pitch framework",
    ],
    billing: "one_time",
  },
  {
    id: "course-business",
    name: "The Business of Chiropractic",
    description:
      "The business education chiropractic school skipped. 6 modules covering practice models, P&L fundamentals, contract negotiation, insurance vs cash, fee setting, and personal branding.",
    longDescription:
      "The business education chiropractic school skipped. 6 modules covering practice models, P&L fundamentals, contract negotiation, insurance vs cash, fee setting, and personal branding.",
    category: "courses",
    audience: ["student", "doctor"],
    retailPrice: 7900,
    memberPrice: 3900,
    features: [
      "6 comprehensive modules",
      "P&L breakdown templates",
      "Fee schedule calculator",
      "Contract negotiation scripts",
    ],
    billing: "one_time",
  },
  {
    id: "course-clinical-confidence",
    name: "Clinical Confidence",
    description:
      "Walk into day one and perform like you've been doing this for years. 6 modules covering first-day prep, Report of Findings, patient objections, difficult conversations, documentation, and referral relationships.",
    longDescription:
      "Walk into day one and perform like you've been doing this for years. 6 modules covering first-day prep, Report of Findings, patient objections, difficult conversations, documentation, and referral relationships.",
    category: "courses",
    audience: ["student"],
    retailPrice: 7900,
    memberPrice: 3900,
    features: [
      "6 practical modules",
      "ROF script templates",
      "Objection handling playbook",
      "Documentation checklists",
    ],
    billing: "one_time",
  },
  {
    id: "course-associate-playbook",
    name: "The Associate Playbook",
    description:
      "Produce more, earn more, and position yourself to own within 3 years. 4 modules covering what owners want, producing $30K+/month, when to stay vs leave, and transitioning to ownership.",
    longDescription:
      "Produce more, earn more, and position yourself to own within 3 years. 4 modules covering what owners want, producing $30K+/month, when to stay vs leave, and transitioning to ownership.",
    category: "courses",
    audience: ["student", "doctor"],
    retailPrice: 9900,
    memberPrice: 4900,
    features: [
      "4 advanced modules",
      "Production tracking system",
      "Ownership transition roadmap",
      "Compensation negotiation guide",
    ],
    billing: "one_time",
    popular: true,
  },
  {
    id: "course-bundle",
    name: "School-to-Practice System",
    description:
      "All 4 courses — 20 modules covering everything from clinical identity to practice ownership. The complete unfair advantage for chiropractic students.",
    longDescription:
      "All 4 courses — 20 modules covering everything from clinical identity to practice ownership. The complete unfair advantage for chiropractic students.",
    category: "courses",
    audience: ["student"],
    retailPrice: 24900,
    memberPrice: 9900,
    badge: "Save $68",
    features: [
      "All 4 courses (20 modules)",
      "Complete student-to-owner roadmap",
      "Every template & worksheet included",
      "Lifetime access",
    ],
    billing: "one_time",
    popular: true,
    bundleIds: [
      "course-clinical-identity",
      "course-business",
      "course-clinical-confidence",
      "course-associate-playbook",
    ],
  },

  // ── Workshop Kits ──────────────────────────────────────────────
  {
    id: "workshop-stress-sleep",
    name: "Stress, Sleep & Your Nervous System",
    description:
      "The #1 community workshop kit. Complete presenter script, pre-event marketing, sign-up sheets, follow-up sequences, and conversion tracking. Ready to run in 48 hours.",
    longDescription:
      "The #1 community workshop kit. Complete presenter script, pre-event marketing, sign-up sheets, follow-up sequences, and conversion tracking. Ready to run in 48 hours.",
    category: "workshops",
    audience: ["doctor"],
    retailPrice: 9900,
    memberPrice: 4900,
    features: [
      "Full 45-min presenter script",
      "8 pre-event marketing templates",
      "Room setup guide",
      "6-touch follow-up sequence",
    ],
    billing: "one_time",
  },
  {
    id: "workshop-pediatric",
    name: "Your Child's Nervous System",
    description:
      "Pediatric workshop kit designed for moms groups, daycares, and preschools. Gentle, parent-friendly content that drives family sign-ups.",
    longDescription:
      "Pediatric workshop kit designed for moms groups, daycares, and preschools. Gentle, parent-friendly content that drives family sign-ups.",
    category: "workshops",
    audience: ["doctor"],
    retailPrice: 9900,
    memberPrice: 4900,
    features: [
      "Parent-focused presenter script",
      "Kid-friendly room setup guide",
      "Family sign-up sheet",
      "Pediatric scan examples",
    ],
    billing: "one_time",
  },
  {
    id: "workshop-corporate",
    name: "Lunch & Learn: Peak Performance",
    description:
      "30-minute corporate wellness presentation. Perfect for offices, gyms, and businesses. Includes the pitch email to get booked.",
    longDescription:
      "30-minute corporate wellness presentation. Perfect for offices, gyms, and businesses. Includes the pitch email to get booked.",
    category: "workshops",
    audience: ["doctor"],
    retailPrice: 9900,
    memberPrice: 4900,
    features: [
      "30-min corporate script",
      "Business owner pitch email",
      "Professional handouts",
      "ROI tracking sheet",
    ],
    billing: "one_time",
  },
  {
    id: "workshop-dinner",
    name: "Dinner with the Doctor",
    description:
      "Intimate 8-12 person dinner event. No slides, no projector — just guided conversation that converts at 80-90%. The highest-converting workshop format in chiropractic.",
    longDescription:
      "Intimate 8-12 person dinner event. No slides, no projector — just guided conversation that converts at 80-90%. The highest-converting workshop format in chiropractic.",
    category: "workshops",
    audience: ["doctor"],
    retailPrice: 9900,
    memberPrice: 4900,
    features: [
      "Guided conversation script",
      "Personal invitation templates",
      "Elegant sign-up cards",
      "Host strategy guide",
    ],
    billing: "one_time",
    popular: true,
  },
  {
    id: "workshop-reactivation",
    name: "The Reactivation Workshop",
    description:
      "Patient appreciation event that reactivates lapsed patients and generates guest referrals. 20-minute high-energy format.",
    longDescription:
      "Patient appreciation event that reactivates lapsed patients and generates guest referrals. 20-minute high-energy format.",
    category: "workshops",
    audience: ["doctor"],
    retailPrice: 9900,
    memberPrice: 4900,
    features: [
      "20-min celebration script",
      "Lapsed patient outreach templates",
      "Guest sign-up system",
      "Reactivation tracking",
    ],
    billing: "one_time",
  },
  {
    id: "workshop-bundle",
    name: "Workshop Mastery System",
    description:
      "All 5 workshop kits. Run one per month and never worry about new patients again. Complete event marketing machine.",
    longDescription:
      "All 5 workshop kits. Run one per month and never worry about new patients again. Complete event marketing machine.",
    category: "workshops",
    audience: ["doctor"],
    retailPrice: 34900,
    memberPrice: 14900,
    badge: "Save $150",
    features: [
      "All 5 workshop kits",
      "12-month event calendar",
      "Every script & template",
      "Lifetime access",
    ],
    billing: "one_time",
    popular: true,
    bundleIds: [
      "workshop-stress-sleep",
      "workshop-pediatric",
      "workshop-corporate",
      "workshop-dinner",
      "workshop-reactivation",
    ],
  },

  // ── Contract Templates ─────────────────────────────────────────
  {
    id: "contract-basic",
    name: "Contract Template (Basic)",
    description:
      "Individual contract template for chiropractic practices. Includes compensation addendum, patient agreements, or vendor agreements with attorney annotations.",
    longDescription:
      "Individual contract template for chiropractic practices. Includes compensation addendum, patient agreements, or vendor agreements with attorney annotations.",
    category: "contracts",
    audience: ["doctor"],
    retailPrice: 6900,
    memberPrice: 2900,
    features: [
      "Attorney-drafted language",
      "Customizable placeholders",
      "Annotation notes explaining each clause",
      "Print-ready format",
    ],
    billing: "one_time",
  },
  {
    id: "contract-standard",
    name: "Contract Template (Standard)",
    description:
      "Independent contractor agreement, non-compete/non-solicitation, or operations templates with attorney annotations and customizable placeholders.",
    longDescription:
      "Independent contractor agreement, non-compete/non-solicitation, or operations templates with attorney annotations and customizable placeholders.",
    category: "contracts",
    audience: ["doctor"],
    retailPrice: 7900,
    memberPrice: 3900,
    features: [
      "Non-compete language included",
      "State-adaptable framework",
      "Attorney annotations",
      "Multiple use-case templates",
    ],
    billing: "one_time",
  },
  {
    id: "contract-employment",
    name: "Associate Doctor Employment Agreement",
    description:
      "Comprehensive associate contract with 3 compensation models, non-compete provisions, IP ownership, termination clauses, and equity pathway language.",
    longDescription:
      "Comprehensive associate contract with 3 compensation models, non-compete provisions, IP ownership, termination clauses, and equity pathway language.",
    category: "contracts",
    audience: ["doctor"],
    retailPrice: 9900,
    memberPrice: 4900,
    features: [
      "3 compensation models",
      "Non-compete & IP clauses",
      "Equity pathway language",
      "Attorney annotations throughout",
    ],
    billing: "one_time",
    popular: true,
  },
  {
    id: "contract-bundle",
    name: "Complete Contract Templates Bundle",
    description:
      "12 professionally drafted chiropractic contract templates plus a 20-clause library. Everything from associate agreements to patient financial agreements to buy-sell agreements.",
    longDescription:
      "12 professionally drafted chiropractic contract templates plus a 20-clause library. Everything from associate agreements to patient financial agreements to buy-sell agreements.",
    category: "contracts",
    audience: ["doctor"],
    retailPrice: 24900,
    memberPrice: 9900,
    badge: "Save $87",
    features: [
      "12 contract templates",
      "20-clause library",
      "Every practice scenario covered",
      "Lifetime access + updates",
    ],
    billing: "one_time",
    popular: true,
    bundleIds: [
      "contract-basic",
      "contract-standard",
      "contract-employment",
    ],
  },

  // ── Practice Tools ─────────────────────────────────────────────
  {
    id: "pl-analyzer",
    name: "Perfect P&L Analyzer",
    description:
      "Your personal bookkeeper. Enter your numbers straight from QuickBooks and see exactly where your money is going with benchmarks, coaching notes, and monthly trend tracking.",
    longDescription:
      "Your personal bookkeeper. Enter your numbers straight from QuickBooks and see exactly where your money is going with benchmarks, coaching notes, and monthly trend tracking.",
    category: "tools",
    audience: ["doctor"],
    retailPrice: 6900,
    memberPrice: 2900,
    features: [
      "QuickBooks-aligned categories",
      "Chiropractic benchmarks",
      "AI coaching notes per line item",
      "Monthly snapshot tracking",
    ],
    billing: "one_time",
    popular: true,
  },
  {
    id: "billing-guide",
    name: "Insurance & Billing Toolkit",
    description:
      "Complete CPT code guide (26 codes), modifier cheat sheet, insurance verification scripts, 5 denial appeal templates, superbill template, and payer-specific quick reference.",
    longDescription:
      "Complete CPT code guide (26 codes), modifier cheat sheet, insurance verification scripts, 5 denial appeal templates, superbill template, and payer-specific quick reference.",
    category: "tools",
    audience: ["doctor"],
    retailPrice: 9900,
    memberPrice: 3900,
    features: [
      "26 CPT codes explained",
      "Modifier cheat sheet",
      "5 denial appeal templates",
      "Payer-specific guides",
    ],
    billing: "one_time",
  },
  {
    id: "scan-report",
    name: "Scan Report Generator",
    description:
      "Generate beautiful, patient-friendly nervous system assessment reports. Input sEMG, thermography, and HRV values and get a printable report with spine diagrams and progress comparisons.",
    longDescription:
      "Generate beautiful, patient-friendly nervous system assessment reports. Input sEMG, thermography, and HRV values and get a printable report with spine diagrams and progress comparisons.",
    category: "tools",
    audience: ["doctor"],
    retailPrice: 3900,
    memberPrice: 1900,
    features: [
      "Patient-friendly reports",
      "Spine diagrams included",
      "Progress comparisons",
      "Age-adaptive language",
    ],
    billing: "monthly",
  },
  {
    id: "kpi-tracker",
    name: "KPI Tracker",
    description:
      "Daily business operating system. Log 5 numbers in 10 seconds, see weekly scorecards, track trends over time, and get smart coaching alerts.",
    longDescription:
      "Daily business operating system. Log 5 numbers in 10 seconds, see weekly scorecards, track trends over time, and get smart coaching alerts.",
    category: "tools",
    audience: ["doctor"],
    retailPrice: 5900,
    memberPrice: 2900,
    features: [
      "10-second daily logging",
      "Weekly scorecards",
      "Trend tracking & charts",
      "Coaching alerts",
    ],
    billing: "monthly",
  },
  {
    id: "content-library",
    name: "Patient Education Content Library",
    description:
      "30+ pre-written patient education templates. Handouts, text/email templates, social media posts, and email sequences. Copy, customize, and send in seconds.",
    longDescription:
      "30+ pre-written patient education templates. Handouts, text/email templates, social media posts, and email sequences. Copy, customize, and send in seconds.",
    category: "tools",
    audience: ["doctor"],
    retailPrice: 5900,
    memberPrice: 2900,
    features: [
      "30+ ready-to-use templates",
      "Social media posts",
      "Email sequences",
      "New content added monthly",
    ],
    billing: "monthly",
  },

  // ── Patient Products ───────────────────────────────────────────
  {
    id: "patient-premium",
    name: "Patient Premium Membership",
    description:
      "Your health, between visits. Daily wellness check-in with trend tracking, personalized exercise library (32 exercises), health journey timeline, and 15 patient education articles.",
    longDescription:
      "Your health, between visits. Daily wellness check-in with trend tracking, personalized exercise library (32 exercises), health journey timeline, and 15 patient education articles.",
    category: "tools",
    audience: ["patient"],
    retailPrice: 900,
    memberPrice: 900,
    features: [
      "Daily wellness tracking",
      "32-exercise video library",
      "Health journey timeline",
      "15 education articles",
    ],
    billing: "monthly",
    popular: true,
  },
  {
    id: "patient-ns-guide",
    name: "Nervous System Health Guide",
    description:
      "Everything you need to know about chiropractic care — what it does, what to expect, and how to talk to friends and family about it.",
    longDescription:
      "A beautifully designed digital guide that explains chiropractic care in plain language. Perfect for new patients or anyone curious about nervous system health. Covers what adjustments actually do, what to expect at your first visit, how to maximize results, and how to explain chiropractic to skeptical friends and family.",
    category: "tools",
    audience: ["patient"],
    retailPrice: 999,
    memberPrice: 999,
    features: [
      "What chiropractic care actually does",
      "What to expect at your first visit",
      "How to maximize your results",
      "How to talk to family about it",
    ],
    billing: "one_time",
  },
  {
    id: "patient-family-guide",
    name: "Family Wellness Plan Guide",
    description:
      "A guide for families considering chiropractic for the whole family. Covers pediatric care, prenatal care, and how to evaluate a family chiropractor.",
    longDescription:
      "Thinking about chiropractic for your whole family? This guide covers pediatric chiropractic (is it safe? what age?), prenatal care, how to evaluate a chiropractor, what questions to ask, and how to build a family wellness routine. Includes a family health tracking worksheet.",
    category: "tools",
    audience: ["patient"],
    retailPrice: 1499,
    memberPrice: 1499,
    features: [
      "Pediatric chiropractic explained",
      "Prenatal care guide",
      "How to evaluate a chiropractor",
      "Family health tracking worksheet",
    ],
    billing: "one_time",
  },
  {
    id: "patient-exercise-library",
    name: "Home Exercise & Rehab Library",
    description:
      "32 guided exercises with step-by-step instructions for home care between visits. Organized by body region with modifications for every fitness level.",
    longDescription:
      "Your chiropractor recommends exercises for a reason — they accelerate your results and help your body hold adjustments longer. This library gives you access to 32 guided exercises with clear step-by-step instructions, organized by body region (neck, upper back, lower back, hips, full body). Each exercise includes modifications for beginners and advanced levels. New exercises added monthly.",
    category: "tools",
    audience: ["patient"],
    retailPrice: 499,
    memberPrice: 499,
    features: [
      "32 guided exercises with instructions",
      "Organized by body region",
      "Beginner & advanced modifications",
      "New exercises added monthly",
    ],
    billing: "monthly",
  },
];

export function getProductsByCategory(
  category: StoreCategory,
  audience?: StoreAudience,
): StoreProduct[] {
  return STORE_PRODUCTS.filter(
    (p) =>
      p.category === category &&
      (!audience || p.audience.includes(audience)),
  );
}

export function getProductsByAudience(
  audience: StoreAudience,
): StoreProduct[] {
  return STORE_PRODUCTS.filter((p) => p.audience.includes(audience));
}

export function getCategoriesForAudience(
  audience: StoreAudience,
): StoreCategory[] {
  const cats = new Set<StoreCategory>();
  STORE_PRODUCTS.filter((p) => p.audience.includes(audience)).forEach((p) =>
    cats.add(p.category),
  );
  return Array.from(cats);
}

export function getPopularProducts(): StoreProduct[] {
  return STORE_PRODUCTS.filter((p) => p.popular);
}

export function getSavingsPercent(product: StoreProduct): number {
  return Math.round(
    ((product.retailPrice - product.memberPrice) / product.retailPrice) * 100,
  );
}

export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}
