/**
 * Hiring Hub — Job templates, interview questions, reference templates,
 * stage email templates, and offer letter templates.
 *
 * All content is written for nervous-system-focused chiropractic practices
 * that use scanning technology (INSiGHT, sEMG, thermography, HRV).
 */

// ─── Pipeline ───────────────────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  "New",
  "Reviewing",
  "Phone Screen",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

// ─── 1. JOB_TEMPLATES ──────────────────────────────────────────────────────

export interface JobTemplate {
  id: string;
  label: string;
  title: string;
  type: string;
  description: string;
  requirements: string[];
  benefits: string[];
  category: string;
  employment_type: string;
  salary_min: number;
  salary_max: number;
  compensationType: string;
}

export const JOB_TEMPLATES: JobTemplate[] = [
  {
    id: "jt-associate-ft",
    label: "Associate Doctor (Full-Time)",
    title: "Associate Doctor (Full-Time)",
    type: "Associate",
    category: "Clinical",
    employment_type: "Full-time",
    description:
      "We are a nervous-system-focused chiropractic practice that measures every patient's progress with objective scanning technology — INSiGHT subluxation station, HRV, thermography, and sEMG. If you want to practice with purpose and proof, this is your office.\n\nAs our full-time Associate Doctor you will see 80-150 patient visits per day in a fast-paced, high-energy environment. Your mornings start with a team huddle where we review the day's schedule, celebrate wins, and align on patient milestones. You will perform initial consultations, deliver Reports of Findings that educate and inspire patients to commit to corrective care, and adjust a diverse caseload — from pediatric families to weekend warriors to post-surgical rehab cases. You will re-scan patients at regular intervals and use the data to modify care plans, keeping the clinical conversation grounded in objective outcomes rather than symptom chasing.\n\nGrowth here is real. We invest in quarterly continuing education, send doctors to seminars, and coach you weekly on communication, case management, and leadership. Many of our associates have gone on to open their own practices or step into partnership roles within the organization. We are looking for someone who treats chiropractic as a calling, not just a career — someone who gets fired up by a clear scan, mentors the clinical assistants, and stays late on Report of Findings day because the mission matters.\n\nIf you believe the adjustment changes lives and you want to practice in an office that proves it with data, send us your resume.",
    requirements: [
      "Doctor of Chiropractic degree from an accredited institution",
      "Active or eligible state chiropractic license",
      "Experience or strong interest in nervous system scanning technology (INSiGHT, thermography, sEMG)",
      "Comfortable delivering Report of Findings presentations",
      "Ability to manage 80-150 patient visits per day",
      "Excellent communication and patient education skills",
      "Commitment to corrective and wellness care models",
      "Willingness to participate in community outreach and health screenings",
    ],
    benefits: [
      "Competitive base salary plus production bonuses",
      "Health, dental, and vision insurance",
      "Paid continuing education and seminar attendance",
      "Malpractice insurance covered",
      "Paid time off and holidays",
      "Mentorship and weekly coaching sessions",
      "Clear pathway to partnership or ownership",
      "Scanning technology and digital X-ray on site",
    ],
    salary_min: 70000,
    salary_max: 130000,
    compensationType: "Annual salary + production bonus",
  },
  {
    id: "jt-associate-pt",
    label: "Associate Doctor (Part-Time)",
    title: "Associate Doctor (Part-Time)",
    type: "Associate",
    category: "Clinical",
    employment_type: "Part-time",
    description:
      "Looking for a part-time opportunity that does not ask you to water down your philosophy? We run a principled, nervous-system-focused chiropractic office where every patient is scanned, every adjustment is intentional, and every care plan is built on objective data — not insurance timelines.\n\nAs our part-time Associate Doctor you will work 2-3 days per week, seeing 40-80 visits on your scheduled days. You will perform consultations, deliver Reports of Findings, adjust patients across all age groups, and review progress scans with patients at milestone visits. Our scanning suite includes INSiGHT subluxation station with sEMG, thermography, and HRV — you will use these tools daily and learn to read them at a level most chiropractors never reach.\n\nA typical shift starts with a quick huddle with the CAs, then a steady flow of adjustments broken up by one or two new patient consultations. The afternoon may include a re-exam block where you walk patients through their updated scans, showing them exactly how their nervous system is responding to care. It is deeply satisfying work because you can see the change — and so can they.\n\nThis role is ideal for a doctor who wants to keep their skills sharp while balancing family, a second practice, or a teaching commitment. We offer flexibility on scheduling and a collaborative team that will have your back on busy days. If you are passionate about subluxation-based care and want to work in an office that matches your standards, let's talk.",
    requirements: [
      "Doctor of Chiropractic degree from an accredited institution",
      "Active state chiropractic license",
      "Comfortable with high-volume adjusting (40-80 visits per shift)",
      "Familiarity with nervous system scanning protocols preferred",
      "Strong Report of Findings and patient communication skills",
      "Reliable availability for agreed-upon schedule",
      "Alignment with corrective care philosophy",
    ],
    benefits: [
      "Competitive per-diem or hourly rate plus production bonus",
      "Flexible scheduling (2-3 days per week)",
      "Malpractice insurance covered on working days",
      "Access to scanning technology and digital X-ray",
      "Continuing education support",
      "Collaborative, mission-driven team environment",
    ],
    salary_min: 45000,
    salary_max: 80000,
    compensationType: "Per-diem + production bonus",
  },
  {
    id: "jt-ca",
    label: "CA / Chiropractic Assistant",
    title: "CA / Chiropractic Assistant",
    type: "Associate",
    category: "Support Staff",
    employment_type: "Full-time",
    description:
      "If you have ever worked in healthcare and felt like just another cog in the machine, this is different. We are a nervous-system-focused chiropractic office that uses advanced scanning technology to track every patient's progress — and our Chiropractic Assistants are at the center of making that experience seamless.\n\nAs a CA you are the engine of patient flow. You will greet patients, get them checked in and on the table, assist the doctor during adjustments, run INSiGHT nervous system scans (we train you — no prior experience needed), and help patients understand their care journey. On busy days you might scan 20-30 patients, prep exam rooms between visits, and still find time to call tomorrow's new patients to confirm their appointments.\n\nWhat makes our CAs different is depth of knowledge. You will learn to read thermography and sEMG patterns, understand what a subluxation does to the nervous system, and explain it in plain language to patients. You become a trusted extension of the doctor — not just someone who hands over a clipboard. Our best CAs have gone on to become office managers, scanning coordinators, and even enrolled in chiropractic school themselves.\n\nWe huddle every morning, celebrate patient wins weekly, and hold each other to high standards because the work matters. If you are energetic, coachable, and excited about helping people get healthy in a way that actually makes sense, we want to meet you. No healthcare experience required — just a great attitude and a willingness to learn.",
    requirements: [
      "High school diploma or equivalent",
      "Strong interpersonal and communication skills",
      "Ability to multitask in a fast-paced clinical environment",
      "Comfortable learning and operating scanning technology",
      "Basic computer skills for scheduling and patient management software",
      "Professional appearance and positive attitude",
      "Ability to stand for extended periods and assist with patient positioning",
      "No prior chiropractic experience required — we train thoroughly",
    ],
    benefits: [
      "Competitive hourly pay with performance bonuses",
      "Health insurance after 90 days",
      "Complimentary chiropractic care for you and immediate family",
      "Paid training on nervous system scanning technology",
      "Paid time off and holidays",
      "Career advancement opportunities within the practice",
      "Positive, mission-driven team culture",
    ],
    salary_min: 30000,
    salary_max: 42000,
    compensationType: "Hourly",
  },
  {
    id: "jt-front-desk",
    label: "Front Desk / Patient Coordinator",
    title: "Front Desk / Patient Coordinator",
    type: "Associate",
    category: "Support Staff",
    employment_type: "Full-time",
    description:
      "You are the first voice a patient hears and the first face they see — and in our office, that moment sets the tone for a life-changing health experience. We are a nervous-system-focused chiropractic practice that helps patients understand and improve the way their body functions, using advanced scanning technology and corrective care plans. Your job is to make every touchpoint feel personal, professional, and purposeful.\n\nAs our Patient Coordinator you will manage the front desk with confidence: answering phones, scheduling new and existing patients, verifying insurance, collecting payments, and keeping the daily schedule running on time. But this is not a sit-and-answer-the-phone job. You will proactively confirm appointments, follow up with patients who miss visits, and re-engage inactive patients through outreach calls and text campaigns. You will track daily statistics — show rate, new patients, reactivations — and report them at our morning huddle.\n\nThe best Patient Coordinators in chiropractic understand the mission. You will learn what our scans mean, why consistent care matters, and how to have real conversations with patients about staying on track with their care plan. When a patient calls to cancel, you do not just say okay — you care enough to find out why and help them recommit to their health goals.\n\nWe invest heavily in training and personal development. You will attend team workshops, get weekly coaching from the doctor, and have clear benchmarks for raises and advancement. If you are organized, warm, and driven by purpose — not just a paycheck — this role will challenge and reward you every single day.",
    requirements: [
      "Previous front desk, reception, or customer service experience preferred",
      "Excellent phone etiquette and interpersonal skills",
      "Strong organizational and multitasking ability",
      "Proficiency with scheduling software and basic computer applications",
      "Experience with insurance verification is a plus",
      "Professional demeanor and warm, welcoming personality",
      "Ability to handle a high-volume phone and walk-in environment",
      "Comfortable tracking and reporting daily key performance indicators",
    ],
    benefits: [
      "Competitive hourly pay with monthly bonus opportunities",
      "Health insurance after 90 days",
      "Complimentary chiropractic care for you and immediate family",
      "Paid training and professional development",
      "Paid time off and holidays",
      "Supportive, team-oriented culture",
      "Opportunities for advancement to Office Manager",
    ],
    salary_min: 32000,
    salary_max: 45000,
    compensationType: "Hourly",
  },
  {
    id: "jt-office-manager",
    label: "Office Manager",
    title: "Office Manager",
    type: "Associate",
    category: "Support Staff",
    employment_type: "Full-time",
    description:
      "Running a high-performance chiropractic office is like running a small business inside a healthcare practice — and our Office Manager is the person who makes it all work. We are a nervous-system-focused practice that sees 150+ patient visits per day, uses advanced scanning technology to track outcomes, and operates on clear KPIs for every role. If you thrive on systems, accountability, and leading a team toward a shared mission, this is your opportunity.\n\nYou will oversee daily operations: managing the front desk team and CAs, running the morning huddle, monitoring patient flow and schedule utilization, handling billing escalations, coordinating with vendors, and ensuring compliance with HIPAA and state regulations. You will own the practice's key metrics — collections, show rate, new patient conversion, retention — and work directly with the doctor to hit monthly targets. When the numbers dip, you diagnose the problem and fix it before it becomes a trend.\n\nBeyond operations, you are the culture keeper. You onboard new team members, coach underperformers, celebrate wins publicly, and create an environment where people want to show up and give their best. You attend leadership trainings, implement new systems, and bring ideas to the table that make the practice better.\n\nThe ideal candidate has managed a team before — ideally in healthcare or chiropractic — and understands that leadership is service. You are organized without being rigid, direct without being cold, and passionate about helping a practice grow. We offer a competitive salary, performance bonuses tied to practice growth, and a seat at the table where your voice genuinely matters.",
    requirements: [
      "2+ years management experience, healthcare or chiropractic preferred",
      "Proven ability to lead, coach, and hold a team accountable",
      "Strong understanding of practice KPIs: collections, show rate, new patients, retention",
      "Experience with practice management software and billing systems",
      "HIPAA compliance knowledge",
      "Excellent written and verbal communication",
      "Ability to manage budgets, vendor relationships, and office logistics",
      "Problem solver who takes initiative without waiting for direction",
    ],
    benefits: [
      "Competitive salary with quarterly performance bonuses",
      "Health, dental, and vision insurance",
      "Complimentary chiropractic care for you and immediate family",
      "Paid continuing education and leadership development",
      "Paid time off and holidays",
      "Direct partnership with the doctor on practice growth strategy",
      "Clear career advancement path",
    ],
    salary_min: 48000,
    salary_max: 68000,
    compensationType: "Annual salary + performance bonus",
  },
  {
    id: "jt-billing",
    label: "Billing Specialist",
    title: "Billing Specialist",
    type: "Associate",
    category: "Support Staff",
    employment_type: "Full-time",
    description:
      "Chiropractic billing is a specialty — and in our office, we treat it that way. We are a nervous-system-focused practice that provides corrective care plans, uses advanced scanning technology for objective documentation, and sees a high volume of patients under both insurance and cash-pay models. Our Billing Specialist is the person who ensures every visit is coded correctly, every claim goes out clean, and every dollar earned actually makes it to the bank.\n\nYour day-to-day includes verifying insurance benefits for new patients, submitting claims electronically, posting payments, following up on denied or outstanding claims, managing patient balances, and running weekly collections reports. You will work closely with the front desk team to ensure patient financial arrangements are set up correctly from Day 1, and you will communicate directly with patients when billing questions arise — always with professionalism and empathy.\n\nWhat sets this role apart is the connection to clinical care. You will understand our scanning protocols, know why certain codes are used, and be able to explain to an insurance company exactly why a 24-visit corrective care plan is medically necessary — backed by objective neurological data. This is not mindless data entry; it is strategic work that directly impacts the practice's ability to serve more patients.\n\nWe are looking for someone detail-oriented, persistent, and fluent in chiropractic billing codes (97140, 98940-98943, 99201-99215). If you have worked in chiropractic billing before, you know how satisfying it is when the AR is clean and the collections are on target. If that sounds like your kind of win, we would love to hear from you.",
    requirements: [
      "2+ years medical or chiropractic billing experience",
      "Proficiency with CPT codes commonly used in chiropractic (97140, 98940-98943, etc.)",
      "Experience with electronic claims submission and ERA/EOB processing",
      "Familiarity with major insurance carriers and their chiropractic policies",
      "Strong attention to detail and organizational skills",
      "Experience with practice management and billing software",
      "Knowledge of HIPAA regulations related to billing and patient information",
      "Excellent communication skills for patient billing inquiries",
    ],
    benefits: [
      "Competitive salary based on experience",
      "Health insurance after 90 days",
      "Complimentary chiropractic care for you and immediate family",
      "Paid time off and holidays",
      "Ongoing training on chiropractic-specific billing updates",
      "Supportive team environment with clear expectations",
      "Remote or hybrid work possible after training period",
    ],
    salary_min: 38000,
    salary_max: 55000,
    compensationType: "Annual salary",
  },
  {
    id: "jt-massage",
    label: "Massage Therapist",
    title: "Massage Therapist",
    type: "Associate",
    category: "Clinical",
    employment_type: "Full-time",
    description:
      "Massage therapy in our office is not a spa experience — it is a clinical tool that works hand-in-hand with chiropractic adjustments to help patients heal faster and hold their corrections longer. We are a nervous-system-focused practice that uses INSiGHT scanning technology to objectively measure how patients are responding to care, and our Massage Therapist is a key member of the clinical team.\n\nYou will see 6-10 patients per day, performing therapeutic massage sessions that are prescribed as part of each patient's individualized care plan. The doctor will brief you on each patient's subluxation patterns, areas of tension, and clinical goals so your work is targeted and purposeful. You are not working off a generic relaxation menu — you are addressing specific neurological and musculoskeletal patterns that show up on our scans. Common modalities include deep tissue, myofascial release, trigger point therapy, and neuromuscular technique.\n\nBetween sessions, you will document your findings, communicate with the doctor about patient responses, and participate in the morning team huddle. You will also have opportunities to educate patients about how soft tissue work supports their nervous system correction — deepening their commitment to the full care plan.\n\nOur ideal candidate is a licensed massage therapist who wants to practice with clinical purpose, not just fill hours. If you are tired of high-turnover spa environments and want to be part of a team that tracks outcomes and celebrates patient transformations, this is your practice. We offer a consistent schedule, steady patient flow, competitive pay, and a team that genuinely respects what you do.",
    requirements: [
      "Active state massage therapy license",
      "Proficiency in deep tissue, myofascial release, and trigger point therapy",
      "Ability to perform 6-10 sessions per day with proper body mechanics",
      "Experience in a clinical or chiropractic setting preferred",
      "Strong documentation and communication skills",
      "Professional, patient-centered approach",
      "Willingness to collaborate with the chiropractic team on care plans",
      "CPR/First Aid certification preferred",
    ],
    benefits: [
      "Competitive per-session or hourly rate plus tips",
      "Consistent patient schedule — no building your own book",
      "Health insurance after 90 days",
      "Complimentary chiropractic care for you and immediate family",
      "Paid time off and holidays",
      "Continuing education support for advanced certifications",
      "Clinical mentorship and team collaboration",
      "All supplies and equipment provided",
    ],
    salary_min: 40000,
    salary_max: 65000,
    compensationType: "Per-session + tips",
  },
  {
    id: "jt-xray-tech",
    label: "X-Ray Technician",
    title: "X-Ray Technician",
    type: "Associate",
    category: "Clinical",
    employment_type: "Full-time",
    description:
      "In our office, X-rays are not an afterthought — they are a foundational piece of the clinical picture. We are a nervous-system-focused chiropractic practice that combines structural X-ray analysis with INSiGHT scanning technology to build precise, individualized corrective care plans. Our X-Ray Technician ensures every image is taken with the accuracy and positioning that our analysis demands.\n\nYour primary responsibility is taking full-spine and sectional radiographs according to our specific protocols. Positioning matters here — we analyze spinal curves, disc angles, and vertebral alignment in detail, so films need to be consistent and high quality. You will also assist with patient intake on X-ray days, explain the imaging process to new patients (many of whom have never had a standing full-spine X-ray before), and maintain all equipment and compliance records.\n\nBeyond imaging, you will work alongside the doctor during Report of Findings presentations, pulling up films and scans as the doctor walks patients through their results. You will learn to see what the doctor sees — the loss of cervical curve, the compensatory patterns, the disc degeneration that tells a story of years of subluxation. This clinical fluency makes you a more valuable team member and opens doors for career growth.\n\nWe keep our X-ray suite modern and well-maintained, and we follow all state radiation safety protocols. The ideal candidate is a certified or registered radiologic technologist who wants to work in a practice where imaging is respected as a clinical art — not just a checkbox. If you take pride in a perfectly positioned lateral cervical and want to be part of a team that cares about precision, apply today.",
    requirements: [
      "ARRT certification or state radiologic technologist license",
      "Experience with full-spine and sectional chiropractic radiography preferred",
      "Knowledge of radiation safety protocols and ALARA principles",
      "Strong attention to detail in patient positioning and film quality",
      "Ability to operate and perform basic maintenance on digital X-ray equipment",
      "Professional patient communication skills",
      "Basic computer skills for digital image management",
      "CPR/First Aid certification preferred",
    ],
    benefits: [
      "Competitive hourly pay based on experience and certification",
      "Health insurance after 90 days",
      "Complimentary chiropractic care for you and immediate family",
      "Paid time off and holidays",
      "Continuing education support for maintaining certification",
      "Collaborative clinical team environment",
      "Modern digital X-ray equipment",
      "Consistent weekday schedule with no on-call requirements",
    ],
    salary_min: 38000,
    salary_max: 58000,
    compensationType: "Hourly",
  },
];

