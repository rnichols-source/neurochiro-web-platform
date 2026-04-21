// ============================================================================
// Store Data — Public Product Catalog with Retail + Member Pricing
// ============================================================================

export type StoreAudience = "doctor" | "student" | "patient";

export interface ProductPreview {
  title: string;
  type: "script" | "template" | "checklist" | "data" | "guide";
  content: string; // A real sample snippet from the product
}

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
  previews?: ProductPreview[];
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

  // ── Student Tools ───────────────────────────────────────────────
  {
    id: "student-financial-planner",
    name: "Student-to-Practice Financial Planner",
    description:
      "The money guide nobody gave you in school. Enter your loans, salary, and expenses — get a personalized financial roadmap with loan repayment strategy, take-home pay calculator, monthly budget, tax deductions, and a 3-year plan.",
    longDescription:
      "Graduate with $250K in debt and no financial plan? Not anymore. This interactive planner takes YOUR actual numbers — student loans, expected salary, monthly expenses — and builds a personalized financial roadmap for your first 3 years out of school. Get a recommended loan repayment strategy (SAVE, Standard, Aggressive, or Refinance) with a side-by-side comparison table, a take-home pay calculator with tax estimates for W-2 and 1099, a monthly budget allocation showing where every dollar goes, a 90-day financial checklist, tax deductions you're probably missing, and a visual 3-year roadmap showing when you'll hit positive net worth. Print a professional financial plan to share with family or a financial advisor.",
    category: "tools",
    audience: ["student"],
    retailPrice: 4900,
    memberPrice: 2900,
    features: [
      "Loan repayment strategy comparison (4 plans)",
      "Take-home pay calculator (W-2 & 1099)",
      "Monthly budget allocation with visual bar",
      "First 90 days financial checklist",
      "Tax deductions you're missing (with $ savings)",
      "3-year roadmap with milestones",
      "Loan payoff & net worth projection charts",
      "Print-ready financial plan",
    ],
    billing: "one_time",
    popular: true,
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
      "A complete financial intelligence dashboard. Enter your numbers, get a health score, see where your money is leaking with a visual donut chart, get automated coaching on your top 3 problems, and print a professional P&L report.",
    longDescription:
      "More than a spreadsheet — this is a financial intelligence dashboard built for chiropractors. Enter your numbers from QuickBooks (all categories pre-mapped), and instantly get a Financial Health Score (0-100), a visual donut chart showing where every dollar goes, gap analysis comparing you to chiropractic benchmarks, your top 3 money leaks with specific coaching notes, quick wins with exact dollar savings, month-over-month trend charts, and a print-ready P&L statement. Tracks every category a chiropractic practice has — from treatment sales and PI collections to team costs, overhead, marketing, and business development.",
    category: "tools",
    audience: ["doctor"],
    retailPrice: 6900,
    memberPrice: 2900,
    features: [
      "Financial Health Score (0-100)",
      "Expense donut chart with clickable drill-down",
      "Gap analysis with red/yellow/green benchmarks",
      "Top 3 problems with dollar-specific coaching",
      "Quick wins with exact savings calculations",
      "Month-over-month trend charts",
      "Print-ready P&L statement",
      "QuickBooks-aligned categories",
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
      "Generate Insight CLA-quality nervous system reports your patients actually understand. Circular score gauge, SVG spine diagram, three scan finding cards, age-adaptive language, progress tracking, and a beautiful print report.",
    longDescription:
      "A 3-step wizard that turns raw scan data into a patient-friendly report they'll want to share with their spouse. Enter sEMG patterns, thermography readings, and HRV values — the system auto-generates a Nervous System Score (0-100) with a circular gauge, an SVG spine diagram highlighting affected regions, three visual finding cards (Muscle & Nerve Activity, Temperature Regulation, Stress Adaptability), a plain-language summary adapted to the patient's age (child/teen/adult/senior), progress comparison for follow-up scans, and a professional print report. Save reports to track patients over time.",
    category: "tools",
    audience: ["doctor"],
    retailPrice: 3900,
    memberPrice: 1900,
    features: [
      "Nervous System Score gauge (0-100)",
      "SVG spine diagram with region highlighting",
      "3 visual scan finding cards",
      "Age-adaptive plain-language summaries",
      "Progress comparison for follow-up scans",
      "Professional print-ready report",
      "Save & track reports over time",
      "Works with any scanning system",
    ],
    billing: "monthly",
  },
  {
    id: "kpi-tracker",
    name: "KPI Tracker",
    description:
      "Your daily practice cockpit. Log 5 numbers in 10 seconds, get instant scorecard feedback with color-coded targets, see weekly tables, trend charts with target lines, and automated coaching alerts that tell you exactly what to fix.",
    longDescription:
      "The daily operating system for high-performance chiropractic practices. Log patient visits, new patients, collections, no-shows, and referrals in 10 seconds flat. Instantly see your Today's Scorecard with green/yellow/red status dots comparing you to your targets and 30-day averages. The weekly scorecard shows your full Mon-Sun table with totals and averages. Trend charts track collections and visits over 7/30/60/90 days with target lines. Smart coaching alerts flag problems before they become crises — collections dropping, no-show spikes, new patient droughts. Streak tracking keeps you accountable. Set custom daily targets and monthly revenue goals.",
    category: "tools",
    audience: ["doctor"],
    retailPrice: 5900,
    memberPrice: 2900,
    features: [
      "10-second daily logging (5 core metrics)",
      "Today's Scorecard with target comparison",
      "Weekly Mon-Sun table with totals & averages",
      "Trend charts (7/30/60/90 days) with target lines",
      "Smart coaching alerts & pattern detection",
      "Streak tracking & milestones",
      "Custom daily targets & monthly revenue goals",
      "Mobile-friendly — log from your phone",
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

  // ── Screening Kit ──────────────────────────────────────────────
  {
    id: "screening-mastery",
    name: "Screening Event Mastery Kit",
    description:
      "The complete system for high-converting health screenings. Not just scripts — a full business-building machine. The only kit that teaches the 3-Build Philosophy: build your patient base, your network, and your vendor pipeline from every single event.",
    longDescription:
      "Most chiropractors go to a screening and come back with a few sign-ups. You should come back with new patients, your next 2 screening bookings, and 2 new referral partners. This kit gives you the complete 6-step screening flow (greet → intake → screen → adjust → offer → book), every script and objection handler, printable intake forms and findings cards, a network builder system to book your next event FROM this one, a vendor connect playbook to build referral partnerships on the spot, follow-up text sequences, and an ROI calculator. Nobody else is teaching this. Follow it to a T and you'll have screenings booked every week within 90 days.",
    category: "tools",
    audience: ["doctor"],
    retailPrice: 14900,
    memberPrice: 7900,
    badge: "New",
    features: [
      "Complete 6-step screening flow with scripts",
      "The 3-Build Philosophy (patients + network + vendors)",
      "Printable intake forms & nerve findings cards",
      "Network Builder — book your next event FROM this one",
      "Vendor Connect — build referral partnerships on the spot",
      "Full follow-up text sequences",
      "Event ROI calculator",
      "Pre-event checklist & marketing templates",
    ],
    billing: "one_time",
    popular: true,
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
