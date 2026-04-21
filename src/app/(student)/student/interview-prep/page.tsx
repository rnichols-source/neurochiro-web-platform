"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Briefcase,
  MessageSquare,
  DollarSign,
  Shield,
  FileText,
  ChevronDown,
  ChevronRight,
  Lock,
  Check,
  X,
  Copy,
  Clock,
  AlertTriangle,
  Target,
  Star,
  Search,
  Filter,
  ArrowRight,
  Timer,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

// ─── Constants ───────────────────────────────────────────────────────────────

const BRAND_NAVY = "#1a2744";
const BRAND_ORANGE = "#e97325";

const LS_PRACTICE = "neurochiro-interview-practice";
const LS_SCORECARD = "neurochiro-interview-scorecard";
const LS_OFFER = "neurochiro-interview-offer";

const TAB_LABELS = [
  "Interview Questions",
  "Questions to Ask",
  "Evaluate the Offer",
  "Negotiation Scripts",
  "After the Interview",
];

const TAB_ICONS = [MessageSquare, Search, DollarSign, Shield, FileText];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#22c55e",
  Medium: "#f59e0b",
  Hard: "#ef4444",
};

const CATEGORY_COLORS: Record<string, string> = {
  Clinical: "#3b82f6",
  Business: "#e97325",
  Culture: "#8b5cf6",
  Philosophy: "#ec4899",
  Compensation: "#22c55e",
  Growth: "#06b6d4",
  Legal: "#ef4444",
  Patients: "#f59e0b",
};

const FILTER_CATEGORIES = ["All", "Clinical", "Business", "Culture", "Philosophy"];

// ─── Interview Questions Data ────────────────────────────────────────────────

