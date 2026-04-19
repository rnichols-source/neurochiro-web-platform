// ============================================================================
// P&L Analyzer Data — QuickBooks-Aligned Chart of Accounts
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PLLineItem {
  id: string;
  code: string;
  label: string;
  minPct: number;
  maxPct: number;
  midPct: number;
  tooltip: string;
  coachingOver: string;
  coachingUnder: string;
}

export interface PLCategory {
  id: string;
  code: string;
  label: string;
  minPct: number;
  maxPct: number;
  items: PLLineItem[];
}

export interface PLSection {
  id: string;
  type: "income" | "cogs" | "expenses";
  label: string;
  categories: PLCategory[];
}

export interface ScalingExample {
  id: string;
  title: string;
  subtitle: string;
  totalIncome: number;
  description: string;
  targetProfit: string;
  lineItems: Record<string, number>;
}

// ---------------------------------------------------------------------------
// 1. PL_SECTIONS — The Full Chart of Accounts
// ---------------------------------------------------------------------------

export const PL_SECTIONS: PLSection[] = [
  // ════════════════════════════════════════════════════════════════════════
  // INCOME
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "income",
    type: "income",
    label: "Income",
    categories: [
      {
        id: "4000-income",
        code: "4000",
        label: "Income",
        minPct: 0,
        maxPct: 100,
        items: [
          {
            id: "4020",
            code: "4020",
            label: "Treatment Sales",
            minPct: 80,
            maxPct: 100,
            midPct: 90,
            tooltip:
              "All revenue from patient visits — adjustments, therapies, exams, X-rays, and any billable clinical service. This is your core production number. In most healthy practices, treatment sales are 85-95% of total income.",
            coachingOver: "",
            coachingUnder:
              "Treatment sales at [X]% of total income is low. If PI collections or other sources make up more than 20% of your revenue, your core practice model may be too dependent on injury cases. Build your cash/insurance base so treatment sales consistently drive 85%+ of income.",
          },
          {
            id: "4035",
            code: "4035",
            label: "PI Collections",
            minPct: 0,
            maxPct: 20,
            midPct: 8,
            tooltip:
              "Personal injury case collections — payments received from PI attorneys, liens settled, and any motor vehicle accident case revenue. PI cases can be high-value but are unpredictable and slow to pay.",
            coachingOver:
              "PI collections at [X]% of total income — you're running a PI-heavy practice. That's great for case averages, but be aware of the cash flow risk. PI cases can take 6-18 months to pay. Make sure you have enough cash/insurance patients to cover monthly overhead without relying on PI settlements. One bad quarter of settlements shouldn't threaten your payroll.",
            coachingUnder: "",
          },
          {
            id: "4500",
            code: "4500",
            label: "Refunds",
            minPct: -3,
            maxPct: 0,
            midPct: -1,
            tooltip:
              "Patient refunds, insurance overpayment returns, and any credits issued. This should be a negative number reducing your total income. High refunds may indicate billing errors or overcharging.",
            coachingOver:
              "Refunds at [X]% is higher than typical. If you're refunding more than 2% of collections, investigate the root cause: billing errors, duplicate charges, or pricing disputes. Every refund also has an administrative cost. Clean up your billing process to reduce refunds at the source.",
            coachingUnder: "",
          },
          {
            id: "4600",
            code: "4600",
            label: "Sales Tax",
            minPct: -5,
            maxPct: 0,
            midPct: -2,
            tooltip:
              "Sales tax collected on taxable goods (supplements, products, retail items). This is a pass-through liability — you collect it from patients and remit it to the state. Shows as negative because it's not really your revenue.",
            coachingOver:
              "Sales tax at [X]% — if this is higher than expected, you may be selling a significant volume of taxable products (supplements, retail). Make sure you're remitting sales tax quarterly and have proper tax nexus compliance. If you're not selling products, this line should be near zero.",
            coachingUnder: "",
          },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // COST OF GOODS SOLD
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "cogs",
    type: "cogs",
    label: "Cost of Goods Sold",
    categories: [
      {
        id: "5000-cogs",
        code: "5000",
        label: "Cost of Goods Sold",
        minPct: 2,
        maxPct: 8,
        items: [
          {
            id: "5010",
            code: "5010",
            label: "COGS — Equipment & Supplies",
            minPct: 0.5,
            maxPct: 3,
            midPct: 1.5,
            tooltip:
              "Direct cost of clinical supplies consumed in patient care: table paper, cervical pillows, Biofreeze, KT tape, rehab bands, gowns, traction supplies, and any consumable used during treatment. Does NOT include durable equipment purchases.",
            coachingOver:
              "Equipment & supplies at [X]% is higher than it should be. At your revenue level, you're spending too much on consumables. Common culprits: ordering name-brand when generics work, not tracking per-visit supply costs, or staff waste. Negotiate bulk pricing with your supplier and do a quarterly supply audit. Track your cost-per-visit for supplies — it should be under $3.",
            coachingUnder:
              "Supplies at [X]% — either you're extremely efficient or you're skimping on the patient experience. Make sure your tables have fresh paper, your rehab area is stocked, and you're not reusing single-use items to save $50/month. Patients notice the details.",
          },
          {
            id: "5020",
            code: "5020",
            label: "COGS — Lab & Diagnostic Costs",
            minPct: 0,
            maxPct: 2,
            midPct: 0.8,
            tooltip:
              "Lab fees, diagnostic imaging costs (if outsourced), X-ray film/supplies, and any third-party diagnostic services. If you have in-house X-ray, include film, developer chemicals, and maintenance here.",
            coachingOver:
              "Lab & diagnostic costs at [X]% — if you're outsourcing imaging, compare costs with bringing X-ray in-house. At 100+ new patients per month, in-house digital X-ray typically pays for itself within 12-18 months. If you're already in-house, check your maintenance contract and supply costs against comparable practices.",
            coachingUnder:
              "Lab & diagnostic at [X]% — this is normal for practices with in-house digital X-ray and minimal lab work. Make sure you're still performing and documenting appropriate diagnostic workups for every new patient.",
          },
          {
            id: "5050",
            code: "5050",
            label: "COGS — Supplements, Food & Drink",
            minPct: 1,
            maxPct: 5,
            midPct: 2.5,
            tooltip:
              "Cost of supplements, nutritional products, protein powders, and any food/drink items you sell to patients. This is the wholesale cost of goods — the markup between this and your retail price is your product margin. A healthy supplement program runs 50-60% margin.",
            coachingOver:
              "Supplement COGS at [X]% — either you're selling a lot of product (which is great if margins are healthy) or your margins are too thin. Check your markup: if you're buying at $15 and selling at $25, that's only a 40% margin. You should be at 50-60% minimum. Also, watch for expired inventory — that's pure waste. Do a quarterly inventory check and return/discount anything approaching expiration.",
            coachingUnder:
              "Supplement COGS at [X]% — you're either not selling supplements or selling very little. A well-run supplement program adds $2,000-$5,000/month in profit with minimal effort. Start with 3-5 core products every chiropractor should carry: omega-3, vitamin D, magnesium, a quality multi, and a topical pain relief. Recommend based on findings, not hard selling.",
          },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // EXPENSES
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "expenses",
    type: "expenses",
    label: "Expenses",
    categories: [
      // ── 6100 Advertising & Marketing ──────────────────────────────
      {
        id: "6100-advertising-marketing",
        code: "6100",
        label: "Advertising & Marketing",
        minPct: 3,
        maxPct: 10,
        items: [
          {
            id: "6110",
            code: "6110",
            label: "Marketing",
            minPct: 3,
            maxPct: 9,
            midPct: 5,
            tooltip:
              "All marketing spend: Google Ads, Facebook/Instagram ads, SEO services, website hosting, social media management, spinal screenings, health fairs, community events, sponsorships, referral programs, patient appreciation events, brochures, business cards, and any patient acquisition costs.",
            coachingOver:
              "Marketing at [X]% — make sure you're tracking cost-per-new-patient for every channel. If Google Ads costs $150+ per new patient, optimize before spending more. The benchmark is $50-$100 per new patient from digital. If you can't attribute new patients to specific marketing spend, you're guessing, not marketing. Demand ROI data from every vendor and cut what doesn't produce.",
            coachingUnder:
              "Marketing at [X]% — in 2026, this is dangerously low. You need a steady flow of new patients to replace attrition. If your website looks dated, you have fewer than 100 Google reviews, and you're not running any digital ads, you're invisible to 80% of potential patients. Start with Google Business Profile optimization and a review campaign — nearly free and high impact.",
          },
          {
            id: "6120",
            code: "6120",
            label: "Marketing Meals",
            minPct: 0.1,
            maxPct: 1,
            midPct: 0.4,
            tooltip:
              "Meals and entertainment directly tied to marketing activities: lunch-and-learns with referral partners, doctor dinners, catered events for patient education, and meals at marketing events. Must have a business purpose to be deductible.",
            coachingOver:
              "Marketing meals at [X]% — are these meals actually generating referrals and new patients? Track every referral partner meal: who did you meet, what was discussed, and did it result in referrals? If you're having nice dinners that don't produce referrals, that's entertainment, not marketing. Focus on lunch-and-learns at attorney offices, MD offices, and gyms — those have the highest referral conversion.",
            coachingUnder:
              "Marketing meals at [X]% — this is fine. But if you're not doing any referral partner meals, you're missing a key relationship-building tool. One lunch per month with a PI attorney, family doctor, or gym owner can produce a steady stream of referrals. A $50 lunch that produces even one referral per month is a massive ROI.",
          },
        ],
      },

      // ── 6200 Team ─────────────────────────────────────────────────
      {
        id: "6200-team",
        code: "6200",
        label: "Team",
        minPct: 22,
        maxPct: 40,
        items: [
          {
            id: "6210",
            code: "6210",
            label: "Associate Doctor Compensation",
            minPct: 0,
            maxPct: 12,
            midPct: 8,
            tooltip:
              "Base salary plus production bonuses for associate doctors. Includes guaranteed minimums and any per-visit or percentage-of-collections compensation. Does NOT include the owner-doctor's draw — that comes out of profit. If you're solo with no associate, leave this at zero.",
            coachingOver:
              "Associate comp at [X]% — your associate is consuming more than 12 cents of every dollar collected. Check the math: are they producing at least 3x their total cost? If an associate costs $8K/month, they need to generate $24K+ in collections. If not, it's either a volume problem (not enough patients scheduled) or a case-average problem (too many single-visit plans). Fix the schedule first — most associates are under-booked, not overpaid.",
            coachingUnder:
              "Associate comp at [X]% is low, which likely means you're solo or your associate is on a heavily production-based deal. If you're solo, ignore this. If you have an associate producing but only costing 4-5%, make sure the comp plan is competitive enough to retain them. Losing a producing associate costs 3-6 months of revenue disruption.",
          },
          {
            id: "6221",
            code: "6221",
            label: "Staff Wages",
            minPct: 10,
            maxPct: 20,
            midPct: 14,
            tooltip:
              "All non-doctor employee wages: front desk staff, chiropractic assistants, office manager, X-ray techs, billing staff, and any other W-2 team members. Includes hourly wages, salary, bonuses, and overtime. Does NOT include associate doctor pay (separate line) or owner draw.",
            coachingOver:
              "Staff wages at [X]% — before you cut, ask: is every team member producing value equal to 3x their cost? A CA who does intake AND applies billable therapies is worth 2x one who only checks people in. Cross-train before you cut. If you're overstaffed for volume, reduce hours before eliminating positions. Match staffing to visit volume — at 80 visits/week you need 1.5-2 FTE CAs, not 3.",
            coachingUnder:
              "Staff wages at [X]% — this is lean, possibly too lean. If your front desk is slammed, calls go to voicemail, and patients wait 15 minutes to check out, you're losing more in missed appointments than you'd spend on help. One missed new patient per week at $2,500 case average = $10K/month in lost revenue. Hire before you're desperate.",
          },
          {
            id: "6222",
            code: "6222",
            label: "Employer Payroll Tax",
            minPct: 2,
            maxPct: 5,
            midPct: 3.5,
            tooltip:
              "Employer-side payroll taxes: Social Security (6.2%), Medicare (1.45%), FUTA, SUTA, and workers' compensation insurance. Rule of thumb: employer taxes run 7.65-10% of gross wages, so this line should be roughly 7-10% of your total salary line above.",
            coachingOver:
              "Employer tax at [X]% — check your workers' comp classification code. Chiropractic offices should be on a clerical rate, not a medical rate — this alone can save $1,000-$2,000/year. Also review your state unemployment rate; if you've had turnover that triggered claims, your SUTA rate may be elevated. Focus on retention to bring it back down. Shop your workers' comp annually.",
            coachingUnder:
              "Employer tax at [X]% — double-check that you're not misclassifying employees as 1099 contractors. The IRS has cracked down hard on this in healthcare. If your 'contractor' has a set schedule, uses your equipment, and you control how they work — that's an employee. Penalties for misclassification are severe.",
          },
          {
            id: "6230",
            code: "6230",
            label: "Employee Benefits",
            minPct: 1,
            maxPct: 5,
            midPct: 2.5,
            tooltip:
              "Employer health insurance contributions, dental/vision, retirement plan matching (401k, SEP-IRA, SIMPLE IRA), workers' comp insurance, disability insurance, and any other employee benefits. Does NOT include payroll taxes — those are a separate line.",
            coachingOver:
              "Benefits at [X]% — review your health insurance plan. You don't need a Cadillac plan to attract good staff. A solid ICHRA or QSEHRA can save $500-$1,000/month while still offering real coverage. For retirement, a SIMPLE IRA with 3% match is the most cost-effective option for small practices. Make sure your workers' comp is classified correctly — chiro offices should be on clerical rates.",
            coachingUnder:
              "Benefits at [X]% — if you're not offering any benefits, you'll struggle to attract and retain quality staff, especially at practices collecting $40K+/month. Even a basic health stipend ($200-$300/month) or SIMPLE IRA shows you invest in your team. The cost of replacing a good CA ($3K-$5K in recruiting and training) makes modest benefits a smart retention investment.",
          },
          {
            id: "6291",
            code: "6291",
            label: "Payroll Processing Fee",
            minPct: 0.2,
            maxPct: 0.8,
            midPct: 0.4,
            tooltip:
              "Fees paid to your payroll processor (Gusto, ADP, Paychex, QuickBooks Payroll, etc.) for running payroll, filing tax forms, issuing W-2s, and handling direct deposits.",
            coachingOver:
              "Payroll processing at [X]% — you may be overpaying. ADP and Paychex often charge per-employee fees that add up. Compare pricing: Gusto and QuickBooks Payroll are typically $40-$80/month base plus $6-$10/employee. If you're paying significantly more, switch. Payroll processing is commoditized — don't overpay for a brand name.",
            coachingUnder:
              "Payroll processing at [X]% — this is fine. Just make sure your payroll service handles tax filings, W-2s, and state compliance correctly. A payroll tax penalty because your $20/month service missed a filing costs far more than a proper platform.",
          },
        ],
      },

      // ── 6600 Practice Costs ───────────────────────────────────────
      {
        id: "6600-practice-costs",
        code: "6600",
        label: "Practice Costs",
        minPct: 6,
        maxPct: 12,
        items: [
          {
            id: "6620",
            code: "6620",
            label: "Rent",
            minPct: 4,
            maxPct: 8,
            midPct: 6,
            tooltip:
              "Monthly lease payment including CAM (Common Area Maintenance) charges and property taxes if passed through. If you own the building, use the fair-market rent you'd charge a tenant. Does NOT include build-out loan payments.",
            coachingOver:
              "Rent at [X]% — for every dollar you collect, [X] cents goes straight to your landlord. Two moves: negotiate the lease down, or grow revenue so the percentage drops. Every $5K in new monthly collections drops your rent percentage by about 1%. If you're locked into an expensive lease, the fastest fix is more volume. Also check: are you using all your square footage? If you have 2,000 sq ft but only use 1,200, you're paying for dead space.",
            coachingUnder:
              "Rent at [X]% — either you got a killer deal or your space is too small for growth. If patients are waiting in the hallway and you can't add a table, cheap rent is costing you production. The right space should allow 150-200+ visits/week without feeling cramped. Don't let $500/month savings cap your growth.",
          },
          {
            id: "6640",
            code: "6640",
            label: "Office Utilities",
            minPct: 0.5,
            maxPct: 2,
            midPct: 1,
            tooltip:
              "Electric, gas, water, trash, and any utility costs for the office space. Does NOT include phone/internet (that's under Overhead) or personal utilities.",
            coachingOver:
              "Utilities at [X]% — check your HVAC system; old units can double your electric bill. Get a programmable thermostat, switch to LED lighting, and make sure you're not on a commercial electric rate when you could be on a small-business rate. Review your utility bills for the last 12 months and look for seasonal spikes you can address.",
            coachingUnder:
              "Utilities at [X]% — this is fine. Not much to optimize here. Just make sure your HVAC is working efficiently so patients and staff are comfortable year-round.",
          },
          {
            id: "6650",
            code: "6650",
            label: "Repairs & Maintenance",
            minPct: 0.3,
            maxPct: 1.5,
            midPct: 0.7,
            tooltip:
              "Building repairs, HVAC service, plumbing, electrical work, equipment maintenance contracts, table servicing, X-ray calibration, and any physical upkeep of the practice. Does NOT include janitorial/cleaning (that's under Overhead).",
            coachingOver:
              "Repairs & maintenance at [X]% — if you're spending heavily here, your building or equipment may be aging out. Evaluate whether it's cheaper to keep repairing old equipment or replace it. For building issues, check your lease — most commercial leases put structural and major system repairs on the landlord. Make sure you're not paying for things that are the landlord's responsibility.",
            coachingUnder:
              "Repairs at [X]% — don't defer maintenance on critical equipment. A table that drops unexpectedly, an X-ray unit that's out of calibration, or an HVAC failure in August will cost you far more in emergency repairs and lost production than routine maintenance. Budget for annual equipment servicing and keep your space in top shape.",
          },
        ],
      },

      // ── 6800 Overhead ─────────────────────────────────────────────
      {
        id: "6800-overhead",
        code: "6800",
        label: "Overhead",
        minPct: 8,
        maxPct: 22,
        items: [
          {
            id: "6811",
            code: "6811",
            label: "Bank Charges & Fees",
            minPct: 0.3,
            maxPct: 2,
            midPct: 1,
            tooltip:
              "Monthly bank fees, wire transfer fees, NSF charges, lockbox fees, and any charges from your business banking accounts. If this is high, you may be on the wrong type of business account.",
            coachingOver:
              "Bank fees at [X]% — this is unusually high. Review your bank account type: many practices stay on basic checking when a business analysis account would waive fees based on your average balance. Also check for recurring NSF or overdraft charges — those indicate cash flow timing issues. Switch to a bank that offers free business checking with your balance level.",
            coachingUnder: "",
          },
          {
            id: "6812",
            code: "6812",
            label: "Cleaning",
            minPct: 0.3,
            maxPct: 1,
            midPct: 0.5,
            tooltip:
              "Janitorial service, office cleaning supplies, carpet cleaning, and general cleaning. Does NOT include major maintenance or repairs.",
            coachingOver:
              "Cleaning at [X]% — get competitive bids from 2-3 janitorial services. Most 1,500 sq ft offices should cost $400-$600/month to clean 3x/week. If you're paying significantly more, you're overpaying. Also check: is your cleaning crew doing everything in the contract? Walk through at 4pm and verify.",
            coachingUnder:
              "Cleaning at [X]% — make sure your office is actually clean. Walk through at 4pm on a Thursday and look through a new patient's eyes. Dust on blinds, stains on carpet, and a grimy bathroom cost you more in lost referrals than a proper cleaning service.",
          },
          {
            id: "6814",
            code: "6814",
            label: "Equipment",
            minPct: 0.5,
            maxPct: 3,
            midPct: 1.5,
            tooltip:
              "Equipment purchases, leases, and maintenance: tables, digital X-ray, decompression, laser, shockwave, and any financed equipment. Includes monthly lease payments and small equipment purchases.",
            coachingOver:
              "Equipment at [X]% — you may have too much equipment relative to revenue. The shiny-object trap is real: that $120K decompression table sounds great, but if it's only generating $2K/month in billings, the math doesn't work. For every piece of equipment, calculate: monthly cost vs. monthly revenue generated. If the ratio isn't at least 3:1, you overpaid or you're underutilizing it.",
            coachingUnder:
              "Equipment at [X]% — either you own everything outright (great) or you're running outdated equipment. If your X-ray system is 15+ years old or you're missing revenue-generating modalities, this is the wrong place to be frugal. Good equipment pays for itself.",
          },
          {
            id: "6816",
            code: "6816",
            label: "Gifts",
            minPct: 0,
            maxPct: 0.5,
            midPct: 0.2,
            tooltip:
              "Patient gifts, referral thank-yous, staff appreciation gifts, holiday gifts, and any goodwill gifts. Business gifts are deductible up to $25 per recipient per year.",
            coachingOver:
              "Gifts at [X]% — you're generous, which builds goodwill, but make sure it's producing results. Track whether gift recipients actually send referrals. A $25 gift card to a patient who refers 3 friends is a great investment. Expensive gifts to people who never refer are just charity. Keep it simple and tied to referral behavior.",
            coachingUnder: "",
          },
          {
            id: "6817",
            code: "6817",
            label: "Insurance",
            minPct: 0.5,
            maxPct: 2,
            midPct: 1,
            tooltip:
              "All business insurance: malpractice/professional liability, general liability, property insurance, business interruption, cyber liability, umbrella policies, and workers' comp. Does NOT include employee health insurance (that's part of payroll/benefits).",
            coachingOver:
              "Insurance at [X]% — shop your policies every 2-3 years. Bundle general liability + property + cyber with one carrier for 10-15% discount. Also verify you're not over-insured: review coverage limits against actual asset values. For malpractice, get quotes from NCMIC, ChiroSecure, and at least one other carrier.",
            coachingUnder:
              "Insurance at [X]% — make sure you have adequate coverage. At minimum: malpractice ($1M/$3M), general liability, property insurance, and cyber liability. One uncovered incident can bankrupt a practice. A data breach alone can cost $50K-$100K without cyber coverage. This is not where you save money.",
          },
          {
            id: "6818",
            code: "6818",
            label: "Interest Paid",
            minPct: 0,
            maxPct: 2,
            midPct: 0.5,
            tooltip:
              "Interest on business loans, lines of credit, equipment financing, credit card interest, and any other debt service interest. Does NOT include the principal portion of loan payments.",
            coachingOver:
              "Interest at [X]% — you're carrying significant debt. Prioritize paying down high-interest debt (credit cards, merchant cash advances) first. If you have multiple loans, consider consolidating with an SBA loan at a lower rate. Every dollar in interest is a dollar that doesn't go to your bottom line. Avoid taking on new debt unless the investment produces 3x+ returns.",
            coachingUnder: "",
          },
          {
            id: "6820",
            code: "6820",
            label: "Legal & Professional Fees",
            minPct: 0.3,
            maxPct: 1.5,
            midPct: 0.7,
            tooltip:
              "Attorney fees, CPA/accounting fees, bookkeeping services, consulting fees, and any professional service providers. Includes tax preparation, contract reviews, and ongoing advisory retainers.",
            coachingOver:
              "Legal & professional at [X]% — unless you're in active litigation, this is high. You shouldn't need a lawyer on retainer for routine operations. For accounting, separate CPA work (taxes, quarterly reviews) from bookkeeping — a bookkeeper at $300-$500/month handles day-to-day; your CPA handles strategy. If your accountant charges $1,500+/month, make sure you're getting strategic tax advice, not just data entry.",
            coachingUnder:
              "Professional fees at [X]% — if you haven't had an attorney review your contracts or an accountant do a tax strategy session in the last 2 years, you're exposed. One employee lawsuit or missed tax deduction costs more than proactive professional help. Budget $3K-$5K/year for professional services and treat it as insurance.",
          },
          {
            id: "6823",
            code: "6823",
            label: "Medical Billing",
            minPct: 0,
            maxPct: 3,
            midPct: 1,
            tooltip:
              "Third-party billing service fees, claims clearinghouse fees, eligibility verification services, and any outsourced billing costs. If you use an outside billing company, their fee (typically 5-8% of collections) goes here. If you bill in-house, this may be minimal.",
            coachingOver:
              "Medical billing at [X]% — if you're using an outside billing company charging 8%+, negotiate or shop around. Market rate is 5-7% for chiropractic billing. If billing in-house, you may have too many overlapping software subscriptions. One good billing platform beats three mediocre ones. Also track your clean claims rate — if it's below 90%, your billing process needs work regardless of cost.",
            coachingUnder:
              "Billing at [X]% — are you doing all billing yourself? That's fine at $20K/month, but above $40K it's usually cheaper to outsource. Your clinical time is worth $200-$400/hour. If you spend 5 hours/week on billing, that's $4K-$8K/month in lost production. A billing service at $2K/month is a bargain by comparison.",
          },
          {
            id: "6824",
            code: "6824",
            label: "Membership Fees",
            minPct: 0,
            maxPct: 0.3,
            midPct: 0.1,
            tooltip:
              "Professional association dues (state and national chiropractic associations), chamber of commerce membership, BNI or networking group fees, and any professional memberships.",
            coachingOver:
              "Membership fees at [X]% — audit every membership. Are you actually attending BNI meetings? Getting value from your chamber membership? Using your association benefits? Cancel anything you haven't actively used in 6 months. Keep your state association (required for advocacy), one networking group that produces referrals, and nothing else unless you can prove ROI.",
            coachingUnder: "",
          },
          {
            id: "6825",
            code: "6825",
            label: "Merchant Processing Fees",
            minPct: 1,
            maxPct: 3.5,
            midPct: 2.5,
            tooltip:
              "Credit card processing fees, debit card fees, payment terminal fees, and any charges from your payment processor (Square, Clover, Stripe, traditional merchant account). Typically 2.5-3.2% of card transaction volume.",
            coachingOver:
              "Merchant processing at [X]% — if you process $30K+/month in cards, you have negotiating leverage. Call your processor and ask for a rate reduction, or get competing quotes. Going from 3.2% to 2.6% on $30K saves $180/month ($2,160/year). Also check for hidden fees: PCI compliance fees, statement fees, batch fees, and monthly minimums add up. Consider a flat-rate processor if your average transaction is under $100.",
            coachingUnder:
              "Processing fees at [X]% — this is either very efficient or you're primarily collecting cash/checks. If you're discouraging card payments to avoid fees, you're likely losing revenue. Patients who can pay by card spend more and comply better with care plans. The 2-3% fee is a cost of doing business in 2026.",
          },
          {
            id: "6826",
            code: "6826",
            label: "Office Expenses & Supplies",
            minPct: 0.3,
            maxPct: 1,
            midPct: 0.5,
            tooltip:
              "General office supplies: paper, toner, pens, printer ink, folders, postage, stamps, and any non-clinical consumables used in daily operations.",
            coachingOver:
              "Office supplies at [X]% — do a supply audit. Most practices have a closet full of supplies they ordered in bulk and never used. Switch to just-in-time ordering through Amazon Business or Staples delivery. Track usage monthly and set reorder points instead of bulk-buying. Also check if staff is ordering personal items on the business account.",
            coachingUnder: "",
          },
          {
            id: "6828",
            code: "6828",
            label: "Software & Subscriptions",
            minPct: 1,
            maxPct: 3,
            midPct: 1.8,
            tooltip:
              "All software subscriptions: EHR/practice management, scheduling software, patient communication platforms, accounting software, cloud storage, HIPAA compliance tools, Microsoft 365/Google Workspace, scanning/diagnostic software, and any SaaS tools.",
            coachingOver:
              "Software at [X]% — do a subscription audit right now. Log into every bank and credit card statement and list every recurring tech charge. Most practices find $200-$500/month in forgotten subscriptions: that old fax service, the website plugin, the trial that auto-renewed. Cancel anything unused in 60 days. Also look for overlap — do you need a separate texting platform AND your EHR's built-in reminders?",
            coachingUnder:
              "Software at [X]% — make sure you're not underinvesting in tech that saves time. A good EHR saves 15-30 minutes/day in documentation. Automated text reminders reduce no-shows by 30-40%. If you're doing things manually that software could automate, you're spending clinical time on admin work. That's the most expensive software savings possible.",
          },
          {
            id: "6830",
            code: "6830",
            label: "Phone & Internet",
            minPct: 0.5,
            maxPct: 1.5,
            midPct: 0.8,
            tooltip:
              "Business phone system (VoIP/landline), internet service, fax service, and cell phone costs if a dedicated business line. Includes monthly service fees and any equipment rentals.",
            coachingOver:
              "Phone & internet at [X]% — review your plans. Most practices don't need more than 200 Mbps internet. If you're paying for a legacy phone system, switch to VoIP (RingCentral, Ooma) and save 30-50%. Make sure you're not paying for unused phone lines or features you don't use. A reliable internet connection is critical — but enterprise-grade is overkill for a chiro office.",
            coachingUnder:
              "Phone & internet at [X]% — just make sure your internet is reliable enough that your EHR and payment systems never go down during business hours. A $50/month savings isn't worth one system outage that disrupts a full day of patients.",
          },
          {
            id: "6831",
            code: "6831",
            label: "Royalty Fees",
            minPct: 0,
            maxPct: 8,
            midPct: 4,
            tooltip:
              "Franchise royalty fees, licensing fees, or any ongoing fees paid to a parent organization or franchisor. If you're an independent practice, this should be zero. For franchise practices, this is typically 5-10% of gross revenue.",
            coachingOver:
              "Royalty fees at [X]% — if you're a franchise, this is the cost of the brand and systems. Make sure you're actually using the marketing, training, and operational support that comes with the franchise fee. If you're paying 8% for a brand name but doing all your own marketing and operations, you're getting poor value. Have a conversation with your franchisor about what's included and maximize every benefit you're paying for.",
            coachingUnder: "",
          },
          {
            id: "6840",
            code: "6840",
            label: "Depreciation",
            minPct: 0.5,
            maxPct: 3,
            midPct: 1.5,
            tooltip:
              "Non-cash expense reflecting the declining value of equipment and assets: adjusting tables, X-ray systems, decompression units, laser equipment, build-out improvements, and office furniture. Calculated by your accountant based on asset life and depreciation method (straight-line or accelerated/Section 179).",
            coachingOver:
              "Depreciation at [X]% — this isn't an expense you can reduce directly, but a high number means you have significant capital tied up in equipment. Make sure every piece of depreciating equipment is generating revenue that justifies its cost. Also confirm your accountant is using the most tax-advantageous depreciation method — Section 179 and bonus depreciation can accelerate deductions significantly in the year of purchase.",
            coachingUnder:
              "Depreciation at [X]% — either your equipment is fully depreciated (common in established practices) or you haven't been tracking depreciation properly. Talk to your accountant — depreciation is a valuable tax deduction that reduces your taxable income without costing you any cash. If you bought a $50K X-ray system and aren't depreciating it, you're overpaying on taxes.",
          },
        ],
      },

      // ── 7000 Business Development ─────────────────────────────────
      {
        id: "7000-business-development",
        code: "7000",
        label: "Business Development",
        minPct: 1,
        maxPct: 4,
        items: [
          {
            id: "7010",
            code: "7010",
            label: "Auto",
            minPct: 0,
            maxPct: 1,
            midPct: 0.3,
            tooltip:
              "Business use of vehicle: mileage for spinal screenings, community events, bank runs, supply pickups, and any practice-related driving. Track mileage using an app (MileIQ, Everlance) for IRS compliance. 2026 standard mileage rate applies.",
            coachingOver:
              "Auto at [X]% — unless you're doing extensive community outreach that requires driving, this is high. Make sure you're tracking actual business miles vs. personal use. The IRS scrutinizes auto deductions heavily. Use a mileage tracking app and only claim legitimate business use. If you're leasing a vehicle through the practice, compare the cost to simply reimbursing mileage.",
            coachingUnder: "",
          },
          {
            id: "7020",
            code: "7020",
            label: "Business Meals & Entertainment",
            minPct: 0.3,
            maxPct: 1.5,
            midPct: 0.8,
            tooltip:
              "Business meals with referral partners, team meals, CE seminar meals, and any entertainment with a business purpose. Keep receipts and document the business purpose, attendees, and topics discussed for tax compliance.",
            coachingOver:
              "Business meals at [X]% — are these meals producing business results? Track every meal: who attended, what was discussed, and what came of it. If you're dining with the same referral partner monthly but they've never sent a patient, that's a friendship dinner, not a business meal. Focus meal spending on relationships that produce measurable referrals or business growth.",
            coachingUnder:
              "Business meals at [X]% — this is fine. But don't overlook team meals. Taking your staff to lunch once a month costs $100-$200 and builds morale that reduces turnover. The cost of replacing one CA ($3K-$5K in recruiting and training) makes occasional team meals one of the best investments you can make.",
          },
          {
            id: "7040",
            code: "7040",
            label: "Travel",
            minPct: 0.3,
            maxPct: 1.5,
            midPct: 0.7,
            tooltip:
              "Business travel: flights, hotels, rental cars, and transportation for CE seminars, conferences, coaching events, and practice-related trips. Does NOT include daily commuting to the office.",
            coachingOver:
              "Travel at [X]% — are your travel expenses tied to high-ROI events? A $2,000 trip to a coaching event that produces $10K in practice improvements is worth it. A $2,000 trip to a resort CE course where you learn nothing new is a vacation. Be honest about which is which. Consider virtual CE options that cost 80% less when the in-person experience isn't critical.",
            coachingUnder:
              "Travel at [X]% — if you haven't attended an out-of-town seminar or coaching event in over a year, you may be falling behind. The energy, ideas, and connections from great events often produce a 30-60 day production surge. It's also how you avoid burnout — getting around other driven doctors recharges you. Budget for at least one major event per year.",
          },
        ],
      },

      // ── 7100 Continuing Education ─────────────────────────────────
      {
        id: "7100-continuing-education",
        code: "7100",
        label: "Continuing Education",
        minPct: 1,
        maxPct: 4,
        items: [
          {
            id: "7110",
            code: "7110",
            label: "Doctor CE & Seminars",
            minPct: 0.5,
            maxPct: 3,
            midPct: 1.5,
            tooltip:
              "All continuing education for the owner and associate doctors: seminar tuition, technique certifications (Gonstead, Thompson, Activator, SOT, upper cervical, etc.), state-required CE hours, online CE courses, and any clinical training programs. Does NOT include travel/lodging for CE events — that's under Travel.",
            coachingOver:
              "Doctor CE at [X]% — you're investing heavily in clinical skills, which is great, but are you implementing what you learn? The most expensive seminar is the one you attend and do nothing with. Pick 1-2 core techniques per year, implement them fully, measure the results, then move to the next. Chasing every new technique while mastering none is expensive and exhausting. Prioritize CE that directly impacts case acceptance and patient outcomes.",
            coachingUnder:
              "Doctor CE at [X]% — if you haven't attended a major seminar in over a year, you're falling behind. At minimum, budget for your state-required CE hours plus one major technique or practice management event per year. The energy and ideas from a great event often produce a 30-60 day production surge. It also prevents burnout — being around driven colleagues recharges you.",
          },
          {
            id: "7120",
            code: "7120",
            label: "Staff Training",
            minPct: 0.3,
            maxPct: 1,
            midPct: 0.5,
            tooltip:
              "Training and development for your team: CA training programs (ChiroMatchmakers, Front Desk Academy, etc.), billing certification courses, front desk scripting workshops, conference attendance for staff, CPR/first aid certification, HIPAA training, and any team development materials.",
            coachingOver:
              "Staff training at [X]% — make sure there's measurable ROI. Are trainings translating into better retention, higher case acceptance, fewer billing errors? If your CA went to a $3,000 seminar and nothing changed, that's entertainment, not education. Require a 'bring-back' report from every training with 3 specific things they'll implement.",
            coachingUnder:
              "Staff training at [X]% — untrained CAs cost you more than trained ones. A CA who can't handle a financial conversation loses 2-3 care plans per month. That's $5K-$10K in lost revenue because you didn't invest $500 in training. At minimum: one major CA training per year, monthly in-house scripting practice, and annual HIPAA compliance training.",
          },
          {
            id: "7130",
            code: "7130",
            label: "Coaching & Consulting",
            minPct: 0,
            maxPct: 1.5,
            midPct: 0.7,
            tooltip:
              "Practice management coaching (MaxLiving, Chiro Matchmakers, AMPED, etc.), business consulting, mastermind groups, and any ongoing coaching relationships. Includes monthly coaching fees, program tuition, and related event costs.",
            coachingOver:
              "Coaching at [X]% — coaching should have clear ROI. If you're paying $2K/month, you should point to at least $6K/month in growth directly from what you've implemented. If you've been in the same program 3+ years with flat numbers, it's become a comfort blanket, not a growth tool. Either re-engage with intensity or find a coach who challenges you differently.",
            coachingUnder:
              "Coaching at [X]% — the practices that grow fastest almost always have a coach. Not because the coach is magic, but because accountability works. If you're stuck at $30-$40K/month, an outside perspective can see what you can't. Budget $500-$1,500/month for a proven chiropractic coaching program. Interview 3 coaches, check references, and pick the one who makes you uncomfortable in the right way.",
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper: Flatten all items from all sections
// ---------------------------------------------------------------------------

export function getAllItems(): PLLineItem[] {
  return PL_SECTIONS.flatMap((section) =>
    section.categories.flatMap((cat) => cat.items),
  );
}

export function getExpenseItems(): PLLineItem[] {
  return PL_SECTIONS.filter((s) => s.type === "expenses")
    .flatMap((s) => s.categories.flatMap((c) => c.items));
}

export function getCOGSItems(): PLLineItem[] {
  return PL_SECTIONS.filter((s) => s.type === "cogs")
    .flatMap((s) => s.categories.flatMap((c) => c.items));
}

export function getIncomeItems(): PLLineItem[] {
  return PL_SECTIONS.filter((s) => s.type === "income")
    .flatMap((s) => s.categories.flatMap((c) => c.items));
}

// ---------------------------------------------------------------------------
// 2. SCALING_EXAMPLES — 4 Pre-built P&L Snapshots
// ---------------------------------------------------------------------------

export const SCALING_EXAMPLES: ScalingExample[] = [
  {
    id: "solo-starter",
    title: "The Solo Starter",
    subtitle: "$20K/mo — Just you and one CA",
    totalIncome: 20000,
    description:
      "You're doing everything: adjusting, marketing, managing. One CA handles the front. Every dollar matters.",
    targetProfit: "$8,000 - $9,000/month (40-45%)",
    lineItems: {
      // Income
      "4020": 19500,
      "4035": 1000,
      "4500": -300,
      "4600": -200,
      // COGS
      "5010": 250,
      "5020": 100,
      "5050": 300,
      // Expenses
      "6110": 500,
      "6120": 50,
      "6210": 0,
      "6221": 2800,
      "6222": 350,
      "6230": 200,
      "6291": 60,
      "6620": 1200,
      "6640": 220,
      "6650": 100,
      "6811": 50,
      "6812": 120,
      "6814": 350,
      "6816": 25,
      "6817": 180,
      "6818": 100,
      "6820": 200,
      "6823": 0,
      "6824": 30,
      "6825": 450,
      "6826": 80,
      "6828": 400,
      "6830": 150,
      "6831": 0,
      "6840": 200,
      "7010": 50,
      "7020": 100,
      "7040": 150,
      "7110": 300,
      "7120": 100,
      "7130": 0,
    },
  },
  {
    id: "growing-practice",
    title: "The Growing Practice",
    subtitle: "$50K/mo — Doctor + associate + 2-3 staff",
    totalIncome: 50000,
    description:
      "You've got an associate, 2 CAs, and maybe a part-time OM. Marketing is ramping up. You're reinvesting in growth while building real profit.",
    targetProfit: "$18,000 - $22,000/month (36-44%)",
    lineItems: {
      // Income
      "4020": 45000,
      "4035": 6500,
      "4500": -800,
      "4600": -700,
      // COGS
      "5010": 600,
      "5020": 300,
      "5050": 1000,
      // Expenses
      "6110": 2000,
      "6120": 200,
      "6210": 5000,
      "6221": 6000,
      "6222": 1600,
      "6230": 800,
      "6291": 120,
      "6620": 3000,
      "6640": 500,
      "6650": 300,
      "6811": 150,
      "6812": 350,
      "6814": 1000,
      "6816": 75,
      "6817": 500,
      "6818": 300,
      "6820": 400,
      "6823": 800,
      "6824": 50,
      "6825": 1200,
      "6826": 250,
      "6828": 800,
      "6830": 350,
      "6831": 0,
      "6840": 400,
      "7010": 75,
      "7020": 300,
      "7040": 400,
      "7110": 750,
      "7120": 300,
      "7130": 400,
    },
  },
  {
    id: "established-practice",
    title: "The Established Practice",
    subtitle: "$80K/mo — Multi-provider, full team",
    totalIncome: 80000,
    description:
      "Two or three providers, a dedicated OM, 3-4 CAs, and systems that run without you in every adjustment room. You're optimizing, not building.",
    targetProfit: "$28,000 - $36,000/month (35-45%)",
    lineItems: {
      // Income
      "4020": 70000,
      "4035": 13000,
      "4500": -1500,
      "4600": -1500,
      // COGS
      "5010": 1000,
      "5020": 500,
      "5050": 2000,
      // Expenses
      "6110": 3500,
      "6120": 400,
      "6210": 8000,
      "6221": 10000,
      "6222": 2800,
      "6230": 1600,
      "6291": 200,
      "6620": 4400,
      "6640": 880,
      "6650": 500,
      "6811": 300,
      "6812": 560,
      "6814": 1600,
      "6816": 150,
      "6817": 800,
      "6818": 500,
      "6820": 600,
      "6823": 1200,
      "6824": 80,
      "6825": 2000,
      "6826": 400,
      "6828": 1200,
      "6830": 560,
      "6831": 0,
      "6840": 800,
      "7010": 120,
      "7020": 500,
      "7040": 600,
      "7110": 1200,
      "7120": 480,
      "7130": 640,
    },
  },
  {
    id: "high-performance",
    title: "The High-Performance Practice",
    subtitle: "$150K/mo — Multi-doctor machine",
    totalIncome: 150000,
    description:
      "3-4 doctors, a COO running operations, 5+ support staff, and marketing that consistently delivers 30-50 new patients/month. The machine runs without you for days at a time.",
    targetProfit: "$52,000 - $67,000/month (35-45%)",
    lineItems: {
      // Income
      "4020": 130000,
      "4035": 25000,
      "4500": -2500,
      "4600": -2500,
      // COGS
      "5010": 1800,
      "5020": 900,
      "5050": 4000,
      // Expenses
      "6110": 6000,
      "6120": 800,
      "6210": 16500,
      "6221": 18500,
      "6222": 5500,
      "6230": 3000,
      "6291": 400,
      "6620": 8250,
      "6640": 1500,
      "6650": 1000,
      "6811": 600,
      "6812": 1050,
      "6814": 3000,
      "6816": 300,
      "6817": 1500,
      "6818": 800,
      "6820": 1100,
      "6823": 2000,
      "6824": 150,
      "6825": 3800,
      "6826": 750,
      "6828": 2200,
      "6830": 1000,
      "6831": 10000,
      "6840": 1500,
      "7010": 200,
      "7020": 800,
      "7040": 1200,
      "7110": 2250,
      "7120": 1050,
      "7130": 1200,
    },
  },
];

// ---------------------------------------------------------------------------
// 3. PROFIT_COACHING — Overall Profit Margin Guidance
// ---------------------------------------------------------------------------

export const PROFIT_COACHING: {
  minPct: number;
  maxPct: number;
  note: string;
}[] = [
  {
    minPct: 0,
    maxPct: 15,
    note: "This is a crisis. You're working full-time and barely covering costs. Something fundamental is broken — your collections are too low, your expenses are too high, or both. Don't try to fix everything at once. Look at your top 3 red items in the breakdown above — those are probably consuming 60-70% of the problem. Fix them first. If your total overhead is above 85%, you need to either dramatically increase collections or make hard cuts within 90 days. This is not sustainable.",
  },
  {
    minPct: 15,
    maxPct: 25,
    note: "You're surviving but not thriving. There's likely $3,000-$8,000/month hiding in your expense structure. The fix is usually in 2-3 line items, not everything. Most commonly: team costs are too high relative to revenue (grow volume before hiring again), rent is too expensive for your collections (negotiate or grow), or you're not investing enough in marketing to drive growth. Fix the biggest red item first.",
  },
  {
    minPct: 25,
    maxPct: 35,
    note: "Solid but not optimized. You're doing better than most chiropractic practices, but there's meaningful room to improve. Focus on your yellow items — the ones close to the edge. Small improvements across 3-4 categories can shift your profit margin by 5-8 points. Also look at your revenue side: a $5 increase in visit average across 400 monthly visits is $2,000/month with zero additional expense.",
  },
  {
    minPct: 35,
    maxPct: 45,
    note: "This is the zone. You're running a healthy, profitable practice. Protect this by not letting expenses creep. Every new expense should pass the 3x test: will this dollar generate $3 back? If yes, invest. If no, wait. Your biggest risk now is complacency. Practices at this level that stop tracking their P&L slip backward within 6-12 months.",
  },
  {
    minPct: 45,
    maxPct: 55,
    note: "Exceptional. You're in the top 10% of chiropractic practices by profitability. But make sure you're not under-investing in your future. Check: are you spending enough on marketing to sustain growth? Is your team compensated well enough to retain them? Sometimes being too lean limits your ceiling. A practice at 48% profit on $50K is great, but 40% on $80K puts more dollars in your pocket.",
  },
  {
    minPct: 55,
    maxPct: 100,
    note: "Either you're a machine or something's missing. Double-check that all expenses are captured: owner health insurance, retirement contributions, vehicle expenses, and any personal expenses running through the business. Verify that all payroll taxes are included. If the numbers are truly accurate at 55%+, you've built something remarkable — but consider whether reinvesting 5-10% could double your revenue within 18 months.",
  },
];
