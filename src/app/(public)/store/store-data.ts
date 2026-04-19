// ============================================================================
// Store Data — Public Product Catalog with Retail + Member Pricing
// ============================================================================

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  category: StoreCategory;
  retailPrice: number; // cents
  memberPrice: number; // cents
  badge?: string;
  features: string[];
  billing: "one_time" | "monthly";
  popular?: boolean;
  bundleIds?: string[]; // products included in this bundle
}

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
    category: "courses",
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
    category: "courses",
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
    category: "courses",
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
    category: "courses",
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
    category: "courses",
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
    category: "workshops",
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
    category: "workshops",
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
    category: "workshops",
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
    category: "workshops",
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
    category: "workshops",
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
    category: "workshops",
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
    category: "contracts",
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
    category: "contracts",
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
    category: "contracts",
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
    category: "contracts",
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
    category: "tools",
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
    category: "tools",
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
    category: "tools",
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
    category: "tools",
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
    category: "tools",
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
];

export function getProductsByCategory(
  category: StoreCategory,
): StoreProduct[] {
  return STORE_PRODUCTS.filter((p) => p.category === category);
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
