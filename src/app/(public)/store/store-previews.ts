import type { ProductPreview } from "./store-data";

// ============================================================================
// Product Previews — Real content samples so buyers see what they're getting
// ============================================================================

export const PRODUCT_PREVIEWS: Record<string, ProductPreview[]> = {
  // ── Courses ────────────────────────────────────────────────────
  "course-clinical-identity": [
    {
      title: "Module 1: Finding Your Philosophy",
      type: "guide",
      content: `What kind of chiropractor do you want to be? This isn't a personality quiz — it's the foundation every clinical decision you make will rest on.

By the end of this module, you'll have a written clinical philosophy statement, a 30-second elevator pitch, and a clear answer to the question every patient will ask: "What makes you different?"

Topics covered:
• The 5 chiropractic practice models (and which fits you)
• Writing your philosophy statement (with 8 real examples)
• The elevator pitch formula that works in any setting
• How to talk about chiropractic without sounding salesy`,
    },
    {
      title: "Your First 90 Days Checklist",
      type: "checklist",
      content: `WEEK 1-2: Foundation
□ Finalize your clinical philosophy statement
□ Set up your professional social media profiles
□ Order business cards and professional headshot
□ Create a Google Business Profile
□ Identify 5 referral partners to contact

WEEK 3-4: Visibility
□ Reach out to 3 local businesses for partnerships
□ Post your first 5 pieces of educational content
□ Attend one local networking event
□ Schedule your first community talk/screening

MONTH 2-3: Momentum
□ Launch your referral program
□ Follow up with every referral partner
□ Collect your first 10 Google reviews
□ Evaluate what's working and double down`,
    },
  ],

  "course-business": [
    {
      title: "Module 2: P&L Fundamentals",
      type: "data",
      content: `THE CHIROPRACTIC P&L — WHAT YOUR NUMBERS SHOULD LOOK LIKE

Revenue:              100%
Cost of Services:      8-15%
Staff & Payroll:      20-28%
Facility:              7-12%
Marketing:             5-10%
Technology:            2-4%
Professional Services: 1.5-3%
═══════════════════════════
Owner Take-Home:      35-45%

If your take-home is below 35%, you have a leak. This module shows you exactly where to find it and how to fix it — line by line.`,
    },
    {
      title: "Fee Schedule Calculator (Sample)",
      type: "template",
      content: `VISIT TYPE          | YOUR FEE | MARKET AVG | STATUS
────────────────────┼──────────┼────────────┼────────
New Patient Exam    |  $___    |   $175     |
Standard Adjustment |  $___    |   $55      |
Decompression       |  $___    |   $45/sess |
Therapeutic Exercise|  $___    |   $35      |
X-Ray (2 views)     |  $___    |   $125     |
Re-Examination      |  $___    |   $95      |

💡 Rule of thumb: If you're more than 15% below market average, you're leaving money on the table. If you're 20%+ above, you need stronger value communication.`,
    },
  ],

  "course-clinical-confidence": [
    {
      title: "Report of Findings Script",
      type: "script",
      content: `"[PATIENT NAME], I want to walk you through exactly what we found today. I'm going to show you three things: what's happening, why it matters, and what we can do about it."

[Show scan results]

"See this area right here? This is telling us that your nervous system is working overtime in this region. It's like a circuit breaker that's been tripped — and it's been that way long enough that your body has started compensating."

[Pause — let them absorb]

"The good news? This is exactly what we're designed to help with. Here's what I'd recommend..."

[Present care plan with confidence — NOT as a suggestion, but as a professional recommendation]`,
    },
    {
      title: "Top 5 Patient Objections + Responses",
      type: "guide",
      content: `OBJECTION: "I need to think about it."
RESPONSE: "I totally understand. What specifically do you want to think through? Is it the time commitment, the financial piece, or something else?"
WHY IT WORKS: This isolates the real objection. 80% of the time, "I need to think about it" means "I have a question I haven't asked yet."

OBJECTION: "My insurance won't cover it."
RESPONSE: "I hear you. Let me ask you this — if your insurance covered acupuncture but not the thing that would actually fix the problem, would you choose based on coverage or results?"
WHY IT WORKS: Reframes from cost to value. Puts the decision back in their hands.

OBJECTION: "Can I just come when I feel pain?"
RESPONSE: "You absolutely can. But let me show you what happens when we do that versus what happens with consistent care..."
[Show before/after scans of consistent patient vs. drop-in patient]`,
    },
  ],

  "course-associate-playbook": [
    {
      title: "Module 1: What Owners Actually Want",
      type: "guide",
      content: `THE 3 THINGS EVERY PRACTICE OWNER MEASURES
(Whether they tell you or not)

1. PRODUCTION — Are you generating revenue?
   Target: 3x your total compensation
   Example: If you cost $8K/month (salary + taxes + benefits), you need to produce $24K+ in collections.

2. RETENTION — Do patients stay?
   Target: 85%+ PVA (Patient Visit Average)
   The owner is watching how many of YOUR patients complete care vs. drop off.

3. CULTURE — Do you make the team better?
   This is the intangible. Do the CAs like working with you? Do patients ask for you by name? Are you contributing energy or draining it?

Master all three and you become un-fireable. Miss one and you're always replaceable.`,
    },
    {
      title: "Compensation Negotiation Template",
      type: "template",
      content: `ASSOCIATE COMPENSATION COMPARISON

MODEL A: Base + Production Bonus
  Base salary: $60,000-$80,000/year
  Bonus: 20-25% of collections above $X threshold
  Best for: New associates, first 1-2 years

MODEL B: Percentage of Collections
  No base salary
  30-35% of personal collections
  Best for: Experienced associates, high-volume practices

MODEL C: Hybrid
  Lower base: $40,000-$50,000/year
  Higher percentage: 25-30% of collections
  Best for: Growing practices, associates who want upside

📋 KEY: Always negotiate these 3 things BEFORE you sign:
1. What counts as "your" collections?
2. How are walk-ins and new patients assigned?
3. What's the path to partnership/ownership?`,
    },
  ],

  // ── Workshop Kits ──────────────────────────────────────────────
  "workshop-stress-sleep": [
    {
      title: "Opening Script (First 2 Minutes)",
      type: "script",
      content: `"Raise your hand if you slept 8 hours last night and woke up feeling FULLY rested."

[Wait. Look around. Very few hands.]

"Okay, now raise your hand if you woke up this morning and the FIRST thing you needed — before you talked to your spouse, before you looked at your kids — was COFFEE."

[Hands go up everywhere. Smile.]

"Yeah. Most of the room. I want you to notice what you just told me. You told me that your body — the most sophisticated machine ever created — cannot turn itself ON without a chemical."

[Pause]

"Tonight I'm going to show you why. And it has nothing to do with your mattress."`,
    },
    {
      title: "Facebook Event Post (Copy & Paste)",
      type: "template",
      content: `What if the reason you can't sleep, can't focus, and feel exhausted all the time has nothing to do with your mattress, your coffee intake, or your age?

On [DATE], I'm hosting a FREE workshop at [PRACTICE NAME] where I'll show you the ONE system in your body that controls all of it — your sleep, your energy, your digestion, your mood.

This isn't a lecture. This isn't a sales pitch. This is 45 minutes that might completely change how you think about your health.

Limited to 25 seats. Comment SLEEP to reserve yours.

[DATE] | [TIME] | [LOCATION]`,
    },
    {
      title: "Post-Event Follow-Up Sequence",
      type: "template",
      content: `TEXT — Same Night (within 2 hours):
"Hi [NAME]! Thank you for coming tonight. I saw you signed up for a scan. My team will call you tomorrow to find a time. Text me here if you have questions!"

EMAIL — Day After:
Subject: Last night was great — here's what's next

TEXT — Day 3:
"Hey [NAME], just circling back — we have a few scan openings this week. Want me to hold one for you?"

TEXT — Day 7 (Final):
"Hi [NAME], last nudge — your complimentary scan is still available but I'm closing signups Friday. Reply if you'd still like to come in."`,
    },
  ],

  "workshop-pediatric": [
    {
      title: "The Lucas Story (Opening Hook)",
      type: "script",
      content: `"About two years ago, a mom brought her son into our office. Let's call him Lucas. Four years old. Not sleeping through the night. Full-body meltdowns — 45 minutes long. Daycare was suggesting an ADHD evaluation."

"His mom had tried everything. Pediatrician. OT. Elimination diets. Weighted blankets. Nothing worked."

"When we scanned Lucas's nervous system, we found massive stress in his upper cervical area — right where the brainstem connects. His nervous system was stuck in fight-or-flight. 24/7."

"I asked his mom one question: 'How was his birth?' Turns out — vacuum extraction."

[Pause. Let it land.]

"Within six weeks, Lucas was sleeping through the night. The meltdowns dropped from daily to maybe once a week. His teachers asked what changed."`,
    },
    {
      title: "Printed Flyer (Ready to Print)",
      type: "template",
      content: `YOUR CHILD'S NERVOUS SYSTEM
What Every Parent Needs to Know

FREE Workshop for Parents

Is your child struggling with:
• Sleep issues or bedtime battles?
• Focus or attention problems?
• Chronic ear infections?
• Anxiety or emotional meltdowns?

80% of neurological development happens before age 5.
Learn what you can do about it.

[DOCTOR NAME] | [PRACTICE NAME]
[DATE] | [TIME] | [LOCATION]

RSVP: [PHONE] or [WEBSITE]
Space is limited — bring a friend!`,
    },
  ],

  "workshop-corporate": [
    {
      title: "Email to Business Owner (Get Booked)",
      type: "template",
      content: `Subject: Free wellness lunch & learn for your team — no cost, no catch

Hi [NAME],

I run [PRACTICE NAME] here in [CITY]. I'd love to offer your team a free 30-minute wellness presentation during lunch.

It's called "Peak Performance: How Your Nervous System Controls Your Productivity" — designed for professionals who sit at desks.

Your team will learn:
— Why brain fog and afternoon crashes are connected
— How sitting is silently degrading their performance
— 3 strategies they can implement immediately

No cost. I bring the content — you provide the room.

Would you be open to a quick call?

[DOCTOR NAME] | [PHONE]`,
    },
  ],

  "workshop-dinner": [
    {
      title: "The Conversation Guide (Phase 1)",
      type: "script",
      content: `[Setting: Restaurant, 8-12 guests, no slides]

PHASE 1: THE WARM-UP (First 15 minutes)
Don't talk about health yet. Be a human first.

"So before we get into anything health-related, I'm curious — what's keeping everyone busy these days?"

[Let people share. Listen. Remember names and details.]

Then the bridge question:
"Can I ask everyone something? On a scale of 1-10, how would you rate your energy level right now — like, today?"

[Go around the table. Most will say 4-6.]

"Interesting. So most of us are running at about 50-60% capacity. What if I told you there's a reason for that — and it's probably not what you think?"

[Now they're leaning in. You've earned the right to teach.]`,
    },
  ],

  "workshop-reactivation": [
    {
      title: "Patient Appreciation Night Script",
      type: "script",
      content: `[High energy. Music playing. Food out.]

"Can I get everyone's attention for just 2 minutes?"

"First — raise your hand if you brought a guest tonight."
[Applause for those who did]

"YOU are the reason this practice exists. Not our marketing. Not our website. YOU. Every time you tell a friend, a coworker, a family member what this place has done for you — that's how we grow. So thank you."

"Now — I want to share 3 things that have changed since your last visit..."
[Share new equipment, services, or team updates — creates FOMO for lapsed patients]`,
    },
  ],

  // ── Contracts ──────────────────────────────────────────────────
  "contract-basic": [
    {
      title: "Sample Clause: Compensation Addendum",
      type: "template",
      content: `SECTION 4: COMPENSATION

4.1 Base Compensation. Employee shall receive a base salary of $_______ per [month/year], payable in accordance with Employer's standard payroll schedule.

4.2 Production Bonus. In addition to Base Compensation, Employee shall receive ___% of net collections personally generated by Employee in excess of $_______ per month.

4.3 Calculation Period. Production bonuses shall be calculated on a [monthly/quarterly] basis and paid within thirty (30) days of the close of each calculation period.

⚖️ ATTORNEY NOTE: Define "net collections" precisely. Does it include insurance adjustments? Refunds? PI settlements? Ambiguity here is the #1 source of associate compensation disputes.`,
    },
  ],

  "contract-standard": [
    {
      title: "Non-Compete Clause (Sample)",
      type: "template",
      content: `SECTION 8: NON-COMPETITION

8.1 Restricted Period. For a period of [12/18/24] months following termination of this Agreement, Employee shall not directly or indirectly engage in the practice of chiropractic within a radius of [X] miles from Employer's office located at [ADDRESS].

8.2 Non-Solicitation. During the Restricted Period, Employee shall not directly or indirectly solicit, contact, or attempt to solicit any patient who was treated at the Practice within the twelve (12) months preceding termination.

⚖️ ATTORNEY NOTE: Non-compete enforceability varies significantly by state. Some states (California, Oklahoma, North Dakota) prohibit them entirely. Others limit radius and duration. Have local counsel review before using. A 10-mile, 12-month restriction is generally the most defensible.`,
    },
  ],

  "contract-employment": [
    {
      title: "3 Compensation Models Included",
      type: "guide",
      content: `THIS CONTRACT INCLUDES 3 READY-TO-USE COMPENSATION MODELS:

MODEL A: Guaranteed Base + Bonus
Best for new associates. Provides security while building a patient base.
• Base: $5,000-$7,000/month guaranteed
• Bonus: 20-25% of collections above threshold
• Typical total comp Year 1: $70K-$90K

MODEL B: Pure Production
Best for experienced, high-producing associates.
• No base salary
• 30-35% of personal collections
• Typical total comp: $80K-$150K+ (unlimited upside)

MODEL C: Equity Track
Best for long-term retention and eventual ownership transition.
• Lower base + modest production bonus
• Equity vesting schedule (3-5 years)
• Includes buy-in formula and valuation method

Each model includes complete contract language, attorney annotations explaining every clause, and customizable placeholders.`,
    },
  ],

  "contract-bundle": [
    {
      title: "What's in the Bundle (12 Templates)",
      type: "checklist",
      content: `EMPLOYMENT & COMPENSATION
☑ Associate Doctor Employment Agreement (3 comp models)
☑ Independent Contractor Agreement
☑ Non-Compete / Non-Solicitation Agreement
☑ Compensation Addendum Template

PATIENT & FINANCIAL
☑ Patient Financial Agreement
☑ Informed Consent for Chiropractic Care
☑ Personal Injury Lien Template
☑ Payment Plan Agreement

OPERATIONS & LEGAL
☑ Office Policies & Procedures Manual Template
☑ Equipment Lease Agreement
☑ Buy-Sell Agreement (Partnership)
☑ Commercial Lease Review Checklist

BONUS: 20-Clause Library
Mix and match clauses for custom contracts: arbitration, indemnification, HIPAA compliance, termination, IP ownership, and more.`,
    },
  ],

  // ── Practice Tools ─────────────────────────────────────────────
  "pl-analyzer": [
    {
      title: "P&L Breakdown (Live Preview)",
      type: "data",
      content: `YOUR P&L AT A GLANCE

INCOME
  4020 Treatment Sales          $184,559
  4035 PI Collections            $21,615
  4500 Refunds                   -$2,842
  Total Income                 $197,182

COST OF GOODS SOLD
  5010 Equipment & Supplies       $2,277
  5050 Supplements                $4,314
  Total COGS                     $8,183
  ─────────────────────────────────────
  GROSS PROFIT                 $188,999

EXPENSES
  6200 Team                     $62,709
  6800 Overhead                 $38,225
  6100 Marketing                $23,854
  ...
  ─────────────────────────────────────
  NET INCOME                    $47,884  (24.3%)

⚠ Your profit margin is below the 35% target.
📍 #1 Problem: Team costs at 31.8% — benchmark is 20-28%.`,
    },
    {
      title: "Coaching Note (Sample)",
      type: "guide",
      content: `When your marketing spend hits 🔴 (over benchmark):

"Marketing at 12.3% — make sure you're tracking cost-per-new-patient for every channel. If Google Ads costs $150+ per new patient, optimize before spending more. The benchmark is $50-$100 per new patient from digital. If you can't attribute new patients to specific marketing spend, you're guessing, not marketing. Demand ROI data from every vendor and cut what doesn't produce."

Every line item gets a coaching note like this — personalized to YOUR numbers, with specific action steps. Not generic advice. Real guidance based on chiropractic benchmarks.`,
    },
  ],

  "billing-guide": [
    {
      title: "CPT Code Quick Reference (Sample)",
      type: "data",
      content: `MOST COMMON CHIROPRACTIC CPT CODES

98940  CMT — Spinal, 1-2 regions           $35-$55
98941  CMT — Spinal, 3-4 regions           $45-$65
98942  CMT — Spinal, 5 regions             $55-$75
98943  CMT — Extraspinal, 1+ regions       $30-$45
99202  New Patient E/M — Straightforward    $75-$125
99203  New Patient E/M — Low complexity     $100-$175
99213  Established E/M — Low complexity     $45-$85
97140  Manual Therapy — per 15 min          $30-$50
97110  Therapeutic Exercise — per 15 min    $25-$45
97112  Neuromuscular Re-ed — per 15 min     $30-$50

⚡ MODIFIER CHEAT SHEET:
-25: Significant, separately identifiable E/M
-59: Distinct procedural service
-GP: Services under outpatient PT plan
-AT: Active/corrective treatment (not maintenance)`,
    },
    {
      title: "Denial Appeal Letter (Template)",
      type: "template",
      content: `[PRACTICE LETTERHEAD]

RE: Appeal of Claim Denial
Patient: [NAME]  |  DOB: [DOB]  |  Claim #: [NUMBER]
Date of Service: [DATE]  |  CPT: [CODES]
Denial Reason: [REASON CODE]

Dear Claims Review Department,

I am writing to appeal the denial of the above-referenced claim. The services provided were medically necessary based on the following clinical findings:

1. [Objective findings from examination]
2. [Scan/imaging results if applicable]
3. [Functional limitations documented]
4. [Treatment plan rationale]

Per [INSURANCE] guidelines, Section [X], these services meet the criteria for medical necessity because [specific policy language].

Enclosed: office notes, scan reports, and treatment plan.

Respectfully,
[DOCTOR NAME], DC`,
    },
  ],

  "kpi-tracker": [
    {
      title: "Daily Dashboard (What You'll See)",
      type: "data",
      content: `TODAY'S NUMBERS              TARGET    ACTUAL    STATUS
────────────────────────────────────────────────────────
New Patients                   2         3        🟢
Total Patient Visits          40        37        🟡
Collections                $2,800    $2,450      🟡
Case Acceptance Rate          80%       85%       🟢
Referrals                      3         1        🔴

WEEKLY SCORECARD
──────────────────
Mon: 38 visits | $2,200 | 2 NP
Tue: 42 visits | $2,800 | 3 NP
Wed: 37 visits | $2,450 | 1 NP  ← Today
Thu: __ visits | $_____ | _ NP
Fri: __ visits | $_____ | _ NP

📈 TREND: Collections up 8% vs. last week
⚠ ALERT: Referrals trending below target 3 weeks in a row`,
    },
  ],

  "scan-report": [
    {
      title: "Sample Patient Report",
      type: "data",
      content: `╔══════════════════════════════════════════════╗
║   NERVOUS SYSTEM ASSESSMENT REPORT           ║
║   Patient: Sarah M.  |  Age: 42              ║
║   Date: April 19, 2026                       ║
╚══════════════════════════════════════════════╝

NERVOUS SYSTEM SCORE: 62/100

sEMG — Muscle Balance:
  Upper Cervical:  ■■■■■■■■░░  Right-dominant
  Mid Thoracic:    ■■■■■░░░░░  Balanced
  Lower Lumbar:    ■■■■■■■■■░  Left-dominant

Thermal Scan — Autonomic Function:
  Pattern: Sympathetic dominance (fight-or-flight)
  Significance: High — consistent with sleep disruption
  and stress-related symptoms

HRV — Adaptability Score: 38
  (Below average for age group. Target: 55+)

SUMMARY: Your nervous system is working harder than
it should. The patterns we see are consistent with
chronic stress adaptation. Targeted care can help
restore balance.`,
    },
  ],

  // ── Patient Products ───────────────────────────────────────────
  "patient-premium": [
    {
      title: "Daily Check-In (What It Looks Like)",
      type: "data",
      content: `Good morning! How are you feeling today?

Energy Level:     ★★★☆☆  (3/5)
Pain Level:       ★★☆☆☆  (2/5)  ↓ improving
Stress Level:     ★★★★☆  (4/5)
Sleep Quality:    ★★★☆☆  (3/5)

📊 YOUR 30-DAY TREND
Energy:  ████████████░░░  Trending up ↑
Pain:    ██████░░░░░░░░░  Down 40% ↓
Stress:  ██████████████░  Stable
Sleep:   ██████████░░░░░  Improving ↑

💡 TIP: Your pain levels drop significantly in the
2 days after each adjustment. Your next visit is
Thursday — keep it up!`,
    },
  ],

  "patient-ns-guide": [
    {
      title: "Chapter 1: What Does a Chiropractor Actually Do?",
      type: "guide",
      content: `Most people think chiropractors "crack backs." Here's what's actually happening.

A chiropractic adjustment is a precise, targeted correction to a specific segment of your spine. The goal isn't to "pop" anything — it's to restore proper motion and alignment so your nervous system can function without interference.

Think of it like this: your nervous system is the electrical wiring of your body. Your brain sends signals down your spinal cord and out through nerves to every organ, muscle, and cell. When a segment of your spine isn't moving properly, it's like a pinched wire — the signal gets disrupted.

An adjustment un-pinches the wire. That's it. Simple concept, profound results.

WHAT TO EXPECT AT YOUR FIRST VISIT:
• Health history and consultation (15-20 min)
• Physical examination and postural analysis
• Nervous system scans (painless, no radiation)
• Your doctor will explain what they find
• If care is recommended, they'll present a plan`,
    },
  ],
};