interface InterviewQuestion {
  id: number;
  question: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: "Clinical" | "Business" | "Culture" | "Philosophy";
  whyTheyAsk: string;
  framework: string[];
  exampleAnswer: string;
  redFlags: string[];
}

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 1,
    question: "What technique(s) are you trained in?",
    difficulty: "Easy",
    category: "Clinical",
    whyTheyAsk: "They want to know if your skills match their office style and patient base. Many practices are technique-specific and need someone who can hit the ground running.",
    framework: [
      "List your primary technique(s) with confidence",
      "Mention proficiency level honestly",
      "Show willingness to learn their preferred technique",
      "Connect technique to patient outcomes",
    ],
    exampleAnswer: "I'm proficient in Diversified and Thompson Drop, and I've had solid training in Gonstead during my rotations. I'm also comfortable with basic Activator protocols. I'm always looking to expand my toolkit, so if your office uses a technique I haven't mastered yet, I'd be excited to train in it. What matters most to me is matching the right approach to each patient's needs.",
    redFlags: [
      "Claiming mastery in techniques you've barely practiced",
      "Being dismissive of techniques the office uses",
      "Saying 'I only do one technique' without flexibility",
      "Not asking what techniques they prefer",
    ],
  },
  {
    id: 2,
    question: "How would you handle a patient who isn't responding to care?",
    difficulty: "Hard",
    category: "Clinical",
    whyTheyAsk: "This tests your clinical reasoning, humility, and willingness to collaborate. They want to see that you won't just keep adjusting endlessly or blame the patient.",
    framework: [
      "Acknowledge it happens to every chiropractor",
      "Describe your reassessment process",
      "Mention when you'd modify the care plan",
      "Show willingness to refer out when appropriate",
      "Emphasize patient communication throughout",
    ],
    exampleAnswer: "First, I'd re-examine the patient and review the original findings to see if we missed something or if the condition has changed. I'd have an honest conversation with the patient about what we're seeing. If I've given the care plan adequate time and the objective markers aren't improving, I'd modify my approach -- maybe change techniques, frequency, or add rehab. If I've exhausted my clinical options, I wouldn't hesitate to refer to another provider. The patient's outcome is always more important than my ego.",
    redFlags: [
      "Saying 'that doesn't happen to me'",
      "Never mentioning referral as an option",
      "Blaming the patient for non-compliance without exploring why",
      "Having no structured reassessment process",
      "Suggesting you'd just keep adjusting the same way",
    ],
  },
  {
    id: 3,
    question: "Walk me through your Report of Findings process.",
    difficulty: "Medium",
    category: "Clinical",
    whyTheyAsk: "The ROF is where cases are accepted or lost. They want to know you can educate patients, build value, and present a care plan with confidence.",
    framework: [
      "Outline the structure (review findings, educate, present plan, handle objections)",
      "Emphasize patient education over sales",
      "Mention visual aids or tools you use",
      "Show you understand the business impact of a strong ROF",
    ],
    exampleAnswer: "I start by reviewing the exam and X-ray findings with the patient using visual aids so they can see exactly what's going on. I explain the three phases of care -- relief, corrective, and wellness -- and why each matters. Then I present the recommended care plan with frequency, duration, and expected milestones. I always leave room for questions and address financial concerns up front. My goal is for the patient to feel informed and empowered, not pressured. A good ROF builds trust that keeps patients engaged for the full plan.",
    redFlags: [
      "Having no structured ROF process",
      "Sounding overly salesy or pushy",
      "Not mentioning patient education",
      "Skipping the financial conversation",
      "Being unable to articulate care phases",
    ],
  },
  {
    id: 4,
    question: "How do you feel about adjusting pediatric/pregnant/geriatric patients?",
    difficulty: "Medium",
    category: "Clinical",
    whyTheyAsk: "This reveals your clinical breadth, comfort with special populations, and whether you'll limit the practice's patient base.",
    framework: [
      "Express genuine interest in these populations",
      "Mention any specific training (Webster, pediatric cert, etc.)",
      "Acknowledge the modifications needed",
      "Be honest about what you need more training in",
    ],
    exampleAnswer: "I'm enthusiastic about working with all ages. During school I had exposure to pediatric and prenatal patients, and I've started my Webster certification because I see a huge need for prenatal chiropractic. For geriatric patients, I'm comfortable modifying force and technique. I believe chiropractic should serve everyone from newborns to the elderly. If there's a population your office sees regularly that I need more training in, I'd welcome the mentorship.",
    redFlags: [
      "Saying 'I don't adjust kids' without explanation",
      "Showing zero interest in expanding to new populations",
      "Claiming expertise you don't have in special populations",
      "Being dismissive about the safety considerations involved",
    ],
  },
  {
    id: 5,
    question: "What's your philosophy on X-rays?",
    difficulty: "Hard",
    category: "Clinical",
    whyTheyAsk: "This is a minefield question that reveals your clinical reasoning AND whether you align with their practice model. Some offices X-ray everyone; others follow strict medical necessity guidelines.",
    framework: [
      "Show you understand both perspectives",
      "Anchor your answer in clinical reasoning and patient safety",
      "Mention guidelines (ACR, evidence-based criteria)",
      "Express willingness to follow office protocol while maintaining patient safety",
    ],
    exampleAnswer: "I believe X-rays are a valuable diagnostic tool when clinically indicated. I follow evidence-based guidelines to determine medical necessity -- things like trauma history, red flags, neurological findings, or failure to respond to conservative care. I also understand that some practice models use X-rays as a standard part of the initial workup for biomechanical analysis. Whatever the office protocol is, I want to make sure we're making decisions that serve the patient's best interest and that we can clinically justify our imaging decisions.",
    redFlags: [
      "Saying 'I X-ray every patient' without clinical justification",
      "Being rigidly anti-X-ray without nuance",
      "Not knowing basic imaging guidelines or criteria",
      "Having no opinion at all -- shows lack of clinical thought",
    ],
  },
  {
    id: 6,
    question: "What are your production expectations?",
    difficulty: "Medium",
    category: "Business",
    whyTheyAsk: "They want to see if you have realistic expectations about what an associate produces and whether you understand the business side of practice.",
    framework: [
      "Show you've researched typical associate production numbers",
      "Be honest about being new while showing ambition",
      "Ask about their ramp-up timeline expectations",
      "Connect production to patient care, not just money",
    ],
    exampleAnswer: "From my research, a new associate typically builds to about 80-120 patient visits per week within the first 6-12 months, depending on the office's marketing and patient flow. I'd expect a ramp-up period and I'm prepared to put in the work -- screenings, community events, whatever it takes to build the schedule. What I'd love to understand is what your typical ramp-up looks like and what support systems you have in place for a new associate to succeed.",
    redFlags: [
      "Having zero knowledge of typical production numbers",
      "Expecting to see 200 patients per week from day one",
      "Showing no interest in how you'll build your schedule",
      "Focusing only on money rather than patient volume and outcomes",
    ],
  },
  {
    id: 7,
    question: "How do you feel about marketing and community events?",
    difficulty: "Easy",
    category: "Business",
    whyTheyAsk: "Most associate positions require some level of external marketing. They want to know you won't hide in the adjusting room and expect patients to just appear.",
    framework: [
      "Show enthusiasm for getting out in the community",
      "Mention specific marketing activities you're willing to do",
      "Connect marketing to practice growth and mission",
      "Ask what marketing they currently do",
    ],
    exampleAnswer: "I love it. I think getting into the community is one of the best parts of being a chiropractor. I'm comfortable doing spinal screenings, lunch-and-learns at local businesses, health fairs, and social media content. I see marketing not as selling but as educating the community about what we do. I'd love to hear about the marketing culture here and what events have worked well for your office.",
    redFlags: [
      "Saying 'I just want to adjust' with no marketing interest",
      "Acting like marketing is beneath you",
      "Having no ideas when asked about specific marketing activities",
      "Showing zero initiative or creativity",
    ],
  },
  {
    id: 8,
    question: "What's your ideal compensation structure?",
    difficulty: "Hard",
    category: "Business",
    whyTheyAsk: "They're testing whether you understand compensation models and whether your expectations are realistic. This is also where you can accidentally price yourself out -- or undervalue yourself.",
    framework: [
      "Show you understand different comp models (base, bonus, collections %)",
      "Express flexibility while having a range in mind",
      "Ask about their structure before committing to a number",
      "Connect comp to performance and growth",
    ],
    exampleAnswer: "I've done my research on typical associate compensation, and I think the best structures align the interests of the associate and the practice. I'm drawn to a base-plus-bonus model because it gives security while I build my patient base, and it rewards me as I grow. I'm flexible on the specifics -- what matters most is that the structure incentivizes me to produce and that there's a clear path to increased compensation as I hit milestones. What does your current compensation model look like?",
    redFlags: [
      "Throwing out a specific number before knowing the office's range",
      "Having no knowledge of typical compensation structures",
      "Only caring about base salary with no mention of performance",
      "Demanding equity or partnership on day one",
    ],
  },
  {
    id: 9,
    question: "How many patients do you expect to see per day?",
    difficulty: "Medium",
    category: "Business",
    whyTheyAsk: "They want to gauge whether you can handle volume and whether your expectations match their practice model. High-volume and low-volume practices have very different cultures.",
    framework: [
      "Give a range rather than a single number",
      "Show awareness that it depends on the practice model",
      "Emphasize quality of care regardless of volume",
      "Ask about their current daily flow",
    ],
    exampleAnswer: "That really depends on the practice model and the types of cases. In a wellness-based high-volume practice, I could see 30-50 patients a day once I'm ramped up. In a rehab-heavy or PI-focused office, maybe 15-25 because visit times are longer. Either way, I want to make sure every patient gets the attention they deserve. What does a typical day look like for your associates here?",
    redFlags: [
      "Saying a specific low number like 'five or six' with no context",
      "Being unwilling to see higher volume",
      "Not understanding that practice model affects patient count",
      "Showing anxiety about seeing 'too many' patients",
    ],
  },
  {
    id: 10,
    question: "Are you comfortable with insurance billing, cash practice, or both?",
    difficulty: "Medium",
    category: "Business",
    whyTheyAsk: "This reveals your adaptability and whether you understand the financial mechanics of different practice models.",
    framework: [
      "Show comfort with whatever model they use",
      "Demonstrate basic understanding of insurance vs. cash pros/cons",
      "Express willingness to learn the business side",
      "Ask about their specific model",
    ],
    exampleAnswer: "I'm comfortable with both. Insurance-based practices give patients access to care with lower out-of-pocket costs, and I understand the documentation requirements that come with that. Cash practices offer simplicity and let you focus purely on outcomes. What I care about most is that the financial model supports great patient care. I'm eager to learn the specifics of however your office operates. What model does this practice use?",
    redFlags: [
      "Being openly hostile toward insurance ('I'd never take insurance')",
      "Having no understanding of how insurance billing works",
      "Not knowing the difference between cash and insurance models",
      "Refusing to learn documentation or compliance requirements",
    ],
  },
  {
    id: 11,
    question: "Why chiropractic?",
    difficulty: "Easy",
    category: "Culture",
    whyTheyAsk: "They want to hear your passion and personal story. This is your chance to connect emotionally and show that chiropractic isn't just a job for you.",
    framework: [
      "Share your personal connection to chiropractic",
      "Keep it genuine and concise (not your entire life story)",
      "Show passion without being preachy",
      "Connect your 'why' to serving patients",
    ],
    exampleAnswer: "I was a college athlete dealing with chronic back pain, and I'd tried everything -- PT, injections, pain meds. A teammate dragged me to a chiropractor, and within a few weeks I was not only out of pain but performing better than I had in years. That experience completely changed my understanding of health care. I realized I wanted to help people the way I was helped -- not just managing symptoms but actually fixing the problem. That's what drove me through four years of chiropractic school, and it's what gets me fired up every day.",
    redFlags: [
      "Saying 'I couldn't get into medical school'",
      "Having no personal connection or passion",
      "Being unable to articulate why chiropractic specifically",
      "Giving a generic answer that could apply to any healthcare field",
    ],
  },
  {
    id: 12,
    question: "Why do you want to work HERE specifically?",
    difficulty: "Medium",
    category: "Culture",
    whyTheyAsk: "They want to know you've done your homework and that this isn't just a random application. Practice owners take their brand and mission seriously.",
    framework: [
      "Reference specific things about their practice (website, reviews, community presence)",
      "Connect their values/mission to yours",
      "Mention what you'd bring to their team specifically",
      "Be genuine -- they can smell generic answers",
    ],
    exampleAnswer: "I've been following your practice on social media, and I love the emphasis on family wellness care and community engagement. Your Google reviews mention how welcoming the team is, and that tells me a lot about the culture you've built. I'm also drawn to the fact that you do regular community events -- that aligns with how I want to practice. I think my energy, clinical skills, and passion for community outreach would be a great fit for what you're building here.",
    redFlags: [
      "Having no knowledge of the practice at all",
      "Giving a generic answer like 'it seems like a nice office'",
      "Only mentioning location or salary",
      "Not being able to name anything specific about the practice",
    ],
  },
  {
    id: 13,
    question: "Where do you see yourself in 5 years?",
    difficulty: "Medium",
    category: "Culture",
    whyTheyAsk: "They're assessing retention risk. If you're planning to leave in 6 months to open your own practice across the street, they need to know that.",
    framework: [
      "Be honest but tactful",
      "Show commitment to growth within the role",
      "If you want ownership eventually, frame it collaboratively",
      "Focus on becoming an excellent clinician first",
    ],
    exampleAnswer: "In five years, I want to be an excellent clinician with a full schedule of patients who trust me and refer their families. I'd love to grow into a leadership role within a practice -- whether that's mentoring new associates, taking on more responsibility, or eventually exploring an ownership pathway. Right now, my priority is learning from a great mentor, building my skills, and contributing to a practice's growth. I'm not in a rush to go anywhere -- I want to plant roots and build something meaningful.",
    redFlags: [
      "Saying 'I want to open my own practice right away'",
      "Having no ambition or growth mindset",
      "Being evasive or clearly lying about long-term plans",
      "Showing no interest in the role beyond a paycheck",
    ],
  },
  {
    id: 14,
    question: "How do you handle conflict with a team member?",
    difficulty: "Medium",
    category: "Culture",
    whyTheyAsk: "Office dynamics matter. They want to know you're mature, professional, and can handle disagreements without creating drama.",
    framework: [
      "Show emotional maturity and self-awareness",
      "Describe a specific approach (direct conversation, listening first, etc.)",
      "Emphasize resolution over winning",
      "Mention when you'd involve leadership if needed",
    ],
    exampleAnswer: "I believe in addressing things directly and respectfully. If there's a conflict, I'd first try to understand the other person's perspective by having a private, calm conversation. Most conflicts come from miscommunication, and simply listening can resolve 80% of issues. If we can't resolve it between ourselves, I'd involve a manager or the practice owner to mediate. What I won't do is let things fester or complain behind someone's back -- that's toxic for a team. The goal is always to find a solution that keeps the team strong.",
    redFlags: [
      "Saying 'I've never had a conflict' (unrealistic)",
      "Describing aggressive or passive-aggressive approaches",
      "Immediately going to the boss without trying to resolve it first",
      "Avoiding the question entirely",
    ],
  },
  {
    id: 15,
    question: "Tell me about a time you failed and what you learned.",
    difficulty: "Hard",
    category: "Culture",
    whyTheyAsk: "This tests self-awareness, humility, and growth mindset. They want to see that you can own mistakes and learn from them.",
    framework: [
      "Choose a real, meaningful example (not a humble brag)",
      "Own the failure completely -- no excuses",
      "Focus heavily on what you learned",
      "Show how you've applied that lesson since",
    ],
    exampleAnswer: "During my clinical rotations, I had a patient whose low back pain wasn't improving. I was so focused on the adjustment that I wasn't looking at the full picture -- their lifestyle, ergonomics, stress levels. My supervising doctor pointed out that I was treating a spine, not a person. That was humbling. Since then, I've completely changed my approach to intake and case management. I now spend more time on history, lifestyle factors, and patient education. That failure made me a significantly better clinician.",
    redFlags: [
      "Saying 'I can't think of one' (shows lack of self-awareness)",
      "Choosing a trivial example that doesn't show real growth",
      "Blaming others for the failure",
      "Not being able to articulate what you learned",
    ],
  },
  {
    id: 16,
    question: "What does wellness care mean to you?",
    difficulty: "Medium",
    category: "Philosophy",
    whyTheyAsk: "This reveals how you view the long-term patient relationship and whether you'll keep patients engaged past pain relief. Retention is the lifeblood of most practices.",
    framework: [
      "Define wellness care in your own words",
      "Distinguish it from symptom-based care",
      "Show you understand its value to the patient AND the practice",
      "Be authentic -- don't just tell them what they want to hear",
    ],
    exampleAnswer: "To me, wellness care is about helping patients maintain the gains they've made and optimizing their health long-term, not just putting out fires when they're in pain. It's like going to the dentist for a cleaning -- you don't wait until you have a cavity. I believe in educating patients about the value of maintenance care so they're making an informed choice, not feeling pressured. When patients understand that regular adjustments help them stay active, sleep better, and prevent future problems, they choose to stay.",
    redFlags: [
      "Saying 'I don't believe in wellness care'",
      "Describing wellness care as 'just getting people to keep coming back'",
      "Having no framework for transitioning patients from corrective to wellness",
      "Sounding like you see patients as revenue rather than people",
    ],
  },
  {
    id: 17,
    question: "How do you explain chiropractic to a skeptic?",
    difficulty: "Hard",
    category: "Philosophy",
    whyTheyAsk: "This tests your communication skills, confidence in your profession, and whether you can handle pushback without getting defensive or preachy.",
    framework: [
      "Start with common ground, not confrontation",
      "Use simple, evidence-based language",
      "Avoid jargon and philosophy lectures",
      "Share a brief, relatable example",
    ],
    exampleAnswer: "I meet them where they are instead of trying to convert them. I'd say something like: 'Your spine protects your nervous system, which controls everything in your body. When the spine isn't moving properly, it can cause pain, stiffness, headaches, and a lot of other problems. What chiropractors do is restore that movement so your body can function the way it's designed to.' I find that when you keep it simple and grounded in anatomy, most skeptics at least become curious. I never argue -- I just invite them to experience it.",
    redFlags: [
      "Getting defensive or argumentative",
      "Using heavy philosophy or jargon ('innate intelligence' to a skeptic)",
      "Saying 'chiropractic cures everything'",
      "Being dismissive of the skeptic's concerns",
      "Unable to explain chiropractic simply",
    ],
  },
  {
    id: 18,
    question: "Do you believe in subluxation-based chiropractic?",
    difficulty: "Hard",
    category: "Philosophy",
    whyTheyAsk: "This is the most polarizing question in chiropractic. They want to see if your philosophy aligns with theirs and whether you can articulate your position without being dogmatic.",
    framework: [
      "Be honest about your perspective",
      "Show respect for different viewpoints within the profession",
      "Avoid being either extreme (militant subluxation or dismissive of it)",
      "Focus on patient outcomes as the common ground",
    ],
    exampleAnswer: "I respect the history and philosophy behind subluxation-based chiropractic, and I understand its importance to our profession's identity. In my own practice, I focus on identifying and correcting vertebral dysfunction that's affecting the nervous system and overall function. Whether we call that a subluxation or a segmental dysfunction, the clinical goal is the same -- restoring proper movement and neurological function. I think the profession is strongest when we focus on what unites us -- helping patients get better -- rather than getting caught up in terminology debates.",
    redFlags: [
      "Being aggressively for or against subluxation without nuance",
      "Insulting other chiropractors' philosophical positions",
      "Having no opinion at all (shows lack of professional thought)",
      "Making claims about subluxation that aren't supported by evidence",
    ],
  },
  {
    id: 19,
    question: "How do you feel about recommending supplements?",
    difficulty: "Easy",
    category: "Philosophy",
    whyTheyAsk: "Many practices sell supplements as part of their wellness model. They want to know if you're comfortable recommending products and whether you see it as part of holistic care.",
    framework: [
      "Show openness to recommending supplements when appropriate",
      "Emphasize evidence-based recommendations",
      "Connect it to whole-person care",
      "Ask about their supplement program",
    ],
    exampleAnswer: "I'm absolutely comfortable with it when it's clinically appropriate. Things like omega-3s for inflammation, vitamin D for bone health, and magnesium for muscle function have strong evidence behind them. I see supplement recommendations as part of whole-person care -- we're not just adjusting spines, we're helping people optimize their health. I'd be curious to learn about your supplement program and how you integrate recommendations into your care plans.",
    redFlags: [
      "Being completely anti-supplement with no nuance",
      "Being willing to sell anything regardless of evidence",
      "Not mentioning clinical appropriateness",
      "Showing zero knowledge of common supplements",
    ],
  },
  {
    id: 20,
    question: "What would you do if you disagreed with the owner's case management?",
    difficulty: "Hard",
    category: "Philosophy",
    whyTheyAsk: "This tests your professionalism, respect for hierarchy, and whether you can navigate disagreements constructively. They also want to know you have a spine (no pun intended) and won't just blindly follow orders if patient safety is at stake.",
    framework: [
      "Show respect for the owner's experience and authority",
      "Describe how you'd raise concerns professionally",
      "Distinguish between preference differences and ethical concerns",
      "Emphasize the patient's best interest as the guiding principle",
    ],
    exampleAnswer: "If it was a difference in approach, I'd respectfully ask about their reasoning. They have more experience than me, and there's probably a rationale I haven't considered. I'd say something like, 'Help me understand your thinking on this case -- I want to learn.' If it was a genuine ethical or safety concern, I'd have a private, respectful conversation about it. I'd never undermine the owner in front of patients or staff, but I also have a license to protect and a duty to my patients. In most cases, these conversations lead to both people learning something.",
    redFlags: [
      "Saying 'I'd just do whatever they say'",
      "Being confrontational or insubordinate",
      "Not distinguishing between preference and ethics",
      "Having no framework for professional disagreement",
    ],
  },
];

