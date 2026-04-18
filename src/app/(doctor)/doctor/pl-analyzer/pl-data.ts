// ============================================================================
// P&L Analyzer Data — Benchmark Structure, Scaling Examples, Profit Coaching
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PLLineItem {
  id: string;
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
  label: string;
  minPct: number;
  maxPct: number;
  items: PLLineItem[];
}

export interface ScalingExample {
  id: string;
  title: string;
  subtitle: string;
  collections: number;
  description: string;
  targetProfit: string;
  lineItems: Record<string, number>;
}

// ---------------------------------------------------------------------------
// 1. PL_CATEGORIES — The Benchmark Structure
// ---------------------------------------------------------------------------

export const PL_CATEGORIES: PLCategory[] = [
  // ── Cost of Services ────────────────────────────────────────────────
  {
    id: "cost-of-services",
    label: "Cost of Services",
    minPct: 8,
    maxPct: 15,
    items: [
      {
        id: "associate-comp",
        label: "Associate Compensation",
        minPct: 8,
        maxPct: 12,
        midPct: 10,
        tooltip:
          "Base salary plus production bonuses for associate doctors. Includes any guaranteed minimums. Does NOT include the owner-doctor's draw — that comes out of profit.",
        coachingOver:
          "Associate comp is at [X]%. That means your associate is consuming more than 12 cents of every dollar collected. Check the math: are they producing at least 3x their total cost? If an associate costs you $8K/month, they need to be generating $24K+ in collections. If they're not, it's either a volume problem (not enough patients) or a case-average problem (too many single-visit plans). Fix the schedule first — most associates are under-booked.",
        coachingUnder:
          "Associate comp at [X]% is low, which likely means you're either solo or your associate is on a heavily production-based deal. If you're solo, ignore this. If you have an associate producing but only costing you 6-7%, make sure the comp plan is competitive enough to retain them. Losing a producing associate costs you 3-6 months of revenue disruption.",
      },
      {
        id: "clinical-supplies",
        label: "Clinical Supplies",
        minPct: 1,
        maxPct: 2,
        midPct: 1.5,
        tooltip:
          "Table paper, cervical pillows, Biofreeze, traction supplies, KT tape, rehab bands, gowns, and any consumable used in patient care. Does NOT include durable equipment purchases — those go under Equipment Leases or capital expenditure.",
        coachingOver:
          "Clinical supplies at [X]% is higher than it should be. At $50K/month collections, that's over $1,000 on consumables. Are you tracking what gets used per visit? Common culprits: ordering name-brand when generics work, over-dispensing supplements without proper margin, or staff waste. Negotiate bulk pricing with your supplier and do a quarterly supply audit.",
        coachingUnder:
          "Supplies at [X]% — you're either extremely efficient or you're skimping on the patient experience. Make sure your tables have fresh paper, your rehab area is stocked, and you're not reusing single-use items to save $50/month. Patients notice.",
      },
    ],
  },

  // ── Staff & Payroll ─────────────────────────────────────────────────
  {
    id: "staff-payroll",
    label: "Staff & Payroll",
    minPct: 20,
    maxPct: 28,
    items: [
      {
        id: "front-desk-ca",
        label: "Front Desk / CA",
        minPct: 10,
        maxPct: 14,
        midPct: 12,
        tooltip:
          "All wages for front desk staff and chiropractic assistants, including part-time. This covers reception, scheduling, therapy application, X-ray techs if separate from CA role. Does NOT include office manager — that's its own line.",
        coachingOver:
          "Front desk and CA costs at [X]% — that's heavy. Before you cut hours, ask two questions: (1) Is every CA producing billable therapy? If not, cross-train them. A CA who does intake AND applies therapies is worth 2x a CA who only checks people in. (2) Are you overstaffed for your volume? If you see 80 visits/week, you need 1.5-2 FTE CAs, not 3. Match staffing to visit volume, not 'what feels comfortable.'",
        coachingUnder:
          "CA costs at [X]% — this is lean, possibly too lean. If your front desk is slammed, calls go to voicemail, and patients wait 15 minutes to check out, you're losing more in missed appointments than you'd spend on another part-time CA. One missed new patient per week at $2,500 case average = $10K/month in lost revenue. Hire before you're desperate.",
      },
      {
        id: "office-manager",
        label: "Office Manager",
        minPct: 4,
        maxPct: 6,
        midPct: 5,
        tooltip:
          "Salary for your office manager or practice administrator. If you don't have a dedicated OM, allocate the portion of your lead CA's salary that goes toward management duties. Includes any OM bonus or profit-sharing.",
        coachingOver:
          "Office manager at [X]% is above the healthy range. At $50K/month collections, 6% is $3,000 — which is fine for a great OM. But at 8%+, either your collections are too low for the salary, or you're paying OM wages for CA-level work. Your OM should be managing the P&L, running staff meetings, handling HR, and driving KPIs. If they're just answering phones and filing, you have an expensive CA, not an OM.",
        coachingUnder:
          "OM cost at [X]% — either you don't have one yet or you're underpaying them. If you're doing all the management yourself, calculate what your time is worth. If you could see 5 more patients a day instead of handling payroll and scheduling, that's $1,500-$2,500/week in production. A good OM pays for themselves in the first 90 days by freeing your clinical time.",
      },
      {
        id: "payroll-taxes-benefits",
        label: "Payroll Taxes & Benefits",
        minPct: 3,
        maxPct: 5,
        midPct: 4,
        tooltip:
          "Employer-side payroll taxes (FICA, FUTA, SUTA), workers' comp insurance, health insurance contributions, retirement plan matching, and any other employee benefits. Rule of thumb: payroll taxes alone run 7.65-10% of gross wages.",
        coachingOver:
          "Payroll burden at [X]% is high. Check your workers' comp classification code — chiropractic offices should be on a clerical rate, not a medical rate. Also review your health insurance plan. You don't need a Cadillac plan to attract good staff — a solid ICHRA or QSEHRA can save $500-$1,000/month while still offering real coverage. Shop your workers' comp annually.",
        coachingUnder:
          "Payroll burden at [X]% — double-check that you're not misclassifying employees as 1099 contractors. The IRS has cracked down hard on this in healthcare. If your 'contractor' CA has a set schedule, uses your equipment, and you control how they work — that's an employee. The penalties for misclassification are severe. Also make sure you're actually withholding properly.",
      },
      {
        id: "staff-ce",
        label: "Staff CE / Training",
        minPct: 0.5,
        maxPct: 1,
        midPct: 0.75,
        tooltip:
          "Continuing education for staff: CA training programs, front desk scripting workshops, billing certification courses, conference attendance for team members, and any staff development materials or subscriptions.",
        coachingOver:
          "Staff CE at [X]% — you're investing heavily in team development, which is admirable, but make sure there's ROI. Are the trainings translating into measurable improvements? Better retention, higher case acceptance, fewer billing errors? If your CA went to a $3,000 seminar and nothing changed in practice, that's entertainment, not education. Require a 'bring-back' report from every training.",
        coachingUnder:
          "Staff CE at [X]% — this is a red flag. Untrained CAs cost you more than trained ones. A CA who can't handle a financial conversation properly loses you 2-3 care plans per month. That's $5K-$10K in lost revenue because you didn't invest $500 in training. At minimum, budget for one major CA training per year and monthly in-house scripting practice.",
      },
    ],
  },

  // ── Facility ────────────────────────────────────────────────────────
  {
    id: "facility",
    label: "Facility",
    minPct: 7,
    maxPct: 12,
    items: [
      {
        id: "rent-lease",
        label: "Rent / Lease",
        minPct: 5,
        maxPct: 8,
        midPct: 6.5,
        tooltip:
          "Monthly lease payment including CAM (Common Area Maintenance) charges and property taxes if passed through. Does NOT include build-out loan payments — those go under equipment/loans. If you own the building, use the fair-market rent you'd charge a tenant as your number.",
        coachingOver:
          "Your rent is eating [X]% of revenue. For every dollar you collect, [X] cents goes straight to your landlord. Two moves: negotiate the lease down, or grow revenue so the percentage drops. Every $5K in new monthly collections drops your rent percentage by about 1%. If you're locked into an expensive lease, the fastest fix is always more volume. Also check: are you using all your square footage? If you have 2,000 sq ft but only use 1,200, you're paying for dead space.",
        coachingUnder:
          "Rent at [X]% — either you got a killer deal or your space is too small for growth. If patients are waiting in the hallway and you can't add a table because there's no room, cheap rent is costing you production. The right space should allow you to see 150-200+ visits/week without feeling cramped. Don't let a $500/month rent savings cap your growth at $30K/month.",
      },
      {
        id: "utilities",
        label: "Utilities",
        minPct: 1,
        maxPct: 1.5,
        midPct: 1.25,
        tooltip:
          "Electric, gas, water, trash, internet, and phone service for the office. Does NOT include cell phone plans for personal devices — that's a personal expense or goes under communication tech.",
        coachingOver:
          "Utilities at [X]% — this is higher than normal. Check your HVAC system; old units can double your electric bill. Get a programmable thermostat, switch to LED lighting, and make sure you're not on a commercial electric rate when you could be on a small-business rate. Also, your internet plan might be overkill — most practices don't need more than 200 Mbps.",
        coachingUnder:
          "Utilities at [X]% — this is fine. Not much to optimize here below 1%. Just make sure your internet is reliable enough that your EHR and payment systems never go down during business hours. A $50/month savings on internet isn't worth one system outage.",
      },
      {
        id: "maintenance-cleaning",
        label: "Maintenance / Cleaning",
        minPct: 0.5,
        maxPct: 1,
        midPct: 0.75,
        tooltip:
          "Janitorial service, office cleaning supplies, minor repairs, carpet cleaning, HVAC filter changes, pest control, and general upkeep. Does NOT include major renovations or build-out costs.",
        coachingOver:
          "Maintenance at [X]% — you're either overpaying your cleaning crew or dealing with a building that needs constant repair. Get competitive bids from 2-3 janitorial services. Most 1,500 sq ft offices should cost $400-$600/month to clean 3x/week. If repairs are the issue, talk to your landlord — most commercial leases put structural repairs on the landlord.",
        coachingUnder:
          "Maintenance at [X]% — make sure your office is actually clean. Walk through your office at 4pm on a Thursday and look at it through a new patient's eyes. Dust on the blinds, stains on the carpet, and a grimy bathroom will cost you more in lost referrals than a proper cleaning service. This is not where you save money.",
      },
      {
        id: "equipment-leases",
        label: "Equipment Leases",
        minPct: 1,
        maxPct: 3,
        midPct: 2,
        tooltip:
          "Monthly payments on leased equipment: tables, digital X-ray, decompression, laser, shockwave, and any financed equipment purchases. Includes build-out loan payments if financed through an equipment lender. Does NOT include small items bought outright — those are clinical supplies.",
        coachingOver:
          "Equipment leases at [X]% — you might have too much equipment relative to your revenue. The shiny-object trap is real: that $120K decompression table sounds great, but if it's only generating $2K/month in billings, the math doesn't work. For every piece of leased equipment, calculate: monthly lease payment vs. monthly revenue generated. If the ratio isn't at least 3:1, you overpaid or you're underutilizing it.",
        coachingUnder:
          "Equipment at [X]% — either you own everything outright (great) or you're running outdated equipment. If your X-ray system is 15+ years old, your tables are worn, or you're missing revenue-generating modalities like decompression or laser, this is the wrong place to be frugal. Good equipment pays for itself. A $2K/month lease that generates $8K/month in new billings is a 4x return.",
      },
    ],
  },

  // ── Marketing ───────────────────────────────────────────────────────
  {
    id: "marketing",
    label: "Marketing",
    minPct: 5,
    maxPct: 10,
    items: [
      {
        id: "digital-marketing",
        label: "Digital Marketing",
        minPct: 2,
        maxPct: 4,
        midPct: 3,
        tooltip:
          "Google Ads, Facebook/Instagram ads, SEO services, website hosting and maintenance, online review management, social media management, and any paid digital lead generation. Does NOT include your EHR's patient communication features — that's under technology.",
        coachingOver:
          "Digital marketing at [X]% — make sure you're tracking cost-per-lead and cost-per-new-patient. If Google Ads is costing you $150+ per new patient, optimize your campaigns before spending more. The benchmark is $50-$100 per new patient from Google Ads in most markets. If you're spending $2,000/month on SEO and can't point to specific ranking improvements and new patients from organic search, fire your SEO company. Demand monthly reports with real numbers.",
        coachingUnder:
          "Digital at [X]% — in 2026, this is dangerously low. 80%+ of new patients Google you before they call. If your website looks like it was built in 2015, you don't show up in 'chiropractor near me' searches, and you have 12 Google reviews while competitors have 200+, you're invisible. Start with Google Business Profile optimization and a review campaign — it's nearly free and moves the needle fast.",
      },
      {
        id: "community-marketing",
        label: "Community Marketing",
        minPct: 1,
        maxPct: 3,
        midPct: 2,
        tooltip:
          "Spinal screenings, health fairs, corporate lunch-and-learns, gym partnerships, school events, community sponsorships, charity event participation, and any external outreach. Includes materials, booth fees, and any giveaway costs.",
        coachingOver:
          "Community marketing at [X]% — are you tracking ROI on each event? A spinal screening that costs $500 (staff time + materials) should produce at least 3-5 new patients within 30 days. If you're sponsoring every Little League team and 5K race in town but can't trace any new patients back, you're doing charity, not marketing. Pick 2-3 high-ROI events per month and do them exceptionally well.",
        coachingUnder:
          "Community at [X]% — you're missing the highest-trust marketing channel in chiropractic. A doctor who shows up at a health fair, does a corporate lunch-and-learn, or partners with a local gym builds trust that no ad can replicate. Start with one screening per month at a local employer. Bring your best CA, show up with energy, and track every lead. Most practices get 5-15 leads per event.",
      },
      {
        id: "internal-marketing",
        label: "Internal Marketing",
        minPct: 1,
        maxPct: 2,
        midPct: 1.5,
        tooltip:
          "Patient appreciation events, referral reward programs, reactivation campaigns (mailers, emails, texts to inactive patients), in-office signage, patient education materials, and care class supplies. This is marketing to your EXISTING patient base.",
        coachingOver:
          "Internal marketing at [X]% — this is unusual to be over budget. Make sure you're not double-counting patient communication software here (that's tech). If you're running expensive patient appreciation events, scale them back. A pizza party and a heartfelt thank-you work better than an expensive catered affair. The ROI of internal marketing should be measured in reactivations and referrals per month.",
        coachingUnder:
          "Internal marketing at [X]% — your current patients are your cheapest source of new patients. A referred patient has 3x the lifetime value of a cold lead and costs almost nothing to acquire. If you're not running a referral program, doing care classes, and sending reactivation campaigns to patients who dropped off, you're leaving easy money on the table. Start a 'refer a friend' program this week — it costs almost nothing.",
      },
      {
        id: "branding-print",
        label: "Branding / Print",
        minPct: 0.5,
        maxPct: 1,
        midPct: 0.75,
        tooltip:
          "Business cards, brochures, branded merchandise, print ads (newspapers, magazines), direct mail campaigns, signage (indoor and outdoor), and any physical branding materials. Does NOT include digital ad spend.",
        coachingOver:
          "Branding/print at [X]% — print is rarely the best use of marketing dollars in 2026. If you're spending heavily on newspaper ads or direct mail, test cutting them for 90 days and see if new patient numbers change. Most practices find they don't. Invest the savings in digital and community marketing where tracking is precise. Keep business cards and brochures — ditch the rest unless you have data proving ROI.",
        coachingUnder:
          "Branding at [X]% — this is probably fine as long as your basic materials are professional. You need clean business cards, a professional brochure for referral partners, and decent signage. If you don't have these basics, invest $500-$1,000 to get them right. After that, your branding budget can stay lean.",
      },
    ],
  },

  // ── Technology ──────────────────────────────────────────────────────
  {
    id: "technology",
    label: "Technology",
    minPct: 2,
    maxPct: 4,
    items: [
      {
        id: "ehr",
        label: "EHR / Practice Management",
        minPct: 0.5,
        maxPct: 1,
        midPct: 0.75,
        tooltip:
          "Your electronic health record and practice management system (ChiroTouch, Jane, Atlas, Platinum, etc.). Includes monthly subscription, per-provider fees, and any add-on modules. Does NOT include billing software if that's a separate service.",
        coachingOver:
          "EHR at [X]% — you might be paying for features you don't use or extra user licenses you don't need. Call your EHR vendor and audit your plan. Many practices pay for the top tier but only use basic SOAP notes and scheduling. Also check: are you paying per-provider fees for associates who left? Unused licenses add up. If your EHR is genuinely too expensive, it may be time to evaluate alternatives.",
        coachingUnder:
          "EHR at [X]% — make sure you're not using a cheap system that's costing you in other ways. If your EHR is slow, crashes regularly, or doesn't integrate with your billing, the lost productivity costs more than a better system. A good EHR saves 15-30 minutes per day in documentation time. That's 2-3 more patients you could see.",
      },
      {
        id: "billing-software",
        label: "Billing Software / Service",
        minPct: 0.5,
        maxPct: 1,
        midPct: 0.75,
        tooltip:
          "Third-party billing service or claims software subscription. If you use an outside billing company, this is their fee (usually 6-8% of collections — include the full cost here). If you bill in-house using your EHR, this might be minimal. Includes clearinghouse fees, eligibility verification services, and any claims scrubbing tools.",
        coachingOver:
          "Billing at [X]% — if you're using an outside billing company and they're charging 8%+ of collections, negotiate or shop around. The market rate is 5-7% for chiropractic billing. If you're billing in-house and still spending this much, you may have too many separate software subscriptions that overlap. Consolidate where possible. One good billing platform beats three mediocre ones.",
        coachingUnder:
          "Billing at [X]% — are you doing all billing yourself? That's fine at $20K/month collections, but above $40K it's usually cheaper to outsource. Your time is worth $200-$400/hour clinically. If you spend 5 hours/week on billing, that's $4K-$8K/month in lost production. A billing service at $2K/month is a bargain by comparison.",
      },
      {
        id: "scanning-software",
        label: "Scanning / Diagnostic Software",
        minPct: 0.5,
        maxPct: 1,
        midPct: 0.75,
        tooltip:
          "Surface EMG, thermography, posture analysis, Insight Subluxation Station, CORESCORE, or any other diagnostic scanning technology. Includes monthly subscription, calibration, and maintenance fees.",
        coachingOver:
          "Scanning software at [X]% — make sure you're using it on every patient, every re-exam. If you paid for a $15K scanning system and only scan 30% of patients, your cost-per-scan is triple what it should be. The scanning pays for itself through better case acceptance (patients who see objective findings start care at 2x the rate). But only if you use it consistently. Build it into your standard new patient flow, every time.",
        coachingUnder:
          "Scanning at [X]% — if you don't have any objective outcome measures beyond X-ray, you're missing a powerful case-acceptance tool. Patients are visual — when they see their scan results, case acceptance rates jump from 60% to 85%+. Even a basic posture analysis system at $200/month can move the needle. This is one of the highest-ROI investments in the practice.",
      },
      {
        id: "communication-tech",
        label: "Communication Tools",
        minPct: 0.3,
        maxPct: 0.5,
        midPct: 0.4,
        tooltip:
          "Patient communication platforms (appointment reminders, two-way texting, email campaigns), phone systems (VoIP/RingCentral), and any patient engagement tools. Does NOT include social media ad spend — that's under digital marketing.",
        coachingOver:
          "Communication tools at [X]% — you may have overlapping systems. Do you need a separate texting platform AND your EHR's built-in reminders AND a third email tool? Consolidate. Most modern EHRs or a single platform like Demand Force or Podium can handle reminders, reviews, and two-way texting. You shouldn't need more than 2 communication tools total.",
        coachingUnder:
          "Communication at [X]% — are patients getting appointment reminders? If not, you're losing 5-10% of visits to no-shows. Automated text reminders alone reduce no-shows by 30-40%. At 100 visits/week, that's 3-4 extra visits per week or $1,200-$1,600/month in recovered revenue for a $150/month investment. This is a no-brainer.",
      },
      {
        id: "other-tech",
        label: "Other Technology",
        minPct: 0.2,
        maxPct: 0.5,
        midPct: 0.35,
        tooltip:
          "Everything else: cloud storage, cybersecurity tools, HIPAA compliance software, Microsoft 365 or Google Workspace, printers/copiers, IT support, and any other tech subscriptions not covered above.",
        coachingOver:
          "Other tech at [X]% — do a subscription audit. Log into every bank and credit card statement and list every recurring tech charge. Most practices find $200-$500/month in forgotten subscriptions: that Dropbox account nobody uses, the old fax service, the website plugin you forgot about. Cancel anything you haven't used in 60 days.",
        coachingUnder:
          "Other tech at [X]% — this is probably fine. Just make sure you have HIPAA-compliant email, a backup system for your patient data, and basic cybersecurity. A ransomware attack on a practice with no backup can cost $50K-$100K. Basic protection costs $50-$100/month.",
      },
    ],
  },

  // ── Professional Services ───────────────────────────────────────────
  {
    id: "professional-services",
    label: "Professional Services",
    minPct: 1.5,
    maxPct: 3,
    items: [
      {
        id: "accounting",
        label: "Accounting / Bookkeeping",
        minPct: 0.5,
        maxPct: 1,
        midPct: 0.75,
        tooltip:
          "CPA fees, monthly bookkeeping, tax preparation, payroll processing (if outsourced), and any financial advisory services. Includes QuickBooks or accounting software subscriptions.",
        coachingOver:
          "Accounting at [X]% — are you paying CPA rates for bookkeeping work? A CPA should do your taxes and quarterly reviews. Day-to-day bookkeeping can be done by a bookkeeper at $300-$500/month or even your OM with QuickBooks training. If your accountant is charging $1,500+/month, make sure you're getting strategic tax advice, not just data entry. Also: a good accountant should save you more in taxes than they cost.",
        coachingUnder:
          "Accounting at [X]% — if you're doing your own books or using a cheap service, make sure your financials are actually accurate. Bad books lead to bad decisions. At minimum, have a CPA do quarterly reviews and annual taxes. If you don't know your exact profit margin within $500 right now, you need better bookkeeping. You can't manage what you don't measure.",
      },
      {
        id: "legal",
        label: "Legal",
        minPct: 0.3,
        maxPct: 0.5,
        midPct: 0.4,
        tooltip:
          "Attorney fees for contract review, lease negotiations, employment law questions, entity structuring, and any ongoing legal retainer. Does NOT include malpractice insurance — that's a separate line item.",
        coachingOver:
          "Legal at [X]% — unless you're in active litigation, this is high. You shouldn't need a lawyer on retainer for routine operations. Build a relationship with a healthcare attorney, pay them for contract reviews as needed, and keep them on speed dial for emergencies. Budget $2K-$3K/year for proactive legal work (associate contracts, lease reviews) and keep the rest in reserve.",
        coachingUnder:
          "Legal at [X]% — this is fine for steady-state operations. But if you haven't had an attorney review your associate contract, your lease, or your employee handbook in the last 3 years, you're exposed. One employee lawsuit or lease dispute can cost $20K-$50K. Spend $1,000-$2,000 proactively to get your documents reviewed and sleep better at night.",
      },
      {
        id: "coaching",
        label: "Practice Coaching / Consulting",
        minPct: 0.5,
        maxPct: 1,
        midPct: 0.75,
        tooltip:
          "Chiropractic coaching programs, practice management consulting, mastermind groups, and business coaching. Includes monthly coaching fees, program tuition, and related travel for coaching events.",
        coachingOver:
          "Coaching at [X]% — coaching should have a clear ROI. If you're paying $2K/month for coaching, you should be able to point to at least $6K/month in growth directly attributable to what you've implemented. If you've been in the same coaching program for 3+ years and your numbers are flat, it's become a comfort blanket, not a growth tool. Either re-engage with intensity or find a program that challenges you.",
        coachingUnder:
          "Coaching at [X]% — the practices that grow fastest almost always have a coach. Not because the coach is magic, but because accountability works. If you're stuck at $30-$40K/month and can't figure out why, an outside perspective can see what you can't. Budget $500-$1,500/month for a proven chiropractic coaching program. Interview 3 coaches, check their references, and pick the one who makes you uncomfortable in the right way.",
      },
      {
        id: "malpractice-insurance",
        label: "Malpractice Insurance",
        minPct: 0.3,
        maxPct: 0.5,
        midPct: 0.4,
        tooltip:
          "Professional liability insurance for all providers. Includes the owner-doctor and any associates. Cost varies by state, coverage limits, and claims history. Does NOT include general liability or business insurance — those are separate.",
        coachingOver:
          "Malpractice at [X]% — shop your policy every 2-3 years. Get quotes from NCMIC, ChiroSecure, and at least one other carrier. Make sure your limits are appropriate — most practices need $1M/$3M occurrence-based coverage. If you're paying more because of claims history, focus on documentation quality. Clean notes are your best defense and will lower your premiums over time.",
        coachingUnder:
          "Malpractice at [X]% — make sure you actually have adequate coverage. Check your per-occurrence and aggregate limits. If you have an associate, make sure they're covered under your policy or have their own. An uncovered claim can bankrupt a practice. This is not negotiable — proper coverage is a cost of doing business.",
      },
      {
        id: "general-insurance",
        label: "General / Business Insurance",
        minPct: 0.3,
        maxPct: 0.5,
        midPct: 0.4,
        tooltip:
          "General liability, property insurance, business interruption, cyber liability, and any umbrella policies. Covers the business itself — slip-and-fall in the office, fire damage, data breaches, etc. Does NOT include malpractice or health insurance for employees.",
        coachingOver:
          "General insurance at [X]% — you may be over-insured or paying premium rates. Bundle your policies (general liability + property + cyber) with one carrier for a 10-15% discount. Also, review your coverage limits — you may be insuring for $2M in property when your actual equipment and build-out is worth $200K. Right-size your coverage annually.",
        coachingUnder:
          "General insurance at [X]% — make sure you have cyber liability coverage. If a data breach exposes patient records, HIPAA fines start at $100 per record. With 2,000 active patients, that's $200K before you even pay for breach notification. A cyber policy costs $500-$1,000/year and covers breach response, notification, and fines. Add it today if you don't have it.",
      },
    ],
  },

  // ── Doctor CE ───────────────────────────────────────────────────────
  {
    id: "doctor-ce",
    label: "Doctor CE",
    minPct: 1,
    maxPct: 3,
    items: [
      {
        id: "doctor-ce-item",
        label: "Seminars / Certifications / Travel",
        minPct: 1,
        maxPct: 3,
        midPct: 2,
        tooltip:
          "All continuing education for the owner-doctor and associate doctors: seminar tuition, certification programs, technique training, travel and lodging for CE events, and any related books or online courses. Does NOT include staff CE — that's under Staff & Payroll.",
        coachingOver:
          "Doctor CE at [X]% — you're investing heavily in your skills, which is great, but are you implementing what you learn? The most expensive seminar is the one you attend and do nothing with. Pick 1-2 core techniques or systems per year, implement them fully, measure the results, then move to the next. Chasing every new technique while mastering none is expensive and exhausting. Also, prioritize CE that directly impacts revenue: case management, communication, and advanced techniques you'll use daily.",
        coachingUnder:
          "Doctor CE at [X]% — if you haven't attended a major seminar in over a year, you're falling behind. The clinical and business landscape changes fast. At minimum, budget for your state-required CE hours plus one major technique or practice management seminar per year. The energy and ideas you bring back from a great event often produce a 30-60 day surge in production. It's also how you avoid burnout — getting around other driven doctors recharges you.",
      },
    ],
  },

  // ── Miscellaneous ───────────────────────────────────────────────────
  {
    id: "miscellaneous",
    label: "Miscellaneous",
    minPct: 1,
    maxPct: 2,
    items: [
      {
        id: "misc-item",
        label: "Office Supplies / Merchant Fees / Misc",
        minPct: 1,
        maxPct: 2,
        midPct: 1.5,
        tooltip:
          "Everything that doesn't fit elsewhere: office supplies (paper, toner, pens), credit card processing / merchant fees (typically 2-3% of card transactions), postage, parking, bank fees, meals with referral partners, and any other small recurring expenses.",
        coachingOver:
          "Misc expenses at [X]% — this category is where expense creep hides. Pull every transaction from last month and categorize it. You'll likely find subscriptions you forgot about, meals that aren't generating referrals, and supplies you're overpaying for. Credit card processing fees alone can be negotiated — if you process $30K+/month in cards, you have leverage. Call your processor and ask for a rate reduction, or switch to a flat-rate processor. Going from 3.2% to 2.6% on $30K saves $180/month.",
        coachingUnder:
          "Misc at [X]% — this is fine and probably accurate. Just make sure you're not categorizing things as misc that should be in other categories. Accurate categorization is how you spot problems early. If this number is suspiciously low, double-check that merchant fees are accounted for — many practices forget to include credit card processing costs.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 2. SCALING_EXAMPLES — 4 Pre-built P&L Snapshots
// ---------------------------------------------------------------------------

export const SCALING_EXAMPLES: ScalingExample[] = [
  // ── The Solo Starter — $20,000/month ────────────────────────────────
  {
    id: "solo-starter",
    title: "The Solo Starter",
    subtitle: "Just you and one CA. Lean, focused, building.",
    collections: 20000,
    description:
      "You're doing everything: adjusting, marketing, managing. One CA handles the front. Every dollar matters at this stage. The goal is to get to $30K so you can hire your second team member and start breathing.",
    targetProfit: "$8,000 - $9,000/month (40-45%)",
    lineItems: {
      // Cost of Services — no associate at this stage
      "associate-comp": 0,
      "clinical-supplies": 250, // 1.25%

      // Staff & Payroll — just one CA
      "front-desk-ca": 2400, // 12%
      "office-manager": 0, // you are the OM
      "payroll-taxes-benefits": 400, // 2% (taxes on CA only)
      "staff-ce": 100, // 0.5%

      // Facility
      "rent-lease": 1200, // 6%
      "utilities": 220, // 1.1%
      "maintenance-cleaning": 120, // 0.6%
      "equipment-leases": 350, // 1.75%

      // Marketing — invest here to grow
      "digital-marketing": 500, // 2.5%
      "community-marketing": 250, // 1.25%
      "internal-marketing": 200, // 1%
      "branding-print": 100, // 0.5%

      // Technology
      ehr: 150, // 0.75%
      "billing-software": 150, // 0.75%
      "scanning-software": 150, // 0.75%
      "communication-tech": 80, // 0.4%
      "other-tech": 50, // 0.25%

      // Professional Services
      accounting: 150, // 0.75%
      legal: 60, // 0.3%
      coaching: 150, // 0.75%
      "malpractice-insurance": 80, // 0.4%
      "general-insurance": 70, // 0.35%

      // Doctor CE
      "doctor-ce-item": 300, // 1.5%

      // Misc
      "misc-item": 300, // 1.5%
    },
    // Total expenses: $7,280 → Profit: $12,720 (but owner draw ~$4,000-5,000 from this)
    // Effective owner profit after reasonable draw: ~$8,000-$9,000
  },

  // ── The Growing Practice — $50,000/month ────────────────────────────
  {
    id: "growing-practice",
    title: "The Growing Practice",
    subtitle: "Doctor + associate + 2-3 staff. Investing in growth.",
    collections: 50000,
    description:
      "You've got an associate seeing patients, 2 CAs, and maybe a part-time OM. Marketing is ramping up. You're reinvesting in growth while building real profit. This is the hardest stage — expenses grow faster than revenue if you're not careful.",
    targetProfit: "$18,000 - $22,000/month (36-44%)",
    lineItems: {
      // Cost of Services
      "associate-comp": 5000, // 10%
      "clinical-supplies": 600, // 1.2%

      // Staff & Payroll
      "front-desk-ca": 6000, // 12% (2 CAs)
      "office-manager": 2500, // 5%
      "payroll-taxes-benefits": 2000, // 4%
      "staff-ce": 300, // 0.6%

      // Facility
      "rent-lease": 3000, // 6%
      "utilities": 550, // 1.1%
      "maintenance-cleaning": 350, // 0.7%
      "equipment-leases": 1000, // 2%

      // Marketing
      "digital-marketing": 1500, // 3%
      "community-marketing": 750, // 1.5%
      "internal-marketing": 600, // 1.2%
      "branding-print": 300, // 0.6%

      // Technology
      ehr: 350, // 0.7%
      "billing-software": 350, // 0.7%
      "scanning-software": 300, // 0.6%
      "communication-tech": 200, // 0.4%
      "other-tech": 150, // 0.3%

      // Professional Services
      accounting: 400, // 0.8%
      legal: 150, // 0.3%
      coaching: 400, // 0.8%
      "malpractice-insurance": 200, // 0.4%
      "general-insurance": 175, // 0.35%

      // Doctor CE
      "doctor-ce-item": 750, // 1.5%

      // Misc
      "misc-item": 750, // 1.5%
    },
    // Total expenses: $28,625 → Profit: $21,375 (42.75%)
  },

  // ── The Established Practice — $80,000/month ────────────────────────
  {
    id: "established-practice",
    title: "The Established Practice",
    subtitle: "Multi-provider, full team, mature systems.",
    collections: 80000,
    description:
      "Two or three providers, a dedicated OM, 3-4 CAs, and systems that run without you in every adjustment room. Marketing is dialed. You're optimizing, not building. The focus now is protecting margin while scaling smart.",
    targetProfit: "$28,000 - $36,000/month (35-45%)",
    lineItems: {
      // Cost of Services
      "associate-comp": 8000, // 10%
      "clinical-supplies": 960, // 1.2%

      // Staff & Payroll
      "front-desk-ca": 9600, // 12% (3 CAs)
      "office-manager": 4000, // 5%
      "payroll-taxes-benefits": 3200, // 4%
      "staff-ce": 480, // 0.6%

      // Facility
      "rent-lease": 4400, // 5.5%
      "utilities": 880, // 1.1%
      "maintenance-cleaning": 560, // 0.7%
      "equipment-leases": 1600, // 2%

      // Marketing
      "digital-marketing": 2400, // 3%
      "community-marketing": 1200, // 1.5%
      "internal-marketing": 960, // 1.2%
      "branding-print": 560, // 0.7%

      // Technology
      ehr: 480, // 0.6%
      "billing-software": 560, // 0.7%
      "scanning-software": 480, // 0.6%
      "communication-tech": 320, // 0.4%
      "other-tech": 240, // 0.3%

      // Professional Services
      accounting: 560, // 0.7%
      legal: 240, // 0.3%
      coaching: 640, // 0.8%
      "malpractice-insurance": 320, // 0.4%
      "general-insurance": 280, // 0.35%

      // Doctor CE
      "doctor-ce-item": 1200, // 1.5%

      // Misc
      "misc-item": 1200, // 1.5%
    },
    // Total expenses: $44,720 → Profit: $35,280 (44.1%)
  },

  // ── The High-Performance Practice — $150,000/month ──────────────────
  {
    id: "high-performance",
    title: "The High-Performance Practice",
    subtitle: "Multi-doctor operation. COO in place. Optimized machine.",
    collections: 150000,
    description:
      "3-4 doctors, a COO or senior OM running operations, 5+ support staff, and marketing that consistently delivers 30-50 new patients/month. You spend 60% of your time in the clinic and 40% on strategic growth. The machine runs without you for days at a time.",
    targetProfit: "$52,000 - $67,000/month (35-45%)",
    lineItems: {
      // Cost of Services
      "associate-comp": 16500, // 11% (2-3 associates)
      "clinical-supplies": 1800, // 1.2%

      // Staff & Payroll
      "front-desk-ca": 16500, // 11% (5+ CAs/support staff)
      "office-manager": 7500, // 5% (COO-level salary)
      "payroll-taxes-benefits": 6000, // 4%
      "staff-ce": 1050, // 0.7%

      // Facility
      "rent-lease": 8250, // 5.5%
      "utilities": 1500, // 1%
      "maintenance-cleaning": 1050, // 0.7%
      "equipment-leases": 3000, // 2%

      // Marketing
      "digital-marketing": 4500, // 3%
      "community-marketing": 2250, // 1.5%
      "internal-marketing": 1800, // 1.2%
      "branding-print": 1050, // 0.7%

      // Technology
      ehr: 900, // 0.6%
      "billing-software": 1050, // 0.7%
      "scanning-software": 750, // 0.5%
      "communication-tech": 600, // 0.4%
      "other-tech": 450, // 0.3%

      // Professional Services
      accounting: 1050, // 0.7%
      legal: 450, // 0.3%
      coaching: 1200, // 0.8%
      "malpractice-insurance": 600, // 0.4%
      "general-insurance": 525, // 0.35%

      // Doctor CE
      "doctor-ce-item": 2250, // 1.5%

      // Misc
      "misc-item": 2250, // 1.5%
    },
    // Total expenses: $84,825 → Profit: $65,175 (43.45%)
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
    note: "This is a crisis. You're working full-time and barely covering costs. Something fundamental is broken — your collections are too low, your expenses are too high, or both. Don't try to fix everything at once. Look at your top 3 red items in the breakdown above. Those 3 line items are probably consuming 60-70% of the problem. Fix them first. If your total overhead is above 85%, you need to either dramatically increase collections or make hard cuts within 90 days. This is not sustainable.",
  },
  {
    minPct: 15,
    maxPct: 25,
    note: "You're surviving but not thriving. There's likely $3,000-$8,000/month hiding in your expense structure that's being wasted. The fix is usually in 2-3 line items, not everything. Most commonly: you're overpaying for staff relative to revenue (grow volume before hiring again), your rent is too high for your collections (negotiate or grow), or you're not investing enough in marketing to drive growth. Fix the biggest red item first — that single change often shifts you 3-5 percentage points.",
  },
  {
    minPct: 25,
    maxPct: 35,
    note: "Solid but not optimized. You're doing better than most chiropractic practices, but there's still meaningful room to improve. Focus on your yellow items — the ones that are close to the edge but not quite red. Small improvements across 3-4 categories can shift your profit margin by 5-8 points. At $50K/month collections, that's an extra $2,500-$4,000/month in your pocket. Also look at your revenue side: a $5 increase in visit average across 400 monthly visits is $2,000/month with zero additional expense.",
  },
  {
    minPct: 35,
    maxPct: 45,
    note: "This is the zone. You're running a healthy, profitable practice that rewards you well for your work. Protect this by not letting expenses creep — it's tempting to add staff, upgrade equipment, and expand when things are going well. Every new expense should pass the 3x test: will this dollar generate $3 back? If yes, invest. If no, wait. Your biggest risk now is complacency. Keep marketing, keep training, keep measuring. Practices at this level that stop tracking their P&L slip backward within 6-12 months.",
  },
  {
    minPct: 45,
    maxPct: 55,
    note: "Exceptional. You're in the top 10% of chiropractic practices by profitability. But make sure you're not under-investing in your future. Check: are you spending enough on marketing to sustain growth? Is your team compensated well enough to retain them? Are you investing in equipment and technology that keeps your practice competitive? Sometimes being too lean limits your ceiling. A practice at 48% profit on $50K is great, but a practice at 40% profit on $80K puts more dollars in your pocket. Don't let margin obsession cap your revenue growth.",
  },
  {
    minPct: 55,
    maxPct: 100,
    note: "Either you're a machine or you're not accounting for everything. Double-check that all expenses are captured: owner health insurance, retirement contributions, vehicle expenses used for practice, home office if applicable, and any personal expenses running through the business. Also verify that your associate compensation and all payroll taxes are included. If the numbers are truly accurate at 55%+, you've built something remarkable — but strongly consider whether reinvesting 5-10% back into marketing and team development could double your revenue within 18 months.",
  },
];