// ─── 2. INTERVIEW_QUESTIONS ────────────────────────────────────────────────

export interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  whyAsk: string;
  greatAnswer: string;
  redFlags: string;
}

export const INTERVIEW_CATEGORIES = [
  "Clinical Philosophy",
  "Production & Work Ethic",
  "Team & Culture",
  "Commitment & Growth",
  "Red Flag Questions",
];

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // ── Clinical Philosophy ──────────────────────────────────────────────
  {
    id: "iq-cp-1",
    category: "Clinical Philosophy",
    question:
      "Walk me through your understanding of subluxation and how it impacts the nervous system.",
    whyAsk:
      "This immediately reveals whether the candidate thinks structurally/symptom-based or truly understands the neurological model. It separates chiropractors who adjust pain from those who correct interference.",
    greatAnswer:
      "They describe subluxation as a neurological event — vertebral misalignment causing interference to nerve communication, affecting organ function, immune response, and adaptability — not just 'a bone out of place that causes back pain.'",
    redFlags:
      "They reduce subluxation to pain or musculoskeletal dysfunction only, or they seem unfamiliar with the term and default to generic 'alignment' language.",
  },
  {
    id: "iq-cp-2",
    category: "Clinical Philosophy",
    question:
      "Have you worked with scanning technology like INSiGHT, sEMG, thermography, or HRV? How did you use the data clinically?",
    whyAsk:
      "Scanning is central to your practice. You need to know if they have hands-on experience or if you are training from scratch — and whether they respect objective data or see it as optional.",
    greatAnswer:
      "They describe using scans to establish baselines, track patient progress, guide care plan modifications, and show patients objective improvement during re-exams. Bonus if they mention using scans in the Report of Findings.",
    redFlags:
      "They dismiss scanning as unnecessary or a sales tool. They say they 'tried it once but didn't see the value.' This suggests they are unlikely to adopt your protocols willingly.",
  },
  {
    id: "iq-cp-3",
    category: "Clinical Philosophy",
    question:
      "How do you deliver a Report of Findings? Walk me through your process from start to finish.",
    whyAsk:
      "The ROF is where patients commit to care. A strong associate needs to educate, inspire, and close — not just read off a sheet of findings. This reveals their communication skill and patient conversion ability.",
    greatAnswer:
      "They describe a structured presentation: reviewing history, explaining scans and X-rays in patient-friendly language, connecting findings to the patient's chief complaint AND overall health, recommending a specific care plan, and addressing the financial investment confidently.",
    redFlags:
      "They rush through it, treat it as an afterthought, or seem uncomfortable discussing money and commitment. If they say 'I just tell them what I found and let them decide,' they likely have poor case acceptance.",
  },
  {
    id: "iq-cp-4",
    category: "Clinical Philosophy",
    question:
      "What is your philosophy on pediatric and family care? Should children be checked for subluxation?",
    whyAsk:
      "Family and pediatric care is a growth engine for nervous-system practices. You need to know if the candidate is comfortable — and confident — adjusting kids and communicating the value to parents.",
    greatAnswer:
      "They enthusiastically support checking children from birth, explain that the nervous system develops rapidly in early years, and can articulate why proactive care matters. They reference specific pediatric adjusting techniques and are comfortable with the conversation.",
    redFlags:
      "They seem hesitant or say 'only if there is a problem.' They express liability concerns about pediatric adjusting or say they have never adjusted a child and are not interested in learning.",
  },
  {
    id: "iq-cp-5",
    category: "Clinical Philosophy",
    question:
      "A patient is halfway through their corrective care plan and wants to stop because they feel better. What do you do?",
    whyAsk:
      "This tests whether they cave to patient pressure or stand firm on corrective care. It also reveals whether they can use objective data (scans) to re-engage a patient versus relying on 'trust me' authority.",
    greatAnswer:
      "They describe pulling up the patient's scans, showing them where objective improvement has occurred and where the nervous system still needs correction, and re-connecting the patient to their original health goals — not just current symptoms.",
    redFlags:
      "They say 'I respect the patient's choice' and let them go without a real conversation. Or they use guilt or fear tactics instead of education. Both indicate poor retention and weak case management.",
  },
  {
    id: "iq-cp-6",
    category: "Clinical Philosophy",
    question:
      "How do you feel about wellness care — continuing to see patients after their corrective plan is complete?",
    whyAsk:
      "Wellness and maintenance care is the long-term revenue and community-building engine of the practice. You need someone who genuinely believes in lifetime care, not just acute episodes.",
    greatAnswer:
      "They believe wellness care is the natural continuation of corrective care — maintaining nervous system function, preventing re-injury, and optimizing health. They can explain it to patients in a way that feels like a benefit, not an upsell.",
    redFlags:
      "They see wellness care as optional or 'not evidence-based.' They are only comfortable treating acute complaints and discharging patients. This doctor will not build a long-term caseload.",
  },

  // ── Production & Work Ethic ──────────────────────────────────────────
  {
    id: "iq-pw-1",
    category: "Production & Work Ethic",
    question:
      "What is the highest patient volume you have managed in a single day, and what was your comfort level?",
    whyAsk:
      "Volume capacity is non-negotiable in a high-performance office. This tells you whether they can physically and mentally handle your pace or if they will burn out in the first month.",
    greatAnswer:
      "They give a specific number (80+), describe the flow systems that made it possible, and express genuine enjoyment of a busy, purposeful day. They talk about rhythm, efficiency, and team coordination.",
    redFlags:
      "They max out at 15-20 patients and seem stressed by the idea of more. They prioritize 'quality time' per visit in a way that signals 45-minute appointments, which will not scale in your model.",
  },
  {
    id: "iq-pw-2",
    category: "Production & Work Ethic",
    question:
      "How do you feel about tracking your numbers — daily visits, new patients, collections, show rate?",
    whyAsk:
      "Data-driven practices run on KPIs. If a candidate is resistant to being measured, they will resist accountability. You need someone who sees numbers as a coaching tool, not a threat.",
    greatAnswer:
      "They embrace it. They describe tracking their own stats, using the data to identify patterns, and feeling motivated by hitting targets. Bonus if they can cite their current or most recent numbers from memory.",
    redFlags:
      "They say numbers are 'corporate' or 'not why they got into chiropractic.' They become visibly uncomfortable or defensive. This is a mindset mismatch that training cannot fix.",
  },
  {
    id: "iq-pw-3",
    category: "Production & Work Ethic",
    question:
      "Tell me about a time you went above and beyond for a patient or your team — something that was not in your job description.",
    whyAsk:
      "This reveals intrinsic motivation and ownership mentality. You want people who see a need and fill it without being asked — not clock-punchers waiting for instructions.",
    greatAnswer:
      "They share a specific, detailed story — staying late for an emergency patient, learning a new skill to help the team, organizing a community event, calling a struggling patient on their day off. The story should show initiative and genuine care.",
    redFlags:
      "They cannot think of an example, or the example is something that was clearly within their normal duties. Lack of above-and-beyond stories usually indicates a transactional work ethic.",
  },
  {
    id: "iq-pw-4",
    category: "Production & Work Ethic",
    question:
      "How do you handle a slow day when the schedule has gaps or cancellations?",
    whyAsk:
      "Slow days happen. How someone fills that time reveals whether they are a builder or a bystander. Producers find ways to generate activity; passengers wait for the next patient to show up.",
    greatAnswer:
      "They describe reactivation calls, reviewing care plans for upcoming re-exams, practicing ROF presentations, organizing the office, prepping for community events, or reaching out to referral partners. They see downtime as opportunity.",
    redFlags:
      "They scroll their phone, leave early, or 'catch up on notes' for the entire block. If their instinct during slow time is passive, they will not help you grow the practice.",
  },
  {
    id: "iq-pw-5",
    category: "Production & Work Ethic",
    question:
      "What does your ideal daily schedule look like in terms of adjusting hours, new patients, and admin time?",
    whyAsk:
      "This exposes whether their expectations align with your actual schedule. If they want to see 10 patients in 8 hours with a 2-hour lunch, there is a mismatch you need to catch now.",
    greatAnswer:
      "Their answer maps closely to your actual schedule. They are comfortable with morning and afternoon adjusting blocks, dedicated new patient and ROF time, and a tight lunch. They ask about your schedule rather than demanding their own.",
    redFlags:
      "They insist on no mornings, no evenings, long breaks, or maximum patient caps that are far below your office volume. Rigidity on schedule before they are even hired signals future conflict.",
  },

  // ── Team & Culture ───────────────────────────────────────────────────
  {
    id: "iq-tc-1",
    category: "Team & Culture",
    question:
      "Describe the best team you have ever been a part of. What made it work?",
    whyAsk:
      "This tells you what they value in a team dynamic and whether it aligns with your office culture. People who loved great teams can usually recreate that energy. People who have never experienced it may struggle.",
    greatAnswer:
      "They describe clear communication, shared mission, mutual accountability, celebrating wins together, and a leader who invested in their growth. The specificity of their answer shows they paid attention to what made it work.",
    redFlags:
      "They cannot name one, or every team story ends with 'it fell apart because of bad management.' If they are always the victim of bad teams, they may be the common denominator.",
  },
  {
    id: "iq-tc-2",
    category: "Team & Culture",
    question:
      "How do you handle conflict with a coworker — say, a CA who keeps running behind on scans and it is slowing down your patient flow?",
    whyAsk:
      "Conflict between doctors and CAs is the number one culture killer in chiropractic offices. You need someone who addresses issues directly and professionally, not someone who complains behind the scenes or explodes.",
    greatAnswer:
      "They describe having a calm, private conversation first — focusing on the impact to patient care, asking if there is a systems issue, and offering to help solve it together. They escalate to management only if the direct conversation does not work.",
    redFlags:
      "They say they would go straight to you (the boss) without trying to resolve it themselves. Or they say they would 'just deal with it' and let resentment build. Both create toxic dynamics.",
  },
  {
    id: "iq-tc-3",
    category: "Team & Culture",
    question:
      "How do you respond to constructive feedback from someone who is not a doctor — like an office manager or lead CA?",
    whyAsk:
      "Ego is a real problem with some associates. If they cannot receive feedback from non-doctors, your office manager's authority is undermined and your culture fragments.",
    greatAnswer:
      "They genuinely welcome it. They share an example of feedback from a non-clinical team member that made them better. They understand that the office manager and CAs see things the doctor cannot.",
    redFlags:
      "They bristle at the idea, say 'I only take clinical feedback from other doctors,' or subtly imply the question itself is beneath them. Ego will poison your team.",
  },
  {
    id: "iq-tc-4",
    category: "Team & Culture",
    question: "What role do you play in morning huddles and team meetings?",
    whyAsk:
      "Huddles are the heartbeat of the practice. You need someone who shows up engaged, contributes, and uses the information — not someone who zones out or sees it as wasted time.",
    greatAnswer:
      "They actively participate — sharing patient updates, asking about the schedule, celebrating team wins, and bringing energy. They see the huddle as essential to a great day, not an interruption before the 'real work.'",
    redFlags:
      "They say huddles are 'too long' or 'not necessary.' They describe sitting quietly and waiting for it to end. Disengagement in huddles predicts disengagement in the culture.",
  },
  {
    id: "iq-tc-5",
    category: "Team & Culture",
    question:
      "Our front desk coordinator will sometimes need to rearrange your schedule for patient emergencies or overbookings. How do you feel about that?",
    whyAsk:
      "This tests flexibility and respect for the front desk role. The front desk runs the logistics of the office — if the associate fights them on every change, the whole flow breaks down.",
    greatAnswer:
      "They are totally fine with it. They trust the front desk team to manage the schedule and see themselves as part of a system, not the center of it. They might ask to be looped in on major changes but do not need control.",
    redFlags:
      "They insist on approving every schedule change or express frustration at the idea. They see the front desk as subordinate rather than as partners in patient care.",
  },

  // ── Commitment & Growth ──────────────────────────────────────────────
  {
    id: "iq-cg-1",
    category: "Commitment & Growth",
    question: "Where do you see yourself in three years?",
    whyAsk:
      "Classic question, but it matters. You need to know if you are investing in someone who will build with you or someone who is using you as a stepping stone for 6 months while they figure out their next move.",
    greatAnswer:
      "They describe growing within a practice — building a patient base, taking on more leadership, potentially exploring partnership or ownership. Their timeline aligns with a meaningful commitment, not a quick stop.",
    redFlags:
      "They say 'opening my own practice across town' or 'I'm not sure, I'm just exploring options.' Vague or competitive long-term plans signal short tenure.",
  },
  {
    id: "iq-cg-2",
    category: "Commitment & Growth",
    question:
      "Are you interested in practice ownership or partnership down the road? Tell me what that looks like to you.",
    whyAsk:
      "If you offer a partnership track, this question identifies candidates with an owner's mentality. If you do not, it helps you identify flight risks who will leave the moment they can afford their own lease.",
    greatAnswer:
      "If you have a partnership track: they light up and ask thoughtful questions about what the path looks like. If you do not: they express genuine satisfaction in being a high-performing associate and building something within your system.",
    redFlags:
      "They are already looking at commercial real estate or they dodge the question. Either they will leave soon, or they are hiding their plans because they think it is not what you want to hear.",
  },
  {
    id: "iq-cg-3",
    category: "Commitment & Growth",
    question:
      "What continuing education have you pursued on your own — not required for license renewal?",
    whyAsk:
      "Self-directed learning is a strong signal of intrinsic motivation and growth mindset. Required CE is the bare minimum. You want someone who invests in themselves because they care about mastery.",
    greatAnswer:
      "They name specific seminars, technique certifications, coaching programs, or clinical mentorships they sought out and paid for themselves. They can explain what they learned and how they applied it.",
    redFlags:
      "They only do the minimum required CE hours and cannot name a single elective course or seminar. Stagnant learners become stagnant practitioners.",
  },
  {
    id: "iq-cg-4",
    category: "Commitment & Growth",
    question:
      "How do you handle the emotional weight of this work — patients who do not get better, long days, high expectations?",
    whyAsk:
      "Burnout is real in high-volume chiropractic. You need someone with self-awareness, coping strategies, and resilience — not someone who is already on the edge and looking for an easier job.",
    greatAnswer:
      "They are honest and self-aware. They describe specific practices — exercise, mentorship, boundaries, getting adjusted themselves, journaling — and acknowledge that hard days are part of the work without being dramatic about it.",
    redFlags:
      "They claim they 'never get stressed' (dishonest) or they describe previous burnout with no evidence of having addressed the root cause. Unprocessed burnout will resurface in your office.",
  },
  {
    id: "iq-cg-5",
    category: "Commitment & Growth",
    question:
      "What is the longest you have stayed in a single position, and what kept you there?",
    whyAsk:
      "Longevity in a role correlates with reliability and commitment. Short stints across multiple offices is a pattern you need to understand before you invest months of training.",
    greatAnswer:
      "They stayed 2+ years somewhere and can articulate what kept them — mentorship, patient relationships, team culture, growth opportunities. The reasons they stayed reveal what they value.",
    redFlags:
      "Multiple jobs lasting under a year with external blame for each departure — 'toxic office,' 'bad management,' 'they changed the deal.' One bad experience is understandable; a pattern is a warning.",
  },
  {
    id: "iq-cg-6",
    category: "Commitment & Growth",
    question:
      "If I invest in sending you to seminars and advanced trainings, how do I know you will still be here in two years?",
    whyAsk:
      "This is a direct question and some candidates will squirm. But it is fair — training is expensive, and you deserve an honest answer about their intentions.",
    greatAnswer:
      "They address it head-on. They talk about loyalty, reciprocity, and the value of investing in a long-term relationship. They may even suggest putting it in a contract or agreement, which shows maturity and good faith.",
    redFlags:
      "They get defensive or give a non-answer like 'you can't really know.' If they are unwilling to commit verbally, they are very unlikely to commit in practice.",
  },

  // ── Red Flag Questions ───────────────────────────────────────────────
  {
    id: "iq-rf-1",
    category: "Red Flag Questions",
    question:
      "Are you currently under or have you ever been bound by a non-compete agreement?",
    whyAsk:
      "A non-compete can create legal liability for you if you hire someone who is restricted. You need to know this upfront, not after they have started seeing your patients.",
    greatAnswer:
      "They are transparent — either they have no non-compete, or they disclose it fully and have already consulted an attorney about its enforceability. Honesty here builds trust immediately.",
    redFlags:
      "They are evasive, say 'I think it expired,' or claim they signed one but 'it is not enforceable.' If they are not clear on their own legal obligations, you could inherit their problem.",
  },
  {
    id: "iq-rf-2",
    category: "Red Flag Questions",
    question:
      "Our schedule includes [your actual hours — e.g., Monday through Thursday 7 AM to 6 PM and Saturday mornings]. Does that work for your life right now?",
    whyAsk:
      "Schedule conflicts are the number one reason new hires fail in the first 90 days. Get explicit confirmation before you waste time on the rest of the interview.",
    greatAnswer:
      "They confirm it works and do not immediately start negotiating exceptions. If they have a minor conflict (like one evening a month), they flag it honestly and ask if there is flexibility — which is mature and reasonable.",
    redFlags:
      "They start negotiating the schedule during the interview — 'Can I leave early on Wednesdays?' or 'I don't really do Saturdays.' If the schedule is a problem now, it will be a bigger problem later.",
  },
  {
    id: "iq-rf-3",
    category: "Red Flag Questions",
    question: "What are your compensation expectations for this role?",
    whyAsk:
      "You need to know if you are in the same ballpark before investing more time. This also reveals how they think about money — base-focused, production-focused, or total-package-focused.",
    greatAnswer:
      "They give a reasonable range based on market research and their experience level. Bonus if they ask about the production bonus structure and seem motivated by earning more through performance rather than just demanding a high base.",
    redFlags:
      "Their number is 40% above market with no justification, or they refuse to give a number at all. Also watch for candidates who only care about base salary and show no interest in production bonuses — they may not be motivated to produce.",
  },
  {
    id: "iq-rf-4",
    category: "Red Flag Questions",
    question:
      "Is there anything about this opportunity that concerns you or that you would need to see change before accepting?",
    whyAsk:
      "This surfaces hidden objections. If they have concerns, it is better to address them now than to have them quietly fester and lead to a resignation in month three.",
    greatAnswer:
      "They share a genuine, thoughtful concern — maybe about patient volume ramp-up time, mentorship structure, or how performance reviews work. Then they listen to your response with an open mind. Healthy skepticism is a sign of a serious candidate.",
    redFlags:
      "They have no concerns at all (they are not thinking critically), or their concerns are all self-serving — 'I need more time off,' 'I want to do my own thing,' 'I don't want to be told how to adjust.' Entitlement at the interview stage only grows after hiring.",
  },
  {
    id: "iq-rf-5",
    category: "Red Flag Questions",
    question:
      "What would make you leave a position? What has caused you to leave in the past?",
    whyAsk:
      "This is the single most predictive question in the interview. Their departure triggers tell you exactly what will cause them to leave your office — and you can decide if those triggers exist in your environment.",
    greatAnswer:
      "They give honest, reasonable answers — lack of growth, broken promises, ethical misalignment, toxic culture. They own their part in previous departures and speak about former employers with respect, even if it did not end well.",
    redFlags:
      "They trash former employers, blame everyone else, or list triggers that are clearly present in your office (e.g., 'I left because they expected too many patients per day' — and you see 150). This candidate will repeat the pattern.",
  },
];