// ─── Questions to Ask Data ───────────────────────────────────────────────────

interface QuestionToAsk {
  id: number;
  question: string;
  category: "Compensation" | "Culture" | "Growth" | "Legal" | "Patients";
  whyMatters: string;
  goodAnswer: string;
  redFlagAnswer: string;
  followUp: string;
}

const QUESTIONS_TO_ASK: QuestionToAsk[] = [
  {
    id: 1,
    question: "What does a typical day look like for an associate here?",
    category: "Culture",
    whyMatters: "This reveals the actual daily reality versus the job posting's promises. You'll learn about patient flow, breaks, documentation time, and whether the schedule is realistic or a burnout machine.",
    goodAnswer: "A detailed, honest walkthrough that includes patient hours, admin time, breaks, and flexibility. They mention support staff and systems that help you stay efficient.",
    redFlagAnswer: "Vague answers like 'every day is different' or descriptions that have you seeing patients for 10 straight hours with no breaks, admin time, or documentation time built in.",
    followUp: "Can I shadow for a day before making a decision?",
  },
  {
    id: 2,
    question: "How many patients does the average associate see per week, and what's the ramp-up timeline?",
    category: "Patients",
    whyMatters: "This tells you if the practice has a realistic plan for getting you busy, or if they're going to throw you in and expect magic. The ramp-up timeline reveals how patient they are with new associates.",
    goodAnswer: "Specific numbers with a realistic ramp-up: 'Most associates build to 80-100 visits per week within 6-9 months. We actively market and route new patients to associates.'",
    redFlagAnswer: "No data, unrealistic expectations ('you should be at 150 visits in month one'), or placing all responsibility on you to build your schedule from scratch with no support.",
    followUp: "What marketing support do you provide to help new associates build their schedule?",
  },
  {
    id: 3,
    question: "What happened with the last associate who left?",
    category: "Culture",
    whyMatters: "The answer reveals turnover patterns, how they treat people, and whether associates tend to stay or run. High turnover is the biggest red flag in chiropractic associateships.",
    goodAnswer: "Honest, respectful answer: 'They moved out of state for family' or 'They grew into their own practice and we helped them transition.' Bonus if they're still on good terms.",
    redFlagAnswer: "Badmouthing the previous associate, being evasive, having a history of associates leaving within a year, or saying 'we've never had an associate stay more than a year.'",
    followUp: "Would you be comfortable connecting me with a previous associate as a reference?",
  },
  {
    id: 4,
    question: "What does the compensation structure look like, including bonuses and benefits?",
    category: "Compensation",
    whyMatters: "You need the complete picture, not just the base salary. Many practices use complex bonus structures that look great on paper but are nearly impossible to actually earn.",
    goodAnswer: "Transparent breakdown: base salary, clear bonus thresholds with examples of what associates actually earn, benefits list, and timeline for compensation reviews.",
    redFlagAnswer: "Vague promises ('you'll make great money'), bonus structures with unreachable thresholds, no benefits, or reluctance to put numbers in writing.",
    followUp: "Can you share what your current or most recent associate actually earned in total compensation last year?",
  },
  {
    id: 5,
    question: "Is this a W-2 or 1099 position?",
    category: "Legal",
    whyMatters: "1099 misclassification is rampant in chiropractic. If you're working set hours, using their equipment, and following their protocols, you're legally a W-2 employee. Being misclassified costs you thousands in self-employment taxes.",
    goodAnswer: "W-2 with full benefits. If 1099, they have a clear rationale and compensate accordingly (15-20% higher to offset self-employment taxes).",
    redFlagAnswer: "1099 with set hours, set protocols, and no compensation adjustment. Or they don't know the difference. This is a legal and financial red flag.",
    followUp: "If 1099, will the compensation be adjusted to account for the additional self-employment tax burden?",
  },
  {
    id: 6,
    question: "Is there a non-compete clause? What are the terms?",
    category: "Legal",
    whyMatters: "A non-compete can prevent you from practicing in the area if you leave. Aggressive non-competes are the number one contract issue for new associates and can derail your career.",
    goodAnswer: "No non-compete, or reasonable terms: 10-15 mile radius, 6-12 months, with a buyout clause. Willingness to negotiate terms.",
    redFlagAnswer: "25+ mile radius, 24+ months, no buyout option, or unwillingness to discuss terms. Especially dangerous in metro areas where a large radius eliminates all options.",
    followUp: "Is there a buyout clause that would allow me to waive the non-compete if needed?",
  },
  {
    id: 7,
    question: "What does mentorship look like here?",
    category: "Growth",
    whyMatters: "The quality of mentorship in your first position shapes your entire career. You want structured guidance, not just being left alone to figure it out.",
    goodAnswer: "Structured mentorship: regular case reviews, observation periods, open-door policy for questions, and a designated mentor. They invest in your clinical development.",
    redFlagAnswer: "No mentorship plan, 'you'll figure it out,' or the owner is too busy to provide guidance. Also a red flag if they expect you to be fully independent from day one.",
    followUp: "How often would we do case reviews together in the first few months?",
  },
  {
    id: 8,
    question: "What CE and training support do you offer?",
    category: "Growth",
    whyMatters: "Continuing education investment shows they care about your growth and want to keep you long-term. It also affects your professional development trajectory.",
    goodAnswer: "Annual CE budget ($1,500-3,000+), paid time off for seminars, and encouragement to pursue certifications. Some offices pay for specific certifications they value.",
    redFlagAnswer: "No CE budget, no paid time off for training, or they actively discourage you from learning new techniques. 'You don't need more training' is a red flag.",
    followUp: "Is there a specific certification or training you'd love your next associate to pursue?",
  },
  {
    id: 9,
    question: "Is there a path to ownership or partnership?",
    category: "Growth",
    whyMatters: "If you want to own a practice eventually, knowing the path matters. Even if you don't, an ownership track signals that the owner invests in associates long-term.",
    goodAnswer: "A clear, defined pathway with timelines and milestones, or honest transparency that it's not available. Either is fine -- you just need honesty.",
    redFlagAnswer: "Vague promises like 'maybe someday' with no structure, or dangling ownership as a carrot with no real intention. Also concerning if every associate has been promised this and none achieved it.",
    followUp: "Has any previous associate transitioned into ownership here?",
  },
  {
    id: 10,
    question: "How does the office handle patient complaints?",
    category: "Patients",
    whyMatters: "This reveals the office culture around accountability, patient satisfaction, and how they support (or blame) associates when things go wrong.",
    goodAnswer: "A clear process: listen to the patient, investigate, resolve fairly, and learn from it. The owner steps in to support the associate, not throw them under the bus.",
    redFlagAnswer: "Blaming the associate immediately, no process for resolution, or dismissing patient concerns. Also a red flag if they say 'we never get complaints' -- every practice does.",
    followUp: "Can you walk me through a recent patient complaint and how it was resolved?",
  },
  {
    id: 11,
    question: "What's the office culture around work-life balance?",
    category: "Culture",
    whyMatters: "Burnout is the number one reason associates leave chiropractic. The office's attitude toward boundaries, time off, and personal life tells you a lot about long-term sustainability.",
    goodAnswer: "Respect for personal time, reasonable hours (40-45/week), PTO that you're actually encouraged to use, and a culture where leaving on time isn't frowned upon.",
    redFlagAnswer: "Glorifying 60-hour weeks, making you feel guilty for taking time off, or the owner bragging about 'never taking a vacation.' Burnout culture is contagious.",
    followUp: "What hours would I typically work, and how is the on-call schedule handled?",
  },
  {
    id: 12,
    question: "What technology and EHR systems does the office use?",
    category: "Patients",
    whyMatters: "Outdated systems slow you down and add frustration. Modern EHR, digital intake, and efficient workflows mean you spend more time with patients and less time on paperwork.",
    goodAnswer: "Modern, cloud-based EHR, digital intake forms, automated appointment reminders, and a willingness to adopt better systems. Staff is trained and the system works smoothly.",
    redFlagAnswer: "Paper charts, outdated software from the 1990s, or a system that takes 30 minutes per patient note. Technology resistance often signals broader resistance to improvement.",
    followUp: "How much time does the average patient note take in your current system?",
  },
  {
    id: 13,
    question: "How do you handle associate compensation reviews?",
    category: "Compensation",
    whyMatters: "You need to know when and how your pay can increase. A practice with no review process is one where you'll be making the same salary in year three as day one.",
    goodAnswer: "Scheduled annual reviews (or more frequent), clear metrics tied to raises, and a history of actually following through. Transparent about what it takes to earn more.",
    redFlagAnswer: "No review process, 'we'll talk about it when the time comes,' or a history of promising raises that never materialize.",
    followUp: "What metrics would trigger a compensation increase, and what's the typical timeline?",
  },
  {
    id: 14,
    question: "Can I see the associate contract before my final decision?",
    category: "Legal",
    whyMatters: "You should NEVER sign a contract the same day it's presented. You need time to review it, ideally with an attorney who understands chiropractic contracts.",
    goodAnswer: "Absolutely. They provide the contract with ample review time (at least a week), encourage you to have an attorney review it, and are open to negotiation.",
    redFlagAnswer: "Pressure to sign immediately, reluctance to share the contract in advance, or acting offended that you want to review it. Major red flag if they say 'nobody else has asked to review it.'",
    followUp: "Is the contract negotiable, or are the terms standard for all associates?",
  },
  {
    id: 15,
    question: "What does success look like for this role in the first year?",
    category: "Growth",
    whyMatters: "Clear expectations prevent misunderstandings and set you up for success. If they can't define success, they can't support you in achieving it.",
    goodAnswer: "Specific, measurable milestones: patient volume targets by quarter, clinical competencies to develop, community involvement expectations, and how they'll support you in hitting those goals.",
    redFlagAnswer: "No clear expectations, unrealistic goals with no support plan, or purely financial metrics with no mention of clinical development or patient outcomes.",
    followUp: "What support will I receive to help me hit those milestones?",
  },
];

