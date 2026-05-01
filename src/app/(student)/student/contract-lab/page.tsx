"use client";
import StudentUpgradeGate from "@/components/student/UpgradeGate";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  DollarSign,
  Lock,
  Search,
  BookOpen,
  Scale,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { getContractsAction, analyzeContractAction } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionnaireState {
  employmentType: "W-2" | "1099" | "Partnership" | "";
  baseSalary: number;
  compModel: string;
  bonusPct: number;
  bonusThreshold: number;
  hasNonCompete: "Yes" | "No" | "Not Sure" | "";
  nonCompeteRadius: number;
  nonCompeteDuration: number;
  hasNonSolicitation: "Yes" | "No" | "Not Sure" | "";
  terminationNotice: string;
  whoTerminates: string;
  benefits: string[];
  contractDuration: string;
  equityPathway: "Yes" | "No" | "Not Mentioned" | "";
  hasIPClause: "Yes" | "No" | "Not Sure" | "";
}

interface RedFlag {
  title: string;
  explanation: string;
  negotiationScript: string;
  askFor: string;
  walkAway: string;
  risk: "High" | "Medium" | "Low";
}

interface GreenLight {
  title: string;
  explanation: string;
}

interface MissingClause {
  title: string;
  explanation: string;
  negotiationScript: string;
  askFor: string;
  walkAway: string;
}

