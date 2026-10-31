export const SEMINAR_CONFIG = {
  packages: {
    single: { id: "single", name: "Single Seminar", priceUsd: 199, seminars: 1, months: null, stripePriceEnv: "STRIPE_SEMINAR_SINGLE_PRICE_ID" },
    annual: { id: "annual", name: "Host Annual", priceUsd: 990, seminars: 6, months: 12, stripePriceEnv: "STRIPE_SEMINAR_ANNUAL_PRICE_ID" },
  },
  featuredAddon: { name: "Featured Placement (30 days)", priceUsd: 149, days: 30, stripePriceEnv: "STRIPE_SEMINAR_FEATURED_PRICE_ID" },
  proFreeSeminarsPerYear: 0,
  adminHosts: {
    slugs: ["raymond-nichols"],
    names: ["raymond nichols", "dr raymond nichols", "dr. raymond nichols"],
  },
  defaultMemberDiscountPct: 10,
  platformFeePct: 7,
  payoutDelayDaysAfterEvent: 3,
  seatHoldMinutes: 30,
  reminderOffsetsHours: [168, 24, 2],
  topics: ["adjusting", "communication", "practice-growth", "pediatrics-prenatal", "neurology", "philosophy", "students", "business"],
} as const;

export type SeminarPackageId = keyof typeof SEMINAR_CONFIG.packages;

export function seminarPriceId(envName: string): string | undefined {
  return process.env[envName] || undefined;
}
