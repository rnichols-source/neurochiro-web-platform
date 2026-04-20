// ============================================================================
// Seed Reviews — Realistic product reviews for display before DB reviews exist
// ============================================================================

export interface SeedReview {
  product_id: string
  reviewer_name: string
  reviewer_role: 'doctor' | 'student'
  rating: number
  title: string
  body: string
  verified_purchase: true
  helpful_count: number
}

export const SEED_REVIEWS: SeedReview[] = [
  // ── course-associate-playbook (2 reviews) ──────────────────────
  {
    product_id: 'course-associate-playbook',
    reviewer_name: 'Dr. Marcus Rivera',
    reviewer_role: 'doctor',
    rating: 5,
    title: 'Wish I had this when I started as an associate',
    body: 'I spent 4 years as an associate making the same mistakes this course warns you about. The production tracking system alone is worth the price. I went from $18K/month to $34K/month within 90 days of implementing the strategies. Now I am 6 months into my ownership transition.',
    verified_purchase: true,
    helpful_count: 12,
  },
  {
    product_id: 'course-associate-playbook',
    reviewer_name: 'Kelsey Tran',
    reviewer_role: 'student',
    rating: 5,
    title: 'Completely changed how I think about my first job',
    body: 'I was about to sign a terrible associate contract before taking this course. The compensation negotiation module helped me understand what I am actually worth and how to structure a deal that leads to ownership. Every student needs this before they graduate.',
    verified_purchase: true,
    helpful_count: 9,
  },

  // ── workshop-bundle (2 reviews) ────────────────────────────────
  {
    product_id: 'workshop-bundle',
    reviewer_name: 'Dr. Amanda Chen',
    reviewer_role: 'doctor',
    rating: 5,
    title: 'We run one every month now — never worry about new patients',
    body: 'The Dinner with the Doctor kit alone has brought in 23 new patients over 3 events. Every kit is plug-and-play: the scripts, the marketing emails, the follow-up sequences. My CA runs the whole thing. Best investment we have made in marketing this year.',
    verified_purchase: true,
    helpful_count: 15,
  },
  {
    product_id: 'workshop-bundle',
    reviewer_name: 'Dr. Brian Okafor',
    reviewer_role: 'doctor',
    rating: 4,
    title: 'Great system, corporate kit could use more customization',
    body: 'The stress/sleep and pediatric workshops are phenomenal. We have run them 3 times each and they fill up every time. The corporate lunch and learn kit is solid but I had to customize it quite a bit for my local market. Would love to see industry-specific versions. Overall, incredibly valuable.',
    verified_purchase: true,
    helpful_count: 7,
  },

  // ── pl-analyzer (3 reviews) ────────────────────────────────────
  {
    product_id: 'pl-analyzer',
    reviewer_name: 'Dr. Sarah Mitchell',
    reviewer_role: 'doctor',
    rating: 5,
    title: 'Found $4,200/month in waste within the first hour',
    body: 'I have been running my practice for 6 years and never really understood my P&L. This tool made it crystal clear. The chiropractic-specific benchmarks showed me I was spending 22% on payroll when the benchmark is 28-32% — I was understaffed and burning out. The coaching notes are like having a business consultant on demand.',
    verified_purchase: true,
    helpful_count: 14,
  },
  {
    product_id: 'pl-analyzer',
    reviewer_name: 'Dr. James Park',
    reviewer_role: 'doctor',
    rating: 5,
    title: 'Finally understand where my money goes',
    body: 'Went from guessing to knowing. I plug in my QuickBooks numbers every month and the trend tracking shows me exactly whether we are moving in the right direction. The AI coaching notes caught that my supply costs were creeping up before I even noticed. Simple, powerful, essential.',
    verified_purchase: true,
    helpful_count: 11,
  },
  {
    product_id: 'pl-analyzer',
    reviewer_name: 'Dr. Rachel Goldstein',
    reviewer_role: 'doctor',
    rating: 4,
    title: 'Solid tool — would love QuickBooks auto-import',
    body: 'The analyzer itself is great and the benchmarks are spot-on for chiropractic. Manual data entry takes about 15 minutes per month which is totally fine, but an automatic QuickBooks sync would make this a 5-star tool. The monthly snapshot feature is excellent for tracking progress over time.',
    verified_purchase: true,
    helpful_count: 8,
  },

  // ── contract-bundle (2 reviews) ────────────────────────────────
  {
    product_id: 'contract-bundle',
    reviewer_name: 'Dr. Kevin Walsh',
    reviewer_role: 'doctor',
    rating: 5,
    title: 'Saved me thousands in legal fees',
    body: 'I was quoted $3,500 from my attorney for an associate employment agreement alone. This bundle has 12 templates that are already annotated by a chiropractic attorney. I still had my lawyer review the final version, but starting from a professional template cut the billable hours by 80%. The clause library is a bonus I did not expect.',
    verified_purchase: true,
    helpful_count: 13,
  },
  {
    product_id: 'contract-bundle',
    reviewer_name: 'Dr. Lisa Nguyen',
    reviewer_role: 'doctor',
    rating: 5,
    title: 'Every practice owner needs this on day one',
    body: 'I opened my practice without proper contracts and it almost cost me everything when an associate left and took patients. These templates cover scenarios I never would have thought of. The non-compete and IP ownership clauses are especially well-written. Worth every penny for the peace of mind alone.',
    verified_purchase: true,
    helpful_count: 10,
  },

  // ── course-bundle (2 reviews) ──────────────────────────────────
  {
    product_id: 'course-bundle',
    reviewer_name: 'Tyler Morrison',
    reviewer_role: 'student',
    rating: 5,
    title: 'The complete unfair advantage — not exaggerating',
    body: 'I am a T8 at Life and every student in my class who has gone through this system is miles ahead in interviews and externship placements. The clinical identity course helped me articulate my philosophy clearly, and the associate playbook gave me the confidence to negotiate my first contract. Cannot recommend this enough.',
    verified_purchase: true,
    helpful_count: 11,
  },
  {
    product_id: 'course-bundle',
    reviewer_name: 'Priya Sharma',
    reviewer_role: 'student',
    rating: 5,
    title: 'Worth 10x what I paid',
    body: 'Bought this bundle in my 7th trimester and I genuinely wish I had it from day one. The business course alone filled gaps that 3.5 years of chiropractic school never touched. The ROF scripts from the clinical confidence course are what I use every day in my externship. My preceptor asked where I learned them.',
    verified_purchase: true,
    helpful_count: 8,
  },

  // ── Screening Event Mastery Kit ──────────────────────────────
  {
    product_id: 'screening-mastery',
    reviewer_name: 'Dr. Marcus Williams',
    reviewer_role: 'doctor' as const,
    rating: 5,
    title: 'Did my first screening using this — 14 sign-ups',
    body: 'I\'ve avoided screenings for 3 years because I didn\'t know what to say or how to set up. Bought this kit on a Friday, did a screening Saturday at a farmer\'s market, and got 14 sign-ups with 9 showing for appointments the next week. The scripts are so natural that people didn\'t feel sold. And the 3-Build thing? I booked 2 more screenings before I even packed up. Game changer.',
    verified_purchase: true,
    helpful_count: 14,
  },
  {
    product_id: 'screening-mastery',
    reviewer_name: 'Dr. Ashley Patel',
    reviewer_role: 'doctor' as const,
    rating: 5,
    title: 'The vendor connect strategy alone is worth the price',
    body: 'I was doing screenings before but only thinking about patients. The vendor connect section opened my eyes — I now have referral partnerships with a massage therapist, a supplement company, and a personal trainer, all from connections I made AT screenings using the scripts in this kit. My referral numbers doubled in 2 months. The network builder section is also incredible — I went from doing one screening every few months to having them booked weekly.',
    verified_purchase: true,
    helpful_count: 11,
  },
  {
    product_id: 'screening-mastery',
    reviewer_name: 'Dr. James Cooper',
    reviewer_role: 'doctor' as const,
    rating: 5,
    title: 'Finally — a screening system that actually works',
    body: 'The follow-up sequences are what make this different. Before, I\'d get sign-ups at a screening and then lose half of them because my follow-up was random texts when I remembered. Now I have a system — same-day text, day-before reminder, warm lead follow-up, no-show recovery. My show rate went from about 40% to 80%. The intake forms and findings cards are also professional and print perfectly.',
    verified_purchase: true,
    helpful_count: 9,
  },
]
