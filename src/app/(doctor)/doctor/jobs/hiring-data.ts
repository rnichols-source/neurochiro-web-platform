/**
 * Hiring Data — Interview questions, reference templates, offer letters, email templates, job templates
 */

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

// ─── Interview Question Bank ─────────────────────────────────────────────────

export interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  whyAsk: string;
  greatAnswer: string;
  redFlags: string;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // Clinical Knowledge
  {
    id: "clin-1",
    category: "Clinical Knowledge",
    question: "Walk me through how you would assess a new patient presenting with chronic low-back pain and radiculopathy.",
    whyAsk: "Tests systematic clinical reasoning and whether they follow objective, evidence-based protocols.",
    greatAnswer: "They describe a structured approach: thorough history, orthopedic/neurological exam, imaging criteria, differential diagnosis, and a clear care plan with measurable outcomes.",
    redFlags: "Jumping straight to treatment without proper assessment. Over-reliance on a single technique without justification.",
  },
  {
    id: "clin-2",
    category: "Clinical Knowledge",
    question: "How do you determine when to refer a patient out vs. continuing chiropractic care?",
    whyAsk: "Gauges clinical maturity, patient safety awareness, and ego management.",
    greatAnswer: "Clear criteria based on red flags, lack of expected progress at re-exam milestones, and collaborative mindset with other providers.",
    redFlags: "Never refers out. Cannot articulate specific clinical criteria for referral.",
  },
  {
    id: "clin-3",
    category: "Clinical Knowledge",
    question: "What objective outcome measures do you use to track patient progress?",
    whyAsk: "Reveals whether they practice with clinical certainty or rely on subjective assessment alone.",
    greatAnswer: "Mentions specific tools: VAS/NRS pain scales, functional questionnaires (ODI, NDI), ROM measurements, neurological findings, and re-exam schedules.",
    redFlags: "Only uses subjective reports. No structured re-evaluation process.",
  },
  // Culture & Values
  {
    id: "cult-1",
    category: "Culture & Values",
    question: "Describe a time you disagreed with a colleague about a patient's care plan. How did you handle it?",
    whyAsk: "Tests emotional intelligence, communication skills, and ability to navigate conflict professionally.",
    greatAnswer: "Describes a respectful conversation, willingness to see the other perspective, and a resolution focused on the patient's best interest.",
    redFlags: "Blames others. Describes confrontational behavior. Cannot recall any instance of disagreement (low self-awareness).",
  },
  {
    id: "cult-2",
    category: "Culture & Values",
    question: "What does 'nervous-system-first care' mean to you, and how does it show up in your daily practice?",
    whyAsk: "Checks philosophical alignment with the practice's core identity.",
    greatAnswer: "Articulates how neurological assessment drives every care decision, from intake to discharge. Connects it to patient education and outcomes.",
    redFlags: "Dismisses the concept. Gives a vague or memorized answer with no practical application.",
  },
  {
    id: "cult-3",
    category: "Culture & Values",
    question: "How do you handle a patient who wants to quit care early despite clinical indicators showing they need more treatment?",
    whyAsk: "Tests patient communication, ethical boundaries, and retention philosophy.",
    greatAnswer: "Describes re-education using objective findings, respecting autonomy, and documenting informed consent. Does not pressure or guilt.",
    redFlags: "Uses guilt or fear. No respect for patient autonomy. Or conversely, just lets them go without proper communication.",
  },
  // Business Acumen
  {
    id: "biz-1",
    category: "Business Acumen",
    question: "How do you think about the relationship between clinical excellence and practice revenue?",
    whyAsk: "Reveals whether they understand that great care and a healthy business are not in conflict.",
    greatAnswer: "Sees them as aligned: better outcomes lead to retention, referrals, and community trust. Can discuss case averages, visit frequency, and patient lifetime value without being salesy.",
    redFlags: "Sees business as dirty. Or only cares about volume without connecting to patient outcomes.",
  },
  {
    id: "biz-2",
    category: "Business Acumen",
    question: "If I gave you a caseload goal of 80 patient visits per week, how would you approach building to that number?",
    whyAsk: "Tests whether they think about growth strategically and whether the volume expectation feels realistic to them.",
    greatAnswer: "Discusses ramp-up timeline, patient education for compliance, community outreach, internal referral systems, and quality vs. quantity balance.",
    redFlags: "Panics at the number. Or says they'll just see whoever walks in without a growth strategy.",
  },
  // Technique & Adaptability
  {
    id: "tech-1",
    category: "Technique & Adaptability",
    question: "What adjusting techniques are you proficient in, and how do you decide which to use for a given patient?",
    whyAsk: "Gauges versatility and clinical decision-making around technique selection.",
    greatAnswer: "Lists multiple techniques (Diversified, Gonstead, Thompson, Activator, etc.) and explains patient-specific criteria: age, condition, tolerance, imaging findings.",
    redFlags: "Only knows one technique. Cannot explain why they choose one approach over another.",
  },
  {
    id: "tech-2",
    category: "Technique & Adaptability",
    question: "Tell me about a case where your initial treatment approach was not working. What did you do?",
    whyAsk: "Tests adaptability, humility, and commitment to outcomes over ego.",
    greatAnswer: "Describes specific re-evaluation, adjustment of the care plan, possibly consulting with a colleague or referring out. Focus on the patient's outcome.",
    redFlags: "Blames the patient for non-compliance. Cannot recall any case where they needed to change course.",
  },
  // Teamwork & Communication
  {
    id: "team-1",
    category: "Teamwork & Communication",
    question: "How do you work with CAs and front desk staff to create a seamless patient experience?",
    whyAsk: "Tests team orientation and understanding that the patient experience extends beyond the adjustment.",
    greatAnswer: "Describes clear handoff protocols, communication about patient status, and treating support staff as essential clinical partners.",
    redFlags: "Sees support staff as beneath them. Does not communicate with the team about patient care.",
  },
  {
    id: "team-2",
    category: "Teamwork & Communication",
    question: "How would you explain a complex spinal condition to a patient who has no medical background?",
    whyAsk: "Tests patient education skills, which directly impact compliance and outcomes.",
    greatAnswer: "Uses analogies, visual aids, or simple language. Checks for understanding. Connects the explanation to the patient's own goals.",
    redFlags: "Uses excessive jargon. Talks at the patient rather than with them.",
  },
];