// ─── 3. REFERENCE_TEMPLATES ────────────────────────────────────────────────

export interface ReferenceTemplate {
  id: string;
  title: string;
  type: string;
  description: string;
  introScript: string;
  questions: { question: string; noteLabel: string; notes: string }[];
}

export const REFERENCE_TEMPLATES: ReferenceTemplate[] = [
  {
    id: "ref-clinical",
    title: "Clinical Reference (Previous Employer)",
    type: "Clinical",
    description:
      "A structured reference check for verifying clinical skills, work history, reliability, and professional conduct with a previous chiropractic employer or supervisor.",
    introScript:
      "Hi, this is [YOUR NAME] from [PRACTICE NAME]. I'm calling because [CANDIDATE NAME] has applied for an associate position in our office and listed you as a professional reference. I really appreciate you taking a few minutes — I know how busy you are. I just have about 10 questions that should take about 10 minutes. Is now a good time, or is there a better time to call back?",
    questions: [
      {
        question:
          "Can you confirm [CANDIDATE NAME]'s dates of employment and their title or role in your office?",
        noteLabel: "Employment dates & title",
        notes:
          "Verify accuracy against what the candidate reported. Discrepancies in dates or title may indicate dishonesty on the application.",
      },
      {
        question:
          "What were their primary clinical responsibilities? What types of patients did they see?",
        noteLabel: "Clinical responsibilities",
        notes:
          "Listen for alignment with your office model — were they adjusting families, PI cases, wellness patients? Note their patient demographic experience.",
      },
      {
        question:
          "How would you describe their adjusting skills and clinical confidence?",
        noteLabel: "Adjusting skill & confidence",
        notes:
          "Look for words like 'confident,' 'precise,' 'patients loved them.' Hesitation or vague praise like 'they were fine' may indicate mediocrity.",
      },
      {
        question:
          "What was their average daily patient volume, and how did they handle the pace?",
        noteLabel: "Volume & pace",
        notes:
          "Compare to your expected volume. If they saw 20/day and you expect 100, the ramp-up will be significant. Ask how they performed under pressure.",
      },
      {
        question:
          "How reliable were they? Were there issues with attendance, punctuality, or following through on commitments?",
        noteLabel: "Reliability",
        notes:
          "Reliability is binary in a high-volume office. One 'but' in this answer is worth paying close attention to.",
      },
      {
        question:
          "How did they interact with the team — front desk staff, CAs, other doctors?",
        noteLabel: "Team interaction",
        notes:
          "You want to hear 'everyone loved working with them.' Red flag if they say the candidate had tension with support staff or preferred to work alone.",
      },
      {
        question:
          "How were they with patient communication — Report of Findings, re-exams, day-to-day education?",
        noteLabel: "Patient communication",
        notes:
          "Communication is the skill that drives retention and case acceptance. Listen for whether patients connected with them or just tolerated them.",
      },
      {
        question:
          "Were there any areas where you felt they needed improvement or additional coaching?",
        noteLabel: "Areas for improvement",
        notes:
          "Every honest reference will name something. If they say 'nothing,' they are either not being candid or did not manage this person closely. The specific weakness matters less than whether the candidate was coachable about it.",
      },
      {
        question:
          "What was the reason for their departure from your office?",
        noteLabel: "Reason for departure",
        notes:
          "Cross-reference this with the candidate's version. Matching stories are a good sign. Conflicting narratives are a red flag worth investigating further.",
      },
      {
        question:
          "Knowing what you know now, would you rehire this person?",
        noteLabel: "Rehire recommendation",
        notes:
          "This is the most important question. A confident 'absolutely' is the green light. Any hesitation, qualifications, or 'it depends' answers should weigh heavily in your decision.",
      },
    ],
  },
  {
    id: "ref-character",
    title: "Character Reference",
    type: "Character",
    description:
      "A reference check focused on personal character, integrity, and interpersonal qualities from someone who knows the candidate well outside of (or alongside) clinical work.",
    introScript:
      "Hi, this is [YOUR NAME] from [PRACTICE NAME]. [CANDIDATE NAME] gave me your name as a character reference — they are applying for a position in our chiropractic office. I really appreciate you taking a few minutes to share your perspective. This should be pretty quick — just 6 questions. Is now okay?",
    questions: [
      {
        question:
          "How do you know [CANDIDATE NAME], and how long have you known them?",
        noteLabel: "Relationship context",
        notes:
          "Establish the depth of the relationship. A 10-year colleague reference carries more weight than a 3-month acquaintance. Note the context — professional, personal, academic.",
      },
      {
        question:
          "What would you say are their greatest strengths as a person — not just professionally, but who they are?",
        noteLabel: "Personal strengths",
        notes:
          "Listen for character traits that matter in a team environment: integrity, empathy, consistency, humility. Generic answers like 'they are nice' do not tell you much.",
      },
      {
        question:
          "How would you describe their work ethic when things get difficult or stressful?",
        noteLabel: "Work ethic under pressure",
        notes:
          "You want to hear that they lean in, not that they shut down or disappear. Ask for a specific example if they give a general answer.",
      },
      {
        question:
          "If you had to count on one person to show up and follow through on something important, would [CANDIDATE NAME] be on that list?",
        noteLabel: "Dependability",
        notes:
          "This is a yes or no question dressed up in a story. Listen for the immediate 'absolutely' versus the pause-and-qualify. Trust your gut on the tone.",
      },
      {
        question:
          "How do they handle interpersonal conflict or disagreements?",
        noteLabel: "Conflict resolution",
        notes:
          "You are listening for emotional maturity — do they address things directly, avoid them, or escalate? A character reference often knows the unfiltered version.",
      },
      {
        question:
          "Is there anything I should know about [CANDIDATE NAME] that would help me set them up for success in our office?",
        noteLabel: "Setup for success",
        notes:
          "This open-ended question often surfaces the most useful information. People who care about the candidate will share genuine insights — communication preferences, motivational triggers, areas where they need support.",
      },
    ],
  },
  {
    id: "ref-academic",
    title: "Academic Reference (New Grads)",
    type: "Academic",
    description:
      "A reference check tailored for recent chiropractic graduates, focused on clinical rotation performance, academic standing, professionalism, and readiness for practice.",
    introScript:
      "Hi, this is [YOUR NAME] from [PRACTICE NAME]. I'm reaching out because [CANDIDATE NAME] recently graduated from your program and has applied for an associate position with us. They mentioned you as someone who could speak to their clinical performance. Do you have about 10 minutes? I have 8 questions and I really value your perspective as someone who saw them develop.",
    questions: [
      {
        question:
          "How would you rate [CANDIDATE NAME]'s clinical skills relative to their graduating class?",
        noteLabel: "Class ranking",
        notes:
          "Top third, middle, or bottom? Professors and clinic supervisors can usually place students accurately. You are looking for 'standout' language, not 'adequate.'",
      },
      {
        question:
          "How did they perform in the student clinic — were they confident with patients, or did they need a lot of hand-holding?",
        noteLabel: "Clinical confidence",
        notes:
          "Confidence with real patients is the bridge between school and practice. A new grad who was already comfortable in the student clinic will ramp up faster in your office.",
      },
      {
        question:
          "How were their academic performance and study habits? Did they take their education seriously?",
        noteLabel: "Academic performance",
        notes:
          "You are not looking for a 4.0 — you are looking for discipline, consistency, and someone who cared about mastery rather than just passing boards.",
      },
      {
        question:
          "How would you describe their professionalism — punctuality, appearance, communication with faculty and peers?",
        noteLabel: "Professionalism",
        notes:
          "Professionalism habits established in school carry directly into practice. If they were late to clinic shifts or sloppy with documentation, that pattern is already set.",
      },
      {
        question: "What are their greatest clinical strengths?",
        noteLabel: "Clinical strengths",
        notes:
          "Listen for specific skills — adjusting technique, patient rapport, diagnostic reasoning, X-ray analysis. Specificity indicates the professor actually paid attention to this student.",
      },
      {
        question:
          "What areas would you recommend they focus on developing in their first year of practice?",
        noteLabel: "Development areas",
        notes:
          "Every new grad has growth areas. A candid professor will name them. This helps you build a targeted onboarding plan rather than discovering gaps the hard way.",
      },
      {
        question:
          "How did they interact with patients in the student clinic — especially anxious or difficult patients?",
        noteLabel: "Patient interaction",
        notes:
          "Patient interaction under pressure reveals emotional intelligence and communication skill. A new grad who can handle a nervous patient will thrive in a real office.",
      },
      {
        question:
          "Based on what you observed, do you think [CANDIDATE NAME] is ready to step into a high-volume chiropractic practice? Why or why not?",
        noteLabel: "Practice readiness",
        notes:
          "This is the summary question. A strong 'yes, and here is why' is the best possible response. Anything less warrants a longer conversation about readiness and what support they will need.",
      },
    ],
  },
];