// ─── Negotiation Scripts Data ────────────────────────────────────────────────

interface NegotiationScript {
  id: number;
  title: string;
  situation: string;
  whatToSay: string;
  whatNotToSay: string;
  proTip: string;
}

const NEGOTIATION_SCRIPTS: NegotiationScript[] = [
  {
    id: 1,
    title: "Asking for a Higher Base Salary",
    situation: "The base salary offered is below market rate or below your research-backed target. Use this after you've received the initial offer but before signing.",
    whatToSay: "Thank you for the offer -- I'm genuinely excited about this opportunity and I can see myself thriving here. Based on my research of associate compensation in this market and the value I'll bring with my [technique/skill/certification], I was hoping we could discuss the base salary. The typical range I've seen for this type of position is $X-$Y. Would you be open to adjusting the base to [your target number]? I want us both to feel great about this arrangement from day one.",
    whatNotToSay: "This salary is too low. I need at least $X or I'm walking. My classmate got offered way more at another office. I have student loans to pay so I need more money.",
    proTip: "Always negotiate in person or on the phone, never over email. Your tone and enthusiasm matter as much as the words. And always frame it as 'we' -- you're building a partnership, not making demands.",
  },
  {
    id: 2,
    title: "Negotiating a Non-Compete Clause",
    situation: "The contract includes a non-compete that feels too restrictive -- too wide a radius, too long a duration, or no buyout option. This is often the most important negotiation point.",
    whatToSay: "I completely understand the need to protect the practice, and I respect that. I'm committed to building something great here. That said, the current non-compete terms would make it very difficult for me to practice in this area if things don't work out for either of us. Would you be open to adjusting the radius to [10-15 miles] and the duration to [12 months]? I'd also love to discuss adding a buyout clause so there's a clear, fair option for both parties. This actually protects you too -- it means I'm financially invested in honoring the spirit of the agreement.",
    whatNotToSay: "Non-competes aren't enforceable anyway, so it doesn't matter. I'm not signing anything with a non-compete. My lawyer says this is ridiculous.",
    proTip: "Non-compete negotiation is where most associateships are won or lost. Be firm but respectful. If they absolutely won't budge on an aggressive non-compete, that tells you a lot about how they'll treat you as an associate. Consider it a character test.",
  },
  {
    id: 3,
    title: "Requesting a Signing Bonus",
    situation: "You have student loans, relocation costs, or need to purchase equipment. A signing bonus helps bridge the gap and shows the practice is invested in you.",
    whatToSay: "I'm really excited about joining the team. One thing I'd like to discuss is a signing bonus to help with the transition costs of relocating and getting started. Would you be open to a $[3,000-5,000] signing bonus? I'm flexible on the structure -- it could be paid upfront or split over the first few months. I see it as a mutual investment in getting this relationship off to the best possible start.",
    whatNotToSay: "I need money to move -- can you give me a signing bonus? Every other job I'm looking at offers a signing bonus. I can't afford to start without extra money upfront.",
    proTip: "If they can't do a signing bonus, ask for alternatives: relocation assistance, a equipment stipend, or a guaranteed first-month draw. There are many ways to get to the same dollar amount without calling it a signing bonus.",
  },
  {
    id: 4,
    title: "Asking for Better Benefits",
    situation: "The offer is light on benefits -- missing health insurance, CE budget, PTO, or malpractice coverage. Benefits are often easier to negotiate than base salary.",
    whatToSay: "The overall offer looks strong, and I appreciate the detail you've put into it. I'd like to discuss the benefits package. Specifically, I'm looking at [health insurance / CE budget / PTO days]. For example, a $2,000 annual CE budget would help me pursue [certification/training] that would directly benefit the practice. And [X days] of PTO would help me stay sharp and avoid burnout. Could we explore adding these to the package?",
    whatNotToSay: "The benefits are terrible. I need way more PTO than this. My friend's office gives them everything -- why can't you?",
    proTip: "Benefits are often the easiest thing to negotiate because they have a smaller impact on the owner's cash flow than salary increases. Lead with the benefits that directly help the practice (CE, certifications) and you'll have more leverage.",
  },
  {
    id: 5,
    title: "Negotiating W-2 Instead of 1099",
    situation: "The offer is structured as 1099 (independent contractor) but the role clearly functions as a W-2 employee. This costs you thousands in self-employment taxes.",
    whatToSay: "I've been reading up on the IRS worker classification guidelines, and based on the role as described -- set hours, using the office's equipment, following established protocols -- this position seems to meet the criteria for W-2 employment. I'd love to discuss either restructuring this as a W-2 position, or adjusting the compensation by 15-20% to account for the additional self-employment tax burden I'd carry as a 1099. I want to make sure we're set up correctly from a compliance standpoint and that the compensation reflects the actual structure.",
    whatNotToSay: "This is illegal. You're trying to avoid paying taxes by making me a 1099. I'm going to report you to the IRS.",
    proTip: "Many practice owners genuinely don't understand the legal distinction. Approach this as education, not accusation. If they insist on 1099 with no adjustment, that's a serious red flag about how they'll treat you financially throughout the relationship.",
  },
  {
    id: 6,
    title: "Requesting a Performance Review Timeline",
    situation: "There's no mention of when or how your compensation will be reviewed. Without defined milestones, you could be stuck at the same pay for years.",
    whatToSay: "I'm excited about the growth potential here. One thing I'd like to build into our agreement is a structured performance review timeline -- maybe at 90 days, 6 months, and annually. This would give us both a chance to assess how things are going and discuss compensation adjustments based on clear metrics. Could we define what those metrics would look like? I'm thinking patient volume, retention rates, and production numbers. Having this structure helps me know exactly what I'm working toward.",
    whatNotToSay: "When do I get a raise? I don't want to be stuck at this salary forever. Promise me I'll make more next year.",
    proTip: "Get the review timeline AND the metrics in writing as part of the contract. Verbal promises about raises are meaningless. If they're not willing to commit to a review process in writing, their 'growth potential' talk is just talk.",
  },
  {
    id: 7,
    title: "Asking for an Equity or Partnership Path",
    situation: "You're interested in long-term ownership but it wasn't mentioned in the offer. This is a conversation for when you're seriously considering the position.",
    whatToSay: "One of the things that excites me most about this opportunity is the potential for a long-term relationship. I'd love to understand if there's an ownership or partnership pathway as part of the long-term vision. I'm not looking for anything immediate -- I know I need to prove myself first. But knowing there's a defined path with clear milestones would help me commit fully to building something here rather than always wondering 'what's next.' Is that something you'd be open to exploring?",
    whatNotToSay: "I want to be a partner within two years. I'm only interested if I can own part of the practice. What's the practice worth? I want equity from day one.",
    proTip: "Don't push this too hard too early -- it can scare owners who think you're trying to take over. Frame it as 'long-term vision' and let them know you're willing to earn it. The best owners are already thinking about succession and will be thrilled that you're thinking long-term.",
  },
  {
    id: 8,
    title: "Counter-Offering When They Say No",
    situation: "They've rejected your initial negotiation request. This is where most people give up -- but there's usually middle ground to find.",
    whatToSay: "I understand, and I appreciate you being straightforward with me. The opportunity here is genuinely important to me, so I'd like to find a middle ground that works for both of us. If the base salary is firm, would you be open to [alternative: lower bonus threshold, additional PTO, CE budget increase, earlier performance review, reduced non-compete]? I want to find a way to make this work because I believe I can bring a lot of value to your practice.",
    whatNotToSay: "Fine, forget it. I guess I'll just take what you're offering. This is my final offer -- take it or leave it. I'll just go work somewhere else then.",
    proTip: "Never negotiate just one thing. Always have 3-4 items you want to discuss so you can trade. If they say no to salary, you can get wins on benefits, schedule, non-compete, or review timeline. The goal is for both parties to walk away feeling like they won.",
  },
];

// ─── Thank You Templates ─────────────────────────────────────────────────────

interface EmailTemplate {
  id: number;
  title: string;
  whenToUse: string;
  template: string;
}