export const INTERVIEW_CATEGORIES = [
  "Clinical Knowledge",
  "Culture & Values",
  "Business Acumen",
  "Technique & Adaptability",
  "Teamwork & Communication",
];

// ─── Reference Check Templates ───────────────────────────────────────────────

export interface ReferenceTemplate {
  id: string;
  type: string;
  introScript: string;
  questions: { question: string; noteLabel: string }[];
}

export const REFERENCE_TEMPLATES: ReferenceTemplate[] = [
  {
    id: "ref-clinical",
    type: "Clinical",
    introScript:
      "Hi [Reference Name], thank you for taking the time to speak with me. I'm Dr. [Your Name] from [Clinic Name]. [Candidate Name] has applied for a position at our practice and listed you as a clinical reference. I'd love to get your perspective on their clinical abilities. This should take about 10 minutes. Everything you share will be kept confidential.",
    questions: [
      { question: "How long have you worked with or supervised [Candidate Name] in a clinical setting?", noteLabel: "Relationship duration" },
      { question: "How would you rate their diagnostic skills and clinical reasoning on a scale of 1-10?", noteLabel: "Clinical reasoning score" },
      { question: "Can you describe their adjusting technique proficiency and patient handling?", noteLabel: "Technique proficiency" },
      { question: "How do they handle complex or difficult cases?", noteLabel: "Complex case handling" },
      { question: "Have you ever had concerns about their clinical judgment or patient safety?", noteLabel: "Safety concerns" },
      { question: "How well do they document their findings and care plans?", noteLabel: "Documentation quality" },
      { question: "Would you hire them for your own practice? Why or why not?", noteLabel: "Hire recommendation" },
    ],
  },
  {
    id: "ref-character",
    type: "Character",
    introScript:
      "Hi [Reference Name], thank you for your time. I'm Dr. [Your Name] from [Clinic Name]. [Candidate Name] has applied to join our team and mentioned you as a personal/professional reference. I'd appreciate your honest perspective. This should take about 8 minutes.",
    questions: [
      { question: "How do you know [Candidate Name] and for how long?", noteLabel: "Relationship context" },
      { question: "How would you describe their work ethic and reliability?", noteLabel: "Work ethic" },
      { question: "Can you give me an example of how they handle stress or pressure?", noteLabel: "Stress management" },
      { question: "How do they interact with colleagues and team members?", noteLabel: "Team dynamics" },
      { question: "What would you say is their biggest strength?", noteLabel: "Top strength" },
      { question: "If you had to pick one area for growth, what would it be?", noteLabel: "Growth area" },
      { question: "Is there anything else you think I should know?", noteLabel: "Additional notes" },
    ],
  },
  {
    id: "ref-academic",
    type: "Academic",
    introScript:
      "Hi [Reference Name], I appreciate you taking my call. I'm Dr. [Your Name] from [Clinic Name]. [Candidate Name] is being considered for a position at our practice and provided you as an academic reference. I'd value your insight into their academic performance and clinical readiness.",
    questions: [
      { question: "What was your role in relation to [Candidate Name] during their studies?", noteLabel: "Academic role" },
      { question: "How would you rate their academic performance and clinical aptitude?", noteLabel: "Academic performance" },
      { question: "Did they show particular strength in any clinical area?", noteLabel: "Clinical strengths" },
      { question: "How did they perform in clinic rotations or practical assessments?", noteLabel: "Practical performance" },
      { question: "Were they active in extracurriculars, research, or leadership roles?", noteLabel: "Leadership/involvement" },
      { question: "How prepared do you think they are for full-time practice?", noteLabel: "Practice readiness" },
    ],
  },
];