// ─── 4. STAGE_EMAIL_TEMPLATES ──────────────────────────────────────────────

export interface StageEmailTemplate {
  id: string;
  stage: string;
  subject: string;
  body: string;
}

export const STAGE_EMAIL_TEMPLATES: StageEmailTemplate[] = [
  {
    id: "email-reviewing",
    stage: "Reviewing",
    subject: "We got your application — here's what happens next",
    body: `Hi [APPLICANT NAME],

Thank you for applying for the [POSITION] role at [PRACTICE NAME]. We read every application personally, and yours caught our attention.

Here is what you can expect: our team will review your materials over the next few days. If it looks like a good fit on paper, we will reach out to schedule a quick phone call so we can get to know each other a bit before a formal interview.

In the meantime, if you have any questions about the role or our office, feel free to reply to this email. We are a real practice run by real people — not a faceless HR department.

We appreciate your interest and will be in touch soon.

Warm regards,
[PRACTICE NAME]`,
  },
  {
    id: "email-phone-screen",
    stage: "Phone Screen",
    subject: "Let's set up a quick call — [POSITION] at [PRACTICE NAME]",
    body: `Hi [APPLICANT NAME],

Thanks again for your interest in the [POSITION] role at [PRACTICE NAME]. After reviewing your application, we would love to set up a brief phone call — about 15-20 minutes — to learn a little more about you and give you a chance to ask questions about us.

Would any of these times work for you?

- [DATE] at [TIME]
- [DATE] at [TIME]
- [DATE] at [TIME]

If none of those work, reply with a couple of times that are convenient for you and we will make it happen.

Looking forward to connecting.

Best,
[PRACTICE NAME]`,
  },
  {
    id: "email-interview",
    stage: "Interview",
    subject: "Interview invitation — [POSITION] at [PRACTICE NAME]",
    body: `Hi [APPLICANT NAME],

Great news — we enjoyed our phone conversation and would like to invite you in for a formal interview for the [POSITION] position at [PRACTICE NAME].

Here are the details:

Date: [DATE]
Time: [TIME]
Location: [LOCATION]

The interview will last about 60-90 minutes. You will meet with the doctor, tour the office, and have a chance to see our scanning technology and patient flow in action. We want you to get a real feel for what a day here looks like — not just sit in a conference room.

Please bring a copy of your resume and any licenses or certifications. Business casual is perfect.

If you need to reschedule or have any questions before the interview, just reply to this email.

We are looking forward to meeting you in person.

Best,
[PRACTICE NAME]`,
  },
  {
    id: "email-offer",
    stage: "Offer",
    subject:
      "Congratulations — we'd love to have you join [PRACTICE NAME]",
    body: `Hi [APPLICANT NAME],

I wanted to reach out personally to say congratulations — after meeting you and discussing the [POSITION] role, our team is excited to extend you an offer to join [PRACTICE NAME].

You stood out to us because of your passion for patient care and your alignment with our nervous-system-first approach, and we genuinely believe you will thrive here.

We are preparing your formal offer letter now and will have it to you within the next 1-2 business days. It will include all the details on compensation, benefits, start date, and next steps.

In the meantime, if you have any questions or just want to talk through anything, please do not hesitate to call or reply to this email. We know that accepting a new position is a big decision, and we want you to feel confident and informed.

Welcome to the team — we cannot wait to get started.

Warm regards,
[PRACTICE NAME]`,
  },
  {
    id: "email-hired",
    stage: "Hired",
    subject: "Welcome to the team — [PRACTICE NAME]",
    body: `Hi [APPLICANT NAME],

It is official — welcome to [PRACTICE NAME]! We are genuinely excited to have you joining us as our [POSITION].

Here are a few things to prepare for your first day:

- Arrive 15 minutes early for onboarding paperwork
- Bring a valid form of ID, your license documentation, and proof of malpractice insurance
- Wear professional clinical attire
- Bring your energy — the team is looking forward to meeting you

We will have your workspace, equipment access, and schedule ready for you on [DATE]. If anything comes up before then, do not hesitate to reach out.

See you soon!

[PRACTICE NAME]`,
  },
  {
    id: "email-rejected",
    stage: "Rejected",
    subject:
      "Update on your application — [POSITION] at [PRACTICE NAME]",
    body: `Hi [APPLICANT NAME],

Thank you for taking the time to apply — and interview — for the [POSITION] role at [PRACTICE NAME]. We genuinely appreciated the opportunity to get to know you, and this was not an easy decision.

After careful consideration, we have decided to move forward with another candidate whose experience more closely aligns with what we need at this particular time. I want to be clear: this is not a reflection of your skills or character. You have a lot to offer, and I have no doubt you will find the right fit.

If you are open to it, we would love to keep your information on file. Needs change, new positions open, and people who impressed us once tend to impress us again. You are also welcome to apply for future openings — we would be glad to hear from you.

Thank you again for your interest in [PRACTICE NAME]. I wish you all the best in your search.

Sincerely,
[PRACTICE NAME]`,
  },
];