const THANK_YOU_TEMPLATES: EmailTemplate[] = [
  {
    id: 1,
    title: "Strong Interest -- You Want the Job",
    whenToUse: "Send within 24 hours of the interview when you're genuinely excited about the position and want to move forward.",
    template: `Subject: Thank you -- excited about [PRACTICE NAME]

Dr. [NAME],

Thank you so much for taking the time to meet with me today. I really enjoyed learning about [PRACTICE NAME] and the vision you have for the practice.

Our conversation reinforced my excitement about this opportunity. I was particularly drawn to [SPECIFIC THING DISCUSSED -- their mentorship approach, patient care philosophy, community involvement, etc.]. It aligns perfectly with how I want to practice and grow as a clinician.

I'm confident I can contribute to your team through [YOUR SPECIFIC STRENGTH -- technique proficiency, marketing enthusiasm, patient communication, etc.], and I'm eager to hit the ground running.

I'd love to take the next steps whenever you're ready. Please don't hesitate to reach out if you have any additional questions.

Thank you again for the opportunity.

Best regards,
[YOUR NAME]
[YOUR PHONE]
[YOUR EMAIL]`,
  },
  {
    id: 2,
    title: "Evaluating Options -- Buying Time",
    whenToUse: "Send within 24 hours when you're interested but want to keep your options open or need more time to decide.",
    template: `Subject: Thank you for the interview -- [PRACTICE NAME]

Dr. [NAME],

Thank you for meeting with me today. I appreciated the thorough look at [PRACTICE NAME] and your transparency about the role and expectations.

I came away with a strong impression of the practice, especially [SPECIFIC POSITIVE DETAIL]. I'm giving serious thought to how this opportunity aligns with my career goals and I want to be thoughtful about this decision -- for both our sakes.

I have a few things I'd like to consider and may have a couple of follow-up questions over the next few days. Would it be alright if I reached out by [DATE -- typically 5-7 days out]?

Thank you again for your time and consideration.

Warm regards,
[YOUR NAME]
[YOUR PHONE]
[YOUR EMAIL]`,
  },
  {
    id: 3,
    title: "Graceful Decline -- Not the Right Fit",
    whenToUse: "Send when you've decided this isn't the right position for you. Burning bridges in chiropractic is career suicide -- the community is small.",
    template: `Subject: Thank you -- [PRACTICE NAME]

Dr. [NAME],

Thank you so much for taking the time to meet with me and share your vision for [PRACTICE NAME]. I have a lot of respect for what you've built.

After careful consideration, I've decided to pursue a different opportunity that I feel is a better fit for where I am in my career right now. This was not an easy decision, and it has nothing to do with the quality of your practice -- I think you're doing great work.

I genuinely appreciate the time you invested in our conversation, and I wish you and your team continued success. I hope our paths cross again in the future.

With respect,
[YOUR NAME]
[YOUR PHONE]
[YOUR EMAIL]`,
  },
];

// ─── Offer Calculator Types ──────────────────────────────────────────────────

interface OfferInputs {
  baseSalary: number;
  compModel: string;
  bonusPct: number;
  bonusThreshold: number;
  estMonthlyCollections: number;
  employmentType: "W-2" | "1099";
  benefits: string[];
  hasNonCompete: boolean;
  nonCompeteRadius: number;
  nonCompeteDuration: number;
  hasEquityPath: boolean;
  signingBonus: number;
}

const INITIAL_OFFER: OfferInputs = {
  baseSalary: 60000,
  compModel: "Base Only",
  bonusPct: 0,
  bonusThreshold: 0,
  estMonthlyCollections: 0,
  employmentType: "W-2",
  benefits: [],
  hasNonCompete: false,
  nonCompeteRadius: 0,
  nonCompeteDuration: 0,
  hasEquityPath: false,
  signingBonus: 0,
};

const BENEFIT_VALUES: Record<string, number> = {
  "Health Insurance": 6000,
  Malpractice: 1200,
  "CE Budget": 2000,
  PTO: 3000,
  "401k": 2400,
  Equipment: 1500,
};

const BENEFITS_LIST = ["Health Insurance", "Malpractice", "CE Budget", "PTO", "401k", "Equipment"];

// ─── Walk-Away Checklist ─────────────────────────────────────────────────────

const WALK_AWAY_ITEMS = [
  "1099 classification with W-2 control and no compensation adjustment",
  "Non-compete over 25 miles or 24 months with no buyout option",
  "No written contract or refusal to let you review before signing",
  "Base salary under $45,000 with no realistic bonus path",
  "Owner badmouths every previous associate",
  "Pressure to sign immediately without review time",
  "No malpractice coverage and you're expected to pay out of pocket",
  "Unethical patient care demands (unnecessary X-rays, over-treating, billing fraud)",
];

// ─── Decision Checklist ──────────────────────────────────────────────────────