// ─── Offer Letter Templates ──────────────────────────────────────────────────

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
    template: `[Clinic Name]
[Clinic Address]
[Date]

Dear [Candidate Name],

We are pleased to extend an offer of employment for the position of [Job Title] at [Clinic Name].

Start Date: [Start Date]
Compensation: $[Salary] per year
Employment Type: [Employment Type]

This offer is contingent upon:
- Successful completion of a background check
- Verification of licensure and credentials
- Completion of all required onboarding documentation

Benefits include:
[Benefits List]

We believe your skills and experience will be a tremendous asset to our team and our patients. Please confirm your acceptance by signing and returning this letter by [Response Deadline].

We are excited to welcome you to the [Clinic Name] family.

Sincerely,

Dr. [Doctor Name]
[Clinic Name]`,
  },
  {
    id: "offer-casual",
    style: "casual",
    label: "Friendly Offer Letter",
    template: `Hey [Candidate Name]!

Great news -- we'd love to officially bring you on board at [Clinic Name] as our new [Job Title]!

Here are the details:

- Start Date: [Start Date]
- Pay: $[Salary]/year
- Type: [Employment Type]
- Perks: [Benefits List]

Before we make it official, we just need to wrap up:
- Background check
- License verification
- A bit of onboarding paperwork

We were really impressed throughout the interview process, and we think you're going to be an incredible fit for our team and our patients.

Let us know by [Response Deadline] if you're in!

Stoked to have you,
Dr. [Doctor Name]
[Clinic Name]`,
  },
];

// ─── Stage Email Templates ───────────────────────────────────────────────────

export interface StageEmailTemplate {
  stage: string;
  subject: string;
  body: string;
}

export const STAGE_EMAIL_TEMPLATES: StageEmailTemplate[] = [
  {
    stage: "Reviewing",
    subject: "Application Received - [Job Title] at [Clinic Name]",
    body: `Hi [Candidate Name],

Thank you for applying for the [Job Title] position at [Clinic Name]. We've received your application and our team is reviewing it.

We'll be in touch within the next 5-7 business days with an update on your status.

Best regards,
Dr. [Doctor Name]
[Clinic Name]`,
  },
  {
    stage: "Phone Screen",
    subject: "Next Step: Phone Screen - [Job Title] at [Clinic Name]",
    body: `Hi [Candidate Name],

Thank you for your interest in the [Job Title] position at [Clinic Name]. After reviewing your application, we'd like to move forward with a brief phone screen.

Could you let us know your availability this week for a 15-20 minute call? We'd love to learn more about your background and answer any questions you have about the role.

Looking forward to connecting!

Best,
Dr. [Doctor Name]
[Clinic Name]`,
  },
  {
    stage: "Interview",
    subject: "Interview Invitation - [Job Title] at [Clinic Name]",
    body: `Hi [Candidate Name],

Great news! We'd like to invite you for an in-person interview for the [Job Title] position at [Clinic Name].

Please let us know your availability in the coming week. The interview will be approximately 45-60 minutes and will include:
- A conversation about your clinical approach and career goals
- A brief tour of our practice
- Time for your questions

We're looking forward to meeting you!

Best regards,
Dr. [Doctor Name]
[Clinic Name]`,
  },
  {
    stage: "Offer",
    subject: "Offer of Employment - [Job Title] at [Clinic Name]",
    body: `Hi [Candidate Name],

I'm thrilled to let you know that after careful consideration, we'd like to offer you the [Job Title] position at [Clinic Name]!

I'll be sending over the formal offer details shortly. In the meantime, please don't hesitate to reach out with any questions.

We're excited about the possibility of you joining our team!

Warm regards,
Dr. [Doctor Name]
[Clinic Name]`,
  },
  {
    stage: "Hired",
    subject: "Welcome to the Team! - [Clinic Name]",
    body: `Hi [Candidate Name],

Welcome to [Clinic Name]! We're so excited to have you joining our team.

Here are a few things to prepare for your first day:
- Bring a valid form of ID and your license documentation
- Arrive 15 minutes early for onboarding paperwork
- Wear professional clinical attire

We'll have everything set up for you. If you have any questions before your start date, don't hesitate to reach out.

See you soon!

Dr. [Doctor Name]
[Clinic Name]`,
  },
  {
    stage: "Rejected",
    subject: "Update on Your Application - [Job Title] at [Clinic Name]",
    body: `Hi [Candidate Name],

Thank you for taking the time to apply for the [Job Title] position at [Clinic Name]. After careful consideration, we've decided to move forward with another candidate whose experience more closely aligns with our current needs.

This was not an easy decision, and we were genuinely impressed by your background. We'd encourage you to apply again in the future as new opportunities arise.

We wish you all the best in your career.

Sincerely,
Dr. [Doctor Name]
[Clinic Name]`,
  },
];