// ─── 5. OFFER_LETTER_TEMPLATES ─────────────────────────────────────────────

export interface OfferLetterTemplate {
  id: string;
  style: string;
  label: string;
  template: string;
}

export const OFFER_LETTER_TEMPLATES: OfferLetterTemplate[] = [
  {
    id: "offer-formal",
    style: "formal",
    label: "Formal Offer Letter",
    template: `[PRACTICE NAME]
[PRACTICE ADDRESS]
[PRACTICE PHONE]

[DATE]

[CANDIDATE NAME]
[CANDIDATE ADDRESS]

Dear [CANDIDATE NAME],

On behalf of [PRACTICE NAME], I am pleased to extend this formal offer of employment for the position of [POSITION]. We were impressed by your qualifications, your alignment with our mission, and the energy you brought to the interview process. We believe you will be an excellent addition to our team.

Position: [POSITION]
Start Date: [START DATE]
Schedule: [SCHEDULE]
Reporting To: [SUPERVISOR NAME AND TITLE]

Compensation: Your starting compensation will be [COMPENSATION AMOUNT] per [YEAR/MONTH/HOUR], paid on a [BIWEEKLY/MONTHLY] basis. In addition, you will be eligible for production bonuses based on [PRODUCTION BONUS STRUCTURE]. Details of the bonus structure will be provided in your onboarding materials.

Benefits: You will be eligible for the following benefits upon [ELIGIBILITY DATE OR PERIOD]:
- Health, dental, and vision insurance
- [NUMBER] days paid time off per year
- [NUMBER] paid holidays per year
- Complimentary chiropractic care for you and your immediate family
- Malpractice insurance coverage
- Continuing education allowance of [AMOUNT] per year
- [ANY ADDITIONAL BENEFITS]

This offer is contingent upon the following:
1. Verification of an active and unrestricted [STATE] chiropractic license (or applicable professional license)
2. Proof of current malpractice insurance (or enrollment in our group policy)
3. Successful completion of a background check
4. Completion of all required onboarding documentation

This is an at-will employment offer, meaning that either party may terminate the employment relationship at any time, with or without cause, and with or without notice. This letter does not constitute a contract of employment for any specified duration.

Please indicate your acceptance by signing and returning this letter by [RESPONSE DEADLINE]. If you have any questions about the terms outlined above, please do not hesitate to contact me directly at [PHONE] or [EMAIL].

We are excited to welcome you to [PRACTICE NAME] and look forward to the impact you will make on our patients and our team.

Sincerely,

____________________________
[DOCTOR NAME]
[TITLE]
[PRACTICE NAME]


ACCEPTED AND AGREED:

____________________________
[CANDIDATE NAME]

Date: ____________________________`,
  },
  {
    id: "offer-casual",
    style: "casual",
    label: "Casual Text / DM",
    template: `Hey [CANDIDATE NAME]! It is official — we want you on the team. After meeting you I knew you would be a great fit at [PRACTICE NAME] and the rest of the team agreed. We are offering you the [POSITION] role starting [START DATE] at [COMPENSATION AMOUNT]. Full details are coming in a formal letter, but I wanted you to hear it from me first. If you have any questions, call me anytime at [PHONE]. We are pumped to have you — let me know when you are ready to make it official!`,
  },
];