const DECISION_ITEMS = [
  "The compensation is fair and within market range for my area",
  "I understand and am comfortable with the employment classification (W-2/1099)",
  "The non-compete terms are reasonable (or there is none)",
  "There is a structured mentorship or training program",
  "The office culture feels genuinely supportive and positive",
  "The owner was transparent about expectations and finances",
  "I've reviewed the contract with an attorney or experienced advisor",
  "The daily schedule allows for work-life balance",
  "There is a clear path for compensation growth and/or advancement",
  "My gut feeling is positive after visiting the office",
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function InterviewPlaybook() {
  const [activeTab, setActiveTab] = useState(0);
  const [purchased, setPurchased] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Tab 1 state
  const [questionFilter, setQuestionFilter] = useState("All");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [practiceMode, setPracticeMode] = useState<Record<number, boolean>>({});
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [timers, setTimers] = useState<Record<number, number>>({});
  const timerRefs = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  // Tab 2 state
  const [expandedAsk, setExpandedAsk] = useState<number | null>(null);
  const [scorecardRatings, setScorecardRatings] = useState<Record<number, "green" | "yellow" | "red">>({});

  // Tab 3 state
  const [offer, setOffer] = useState<OfferInputs>(INITIAL_OFFER);

  // Tab 4 state
  const [expandedScript, setExpandedScript] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Tab 5 state
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [copiedTemplateId, setCopiedTemplateId] = useState<number | null>(null);
  const [decisionChecks, setDecisionChecks] = useState<Record<number, boolean>>({});

  // ─── Purchase check ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function checkPurchase() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase as any)
            .from("course_purchases")
            .select("id")
            .eq("course_id", "interview-playbook")
            .eq("user_id", user.id)
            .maybeSingle();
          if (!cancelled && data) setPurchased(true);
        }
      } catch {
        // Not logged in or table missing
      }
    }
    checkPurchase();
    return () => { cancelled = true; };
  }, []);

  // ─── Load localStorage ────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_PRACTICE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.practiceAnswers) setPracticeAnswers(parsed.practiceAnswers);
      }
    } catch { /* ignore */ }
    try {
      const saved = localStorage.getItem(LS_SCORECARD);
      if (saved) setScorecardRatings(JSON.parse(saved));
    } catch { /* ignore */ }
    try {
      const saved = localStorage.getItem(LS_OFFER);
      if (saved) setOffer((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  // ─── Save localStorage (debounced) ────────────────────────────────────────

  const practiceRef = useRef(practiceAnswers);
  practiceRef.current = practiceAnswers;
  const scorecardRef = useRef(scorecardRatings);
  scorecardRef.current = scorecardRatings;
  const offerRef = useRef(offer);
  offerRef.current = offer;

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(LS_PRACTICE, JSON.stringify({ practiceAnswers: practiceRef.current })); } catch { /* */ }
    }, 500);
    return () => clearTimeout(t);
  }, [practiceAnswers, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(LS_SCORECARD, JSON.stringify(scorecardRef.current)); } catch { /* */ }
    }, 500);
    return () => clearTimeout(t);
  }, [scorecardRatings, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(LS_OFFER, JSON.stringify(offerRef.current)); } catch { /* */ }
    }, 500);
    return () => clearTimeout(t);
  }, [offer, loaded]);

  // ─── Timer cleanup ────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(clearInterval);
    };
  }, []);

  // ─── Timer helpers ────────────────────────────────────────────────────────

  const startTimer = useCallback((qId: number) => {
    if (timerRefs.current[qId]) clearInterval(timerRefs.current[qId]);
    setTimers((prev) => ({ ...prev, [qId]: 60 }));
    timerRefs.current[qId] = setInterval(() => {
      setTimers((prev) => {
        const val = (prev[qId] ?? 0) - 1;
        if (val <= 0) {
          clearInterval(timerRefs.current[qId]);
          delete timerRefs.current[qId];
          return { ...prev, [qId]: 0 };
        }
        return { ...prev, [qId]: val };
      });
    }, 1000);
  }, []);

  // ─── Copy helper ──────────────────────────────────────────────────────────

  const copyText = useCallback(async (text: string, id: number, isTemplate?: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isTemplate) {
        setCopiedTemplateId(id);
        setTimeout(() => setCopiedTemplateId(null), 2000);
      } else {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch { /* */ }
  }, []);

  // ─── Offer calculation helpers ────────────────────────────────────────────

  const calcOffer = useCallback(() => {
    const o = offer;
    const base = o.baseSalary;
    const showBonus = o.compModel !== "Base Only";
    let estBonus = 0;
    if (showBonus && o.estMonthlyCollections > o.bonusThreshold) {
      estBonus = (o.estMonthlyCollections - o.bonusThreshold) * (o.bonusPct / 100) * 12;
    }
    const benefitsVal = o.benefits.reduce((sum, b) => sum + (BENEFIT_VALUES[b] || 0), 0);
    const totalComp = base + estBonus + benefitsVal + o.signingBonus;
    const hourly = totalComp / 2080;

    // Hidden costs
    let hiddenCosts = 0;
    if (o.employmentType === "1099") hiddenCosts += base * 0.0765;
    if (!o.benefits.includes("Health Insurance")) hiddenCosts += 6000;
    if (!o.benefits.includes("Malpractice")) hiddenCosts += 1200;
    if (o.hasNonCompete) {
      hiddenCosts += (base / 12) * o.nonCompeteDuration * 0.5;
    }
    const trueNet = totalComp - hiddenCosts;

    // Market comparison
    let marketLabel = "At Market";
    let marketColor = "#f59e0b";
    if (totalComp >= 85000) { marketLabel = "Above Market"; marketColor = "#22c55e"; }
    else if (totalComp < 60000) { marketLabel = "Below Market"; marketColor = "#ef4444"; }

    // Offer score
    let compPts = 5;
    if (base >= 75000) compPts = 35;
    else if (base >= 65000) compPts = 28;
    else if (base >= 55000) compPts = 20;
    else if (base >= 45000) compPts = 12;

    let benefitsPts = Math.min(24, o.benefits.length * 4);
    if (o.benefits.length === BENEFITS_LIST.length) benefitsPts = 25;

    let restrictPts = 20;
    if (o.hasNonCompete) {
      if (o.nonCompeteRadius <= 15 && o.nonCompeteDuration <= 12) restrictPts = 15;
      else if (o.nonCompeteRadius <= 25 && o.nonCompeteDuration <= 18) restrictPts = 8;
      else restrictPts = 3;
    }

    const growthPts = o.hasEquityPath ? 20 : 5;
    const totalScore = compPts + benefitsPts + restrictPts + growthPts;

    return {
      base, estBonus, benefitsVal, totalComp, hourly,
      hiddenCosts, trueNet, marketLabel, marketColor,
      compPts, benefitsPts, restrictPts, growthPts, totalScore,
      showBonus,
    };
  }, [offer]);

  // ─── Scorecard calculation ────────────────────────────────────────────────

  const calcScorecard = useCallback(() => {
    const ratings = Object.values(scorecardRatings);
    const greenCount = ratings.filter((r) => r === "green").length;
    const total = ratings.length;
    if (total === 0) return null;

    if (greenCount >= 12) return { label: "This practice looks solid", color: "#22c55e", bg: "#f0fdf4" };
    if (greenCount >= 8) return { label: "Proceed with caution", color: "#f59e0b", bg: "#fefce8" };
    if (greenCount >= 5) return { label: "Significant concerns -- investigate further", color: "#f97316", bg: "#fff7ed" };
    return { label: "Walk away -- too many red flags", color: "#ef4444", bg: "#fef2f2" };
  }, [scorecardRatings]);

  if (!loaded) return null;

  // ─── Purchase Gate ────────────────────────────────────────────────────────

  const PurchaseGate = ({ message }: { message?: string }) => (
    <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/70 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
      <Lock className="w-8 h-8 mb-3" style={{ color: BRAND_NAVY }} />
      <p className="font-bold text-lg" style={{ color: BRAND_NAVY }}>
        {message || "$29 -- Unlock Full Playbook"}
      </p>
      <p className="text-gray-500 text-sm mt-1 max-w-xs">
        Get access to all questions, the offer calculator, negotiation scripts, and follow-up templates.
      </p>
      <button
        className="mt-4 px-6 py-3 rounded-xl text-white font-bold text-sm transition-colors hover:opacity-90"
        style={{ backgroundColor: BRAND_ORANGE }}
      >
        Unlock for $29
      </button>
    </div>
  );

  // ─── TAB 1: Interview Questions ───────────────────────────────────────────

  const renderInterviewQuestions = () => {
    const filtered = questionFilter === "All"
      ? INTERVIEW_QUESTIONS
      : INTERVIEW_QUESTIONS.filter((q) => q.category === questionFilter);

    return (
      <div>
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-7 h-7" style={{ color: BRAND_ORANGE }} />
          <h2 className="text-2xl font-heading font-black" style={{ color: BRAND_NAVY }}>
            Interview Questions
          </h2>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Master the 20 most common chiropractic associate interview questions with frameworks, example answers, and practice mode.
        </p>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTER_CATEGORIES.map((cat) => {
            const isActive = questionFilter === cat;
            const color = cat === "All" ? BRAND_NAVY : CATEGORY_COLORS[cat] || BRAND_NAVY;
            return (
              <button
                key={cat}
                onClick={() => setQuestionFilter(cat)}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all border"
                style={{
                  backgroundColor: isActive ? color : "transparent",
                  color: isActive ? "#fff" : color,
                  borderColor: color,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Question cards */}
        <div className="space-y-3">
          {filtered.map((q) => {
            const isFree = q.id <= 5 || purchased;
            const isExpanded = expandedQ === q.id;
            const inPractice = practiceMode[q.id];
            const catColor = CATEGORY_COLORS[q.category] || BRAND_NAVY;
            const diffColor = DIFFICULTY_COLORS[q.difficulty] || BRAND_NAVY;

            return (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                {/* Collapsed header */}
                <button
                  onClick={() => {
                    if (isFree) setExpandedQ(isExpanded ? null : q.id);
                  }}
                  className="w-full text-left p-5 flex items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-gray-400 text-xs font-bold">Q{q.id}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: diffColor }}
                      >
                        {q.difficulty}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: catColor }}
                      >
                        {q.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-base" style={{ color: BRAND_NAVY }}>
                      {q.question}
                    </h3>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    {isFree ? (
                      isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                </button>

                {/* Lock overlay for 6-20 */}
                {!isFree && isExpanded && <PurchaseGate />}

                {/* Expanded content */}
                {isExpanded && isFree && !inPractice && (
                  <div className="px-5 pb-6 pt-0 space-y-5 border-t border-gray-100">
                    {/* Why they ask */}
                    <p className="text-sm text-gray-500 italic leading-relaxed">{q.whyTheyAsk}</p>

                    {/* Strong answer framework */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: BRAND_ORANGE }}>
                        Strong Answer Framework
                      </h4>
                      <ul className="space-y-1.5">
                        {q.framework.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: BRAND_ORANGE }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Example answer */}
                    <div className="rounded-xl p-4 border-2" style={{ borderColor: BRAND_ORANGE, backgroundColor: `${BRAND_ORANGE}08` }}>
                      <h4 className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: BRAND_ORANGE }}>
                        Example Answer
                      </h4>
                      <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{q.exampleAnswer}&rdquo;</p>
                    </div>

                    {/* Red flags */}
                    <div className="rounded-xl p-4 border-2 border-red-200 bg-red-50">
                      <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-red-600">
                        Red Flags to Avoid
                      </h4>
                      <ul className="space-y-1.5">
                        {q.redFlags.map((rf, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                            <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                            {rf}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Practice button */}
                    <button
                      onClick={() => {
                        setPracticeMode((prev) => ({ ...prev, [q.id]: true }));
                        setShowAnswers((prev) => ({ ...prev, [q.id]: false }));
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-colors"
                      style={{ backgroundColor: BRAND_NAVY }}
                    >
                      <Target className="w-4 h-4" /> Practice This
                    </button>
                  </div>
                )}

                {/* Practice mode */}
                {isExpanded && isFree && inPractice && (
                  <div className="px-5 pb-6 pt-0 space-y-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold" style={{ color: BRAND_NAVY }}>Practice Mode</h4>
                      <div className="flex items-center gap-3">
                        {timers[q.id] !== undefined && timers[q.id] > 0 && (
                          <span className="flex items-center gap-1 text-sm font-bold" style={{ color: timers[q.id] <= 10 ? "#ef4444" : BRAND_NAVY }}>
                            <Timer className="w-4 h-4" /> {timers[q.id]}s
                          </span>
                        )}
                        {timers[q.id] === 0 && (
                          <span className="text-xs font-bold text-red-500">Time&apos;s up!</span>
                        )}
                        <button
                          onClick={() => startTimer(q.id)}
                          className="px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-colors"
                          style={{ color: BRAND_NAVY }}
                        >
                          <Clock className="w-3 h-3 inline mr-1" />60s Timer
                        </button>
                      </div>
                    </div>

                    <p className="text-sm font-bold" style={{ color: BRAND_NAVY }}>{q.question}</p>

                    <textarea
                      value={practiceAnswers[q.id] || ""}
                      onChange={(e) => setPracticeAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Type your answer here..."
                      className="w-full h-32 p-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325] transition-colors resize-none"
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowAnswers((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                        className="px-5 py-2 rounded-xl text-sm font-bold border-2 transition-colors hover:opacity-90"
                        style={{ borderColor: BRAND_ORANGE, color: BRAND_ORANGE }}
                      >
                        {showAnswers[q.id] ? "Hide Answer" : "Show Answer"}
                      </button>
                      <button
                        onClick={() => {
                          setPracticeMode((prev) => ({ ...prev, [q.id]: false }));
                          if (timerRefs.current[q.id]) {
                            clearInterval(timerRefs.current[q.id]);
                            delete timerRefs.current[q.id];
                          }
                        }}
                        className="px-5 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        Exit Practice
                      </button>
                    </div>

                    {showAnswers[q.id] && (
                      <div className="rounded-xl p-4 border-2" style={{ borderColor: BRAND_ORANGE, backgroundColor: `${BRAND_ORANGE}08` }}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: BRAND_ORANGE }}>
                          Example Answer
                        </h4>
                        <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{q.exampleAnswer}&rdquo;</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── TAB 2: Questions to Ask ──────────────────────────────────────────────

  const renderQuestionsToAsk = () => {
    const verdict = calcScorecard();

    return (
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Search className="w-7 h-7" style={{ color: BRAND_ORANGE }} />
          <h2 className="text-2xl font-heading font-black" style={{ color: BRAND_NAVY }}>
            Questions to Ask Them
          </h2>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          15 essential questions to evaluate any practice, with green/red flag detection and a scorecard to guide your decision.
        </p>

        {/* Question cards */}
        <div className="space-y-3 mb-10">
          {QUESTIONS_TO_ASK.map((q) => {
            const isFree = q.id <= 5 || purchased;
            const isExpanded = expandedAsk === q.id;
            const catColor = CATEGORY_COLORS[q.category] || BRAND_NAVY;

            return (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                <button
                  onClick={() => {
                    if (isFree) setExpandedAsk(isExpanded ? null : q.id);
                  }}
                  className="w-full text-left p-5 flex items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-gray-400 text-xs font-bold">#{q.id}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: catColor }}
                      >
                        {q.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-base" style={{ color: BRAND_NAVY }}>
                      {q.question}
                    </h3>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    {isFree ? (
                      isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                </button>

                {!isFree && isExpanded && <PurchaseGate />}

                {isExpanded && isFree && (
                  <div className="px-5 pb-6 pt-0 space-y-4 border-t border-gray-100">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: BRAND_ORANGE }}>
                        Why This Matters
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{q.whyMatters}</p>
                    </div>

                    <div className="rounded-xl p-4 border-2 border-green-200 bg-green-50">
                      <h4 className="text-[10px] font-black uppercase tracking-widest mb-1.5 text-green-700">
                        Good Answer Sounds Like
                      </h4>
                      <p className="text-sm text-green-800 leading-relaxed">{q.goodAnswer}</p>
                    </div>

                    <div className="rounded-xl p-4 border-2 border-red-200 bg-red-50">
                      <h4 className="text-[10px] font-black uppercase tracking-widest mb-1.5 text-red-600">
                        Red Flag Answer
                      </h4>
                      <p className="text-sm text-red-700 leading-relaxed">{q.redFlagAnswer}</p>
                    </div>

                    <p className="text-sm font-bold" style={{ color: BRAND_ORANGE }}>
                      Follow-up: &ldquo;{q.followUp}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Red Flag Scorecard */}
        <div className="relative">
          {!purchased && (
            <PurchaseGate message="Unlock the Red Flag Scorecard for $29" />
          )}
          <div className={!purchased ? "pointer-events-none select-none opacity-30" : ""}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6" style={{ color: BRAND_ORANGE }} />
                <h3 className="text-lg font-bold" style={{ color: BRAND_NAVY }}>Red Flag Scorecard</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Rate each area based on the answers you received during your interview. This will generate a recommendation.
              </p>

              <div className="space-y-3 mb-6">
                {QUESTIONS_TO_ASK.map((q) => (
                  <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-xs font-bold text-gray-400 w-6 flex-shrink-0">#{q.id}</span>
                    <p className="text-sm text-gray-700 flex-1 min-w-0 truncate">{q.question}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      {(["green", "yellow", "red"] as const).map((rating) => {
                        const icons = { green: "🟢", yellow: "🟡", red: "🔴" };
                        const isSelected = scorecardRatings[q.id] === rating;
                        return (
                          <button
                            key={rating}
                            onClick={() => setScorecardRatings((prev) => ({ ...prev, [q.id]: rating }))}
                            className="w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: isSelected ? (rating === "green" ? "#dcfce7" : rating === "yellow" ? "#fef9c3" : "#fee2e2") : "#f3f4f6",
                              border: isSelected ? `2px solid ${rating === "green" ? "#22c55e" : rating === "yellow" ? "#f59e0b" : "#ef4444"}` : "2px solid transparent",
                            }}
                          >
                            {icons[rating]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {verdict && (
                <div className="rounded-xl p-5 text-center" style={{ backgroundColor: verdict.bg }}>
                  <p className="text-lg font-bold" style={{ color: verdict.color }}>{verdict.label}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {Object.values(scorecardRatings).filter((r) => r === "green").length} green,{" "}
                    {Object.values(scorecardRatings).filter((r) => r === "yellow").length} yellow,{" "}
                    {Object.values(scorecardRatings).filter((r) => r === "red").length} red out of {Object.values(scorecardRatings).length} rated
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── TAB 3: Evaluate the Offer ────────────────────────────────────────────

  const renderOfferCalculator = () => {
    const calc = calcOffer();
    const showBonus = offer.compModel !== "Base Only";

    return (
      <div>
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-7 h-7" style={{ color: BRAND_ORANGE }} />
          <h2 className="text-2xl font-heading font-black" style={{ color: BRAND_NAVY }}>
            Evaluate the Offer
          </h2>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Enter the details of your offer to see the true compensation, hidden costs, and an overall score.
        </p>

        {/* Input Section (always free) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="text-sm font-bold mb-4" style={{ color: BRAND_NAVY }}>Offer Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Base Salary */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Base Salary ($)</label>
              <input
                type="number"
                value={offer.baseSalary}
                onChange={(e) => setOffer((prev) => ({ ...prev, baseSalary: Number(e.target.value) }))}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325]"
              />
            </div>

            {/* Comp Model */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Compensation Model</label>
              <select
                value={offer.compModel}
                onChange={(e) => setOffer((prev) => ({ ...prev, compModel: e.target.value }))}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325] bg-white"
              >
                {["Base Only", "Base + Bonus", "% Collections", "Hybrid"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Bonus fields */}
            {showBonus && (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bonus % of Collections</label>
                  <input
                    type="number"
                    value={offer.bonusPct}
                    onChange={(e) => setOffer((prev) => ({ ...prev, bonusPct: Number(e.target.value) }))}
                    className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bonus Threshold ($)</label>
                  <input
                    type="number"
                    value={offer.bonusThreshold}
                    onChange={(e) => setOffer((prev) => ({ ...prev, bonusThreshold: Number(e.target.value) }))}
                    className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Est. Monthly Collections ($)</label>
                  <input
                    type="number"
                    value={offer.estMonthlyCollections}
                    onChange={(e) => setOffer((prev) => ({ ...prev, estMonthlyCollections: Number(e.target.value) }))}
                    className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325]"
                  />
                </div>
              </>
            )}

            {/* Employment Type */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Employment Type</label>
              <div className="flex gap-3">
                {(["W-2", "1099"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOffer((prev) => ({ ...prev, employmentType: type }))}
                    className="flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all"
                    style={{
                      borderColor: offer.employmentType === type ? BRAND_NAVY : "#e5e7eb",
                      backgroundColor: offer.employmentType === type ? BRAND_NAVY : "#fff",
                      color: offer.employmentType === type ? "#fff" : "#6b7280",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Benefits Included</label>
              <div className="flex flex-wrap gap-2">
                {BENEFITS_LIST.map((b) => {
                  const checked = offer.benefits.includes(b);
                  return (
                    <button
                      key={b}
                      onClick={() => {
                        setOffer((prev) => ({
                          ...prev,
                          benefits: checked ? prev.benefits.filter((x) => x !== b) : [...prev.benefits, b],
                        }));
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all"
                      style={{
                        borderColor: checked ? "#22c55e" : "#e5e7eb",
                        backgroundColor: checked ? "#f0fdf4" : "#fff",
                        color: checked ? "#16a34a" : "#6b7280",
                      }}
                    >
                      {checked ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded border border-gray-300" />}
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Non-compete */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Non-Compete Clause</label>
              <div className="flex gap-3">
                {[false, true].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => setOffer((prev) => ({ ...prev, hasNonCompete: val }))}
                    className="flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all"
                    style={{
                      borderColor: offer.hasNonCompete === val ? (val ? "#ef4444" : "#22c55e") : "#e5e7eb",
                      backgroundColor: offer.hasNonCompete === val ? (val ? "#fef2f2" : "#f0fdf4") : "#fff",
                      color: offer.hasNonCompete === val ? (val ? "#ef4444" : "#16a34a") : "#6b7280",
                    }}
                  >
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>

            {offer.hasNonCompete && (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Radius (miles)</label>
                  <input
                    type="number"
                    value={offer.nonCompeteRadius}
                    onChange={(e) => setOffer((prev) => ({ ...prev, nonCompeteRadius: Number(e.target.value) }))}
                    className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Duration (months)</label>
                  <input
                    type="number"
                    value={offer.nonCompeteDuration}
                    onChange={(e) => setOffer((prev) => ({ ...prev, nonCompeteDuration: Number(e.target.value) }))}
                    className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325]"
                  />
                </div>
              </>
            )}

            {/* Equity Path */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Equity/Ownership Path</label>
              <div className="flex gap-3">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => setOffer((prev) => ({ ...prev, hasEquityPath: val }))}
                    className="flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all"
                    style={{
                      borderColor: offer.hasEquityPath === val ? BRAND_NAVY : "#e5e7eb",
                      backgroundColor: offer.hasEquityPath === val ? BRAND_NAVY : "#fff",
                      color: offer.hasEquityPath === val ? "#fff" : "#6b7280",
                    }}
                  >
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>

            {/* Signing Bonus */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Signing Bonus ($)</label>
              <input
                type="number"
                value={offer.signingBonus}
                onChange={(e) => setOffer((prev) => ({ ...prev, signingBonus: Number(e.target.value) }))}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325]"
              />
            </div>
          </div>
        </div>

        {/* Output Section (purchase-gated) */}
        <div className="relative">
          {!purchased && <PurchaseGate message="Unlock Full Offer Analysis for $29" />}
          <div className={!purchased ? "pointer-events-none select-none opacity-30" : ""}>
            {/* Total Comp Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
              <h3 className="text-sm font-bold mb-4" style={{ color: BRAND_NAVY }}>Total Compensation Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Base Salary</span>
                  <span className="text-sm font-bold" style={{ color: BRAND_NAVY }}>
                    ${calc.base.toLocaleString()}/yr (${Math.round(calc.base / 12).toLocaleString()}/mo)
                  </span>
                </div>
                {calc.showBonus && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Est. Annual Bonuses</span>
                    <span className="text-sm font-bold" style={{ color: BRAND_NAVY }}>
                      ${Math.round(calc.estBonus).toLocaleString()}/yr
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Benefits Value</span>
                  <span className="text-sm font-bold" style={{ color: BRAND_NAVY }}>
                    ${calc.benefitsVal.toLocaleString()}/yr
                  </span>
                </div>
                {offer.signingBonus > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Signing Bonus</span>
                    <span className="text-sm font-bold" style={{ color: BRAND_NAVY }}>
                      ${offer.signingBonus.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 bg-gray-50 rounded-xl px-4">
                  <span className="text-sm font-bold" style={{ color: BRAND_NAVY }}>Total Compensation</span>
                  <span className="text-lg font-black" style={{ color: BRAND_ORANGE }}>
                    ${Math.round(calc.totalComp).toLocaleString()}/yr
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Effective Hourly Rate</span>
                  <span className="text-sm font-bold" style={{ color: BRAND_NAVY }}>
                    ${calc.hourly.toFixed(2)}/hr
                  </span>
                </div>
              </div>

              {/* Market comparison */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Market Position:</span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: calc.marketColor }}
                >
                  {calc.marketLabel}
                </span>
              </div>
            </div>

            {/* Hidden Costs */}
            {calc.hiddenCosts > 0 && (
              <div className="bg-white rounded-2xl border-2 border-red-200 p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-bold text-red-600">Hidden Costs</h3>
                </div>
                <div className="space-y-2">
                  {offer.employmentType === "1099" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Self-Employment Tax (7.65%)</span>
                      <span className="font-bold text-red-700">-${Math.round(offer.baseSalary * 0.0765).toLocaleString()}/yr</span>
                    </div>
                  )}
                  {!offer.benefits.includes("Health Insurance") && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Missing Health Insurance</span>
                      <span className="font-bold text-red-700">-$6,000/yr</span>
                    </div>
                  )}
                  {!offer.benefits.includes("Malpractice") && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Missing Malpractice Insurance</span>
                      <span className="font-bold text-red-700">-$1,200/yr</span>
                    </div>
                  )}
                  {offer.hasNonCompete && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Non-Compete Risk Cost (est.)</span>
                      <span className="font-bold text-red-700">
                        -${Math.round((offer.baseSalary / 12) * offer.nonCompeteDuration * 0.5).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 mt-2 bg-red-50 rounded-xl px-4">
                    <span className="text-sm font-bold text-red-700">True Net Compensation</span>
                    <span className="text-lg font-black text-red-700">${Math.round(calc.trueNet).toLocaleString()}/yr</span>
                  </div>
                </div>
              </div>
            )}

            {/* Offer Score Gauge */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold mb-4" style={{ color: BRAND_NAVY }}>Offer Score</h3>

              <div className="flex justify-center mb-6">
                <svg viewBox="0 0 200 120" className="w-64">
                  {/* Background arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* Score arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke={calc.totalScore >= 75 ? "#22c55e" : calc.totalScore >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(calc.totalScore / 100) * 251.2} 251.2`}
                  />
                  <text x="100" y="85" textAnchor="middle" className="text-3xl font-black" fill={BRAND_NAVY}>
                    {calc.totalScore}
                  </text>
                  <text x="100" y="100" textAnchor="middle" className="text-xs" fill="#9ca3af">
                    out of 100
                  </text>
                </svg>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Compensation", pts: calc.compPts, max: 35 },
                  { label: "Benefits", pts: calc.benefitsPts, max: 25 },
                  { label: "Restrictions", pts: calc.restrictPts, max: 20 },
                  { label: "Growth", pts: calc.growthPts, max: 20 },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-lg font-black" style={{ color: BRAND_NAVY }}>
                      {item.pts}<span className="text-xs text-gray-400">/{item.max}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── TAB 4: Negotiation Scripts ───────────────────────────────────────────

  const renderNegotiationScripts = () => (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-7 h-7" style={{ color: BRAND_ORANGE }} />
        <h2 className="text-2xl font-heading font-black" style={{ color: BRAND_NAVY }}>
          Negotiation Scripts
        </h2>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Word-for-word scripts for the 8 most common negotiation scenarios. Copy, customize, and use with confidence.
      </p>

      <div className="space-y-3">
        {NEGOTIATION_SCRIPTS.map((s) => {
          const isFree = s.id <= 2 || purchased;
          const isExpanded = expandedScript === s.id;

          return (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
              <button
                onClick={() => {
                  if (isFree) setExpandedScript(isExpanded ? null : s.id);
                }}
                className="w-full text-left p-5 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-gray-400 text-xs font-bold">Script {s.id}</span>
                  <h3 className="font-bold text-base mt-1" style={{ color: BRAND_NAVY }}>{s.title}</h3>
                </div>
                <div className="flex-shrink-0 mt-1">
                  {isFree ? (
                    isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-300" />
                  )}
                </div>
              </button>

              {!isFree && isExpanded && <PurchaseGate />}

              {isExpanded && isFree && (
                <div className="px-5 pb-6 pt-0 space-y-4 border-t border-gray-100">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: BRAND_NAVY }}>
                      The Situation
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.situation}</p>
                  </div>

                  <div className="rounded-xl p-4 border-2 border-green-200 bg-green-50 relative">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-green-700">
                        What to Say
                      </h4>
                      <button
                        onClick={() => copyText(s.whatToSay, s.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-colors hover:bg-green-100"
                        style={{ color: copiedId === s.id ? "#22c55e" : "#6b7280" }}
                      >
                        {copiedId === s.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedId === s.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm text-green-800 leading-relaxed italic">&ldquo;{s.whatToSay}&rdquo;</p>
                  </div>

                  <div className="rounded-xl p-4 border-2 border-red-200 bg-red-50">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-red-600">
                      What NOT to Say
                    </h4>
                    <p className="text-sm text-red-700 leading-relaxed italic">&ldquo;{s.whatNotToSay}&rdquo;</p>
                  </div>

                  <div className="rounded-xl p-4 border-2" style={{ borderColor: BRAND_ORANGE, backgroundColor: `${BRAND_ORANGE}08` }}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: BRAND_ORANGE }}>
                      Pro Tip
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{s.proTip}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── TAB 5: After the Interview ───────────────────────────────────────────

  const renderAfterInterview = () => {
    const checkedCount = Object.values(decisionChecks).filter(Boolean).length;
    const decisionVerdict = checkedCount >= 8
      ? { label: "Strong accept -- this looks like a great fit", color: "#22c55e", bg: "#f0fdf4" }
      : checkedCount >= 6
      ? { label: "Consider negotiating before accepting", color: "#f59e0b", bg: "#fefce8" }
      : { label: "Keep looking -- this may not be the right fit", color: "#ef4444", bg: "#fef2f2" };

    return (
      <div>
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-7 h-7" style={{ color: BRAND_ORANGE }} />
          <h2 className="text-2xl font-heading font-black" style={{ color: BRAND_NAVY }}>
            After the Interview
          </h2>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Thank-you templates, follow-up timeline, and decision tools to help you close the deal or walk away with class.
        </p>

        {/* Section 1: Thank You Templates */}
        <div className="mb-10">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4" style={{ color: BRAND_NAVY }}>
            Thank-You Email Templates
          </h3>
          <div className="space-y-3">
            {THANK_YOU_TEMPLATES.map((t) => {
              const isFree = t.id === 1 || purchased;
              const isExpanded = expandedTemplate === t.id;

              return (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                  <button
                    onClick={() => {
                      if (isFree) setExpandedTemplate(isExpanded ? null : t.id);
                    }}
                    className="w-full text-left p-5 flex items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base" style={{ color: BRAND_NAVY }}>{t.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{t.whenToUse}</p>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {isFree ? (
                        isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  </button>

                  {!isFree && isExpanded && <PurchaseGate />}

                  {isExpanded && isFree && (
                    <div className="px-5 pb-6 pt-0 border-t border-gray-100">
                      <div className="relative bg-gray-50 rounded-xl p-4 mt-4">
                        <button
                          onClick={() => copyText(t.template, t.id, true)}
                          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                          style={{ color: copiedTemplateId === t.id ? "#22c55e" : "#6b7280" }}
                        >
                          {copiedTemplateId === t.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedTemplateId === t.id ? "Copied" : "Copy"}
                        </button>
                        <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{t.template}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Follow-Up Timeline */}
        <div className="relative mb-10">
          {!purchased && <PurchaseGate message="Unlock Follow-Up Timeline for $29" />}
          <div className={!purchased ? "pointer-events-none select-none opacity-30" : ""}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4" style={{ color: BRAND_NAVY }}>
              Follow-Up Timeline
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                {[
                  {
                    day: "Day 0",
                    title: "Send Thank-You Email",
                    desc: "Within 24 hours of the interview. Use one of the templates above. Personalize it with a specific detail from your conversation.",
                    color: "#22c55e",
                  },
                  {
                    day: "Day 3",
                    title: "Check In (If No Response)",
                    desc: "A brief, professional follow-up: 'Hi Dr. [NAME], I wanted to follow up on our conversation and reiterate my interest in the position. I'm available to discuss next steps whenever is convenient for you. Thank you for your time.'",
                    color: BRAND_ORANGE,
                  },
                  {
                    day: "Day 7",
                    title: "Final Follow-Up or Decision",
                    desc: "If you haven't heard back: 'Dr. [NAME], I hope you're doing well. I remain very interested in the associate position and would love to know if there's any additional information I can provide. If you've decided to go in a different direction, I completely understand and wish you the best.' Then move on.",
                    color: "#ef4444",
                  },
                ].map((item, i) => (
                  <div key={i} className="relative pl-14 pb-8 last:pb-0">
                    <div
                      className="absolute left-4 w-5 h-5 rounded-full border-2 border-white"
                      style={{ backgroundColor: item.color, top: "2px" }}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: item.color }}>
                        {item.day}
                      </span>
                      <h4 className="text-sm font-bold" style={{ color: BRAND_NAVY }}>{item.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Decision Checklist */}
        <div className="relative mb-10">
          {!purchased && <PurchaseGate message="Unlock Decision Tools for $29" />}
          <div className={!purchased ? "pointer-events-none select-none opacity-30" : ""}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4" style={{ color: BRAND_NAVY }}>
              Offer Decision Checklist
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="space-y-3 mb-6">
                {DECISION_ITEMS.map((item, idx) => {
                  const checked = decisionChecks[idx] || false;
                  return (
                    <button
                      key={idx}
                      onClick={() => setDecisionChecks((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                      className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all hover:bg-gray-50"
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                        style={{
                          backgroundColor: checked ? "#22c55e" : "#f3f4f6",
                          border: checked ? "none" : "2px solid #d1d5db",
                        }}
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm" style={{ color: checked ? BRAND_NAVY : "#6b7280" }}>{item}</span>
                    </button>
                  );
                })}
              </div>

              {checkedCount > 0 && (
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: decisionVerdict.bg }}>
                  <p className="text-sm font-bold" style={{ color: decisionVerdict.color }}>
                    {checkedCount}/10 checked: {decisionVerdict.label}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Walk-Away Checklist */}
        <div className="relative">
          {!purchased && <PurchaseGate message="Unlock Walk-Away Guide for $29" />}
          <div className={!purchased ? "pointer-events-none select-none opacity-30" : ""}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4" style={{ color: BRAND_NAVY }}>
              Walk-Away Checklist
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              If ANY of these are present, seriously consider walking away. These are non-negotiable deal-breakers.
            </p>
            <div className="space-y-3">
              {WALK_AWAY_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm"
                  style={{ borderLeft: "4px solid #ef4444" }}
                >
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-black flex items-center gap-3" style={{ color: BRAND_NAVY }}>
          <Briefcase className="w-7 h-7" style={{ color: BRAND_ORANGE }} />
          Interview Playbook
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Everything you need to ace the interview, evaluate the offer, and negotiate like a pro.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl overflow-hidden border border-gray-200 mb-6">
        {TAB_LABELS.map((label, i) => {
          const isActive = activeTab === i;
          const Icon = TAB_ICONS[i];
          return (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className="flex-1 py-3 px-1 text-[10px] sm:text-xs font-bold transition-all border-r last:border-r-0 border-gray-200 flex flex-col sm:flex-row items-center justify-center gap-1"
              style={{
                backgroundColor: isActive ? BRAND_NAVY : "#fff",
                color: isActive ? "#fff" : "#9ca3af",
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 0 && renderInterviewQuestions()}
      {activeTab === 1 && renderQuestionsToAsk()}
      {activeTab === 2 && renderOfferCalculator()}
      {activeTab === 3 && renderNegotiationScripts()}
      {activeTab === 4 && renderAfterInterview()}
    </div>
  );
}