// ─── Job Post Templates ──────────────────────────────────────────────────────

export interface JobTemplate {
  id: string;
  label: string;
  title: string;
  description: string;
  type: string;
  category: string;
  employment_type: string;
  salary_min: number;
  salary_max: number;
}

export const JOB_TEMPLATES: JobTemplate[] = [
  {
    id: "tpl-associate",
    label: "Associate Chiropractor",
    title: "Associate Chiropractor",
    description:
      "We're looking for a passionate, patient-centered associate chiropractor to join our growing practice. You'll work alongside our lead doctor to deliver nervous-system-first care, manage your own caseload, and contribute to a culture of clinical excellence.\n\nResponsibilities:\n- Perform thorough patient assessments including orthopedic and neurological testing\n- Develop and execute individualized care plans with measurable outcomes\n- Educate patients on their conditions and the value of ongoing wellness care\n- Participate in team huddles and case reviews\n- Maintain excellent documentation\n\nQualifications:\n- DC degree from an accredited chiropractic college\n- Active state license (or eligible)\n- Strong adjusting skills in multiple techniques\n- Excellent communication and patient rapport\n- Growth mindset and coachability",
    type: "Associate",
    category: "Clinical",
    employment_type: "Full-time",
    salary_min: 70000,
    salary_max: 100000,
  },
  {
    id: "tpl-ic",
    label: "Independent Contractor DC",
    title: "Independent Contractor Chiropractor",
    description:
      "Seeking an experienced chiropractor to join our practice as an independent contractor. Flexible schedule with an established patient base. Ideal for a doctor who wants autonomy with the support of a well-run practice.\n\nDetails:\n- Set your own hours (minimum 20 hrs/week)\n- Access to fully equipped adjusting rooms and X-ray\n- Front desk and CA support provided\n- Competitive revenue split\n\nRequirements:\n- DC degree and active license\n- Minimum 2 years clinical experience\n- Own malpractice insurance\n- Proficiency in at least 2 adjusting techniques\n- Strong patient management skills",
    type: "Independent Contractor",
    category: "Clinical",
    employment_type: "Contract",
    salary_min: 80000,
    salary_max: 150000,
  },
  {
    id: "tpl-ca",
    label: "Chiropractic Assistant (CA)",
    title: "Chiropractic Assistant",
    description:
      "We're hiring a friendly, organized Chiropractic Assistant to be the heartbeat of our front office. You'll be the first face patients see and the glue that keeps our daily operations running smoothly.\n\nResponsibilities:\n- Greet and check in patients with warmth and professionalism\n- Schedule appointments and manage the daily calendar\n- Handle insurance verification and billing basics\n- Prepare treatment rooms and assist with patient flow\n- Support the doctor with documentation and patient education materials\n\nQualifications:\n- Prior experience in a healthcare or chiropractic office preferred\n- Exceptional people skills and positive attitude\n- Organized, detail-oriented, and comfortable with technology\n- Able to multitask in a fast-paced environment\n- Passion for health and wellness",
    type: "Associate",
    category: "Support Staff",
    employment_type: "Full-time",
    salary_min: 32000,
    salary_max: 45000,
  },
  {
    id: "tpl-buyin",
    label: "Buy-In Partner Opportunity",
    title: "Buy-In Partner - Growth Opportunity",
    description:
      "Rare opportunity to buy into a thriving chiropractic practice. We've built a strong brand, loyal patient base, and systems-driven operation. Now we're looking for the right partner to help us scale to the next level.\n\nWhat you get:\n- Equity stake in an established, profitable practice\n- Proven systems for new patient acquisition and retention\n- Full team in place (CAs, billing, marketing)\n- Mentorship and transition support\n\nIdeal candidate:\n- DC with 3+ years experience\n- Entrepreneurial mindset\n- Strong clinical AND business skills\n- Aligned with nervous-system-first philosophy\n- Financial capacity for buy-in investment",
    type: "Buy-In",
    category: "Clinical",
    employment_type: "Full-time",
    salary_min: 100000,
    salary_max: 200000,
  },
];