interface ScoredResult {
  score: number;
  label: string;
  color: string;
  compensation: number;
  protection: number;
  flexibility: number;
  benefitsScore: number;
  growth: number;
  redFlags: RedFlag[];
  greenLights: GreenLight[];
  missingClauses: MissingClause[];
  salaryBenchmark: "Below Market" | "At Market" | "Above Market";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = "neurochiro-contract-lab-draft";
const BRAND_NAVY = "#1a2744";
const BRAND_ORANGE = "#e97325";

const BENEFITS_OPTIONS = [
  "Health Insurance",
  "Malpractice",
  "CE Allowance",
  "401k",
  "PTO",
  "Equipment",
];

const COMP_MODELS = ["Base Only", "Base + Bonus", "% Collections", "Hybrid"];
const TERMINATION_NOTICES = ["None", "30 days", "60 days", "90 days"];
const WHO_TERMINATES = ["Either Party", "Employer Only", "Either With Cause"];
const CONTRACT_DURATIONS = ["At-will", "1 year", "2 years", "3 years"];

const INITIAL_Q: QuestionnaireState = {
  employmentType: "",
  baseSalary: 60000,
  compModel: "Base Only",
  bonusPct: 0,
  bonusThreshold: 0,
  hasNonCompete: "",
  nonCompeteRadius: 0,
  nonCompeteDuration: 0,
  hasNonSolicitation: "",
  terminationNotice: "None",
  whoTerminates: "Either Party",
  benefits: [],
  contractDuration: "At-will",
  equityPathway: "",
  hasIPClause: "",
};

// ─── Scoring Logic ────────────────────────────────────────────────────────────

function scoreQuestionnaire(q: QuestionnaireState): ScoredResult {
  let compensation = 0;
  const salary = q.baseSalary;
  if (salary >= 70000) compensation = 25;
  else if (salary >= 60000) compensation = 20;
  else if (salary >= 55000) compensation = 15;
  else if (salary >= 45000) compensation = 10;
  else compensation = 5;
  if (q.employmentType === "1099") compensation = Math.max(0, compensation - 5);

  let protection = 0;
  if (q.hasNonCompete === "No") {
    protection = 25;
  } else if (q.hasNonCompete === "Yes") {
    const r = q.nonCompeteRadius;
    const d = q.nonCompeteDuration;
    if (r <= 15 && d <= 12) protection = 20;
    else if (r <= 25 && d <= 18) protection = 12;
    else protection = 5;
  } else {
    protection = 15;
  }
  if (q.whoTerminates === "Employer Only") protection = Math.max(0, protection - 5);
  if (q.hasIPClause === "Yes") protection = Math.max(0, protection - 5);

  let flexibility = 0;
  if (q.whoTerminates === "Either Party") flexibility = 20;
  else if (q.whoTerminates === "Either With Cause") flexibility = 15;
  else flexibility = 5;
  if (q.terminationNotice === "60 days" || q.terminationNotice === "90 days") {
    flexibility = Math.min(20, flexibility + 5);
  }

  let benefitsScore = 0;
  benefitsScore += Math.min(12, q.benefits.length * 2);
  if (q.benefits.includes("Health Insurance")) benefitsScore += 3;
  benefitsScore = Math.min(15, benefitsScore);

  let growth = 0;
  if (q.equityPathway === "Yes") growth = 15;
  else if (q.equityPathway === "Not Mentioned") growth = 5;
  if (q.benefits.includes("CE Allowance")) growth = Math.min(15, growth + 3);

  const score = compensation + protection + flexibility + benefitsScore + growth;

  let label = "Dangerous";
  let color = "#dc2626";
  if (score >= 85) { label = "Excellent"; color = "#16a34a"; }
  else if (score >= 70) { label = "Good"; color = "#22c55e"; }
  else if (score >= 50) { label = "Fair"; color = "#eab308"; }
  else if (score >= 30) { label = "High Risk"; color = "#f97316"; }

  // Red Flags
  const redFlags: RedFlag[] = [];
  if (q.employmentType === "1099") {
    redFlags.push({
      title: "Possible Misclassification",
      explanation: "Being classified as 1099 while working set hours, using the employer's equipment, and following their protocols may violate IRS worker classification rules. The IRS uses a 3-factor test: behavioral control, financial control, and relationship type. If the employer controls how, when, and where you work, you may legally be a W-2 employee being misclassified to avoid paying employer taxes and benefits.",
      negotiationScript: "I've reviewed the IRS guidelines on worker classification, and based on the work arrangement described, this position appears to meet the criteria for W-2 employment. I'd like to discuss reclassifying this as a W-2 position, or adjusting the compensation to account for the additional 7.65% self-employment tax burden I'd carry as a 1099.",
      askFor: "W-2 classification, or a 15-20% increase in base compensation to offset self-employment taxes, plus a healthcare stipend",
      walkAway: "If the employer insists on 1099 classification without adequate compensation adjustment and you'd be working set hours at their location, this is a significant red flag about how they treat associates.",
      risk: "High",
    });
  }
  if (q.hasNonCompete === "Yes" && (q.nonCompeteRadius > 15 || q.nonCompeteDuration > 12)) {
    redFlags.push({
      title: "Aggressive Non-Compete",
      explanation: `A ${q.nonCompeteRadius}-mile radius for ${q.nonCompeteDuration} months is considered aggressive. Industry standard is 10-15 miles for 6-12 months. An overly broad non-compete can prevent you from practicing in the entire metro area if the relationship doesn't work out.`,
      negotiationScript: "I understand the need to protect the practice, and I respect that. However, the current non-compete terms would effectively prevent me from practicing in this entire region. I'd like to negotiate terms that are more in line with industry standards — a 10-mile radius for 12 months would still protect the practice while giving me a reasonable path forward if things change.",
      askFor: "Reduce radius to 10-15 miles and duration to 12 months maximum. Add a buyout clause that lets you pay a defined amount to waive the non-compete.",
      walkAway: "If the employer refuses to budge on a 25+ mile radius or 24+ month duration with no buyout option, this contract could trap you geographically.",
      risk: "High",
    });
  }
  if (salary < 55000) {
    redFlags.push({
      title: "Below Market Compensation",
      explanation: `A base salary of $${(salary / 1000).toFixed(0)}K is below the typical new graduate range of $55-75K. Even in lower cost-of-living areas, sub-$55K base salaries often indicate the employer is underpaying associates.`,
      negotiationScript: "Based on my research of associate compensation in this market, the typical range for a new graduate is $55-75K base. I'd like to discuss bringing the base salary more in line with market rates, or adding a clear production bonus structure that provides a realistic path to competitive total compensation.",
      askFor: "Base salary of at least $55K, or a guaranteed minimum with production bonuses that put realistic total comp at $65K+",
      walkAway: "If total realistic compensation (base + achievable bonuses) doesn't reach $55K, you're subsidizing the practice's growth at your expense.",
      risk: "High",
    });
  }
  if (q.whoTerminates === "Employer Only") {
    redFlags.push({
      title: "One-Sided Termination",
      explanation: "If only the employer can terminate the contract, you're locked in with no exit. This means even in a toxic work environment, you'd have no contractual right to leave without potentially facing legal consequences or forfeiting compensation.",
      negotiationScript: "I noticed the termination clause only gives the employer the right to end the agreement. For a fair working relationship, I'd like mutual termination rights with a reasonable notice period — this protects both of us.",
      askFor: "Mutual termination rights with 60-90 day notice for either party, with or without cause",
      walkAway: "One-sided termination is almost always a deal-breaker. No reputable practice should need to contractually trap their associates.",
      risk: "High",
    });
  }
  if (q.hasIPClause === "Yes") {
    redFlags.push({
      title: "Patient Ownership Clause",
      explanation: "An intellectual property or patient ownership clause means the practice claims ownership of patient relationships, records, or even treatment protocols you develop. This can prevent you from seeing any patients you treated if you leave, even outside the non-compete zone.",
      negotiationScript: "I want to clarify the IP clause in the agreement. While I understand patient records belong to the practice, I'd like to ensure I can inform patients of my departure and that any clinical protocols or educational content I create remain my intellectual property.",
      askFor: "Remove or narrow the IP clause. Patients should be free to choose their provider. Any original clinical materials you create should remain yours.",
      walkAway: "If the practice claims permanent ownership of all patient relationships and your clinical work product, this limits your entire career trajectory.",
      risk: "Medium",
    });
  }
  if (!q.benefits.includes("Malpractice")) {
    redFlags.push({
      title: "No Malpractice Coverage",
      explanation: "Malpractice insurance is essential for any practicing chiropractor. If the employer doesn't provide it, you'll pay $2,000-5,000+ annually out of pocket. More importantly, gaps in coverage leave you personally liable.",
      negotiationScript: "I noticed malpractice insurance isn't included in the benefits package. This is standard for associate positions, and I'd like to discuss adding it. If the practice can't provide it, I'd like a stipend of $3,000-5,000 annually to cover the cost.",
      askFor: "Employer-paid malpractice coverage (occurrence-based, not claims-made), or an annual stipend to cover it",
      walkAway: "Not a deal-breaker on its own, but factor the $3-5K annual cost into your total compensation assessment.",
      risk: "Medium",
    });
  }
  if (q.hasNonSolicitation === "Yes" && q.hasNonCompete === "Yes") {
    redFlags.push({
      title: "Double Restriction",
      explanation: "Having both a non-compete AND a non-solicitation clause creates a layered restriction. The non-compete prevents you from practicing nearby, while the non-solicitation prevents you from reaching out to patients even outside the restricted area. Together, they can make it nearly impossible to build a practice after leaving.",
      negotiationScript: "The combination of a non-compete and non-solicitation clause creates a very restrictive situation. I'd like to negotiate — either narrow the non-compete terms significantly, or remove the non-solicitation in favor of a reasonable non-compete alone. Having both is unusual for associate positions.",
      askFor: "Remove one of the two restrictions, or significantly narrow both. A reasonable non-compete alone (10mi/12mo) should be sufficient to protect the practice.",
      walkAway: "If both restrictions are aggressive (wide radius + long duration + no solicitation), this contract is designed to prevent you from ever competing. Proceed with extreme caution.",
      risk: "High",
    });
  }

  // Green Lights
  const greenLights: GreenLight[] = [];
  if (q.hasNonCompete === "No") {
    greenLights.push({ title: "No Non-Compete", explanation: "This gives you full geographic freedom to practice anywhere if you leave. This is increasingly common and shows the employer is confident in their retention through culture, not contracts." });
  }
  if (q.whoTerminates === "Either Party") {
    greenLights.push({ title: "Mutual Termination Rights", explanation: "Both parties can end the agreement. This shows a balanced, professional approach to the employment relationship." });
  }
  if (q.equityPathway === "Yes") {
    greenLights.push({ title: "Equity/Buy-In Pathway", explanation: "Having a defined path to ownership shows the employer sees you as a long-term partner, not just labor. This can be transformative for your career." });
  }
  if (salary >= 70000) {
    greenLights.push({ title: "Strong Base Salary", explanation: `$${(salary / 1000).toFixed(0)}K is at or above market rate for new graduates. This shows the employer values the associate position.` });
  }
  if (q.benefits.includes("Health Insurance") && q.benefits.includes("Malpractice")) {
    greenLights.push({ title: "Comprehensive Benefits", explanation: "Having both health insurance and malpractice coverage is the gold standard for associate benefits packages." });
  }
  if (q.terminationNotice === "90 days") {
    greenLights.push({ title: "90-Day Notice Period", explanation: "A longer notice period protects both parties and allows for a smooth transition of patient care." });
  }
  if (q.hasNonCompete === "Yes" && q.nonCompeteRadius <= 10 && q.nonCompeteDuration <= 12) {
    greenLights.push({ title: "Reasonable Non-Compete", explanation: `${q.nonCompeteRadius} miles for ${q.nonCompeteDuration} months is very reasonable and industry-friendly.` });
  }

  // Missing Clauses
  const missingClauses: MissingClause[] = [];
  if (q.equityPathway !== "Yes") {
    missingClauses.push({
      title: "No Ownership Path",
      explanation: "Without a defined equity or buy-in pathway, your long-term growth is capped as an associate. You'll build the practice's value without sharing in it.",
      negotiationScript: "I'm looking for a long-term home, not just a job. I'd love to discuss what an ownership pathway might look like — even if it's 3-5 years down the road. Could we include language about a future buy-in discussion or right of first refusal?",
      askFor: "A written timeline for buy-in discussions (e.g., after 2-3 years), right of first refusal if the practice sells, or a defined equity earn-in formula",
      walkAway: "Not a deal-breaker for your first job, but if you plan to stay long-term, lack of ownership path means you're building someone else's asset.",
    });
  }
  if (!q.benefits.includes("CE Allowance")) {
    missingClauses.push({
      title: "No CE Budget",
      explanation: "Continuing education is required to maintain your license. Without a CE allowance, you'll pay $1,500-5,000+ annually out of pocket for seminars, courses, and certifications.",
      negotiationScript: "Continuing education is important to me and ultimately benefits the practice through better patient outcomes. Could we add a CE allowance of $1,500-2,500 annually, including time off to attend seminars?",
      askFor: "$1,500-2,500 annual CE allowance plus 3-5 paid CE days",
      walkAway: "Not a deal-breaker, but factor the cost into your total compensation. A practice that doesn't invest in your growth may not invest in your career.",
    });
  }
  if (!q.benefits.includes("PTO")) {
    missingClauses.push({
      title: "No Paid Time Off",
      explanation: "Without PTO, every day you don't work is a day you don't get paid. This applies to vacations, sick days, and personal emergencies. Even 1099 contractors should negotiate guaranteed paid days.",
      negotiationScript: "I'd like to discuss adding paid time off to the compensation package. Industry standard for associates is 2-3 weeks PTO plus holidays. This is important for preventing burnout and maintaining quality patient care.",
      askFor: "2-3 weeks (10-15 days) PTO annually, plus major holidays",
      walkAway: "Zero PTO is a sign the employer views you as a production unit. If they won't budge, the total comp needs to be significantly higher to offset it.",
    });
  }
  if ((q.compModel === "Base + Bonus" || q.compModel === "Hybrid") && q.bonusPct <= 0) {
    missingClauses.push({
      title: "Verbal Bonus Promise",
      explanation: "A bonus structure without specific written terms (percentage, threshold, calculation method, payment schedule) is effectively a verbal promise. Verbal bonus promises are the #1 source of associate disputes.",
      negotiationScript: "I'm excited about the bonus opportunity. To make sure we're aligned, could we put the specific terms in writing — the percentage, what counts toward the threshold, how it's calculated, and when it's paid out? This protects both of us.",
      askFor: "Written bonus formula with: exact percentage, clear threshold number, what revenue counts (collections vs billings), monthly vs quarterly payout, and audit rights",
      walkAway: "If the employer refuses to put bonus terms in writing, the bonus effectively doesn't exist. Evaluate the contract based on base salary alone.",
    });
  }
  if (!q.benefits.includes("Equipment")) {
    missingClauses.push({
      title: "No Equipment Provision",
      explanation: "If you need your own adjusting table, tools, or technology, startup costs can reach $5,000-15,000. Most associate positions should provide all necessary equipment.",
      negotiationScript: "I want to confirm that all necessary clinical equipment — adjusting tables, diagnostic tools, and practice management software — will be provided by the practice. If there are any equipment costs I'd be expected to cover, I'd like to discuss that now.",
      askFor: "All clinical equipment provided by the practice, or a one-time equipment stipend if you're expected to bring your own",
      walkAway: "Not a deal-breaker, but significant out-of-pocket equipment costs should be reflected in higher compensation.",
    });
  }

  // Salary benchmark
  let salaryBenchmark: "Below Market" | "At Market" | "Above Market" = "At Market";
  if (salary < 55000) salaryBenchmark = "Below Market";
  else if (salary > 75000) salaryBenchmark = "Above Market";

  return {
    score,
    label,
    color,
    compensation,
    protection,
    flexibility,
    benefitsScore,
    growth,
    redFlags,
    greenLights,
    missingClauses,
    salaryBenchmark,
  };
}

// ─── Score Gauge SVG ──────────────────────────────────────────────────────────

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 54;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const progress = (score / 100) * arcLength;
  const rotation = 135;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 128 128">
        <circle
          cx="64" cy="64" r={radius}
          fill="none" stroke="#e5e7eb" strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} 64 64)`}
        />
        <circle
          cx="64" cy="64" r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} 64 64)`}
          className="transition-all duration-700"
        />
        <text x="64" y="58" textAnchor="middle" fontSize="28" fontWeight="900" fill={BRAND_NAVY}>
          {score}
        </text>
        <text x="64" y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>
          {label}
        </text>
      </svg>
    </div>
  );
}

