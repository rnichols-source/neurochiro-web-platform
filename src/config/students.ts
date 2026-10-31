export const STUDENT_CONFIG = {
  membership: {
    monthly: { usd: 33, stripePriceEnv: 'STRIPE_STUDENT_MEMBERSHIP_MONTHLY_PRICE_ID', expectCents: 3300, interval: 'month' as const },
    annual: { usd: 333, stripePriceEnv: 'STRIPE_STUDENT_MEMBERSHIP_ANNUAL_PRICE_ID', expectCents: 33300, interval: 'year' as const },
    tagline: '$33 a month. One for each of the 33 Principles.',
  },
  founding: { enabled: false, maxSeats: 100, promoCodeEnv: 'STRIPE_STUDENT_FOUNDING_PROMO_CODE_ID' },
  freeAccessGraceDays: 30,
  launchAt: null as string | null,
  contractLabAiPerDay: 5,
  requireSchoolVerification: true,
  grandfatherCents: 1200,
  jobs: {
    memberActivePostLimit: 2,
    memberPostDays: 60,
    featured: { usd: 49, days: 30, stripePriceEnv: 'STRIPE_JOB_FEATURED_PRICE_ID', expectCents: 4900 },
    nonMember: { usd: 149, days: 60, stripePriceEnv: 'STRIPE_JOB_NONMEMBER_PRICE_ID', expectCents: 14900 },
    refundOnReject: true,
  },
  seminars: { studentDiscountPct: 25, defaultStudentSeats: 5 },
  // RAYMOND: legal review. Placeholder only.
  shadowWaiver: 'I understand a shadow day is observational, I am responsible for my own travel, and the clinic can end the visit at any time.',
} as const;