// ─── Accordion Component ──────────────────────────────────────────────────────

function Accordion({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-5 hover:bg-gray-50 transition-colors text-left">
        {icon}
        <span className="flex-1 font-bold text-neuro-navy text-sm">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}

// ─── Disclaimer Banner ────────────────────────────────────────────────────────

function Disclaimer() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
      <p className="text-xs text-yellow-700">
        <strong>Disclaimer:</strong> This is an educational tool, not legal advice. Always consult a licensed attorney before signing any employment contract.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContractLabPage() {
  return (
    <StudentUpgradeGate feature="Contract Lab" description="Review real associate contracts, understand what to look for, and protect yourself before signing your first deal.">
      <ContractLabContent />
    </StudentUpgradeGate>
  );
}

function ContractLabContent() {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  // Tab 1 state
  const [inputMode, setInputMode] = useState<"paste" | "questions">("questions");
  const [contractText, setContractText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [qResult, setQResult] = useState<ScoredResult | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireState>(INITIAL_Q);
  const [pastContracts, setPastContracts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // localStorage debounce
  const qRef = useRef(questionnaire);
  qRef.current = questionnaire;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<QuestionnaireState>;
        setQuestionnaire((prev) => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(qRef.current)); } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [questionnaire, loaded]);

  useEffect(() => {
    getContractsAction().then(setPastContracts).catch(console.error).finally(() => setLoadingHistory(false));
  }, []);

  const setQ = <K extends keyof QuestionnaireState>(key: K, value: QuestionnaireState[K]) => {
    setQuestionnaire((prev) => ({ ...prev, [key]: value }));
  };

  const handlePasteAnalyze = async () => {
    if (!contractText.trim() || contractText.trim().length < 100) {
      setAnalysisError("Please paste the full contract text (at least 100 characters).");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeContractAction(contractText);
      if (result.error) setAnalysisError(result.error);
      else if (result.analysis) {
        setAiResult(result.analysis);
        setQResult(null);
        setPastContracts(await getContractsAction());
      }
    } catch (err: any) {
      setAnalysisError(err.message || "Analysis failed.");
    }
    setIsAnalyzing(false);
  };

  const handleQuestionnaireAnalyze = () => {
    const result = scoreQuestionnaire(questionnaire);
    setQResult(result);
    setAiResult(null);
  };

  const resetAnalysis = () => {
    setAiResult(null);
    setQResult(null);
    setContractText("");
    setAnalysisError(null);
  };

  const hasResults = aiResult || qResult;

  // ─── Tab Buttons ──────────────────────────────────────────────────────────

  const tabs: { id: 1 | 2 | 3; label: string; icon: React.ReactNode }[] = [
    { id: 1, label: "Contract Analyzer", icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 2, label: "Know Your Rights", icon: <BookOpen className="w-4 h-4" /> },
    { id: 3, label: "Contract Library", icon: <FileText className="w-4 h-4" /> },
  ];

  // ─── Triple Button Picker ────────────────────────────────────────────────

  const TriplePick = ({ value, options, onChange }: { value: string; options: string[]; onChange: (v: any) => void }) => (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button key={opt} onClick={() => onChange(opt)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${value === opt ? "bg-[#1a2744] text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          {opt}
        </button>
      ))}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1: Contract Analyzer
  // ═══════════════════════════════════════════════════════════════════════════

  const Tab1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Input Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-neuro-navy mb-1">Analyze a Contract</h2>
            <p className="text-sm text-gray-400 mb-4">Choose an input method below.</p>

            {/* Mode Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
              <button onClick={() => setInputMode("paste")}
                className={`flex-1 py-2.5 text-xs font-bold transition-all ${inputMode === "paste" ? "bg-[#1a2744] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                <FileText className="w-3.5 h-3.5 inline mr-1.5" />Paste Contract
              </button>
              <button onClick={() => setInputMode("questions")}
                className={`flex-1 py-2.5 text-xs font-bold transition-all ${inputMode === "questions" ? "bg-[#1a2744] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />Answer Questions
              </button>
            </div>

            {inputMode === "paste" && !hasResults && (
              <div className="space-y-4">
                <textarea value={contractText} onChange={(e) => setContractText(e.target.value)}
                  placeholder="Paste your full employment contract text here..."
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:border-[#e97325] text-sm min-h-[220px]" />
                <p className="text-xs text-gray-400">Minimum 100 characters. The AI will analyze every clause.</p>
                {analysisError && <p className="text-red-500 text-xs font-bold">{analysisError}</p>}
                <button onClick={handlePasteAnalyze} disabled={isAnalyzing || !contractText.trim()}
                  className="w-full py-3 px-6 bg-[#1a2744] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#1a2744]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><ShieldAlert className="w-4 h-4" /> Analyze Contract</>}
                </button>
              </div>
            )}

            {inputMode === "questions" && !hasResults && (
              <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
                {/* Employment Type */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Employment Type</label>
                  <TriplePick value={questionnaire.employmentType} options={["W-2", "1099", "Partnership"]} onChange={(v: string) => setQ("employmentType", v as any)} />
                </div>

                {/* Base Salary */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Base Salary</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input type="number" value={questionnaire.baseSalary} onChange={(e) => setQ("baseSalary", Number(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#e97325]" />
                  </div>
                </div>

                {/* Comp Model */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Compensation Model</label>
                  <select value={questionnaire.compModel} onChange={(e) => setQ("compModel", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325] bg-white">
                    {COMP_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Bonus fields */}
                {(questionnaire.compModel === "Base + Bonus" || questionnaire.compModel === "Hybrid") && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Bonus %</label>
                      <div className="relative">
                        <input type="number" value={questionnaire.bonusPct} onChange={(e) => setQ("bonusPct", Number(e.target.value) || 0)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#e97325]" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Bonus Threshold</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                        <input type="number" value={questionnaire.bonusThreshold} onChange={(e) => setQ("bonusThreshold", Number(e.target.value) || 0)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#e97325]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Non-Compete */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Non-Compete Clause?</label>
                  <TriplePick value={questionnaire.hasNonCompete} options={["Yes", "No", "Not Sure"]} onChange={(v: string) => setQ("hasNonCompete", v as any)} />
                </div>

                {questionnaire.hasNonCompete === "Yes" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Radius (miles)</label>
                      <input type="number" value={questionnaire.nonCompeteRadius} onChange={(e) => setQ("nonCompeteRadius", Number(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#e97325]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Duration (months)</label>
                      <input type="number" value={questionnaire.nonCompeteDuration} onChange={(e) => setQ("nonCompeteDuration", Number(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#e97325]" />
                    </div>
                  </div>
                )}

                {/* Non-Solicitation */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Non-Solicitation Clause?</label>
                  <TriplePick value={questionnaire.hasNonSolicitation} options={["Yes", "No", "Not Sure"]} onChange={(v: string) => setQ("hasNonSolicitation", v as any)} />
                </div>

                {/* Termination */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Termination Notice</label>
                    <select value={questionnaire.terminationNotice} onChange={(e) => setQ("terminationNotice", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325] bg-white">
                      {TERMINATION_NOTICES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Who Can Terminate?</label>
                    <select value={questionnaire.whoTerminates} onChange={(e) => setQ("whoTerminates", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325] bg-white">
                      {WHO_TERMINATES.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Benefits Included</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BENEFITS_OPTIONS.map((b) => {
                      const checked = questionnaire.benefits.includes(b);
                      return (
                        <button key={b} onClick={() => setQ("benefits", checked ? questionnaire.benefits.filter((x) => x !== b) : [...questionnaire.benefits, b])}
                          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${checked ? "bg-[#1a2744] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          <CheckCircle className={`w-3.5 h-3.5 ${checked ? "text-green-300" : "text-gray-300"}`} />
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contract Duration */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Contract Duration</label>
                  <select value={questionnaire.contractDuration} onChange={(e) => setQ("contractDuration", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325] bg-white">
                    {CONTRACT_DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Equity Pathway */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Equity/Buy-In Pathway?</label>
                  <TriplePick value={questionnaire.equityPathway} options={["Yes", "No", "Not Mentioned"]} onChange={(v: string) => setQ("equityPathway", v as any)} />
                </div>

                {/* IP Clause */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">IP/Patient Ownership Clause?</label>
                  <TriplePick value={questionnaire.hasIPClause} options={["Yes", "No", "Not Sure"]} onChange={(v: string) => setQ("hasIPClause", v as any)} />
                </div>

                {analysisError && <p className="text-red-500 text-xs font-bold">{analysisError}</p>}

                <button onClick={handleQuestionnaireAnalyze}
                  className="w-full py-3 px-6 bg-[#e97325] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#e97325]/90 transition-all flex items-center justify-center gap-2">
                  <Scale className="w-4 h-4" /> Analyze Contract
                </button>
              </div>
            )}

            {hasResults && (
              <div className="bg-green-50 border border-green-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                <h3 className="font-bold text-green-900 mb-1">Analysis Complete</h3>
                <p className="text-sm text-green-700 mb-4">Review your results on the right.</p>
                <button onClick={resetAnalysis} className="text-xs font-bold uppercase tracking-widest text-[#1a2744] hover:underline">
                  Analyze Another
                </button>
              </div>
            )}
          </div>

          {/* Past Analyses */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-neuro-navy uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#e97325]" /> Past Analyses
            </h3>
            <div className="space-y-2">
              {loadingHistory ? (
                <div className="py-8 text-center"><Loader2 className="w-5 h-5 text-gray-300 animate-spin mx-auto mb-2" /><p className="text-xs text-gray-400">Loading...</p></div>
              ) : pastContracts.length > 0 ? pastContracts.map((c) => (
                <button key={c.id} onClick={() => { setAiResult(c.analysis_results); setQResult(null); }}
                  className="w-full text-left p-3 rounded-xl border border-gray-50 hover:border-[#e97325] hover:bg-gray-50 transition-all flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neuro-navy truncate">{c.title}</p>
                    <p className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-bold text-[#e97325] ml-3">{c.analysis_results?.overallScore || "N/A"}</span>
                </button>
              )) : (
                <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No analyses yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Results Panel */}
        <div className="lg:col-span-7">
          {qResult && QuestionnaireResults(qResult)}
          {aiResult && !qResult && AiResults(aiResult)}
          {!hasResults && (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 h-full flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-1">No Analysis Yet</h3>
              <p className="text-gray-400 text-sm max-w-md">Answer the questions on the left or paste a contract, then click Analyze to see your results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ─── Questionnaire Results Renderer ───────────────────────────────────────

  const QuestionnaireResults = (r: ScoredResult) => (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-8">
      {/* Score + Breakdown */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <ScoreGauge score={r.score} label={r.label} color={r.color} />
        <div className="flex-1 space-y-2 w-full">
          <h2 className="text-xl font-bold text-neuro-navy mb-3">Contract Score</h2>
          {[
            { name: "Compensation", score: r.compensation, max: 25 },
            { name: "Protection", score: r.protection, max: 25 },
            { name: "Flexibility", score: r.flexibility, max: 20 },
            { name: "Benefits", score: r.benefitsScore, max: 15 },
            { name: "Growth", score: r.growth, max: 15 },
          ].map((cat) => (
            <div key={cat.name} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-24">{cat.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${(cat.score / cat.max) * 100}%`, backgroundColor: cat.score / cat.max >= 0.7 ? "#16a34a" : cat.score / cat.max >= 0.4 ? "#eab308" : "#dc2626" }} />
              </div>
              <span className="text-xs font-bold text-gray-600 w-10 text-right">{cat.score}/{cat.max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compensation Benchmark */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-[#e97325]" />
          <h3 className="text-sm font-bold text-neuro-navy">Compensation Benchmark</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-500">New Grad Range: <span className="font-bold text-neuro-navy">$55-75K</span></p>
            <p className="text-gray-500">1-2 Years: <span className="font-bold text-neuro-navy">$65-85K</span></p>
          </div>
          <div className="flex items-center justify-end">
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${r.salaryBenchmark === "Below Market" ? "bg-red-100 text-red-600" : r.salaryBenchmark === "Above Market" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
              {r.salaryBenchmark}
            </span>
          </div>
        </div>
      </div>

      {/* Red Flags */}
      {r.redFlags.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Red Flags ({r.redFlags.length})
          </h3>
          <div className="space-y-3">
            {r.redFlags.map((flag, i) => (
              <div key={i} className="border-2 border-red-200 bg-red-50/50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h4 className="font-bold text-neuro-navy text-sm">{flag.title}</h4>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${flag.risk === "High" ? "bg-red-100 text-red-600" : flag.risk === "Medium" ? "bg-orange-100 text-orange-600" : "bg-yellow-100 text-yellow-600"}`}>{flag.risk} Risk</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{flag.explanation}</p>
                <div className="space-y-3 border-t border-red-200 pt-3">
                  <div className="flex gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest block mb-0.5">What to Say</span>
                      <p className="text-sm text-gray-700">{flag.negotiationScript}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest block mb-0.5">What to Ask For</span>
                      <p className="text-sm text-gray-700">{flag.askFor}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-0.5">Walk-Away Point</span>
                      <p className="text-sm text-gray-700">{flag.walkAway}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Green Lights */}
      {r.greenLights.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Green Lights ({r.greenLights.length})
          </h3>
          <div className="space-y-3">
            {r.greenLights.map((gl, i) => (
              <div key={i} className="border-2 border-green-200 bg-green-50/50 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-neuro-navy text-sm mb-1">{gl.title}</h4>
                    <p className="text-sm text-gray-700">{gl.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Clauses */}
      {r.missingClauses.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-yellow-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Missing Clauses ({r.missingClauses.length})
          </h3>
          <div className="space-y-3">
            {r.missingClauses.map((mc, i) => (
              <div key={i} className="border-2 border-yellow-200 bg-yellow-50/50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-yellow-500" />
                  <h4 className="font-bold text-neuro-navy text-sm">{mc.title}</h4>
                </div>
                <p className="text-sm text-gray-700 mb-3">{mc.explanation}</p>
                <div className="space-y-3 border-t border-yellow-200 pt-3">
                  <div className="flex gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest block mb-0.5">What to Say</span>
                      <p className="text-sm text-gray-700">{mc.negotiationScript}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest block mb-0.5">What to Ask For</span>
                      <p className="text-sm text-gray-700">{mc.askFor}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-0.5">Walk-Away Point</span>
                      <p className="text-sm text-gray-700">{mc.walkAway}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Negotiation Playbook Summary */}
      {(r.redFlags.length > 0 || r.missingClauses.length > 0) && (
        <div className="bg-[#1a2744] rounded-2xl p-6 text-white">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#e97325]" /> Negotiation Playbook Summary
          </h3>
          <p className="text-white/70 text-sm mb-4">Prioritize these items in your next conversation with the employer:</p>
          <div className="space-y-2">
            {r.redFlags.filter((f) => f.risk === "High").map((f, i) => (
              <div key={`rf-${i}`} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                <span className="text-white/90">{f.title}</span>
                <span className="text-[10px] bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full font-bold">Priority</span>
              </div>
            ))}
            {r.missingClauses.map((mc, i) => (
              <div key={`mc-${i}`} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] font-bold text-[#1a2744] shrink-0">{r.redFlags.filter((f) => f.risk === "High").length + i + 1}</span>
                <span className="text-white/90">{mc.title}</span>
                <span className="text-[10px] bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full font-bold">Add</span>
              </div>
            ))}
            {r.redFlags.filter((f) => f.risk !== "High").map((f, i) => (
              <div key={`rl-${i}`} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold shrink-0">{r.redFlags.filter((f2) => f2.risk === "High").length + r.missingClauses.length + i + 1}</span>
                <span className="text-white/90">{f.title}</span>
                <span className="text-[10px] bg-orange-500/30 text-orange-300 px-2 py-0.5 rounded-full font-bold">Discuss</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── AI Results Renderer ──────────────────────────────────────────────────

  const AiResults = (result: any) => {
    const recColor = result.overallRecommendation === "Accept" ? "text-green-500" : result.overallRecommendation === "Walk Away" ? "text-red-500" : "text-orange-500";
    const numScore = typeof result.overallScore === "number" ? result.overallScore : 50;
    const scoreLabel = numScore >= 85 ? "Excellent" : numScore >= 70 ? "Good" : numScore >= 50 ? "Fair" : numScore >= 30 ? "High Risk" : "Dangerous";
    const scoreColor = numScore >= 85 ? "#16a34a" : numScore >= 70 ? "#22c55e" : numScore >= 50 ? "#eab308" : numScore >= 30 ? "#f97316" : "#dc2626";

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
          <ScoreGauge score={numScore} label={scoreLabel} color={scoreColor} />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-neuro-navy mb-1">AI Analysis Results</h2>
            {result.summary && <p className="text-gray-500 text-sm mb-2">{result.summary}</p>}
            {result.overallRecommendation && (
              <span className={`text-sm font-bold uppercase tracking-widest ${recColor}`}>{result.overallRecommendation}</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {(result.clauses || []).map((clause: any, i: number) => {
            const risk = clause.risk || clause.status || "Medium";
            const isLow = risk === "Low" || risk === "safe";
            const isHigh = risk === "High" || risk === "Critical" || risk === "danger";
            const colors = isLow ? "border-green-200 bg-green-50/50" : isHigh ? "border-red-200 bg-red-50/50" : "border-orange-200 bg-orange-50/50";
            const badgeColors = isLow ? "bg-green-100 text-green-600" : isHigh ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600";
            const Icon = isLow ? ShieldCheck : isHigh ? ShieldAlert : AlertTriangle;
            const iconColor = isLow ? "text-green-500" : isHigh ? "text-red-500" : "text-orange-500";

            return (
              <div key={i} className={`p-5 rounded-2xl border-2 ${colors}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${iconColor}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-neuro-navy text-sm">{clause.name || clause.type}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${badgeColors}`}>{risk}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{clause.finding || clause.text}</p>
                    {(clause.insight || clause.recommendation) && (
                      <div className="flex gap-2 mt-2">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Recommendation</span>
                          <p className="text-sm text-gray-600">{clause.recommendation || clause.insight}</p>
                        </div>
                      </div>
                    )}
                    {clause.negotiation && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-black/5">
                        <MessageSquare className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest block mb-0.5">Negotiation Strategy</span>
                          <p className="text-sm text-gray-700 font-medium">{clause.negotiation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2: Know Your Rights
  // ═══════════════════════════════════════════════════════════════════════════

  const Tab2 = () => (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Accordion title="W-2 vs 1099: Know the Difference" icon={<DollarSign className="w-5 h-5 text-[#e97325]" />}>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>The distinction between W-2 employee and 1099 independent contractor is one of the most important things to understand in your first contract. Getting this wrong can cost you thousands of dollars annually and expose both you and your employer to IRS penalties.</p>
          <p><strong>The IRS 3-Factor Test:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Behavioral Control:</strong> Does the employer dictate when, where, and how you work? If they set your hours, require you to be in their office, and control your treatment protocols, you are likely a W-2 employee.</li>
            <li><strong>Financial Control:</strong> Do you have significant investment in your own equipment? Can you work for other practices? If the employer provides all equipment and you work exclusively for them, W-2 is appropriate.</li>
            <li><strong>Relationship Type:</strong> Are benefits provided? Is there a written contract indicating an employee relationship? Ongoing, indefinite work typically indicates employment.</li>
          </ul>
          <p><strong>Signs of Misclassification:</strong> You work set hours at the employer&apos;s location, use their equipment, follow their protocols, cannot work elsewhere, but are paid as 1099. This is a red flag.</p>
          <div className="bg-gray-50 rounded-xl p-4 mt-3">
            <p className="font-bold text-neuro-navy mb-2">Side-by-Side Take-Home Comparison at $60,000:</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="font-bold text-green-600 text-xs uppercase tracking-widest mb-2">W-2 Employee</p>
                <p>Gross: $60,000</p>
                <p>Federal Tax (~12%): -$7,200</p>
                <p>FICA (7.65%): -$4,590</p>
                <p>State Tax (~3%): -$1,800</p>
                <p className="font-bold text-neuro-navy mt-2 pt-2 border-t">Net: ~$46,410</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="font-bold text-red-600 text-xs uppercase tracking-widest mb-2">1099 Contractor</p>
                <p>Gross: $60,000</p>
                <p>Federal Tax (~12%): -$7,200</p>
                <p>Self-Employment (15.3%): -$9,180</p>
                <p>State Tax (~3%): -$1,800</p>
                <p className="font-bold text-neuro-navy mt-2 pt-2 border-t">Net: ~$41,820</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">* Approximate. 1099 costs $4,590 MORE annually in self-employment taxes alone, before accounting for benefits you must purchase yourself.</p>
          </div>
          <p className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm"><strong>What to say:</strong> &quot;Based on the work arrangement described, this position appears to meet the IRS criteria for W-2 classification. Can we discuss either reclassifying as W-2, or adjusting compensation to offset the additional tax burden?&quot;</p>
        </div>
      </Accordion>

      <Accordion title="Non-Compete Clauses: What You Need to Know" icon={<Lock className="w-5 h-5 text-[#e97325]" />}>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>A non-compete clause restricts where you can practice after leaving an employer. These are common in chiropractic contracts but vary wildly in enforceability and reasonableness. Understanding the landscape is critical before you sign.</p>
          <p><strong>State Enforceability:</strong> Not all states enforce non-competes equally. California, Oklahoma, and North Dakota essentially ban them for employees. Other states like Colorado and Illinois have placed significant restrictions on their use. Many states will only enforce &quot;reasonable&quot; non-competes, meaning a court could throw out overly aggressive terms.</p>
          <p><strong>Reasonable vs. Excessive Benchmarks:</strong></p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="font-bold text-green-600 text-xs uppercase mb-1">Reasonable</p>
              <p>5-10 mile radius</p>
              <p>6-12 months</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="font-bold text-yellow-600 text-xs uppercase mb-1">Moderate</p>
              <p>10-20 mile radius</p>
              <p>12-18 months</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="font-bold text-red-600 text-xs uppercase mb-1">Aggressive</p>
              <p>20+ mile radius</p>
              <p>18+ months</p>
            </div>
          </div>
          <p><strong>Negotiation Strategies:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Request a buyout clause — a defined dollar amount you can pay to waive the non-compete</li>
            <li>Negotiate the radius down to 10 miles, which still protects the practice</li>
            <li>Cap duration at 12 months maximum</li>
            <li>Add a sunset clause — the non-compete expires if you&apos;re terminated without cause</li>
            <li>Define the restricted activities precisely — &quot;chiropractic practice&quot; not &quot;healthcare services&quot;</li>
          </ul>
          <p className="bg-blue-50 border border-blue-200 rounded-xl p-3"><strong>What to say:</strong> &quot;I respect the need to protect the practice, and I&apos;m willing to agree to a reasonable non-compete. Could we adjust the terms to a 10-mile radius for 12 months, with a buyout option? I&apos;d also like the restriction to expire if I&apos;m terminated without cause.&quot;</p>
        </div>
      </Accordion>

      <Accordion title="Non-Solicitation: The Hidden Trap" icon={<ShieldAlert className="w-5 h-5 text-[#e97325]" />}>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>Many new chiropractors focus exclusively on non-compete clauses and overlook non-solicitation agreements. In practice, a non-solicitation clause can be even more restrictive than a non-compete, because it follows you everywhere regardless of geographic distance.</p>
          <p><strong>What is it?</strong> A non-solicitation clause prevents you from contacting, reaching out to, or accepting patients from your former employer&apos;s practice. Even if you open a practice 50 miles away (outside any non-compete zone), you still cannot reach out to patients you treated.</p>
          <p><strong>Why it can be worse than a non-compete:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>No geographic boundary — it applies everywhere</li>
            <li>Often has longer durations (2-3 years is common)</li>
            <li>Vaguely worded clauses can prevent patients from choosing to follow you</li>
            <li>Can extend to referral sources, other physicians, and business contacts</li>
          </ul>
          <p><strong>What to watch for:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>&quot;Shall not solicit or accept&quot; — the word &quot;accept&quot; means even if a patient finds you on their own, you cannot see them</li>
            <li>Broad definitions of &quot;patient&quot; — some clauses cover anyone who visited the practice in the last 2-3 years, even if you never treated them</li>
            <li>Staff solicitation — prevents you from hiring any former coworkers</li>
          </ul>
          <p className="bg-blue-50 border border-blue-200 rounded-xl p-3"><strong>What to say:</strong> &quot;I&apos;d like to clarify the non-solicitation clause. I&apos;m comfortable agreeing not to actively solicit patients, but I want to ensure that patients who independently choose to seek care from me are free to do so. Can we change &apos;solicit or accept&apos; to just &apos;directly solicit&apos;?&quot;</p>
        </div>
      </Accordion>

      <Accordion title="Compensation Models Explained" icon={<DollarSign className="w-5 h-5 text-[#e97325]" />}>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>How you get paid as an associate matters as much as how much. Understanding compensation models helps you evaluate the true value of any offer and spot structures designed to underpay you.</p>
          <p><strong>Base Salary Only:</strong> Fixed annual salary regardless of production. Pros: predictable income, good for new grads building skills. Cons: no upside potential, no reward for growing the practice. Typical range: $55-75K for new graduates.</p>
          <p><strong>Base + Bonus:</strong> Fixed base salary plus bonuses tied to hitting production thresholds. This is the most common model. Key questions: What exactly counts toward the threshold — collections or billings? How is it calculated — monthly or quarterly? Is the threshold achievable based on current patient volume and your expected schedule? Get the formula in writing.</p>
          <p><strong>Percentage of Collections:</strong> You earn a percentage (typically 25-35%) of what the practice collects on your patients. Important distinction: collections (what the practice actually receives) vs. billings (what they charge). Collections are always lower. Also ask about patient assignment — if you only see overflow patients, your collections will be low regardless of the percentage.</p>
          <p><strong>Hybrid:</strong> Typically a lower base salary combined with a percentage of collections above a threshold. Example: $50K base + 25% of collections above $200K. This aligns incentives but requires understanding the practice&apos;s historical collection data.</p>
          <p><strong>Patient Assignment Matters:</strong> No compensation model works if you do not have patients. Ask: How are new patients assigned? What is the current patient volume? How many patients will be on my schedule from day one? Do I have a ramp-up period with guaranteed minimum compensation?</p>
          <p className="bg-blue-50 border border-blue-200 rounded-xl p-3"><strong>What to say:</strong> &quot;I&apos;d like to understand the bonus structure better. Can you show me the last 12 months of collections for the associate position so I can see what&apos;s realistically achievable? And can we put the exact bonus formula in the contract?&quot;</p>
        </div>
      </Accordion>

      <Accordion title="Termination Clauses: Your Exit Strategy" icon={<Shield className="w-5 h-5 text-[#e97325]" />}>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>How a contract ends is just as important as how it begins. Termination clauses determine your ability to leave a bad situation and what happens to your patient relationships when you do.</p>
          <p><strong>At-Will vs. Term:</strong> At-will means either party can end the relationship at any time. A term contract (1-3 years) locks you in for a defined period. Both have pros and cons — at-will gives flexibility but less security; term gives security but less flexibility.</p>
          <p><strong>Notice Periods:</strong> Most contracts require 30-90 days written notice before termination. Shorter notice benefits the party leaving; longer notice allows for better patient transition. Industry standard is 60-90 days for both parties.</p>
          <p><strong>For Cause vs. Without Cause:</strong> &quot;For cause&quot; termination means there must be a specific reason (malpractice, theft, breach of contract). &quot;Without cause&quot; means either party can end it for any reason. You want the option for either party to terminate without cause with appropriate notice.</p>
          <p><strong>Malpractice Tail Coverage:</strong> If the practice provides claims-made malpractice insurance, who pays for &quot;tail coverage&quot; when you leave? Tail coverage can cost $5,000-15,000. The contract should specify this — ideally the employer pays if they terminate you.</p>
          <p><strong>Patient Ownership on Exit:</strong> What happens to your patients when you leave? Can you notify them? Can they choose to follow you? A fair contract allows you to send a brief departure notice and lets patients choose their provider.</p>
          <p className="bg-blue-50 border border-blue-200 rounded-xl p-3"><strong>What to say:</strong> &quot;I want to ensure the termination clause is fair to both of us. Can we agree on mutual termination rights with 90 days notice, and include language about malpractice tail coverage and patient notification?&quot;</p>
        </div>
      </Accordion>

      <Accordion title="Equity & Buy-In: Building Your Future" icon={<Scale className="w-5 h-5 text-[#e97325]" />}>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>One of the most transformative career decisions for a chiropractor is transitioning from associate to owner. Having an equity or buy-in pathway in your contract can set the stage for this transition — or the absence of one can lock you into perpetual associate status.</p>
          <p><strong>Why it matters:</strong> As an associate, you build the practice&apos;s value every day through patient relationships, community reputation, and revenue generation. Without an ownership path, all that value accrues to the practice owner alone. Ownership is how chiropractors build real wealth.</p>
          <p><strong>How buy-in formulas work:</strong> Most buy-ins are based on a multiple of collections or revenue. Common formulas include 50-70% of one year&apos;s gross collections, or a defined dollar amount with a payment plan over 3-5 years. Some practices offer equity earn-in where you accumulate ownership percentage over time.</p>
          <p><strong>Questions to ask:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Is there a defined timeline for buy-in discussions?</li>
            <li>What is the valuation method? Who performs the valuation?</li>
            <li>Is there a right of first refusal if the practice is sold?</li>
            <li>What happens to my equity if I leave before full buy-in?</li>
            <li>Are there performance milestones that accelerate the timeline?</li>
          </ul>
          <p><strong>Red flags:</strong> Vague promises (&quot;we&apos;ll talk about it later&quot;), unreasonable valuations (3x+ revenue), no written timeline, restrictive conditions that make buy-in practically impossible.</p>
          <p className="bg-blue-50 border border-blue-200 rounded-xl p-3"><strong>What to say:</strong> &quot;I&apos;m interested in a long-term relationship and eventually having an ownership stake. Can we include language about a buy-in discussion after two years, with right of first refusal if the practice is sold?&quot;</p>
        </div>
      </Accordion>

      <Accordion title="Benefits Checklist: What to Expect" icon={<CheckCircle className="w-5 h-5 text-[#e97325]" />}>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>Benefits are a significant part of your total compensation package. A position paying $65K with full benefits is often worth more than $75K with none. Here is what to expect and what is negotiable.</p>
          <p><strong>Standard Benefits (should be included):</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Malpractice Insurance:</strong> Non-negotiable. Occurrence-based is better than claims-made. If claims-made, ensure tail coverage is addressed in the contract.</li>
            <li><strong>Health Insurance:</strong> Employer should contribute at least 50% of premium. Worth $3,000-8,000+ annually.</li>
            <li><strong>PTO:</strong> 2-3 weeks (10-15 days) plus major holidays is standard. Some practices offer separate sick days.</li>
          </ul>
          <p><strong>Commonly Negotiable:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>CE Allowance:</strong> $1,500-3,000 annually plus paid CE days. Essential for license maintenance and professional growth.</li>
            <li><strong>401(k) or Retirement:</strong> Employer match of 3-6% is valuable. Even without a match, having access to a 401(k) provides tax advantages.</li>
            <li><strong>Equipment:</strong> All clinical equipment should be provided. If you bring your own tools, negotiate a stipend.</li>
          </ul>
          <p><strong>The Benefits Math:</strong></p>
          <div className="bg-gray-50 rounded-xl p-4">
            <p>Health Insurance: ~$6,000/year</p>
            <p>Malpractice: ~$3,500/year</p>
            <p>CE Allowance: ~$2,000/year</p>
            <p>401k Match (3%): ~$1,800/year</p>
            <p>PTO (2 weeks): ~$2,500/year</p>
            <p className="font-bold text-neuro-navy mt-2 pt-2 border-t">Total Benefits Value: ~$15,800/year</p>
          </div>
          <p className="bg-blue-50 border border-blue-200 rounded-xl p-3"><strong>What to say:</strong> &quot;I&apos;d like to discuss the benefits package. Malpractice coverage, health insurance contribution, and a CE allowance are all important to me. What does the current benefits package include?&quot;</p>
        </div>
      </Accordion>

      <Accordion title="10 Questions to Ask Before You Sign" icon={<Search className="w-5 h-5 text-[#e97325]" />}>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>Before signing any associate contract, make sure you have clear, written answers to these ten questions. Verbal promises are not enforceable — if it is not in the contract, it does not exist.</p>
          <ol className="list-decimal pl-5 space-y-3">
            <li><strong>How are patients assigned to me?</strong> — Your income depends on patient volume. Understand whether you will get a share of existing patients, only new patients, or only overflow. Ask for patient volume data from the last 12 months.</li>
            <li><strong>What exactly triggers the bonus, and how is it calculated?</strong> — Get the formula in writing. &quot;Collections&quot; vs. &quot;billings&quot; matters enormously. Monthly vs. quarterly payout affects cash flow. Ask to see the actual calculation on a recent associate&apos;s pay.</li>
            <li><strong>What happens to my patients if I leave?</strong> — Can you notify them? Can they follow you? Who owns the patient records? This impacts your future practice viability.</li>
            <li><strong>Who pays for malpractice tail coverage?</strong> — If you have claims-made insurance and leave, tail coverage can cost $5,000-15,000. The contract should specify who pays and under what circumstances.</li>
            <li><strong>Is the non-compete enforceable in this state?</strong> — Research your state&apos;s laws. Many states have limitations on non-compete enforcement. Have a local attorney review this clause specifically.</li>
            <li><strong>What is the path to ownership or partnership?</strong> — Even if it is not immediate, understanding whether ownership is possible helps you evaluate whether this is a career move or just a job.</li>
            <li><strong>What does &quot;for cause&quot; termination include?</strong> — The definition of &quot;for cause&quot; should be specific and reasonable. Vague language like &quot;failure to meet expectations&quot; gives the employer too much power.</li>
            <li><strong>Can I work elsewhere or have a side practice?</strong> — Some contracts restrict all outside professional activity. If you want to do sports events, teach, or consult, make sure the contract allows it.</li>
            <li><strong>What equipment and support staff will be available?</strong> — Your efficiency and income depend on having adequate support. Ask about CA staffing, equipment quality, and technology systems.</li>
            <li><strong>Have you had the contract reviewed by a healthcare attorney?</strong> — Spending $500-1,000 on an attorney review is always worth it. They will catch issues you will miss. Ask the employer if they are open to mutually agreed modifications.</li>
          </ol>
          <p className="bg-blue-50 border border-blue-200 rounded-xl p-3"><strong>Bottom line:</strong> Never sign a contract the same day you receive it. Take at least a week to review it, have it reviewed by an attorney, and prepare your negotiation points. A good employer will respect this process.</p>
        </div>
      </Accordion>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 3: Contract Library
  // ═══════════════════════════════════════════════════════════════════════════

  const Tab3 = () => (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: Sample Clauses */}
      <div>
        <h2 className="text-lg font-bold text-neuro-navy mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#e97325]" /> Sample Contract Clauses
        </h2>
        <div className="space-y-3">
          {SAMPLE_CLAUSES.map((clause, i) => (
            <Accordion key={i} title={clause.title} icon={<span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${clause.ratingColor}`}>{clause.rating}</span>}>
              <div className="space-y-3">
                <blockquote className="bg-gray-50 border-l-4 border-[#1a2744] p-4 rounded-r-xl font-mono text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {clause.language}
                </blockquote>
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">What This Means</span>
                    <p className="text-sm text-gray-700">{clause.annotation}</p>
                  </div>
                </div>
              </div>
            </Accordion>
          ))}
        </div>
      </div>

      {/* Section 2: Comparison Table */}
      <div>
        <h2 className="text-lg font-bold text-neuro-navy mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#e97325]" /> Contract Comparison
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Term</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-green-600 uppercase tracking-widest">Good Contract</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-yellow-600 uppercase tracking-widest">Average</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-red-600 uppercase tracking-widest">Bad Contract</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-neuro-navy">{row.term}</td>
                    <td className="px-4 py-3 text-green-700">{row.good}</td>
                    <td className="px-4 py-3 text-yellow-700">{row.average}</td>
                    <td className="px-4 py-3 text-red-700">{row.bad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3: Red Flag Examples */}
      <div>
        <h2 className="text-lg font-bold text-neuro-navy mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#e97325]" /> Real-World Red Flag Examples
        </h2>
        <div className="space-y-3">
          {RED_FLAG_EXAMPLES.map((ex, i) => (
            <div key={i} className="bg-red-50/50 border-2 border-red-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h4 className="font-bold text-neuro-navy text-sm">{ex.title}</h4>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-600">Danger</span>
              </div>
              <blockquote className="bg-white border-l-4 border-red-400 p-3 rounded-r-xl font-mono text-xs text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
                {ex.clause}
              </blockquote>
              <div className="flex gap-2">
                <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{ex.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-black text-neuro-navy flex items-center gap-3">
          <Shield className="w-7 h-7 text-[#e97325]" /> Contract Lab
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Analyze contracts, know your rights, and negotiate with confidence.</p>
      </header>

      {/* Tab Bar */}
      <div className="flex rounded-2xl overflow-hidden border border-gray-200">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border-r last:border-r-0 border-gray-200 ${activeTab === tab.id ? "bg-[#1a2744] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <Disclaimer />

      {activeTab === 1 && Tab1()}
      {activeTab === 2 && Tab2()}
      {activeTab === 3 && Tab3()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATIC DATA: Sample Clauses
// ═══════════════════════════════════════════════════════════════════════════════

const SAMPLE_CLAUSES = [
  {
    title: "Compensation Clause",
    rating: "Standard",
    ratingColor: "bg-green-100 text-green-600",
    language: `COMPENSATION. Employer shall pay Associate a base annual salary of Sixty-Five Thousand Dollars ($65,000), payable in equal bi-weekly installments. In addition, Associate shall receive a production bonus equal to twenty-five percent (25%) of net collections exceeding Fifteen Thousand Dollars ($15,000) per month, calculated and paid quarterly.`,
    annotation: "This is a straightforward base + bonus structure. The base salary is within market range for new graduates, and the bonus threshold of $15K/month in collections is achievable in most practices. The quarterly payout is standard. Make sure 'net collections' is clearly defined elsewhere in the contract.",
  },
  {
    title: "Non-Compete (Fair)",
    rating: "Favorable",
    ratingColor: "bg-blue-100 text-blue-600",
    language: `NON-COMPETITION. For a period of twelve (12) months following termination, Associate shall not practice chiropractic medicine within a ten (10) mile radius of Employer's primary office location. This restriction shall not apply if Associate is terminated without cause by Employer.`,
    annotation: "This is one of the fairest non-compete clauses you will see. The 10-mile radius and 12-month duration are reasonable, and the carve-out for without-cause termination protects you if the employer lets you go. The restriction is limited to 'chiropractic medicine' rather than broader healthcare.",
  },
  {
    title: "Non-Solicitation (Fair)",
    rating: "Standard",
    ratingColor: "bg-green-100 text-green-600",
    language: `NON-SOLICITATION. For a period of twelve (12) months following termination, Associate shall not directly solicit patients of the Practice for the purpose of providing chiropractic services. This provision does not restrict patients from independently seeking care from Associate.`,
    annotation: "The key phrase here is 'directly solicit' — this means you cannot reach out to patients, but patients who find you on their own are free to see you. This is a fair balance. Watch out for clauses that say 'solicit or accept' — the word 'accept' would prevent you from seeing patients even if they find you independently.",
  },
  {
    title: "Termination (Mutual)",
    rating: "Favorable",
    ratingColor: "bg-blue-100 text-blue-600",
    language: `TERMINATION. Either party may terminate this Agreement at any time, with or without cause, by providing ninety (90) days written notice. Upon termination, Employer shall pay Associate all earned but unpaid compensation within fourteen (14) days. Employer shall provide malpractice tail coverage at its expense if Associate is terminated without cause.`,
    annotation: "This is an excellent termination clause. Mutual termination rights with 90 days notice is generous. The requirement to pay earned compensation within 14 days is important. The malpractice tail coverage provision protects you from a significant expense if you are let go.",
  },
  {
    title: "CE Allowance",
    rating: "Standard",
    ratingColor: "bg-green-100 text-green-600",
    language: `CONTINUING EDUCATION. Employer shall provide Associate with an annual continuing education allowance of Two Thousand Five Hundred Dollars ($2,500) for registration fees, travel, and materials. Associate shall receive up to five (5) paid business days annually for approved CE activities.`,
    annotation: "$2,500 plus 5 paid days is a solid CE benefit. Make sure 'approved' CE activities is not overly restrictive — you should be able to attend any state-approved CE program, not just programs the employer selects. Consider negotiating for the allowance to roll over if unused.",
  },
  {
    title: "Patient Assignment",
    rating: "Favorable",
    ratingColor: "bg-blue-100 text-blue-600",
    language: `PATIENT ASSIGNMENT. Employer shall assign to Associate a proportional share of new patient intake, not less than forty percent (40%) of new patients during the first twelve (12) months. Employer shall maintain Associate's schedule at a minimum of twenty (20) patient visits per day within sixty (60) days of start date.`,
    annotation: "This is excellent — it guarantees patient flow. The 40% new patient assignment and 20 visits/day minimum protect your income potential. Without this language, some practices give associates only overflow patients, making production bonuses impossible to achieve.",
  },
  {
    title: "Equity/Buy-In Path",
    rating: "Favorable",
    ratingColor: "bg-blue-100 text-blue-600",
    language: `EQUITY PATHWAY. After twenty-four (24) months of employment, Associate shall have the option to purchase up to forty-nine percent (49%) of the Practice. Purchase price shall be determined by an independent valuation using a multiple of trailing twelve-month collections, not to exceed seventy percent (70%) of annual gross collections. Associate shall have right of first refusal in the event of a sale of the Practice.`,
    annotation: "This is a strong equity clause. The 24-month timeline is reasonable, the valuation formula is transparent (70% of collections cap protects you from inflated valuations), and the right of first refusal is extremely valuable. Make sure the 'independent valuation' process is also defined — who selects the valuator?",
  },
  {
    title: "Malpractice Tail Coverage",
    rating: "Standard",
    ratingColor: "bg-green-100 text-green-600",
    language: `MALPRACTICE. Employer shall maintain professional liability insurance for Associate in the amount of $1,000,000/$3,000,000. In the event of termination by either party, Employer shall purchase tail coverage at its sole expense, provided Associate has been employed for a minimum of twelve (12) months.`,
    annotation: "The $1M/$3M coverage limits are standard. Employer-paid tail coverage is a significant benefit — tail coverage can cost $5,000-15,000. The 12-month employment minimum for tail coverage is reasonable. If you leave before 12 months, you may need to purchase your own tail.",
  },
  {
    title: "Dispute Resolution",
    rating: "Watch Out",
    ratingColor: "bg-orange-100 text-orange-600",
    language: `DISPUTE RESOLUTION. Any dispute arising from this Agreement shall be resolved through binding arbitration administered by the American Arbitration Association, in the county of Employer's principal office. Each party shall bear its own costs and attorney's fees.`,
    annotation: "Arbitration clauses waive your right to sue in court. While arbitration can be faster, it often favors employers because they are repeat participants in the system. 'Binding' means you cannot appeal. 'Each party bears its own costs' means you pay your own attorney even if you win. Consider negotiating for mediation first, then arbitration, with the losing party paying fees.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STATIC DATA: Comparison Table
// ═══════════════════════════════════════════════════════════════════════════════

const COMPARISON_ROWS = [
  { term: "Base Salary", good: "$65-80K with clear raises", average: "$55-65K, annual review", bad: "Under $50K, no raise structure" },
  { term: "Non-Compete", good: "None, or 10mi/12mo with buyout", average: "15mi/18mo, no buyout", bad: "25+ mi/24+ mo, no exceptions" },
  { term: "Termination", good: "Mutual, 90 days, with/without cause", average: "Mutual, 60 days, with cause defined", bad: "Employer only, 30 days, vague cause" },
  { term: "Benefits", good: "Health, malpractice, CE, 401k, PTO", average: "Malpractice, some PTO", bad: "No benefits, 1099 classification" },
  { term: "Equity Path", good: "Written timeline, defined formula", average: "Verbal discussion after 2+ years", bad: "No mention, no interest" },
  { term: "Patient Ownership", good: "Patients choose freely on exit", average: "No solicitation, patients can find you", bad: "All patients belong to practice permanently" },
  { term: "CE Budget", good: "$2,500+ with 5 paid days", average: "$1,000-1,500, unpaid days", bad: "No CE allowance or time off" },
  { term: "Malpractice", good: "Occurrence-based, employer-paid tail", average: "Claims-made, shared tail cost", bad: "Associate pays all insurance costs" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STATIC DATA: Red Flag Examples
// ═══════════════════════════════════════════════════════════════════════════════

const RED_FLAG_EXAMPLES = [
  {
    title: "The Unescapable Non-Compete",
    clause: `Associate shall not, for a period of thirty-six (36) months following termination for any reason, engage in the practice of chiropractic or any healthcare-related services within a thirty (30) mile radius of any office operated by Employer, including any office opened during the term of this Agreement or within twelve (12) months thereafter.`,
    explanation: "This clause is designed to be inescapable. 36 months is excessively long. 30 miles covers an entire metro area. 'Any healthcare-related services' goes far beyond chiropractic. And the radius applies to ANY office the employer has or opens in the future — meaning they could open an office near your home and retroactively restrict you. This is unenforceable in many states but can still cost you thousands in legal fees to fight.",
  },
  {
    title: "The Production Trap",
    clause: `Associate shall receive a base salary of $45,000. Associate shall also be eligible for a production bonus of 20% of net collections exceeding $25,000 per month, payable quarterly, subject to Employer's sole discretion and determination of qualifying collections.`,
    explanation: "Three red flags here: (1) $45K base is significantly below market. (2) The $25K/month threshold means you need to generate $300K/year before seeing any bonus — which requires an extremely busy schedule. (3) 'Subject to Employer's sole discretion' means they can define 'qualifying collections' however they want and change the rules at any time. This bonus is essentially illusory.",
  },
  {
    title: "The Patient Ownership Lock",
    clause: `All patients treated by Associate during the term of this Agreement are and shall remain patients of the Practice. Associate shall not, directly or indirectly, solicit, accept, treat, or provide any services to any patient of the Practice for a period of twenty-four (24) months following termination. Associate acknowledges that all patient records, relationships, and goodwill are the exclusive property of Employer.`,
    explanation: "This clause makes it impossible to build on your patient relationships. 'Accept' means even if a patient finds you independently, you cannot see them. 'Any patient of the Practice' likely means every patient who has ever visited, not just your patients. Combined with a non-compete, this could prevent you from practicing at all for two years. 'Goodwill is exclusive property' is legally questionable but designed to intimidate.",
  },
  {
    title: "The Invisible IP Clause",
    clause: `Any and all intellectual property, including but not limited to treatment protocols, marketing materials, patient education content, social media content, clinical workflows, and business processes developed by Associate during the term of this Agreement shall be the sole and exclusive property of Employer, whether developed during or outside of working hours.`,
    explanation: "This clause claims ownership of everything you create — even outside of work hours. If you develop a unique treatment approach, write educational content, or create anything professionally valuable, the employer owns it. The phrase 'whether developed during or outside of working hours' is particularly aggressive and may be unenforceable, but it signals the employer's mindset about the associate relationship.",
  },
];
