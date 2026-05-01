"use client";
import StudentUpgradeGate from "@/components/student/UpgradeGate";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Printer,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Target,
  Wallet,
  FileText,
  AlertTriangle,
  GraduationCap,
  RotateCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlannerState {
  step: number;
  name: string;
  loanBalance: number;
  interestRate: number;
  hasPrivateLoans: boolean;
  hasConsolidated: boolean;
  currentPayment: number;
  employmentType: string;
  annualSalary: number;
  compModel: string;
  monthlyBonus: number;
  state: string;
  expenses: Record<string, number>;
  emergencyMonths: number;
  openPractice: string;
  practiceTimeline: number;
  retirementSaving: number;
  isPurchased: boolean;
  checkingPurchase: boolean;
  completedSteps: number[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = "neurochiro-financial-planner";

const DEFAULT_EXPENSES: Record<string, number> = {
  Rent: 1200,
  Utilities: 150,
  Insurance_Home: 100,
  Car: 350,
  CarInsurance: 150,
  Gas: 150,
  Groceries: 400,
  DiningOut: 150,
  Phone: 80,
  Subscriptions: 50,
  Personal: 100,
  Malpractice: 100,
  License: 30,
  CE: 100,
  Associations: 25,
  HealthInsurance: 350,
  Dental: 50,
  Other: 200,
};

const EXPENSE_GROUPS: { label: string; icon: string; keys: string[] }[] = [
  { label: "Housing", icon: "🏠", keys: ["Rent", "Utilities", "Insurance_Home"] },
  { label: "Transport", icon: "🚗", keys: ["Car", "CarInsurance", "Gas"] },
  { label: "Living", icon: "🛒", keys: ["Groceries", "DiningOut", "Phone", "Subscriptions", "Personal"] },
  { label: "Professional", icon: "💼", keys: ["Malpractice", "License", "CE", "Associations"] },
  { label: "Health", icon: "🏥", keys: ["HealthInsurance", "Dental"] },
  { label: "Other", icon: "📦", keys: ["Other"] },
];

const EXPENSE_LABELS: Record<string, string> = {
  Rent: "Rent",
  Utilities: "Utilities",
  Insurance_Home: "Renter's Insurance",
  Car: "Car Payment",
  CarInsurance: "Car Insurance",
  Gas: "Gas",
  Groceries: "Groceries",
  DiningOut: "Dining Out",
  Phone: "Phone",
  Subscriptions: "Subscriptions",
  Personal: "Personal Care",
  Malpractice: "Malpractice Ins.",
  License: "Licensing Fees",
  CE: "Continuing Ed",
  Associations: "Associations",
  HealthInsurance: "Health Insurance",
  Dental: "Dental Insurance",
  Other: "Other",
};

const EMPLOYMENT_TYPES = ["Associate (W-2)", "Associate (1099)", "Own Practice", "Not Employed"];
const COMP_MODELS = ["Base Only", "Base + Bonus", "% of Collections", "Hybrid"];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

const STATE_TAX_RATES: Record<string, number> = {
  TX: 0, FL: 0, WA: 0, NV: 0, WY: 0, SD: 0, AK: 0, TN: 0, NH: 0,
  CA: 9.3, NY: 6.85, NJ: 6.37, IL: 4.95, PA: 3.07, OH: 3.99,
  GA: 5.49, NC: 4.75, VA: 5.75, MA: 5.0, CO: 4.4, MN: 7.05,
  OR: 8.75, SC: 6.5, MD: 5.75, AZ: 2.5, MI: 4.25,
};

const STEP_LABELS = [
  "1. Your Situation",
  "2. Your Plan",
  "3. Your Roadmap",
  "4. Print Report",
];

const INITIAL_STATE: PlannerState = {
  step: 1,
  name: "",
  loanBalance: 250000,
  interestRate: 6.5,
  hasPrivateLoans: false,
  hasConsolidated: false,
  currentPayment: 0,
  employmentType: "Associate (W-2)",
  annualSalary: 60000,
  compModel: "Base Only",
  monthlyBonus: 0,
  state: "GA",
  expenses: { ...DEFAULT_EXPENSES },
  emergencyMonths: 6,
  openPractice: "Maybe",
  practiceTimeline: 3,
  retirementSaving: 100,
  isPurchased: false,
  checkingPurchase: true,
  completedSteps: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDec(n: number, d: number = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function calcFederalTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  const brackets = [
    { limit: 11600, rate: 0.10 },
    { limit: 47150, rate: 0.12 },
    { limit: 100525, rate: 0.22 },
    { limit: Infinity, rate: 0.24 },
  ];
  let prev = 0;
  for (const b of brackets) {
    const portion = Math.min(taxableIncome, b.limit) - prev;
    if (portion <= 0) break;
    tax += portion * b.rate;
    prev = b.limit;
  }
  return tax;
}

function getStateTaxRate(st: string): number {
  return (STATE_TAX_RATES[st] ?? 5) / 100;
}

function getMarginalRate(taxableIncome: number): number {
  if (taxableIncome <= 11600) return 0.10;
  if (taxableIncome <= 47150) return 0.12;
  if (taxableIncome <= 100525) return 0.22;
  return 0.24;
}

function calcMonthlyPayment(balance: number, annualRate: number, years: number): number {
  if (balance <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return balance / (years * 12);
  const n = years * 12;
  return (balance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcTotalPaid(monthly: number, years: number): number {
  return monthly * years * 12;
}

function calcSAVEPayment(agi: number): number {
  const fpl225 = 15060 * 2.25;
  const discretionary = agi - fpl225;
  if (discretionary <= 0) return 0;
  return (discretionary * 0.10) / 12;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FinancialPlanner() {
  return (
    <StudentUpgradeGate feature="Financial Planner" description="Plan your first year finances, calculate loan payments, project your salary, and build a budget before you graduate.">
      <FinancialPlannerContent />
    </StudentUpgradeGate>
  );
}

function FinancialPlannerContent() {
  const [state, setState] = useState<PlannerState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PlannerState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
          checkingPurchase: true,
          expenses: { ...DEFAULT_EXPENSES, ...(parsed.expenses || {}) },
        }));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Check purchase status
  useEffect(() => {
    if (!loaded) return;
    const check = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await (supabase as any)
            .from("course_purchases")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", "student-financial-planner")
            .limit(1);
          if (data && data.length > 0) {
            setState((prev) => ({ ...prev, isPurchased: true, checkingPurchase: false }));
            return;
          }
        }
      } catch {
        // ignore
      }
      setState((prev) => ({ ...prev, checkingPurchase: false }));
    };
    check();
  }, [loaded]);

  // Save to localStorage (debounced)
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      try {
        const toSave = { ...stateRef.current };
        delete (toSave as Record<string, unknown>).checkingPurchase;
        localStorage.setItem(LS_KEY, JSON.stringify(toSave));
      } catch {
        // ignore
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [state, loaded]);

  const set = useCallback(
    <K extends keyof PlannerState>(key: K, value: PlannerState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setExpense = useCallback((key: string, value: number) => {
    setState((prev) => ({
      ...prev,
      expenses: { ...prev.expenses, [key]: value },
    }));
  }, []);

  // ─── Derived values ──────────────────────────────────────────────────────

  const totalExpenses = Object.values(state.expenses).reduce((a, b) => a + b, 0);

  const isW2 = state.employmentType === "Associate (W-2)";
  const is1099 = state.employmentType === "Associate (1099)" || state.employmentType === "Own Practice";
  const ficaRate = is1099 ? 0.153 : 0.0765;

  const grossAnnual = state.annualSalary + state.monthlyBonus * 12;
  const standardDeduction = 14600;
  const selfEmploymentDeduction = is1099 ? grossAnnual * 0.0765 : 0;
  const taxableIncome = Math.max(0, grossAnnual - standardDeduction - selfEmploymentDeduction);
  const federalTaxAnnual = calcFederalTax(taxableIncome);
  const stateTaxAnnual = taxableIncome * getStateTaxRate(state.state);
  const ficaAnnual = grossAnnual * ficaRate;
  const totalTaxAnnual = federalTaxAnnual + stateTaxAnnual + ficaAnnual;
  const netAnnual = grossAnnual - totalTaxAnnual;
  const netMonthly = netAnnual / 12;

  const surplus = netMonthly - totalExpenses;
  const dti = state.annualSalary > 0 ? (state.loanBalance / state.annualSalary) * 100 : 0;
  const standardPayment = calcMonthlyPayment(state.loanBalance, state.interestRate, 10);
  const yearsToPayOff = standardPayment > 0 ? 10 : 0;

  const marginalRate = getMarginalRate(taxableIncome);

  // Loan plans
  const savePayment = calcSAVEPayment(grossAnnual);
  const standard10Payment = calcMonthlyPayment(state.loanBalance, state.interestRate, 10);
  const aggressive7Payment = calcMonthlyPayment(state.loanBalance, state.interestRate, 7);
  const refiRate = Math.max(0, state.interestRate - 1.5);
  const refiPayment = calcMonthlyPayment(state.loanBalance, refiRate, 10);

  const saveTotalPaid = calcTotalPaid(savePayment, 25);
  const standard10Total = calcTotalPaid(standard10Payment, 10);
  const aggressive7Total = calcTotalPaid(aggressive7Payment, 7);
  const refiTotal = calcTotalPaid(refiPayment, 10);

  // Recommended plan logic
  const recommendedPlan = (() => {
    if (grossAnnual < 75000 && !state.hasPrivateLoans) return "SAVE";
    if (surplus > 1000) return "Aggressive";
    return "Standard";
  })();

  // ─── Navigation ──────────────────────────────────────────────────────────

  const goToStep = (step: number) => {
    setState((prev) => {
      const completed = [...prev.completedSteps];
      if (!completed.includes(prev.step) && prev.step < step) {
        completed.push(prev.step);
      }
      return { ...prev, step, completedSteps: completed };
    });
  };

  const canNavigate = (step: number) => {
    return step <= state.step || state.completedSteps.includes(step);
  };

  const nextStep = () => {
    if (state.step < 4) goToStep(state.step + 1);
  };

  const prevStep = () => {
    if (state.step > 1) goToStep(state.step - 1);
  };

  const resetAll = () => {
    localStorage.removeItem(LS_KEY);
    setState({ ...INITIAL_STATE, checkingPurchase: false, isPurchased: state.isPurchased });
  };

  const resetExpenses = () => {
    set("expenses", { ...DEFAULT_EXPENSES });
  };

  // ─── Purchase ────────────────────────────────────────────────────────────

  const handlePurchase = async () => {
    setPurchaseLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: "student-financial-planner",
          courseName: "Student Financial Planner",
          price: 2900,
          returnPath: "/student/financial-planner",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // ignore
    }
    setPurchaseLoading(false);
  };

  // ─── Print ───────────────────────────────────────────────────────────────

  const handlePrint = () => window.print();

  if (!loaded) return null;

  // ─── Step Tabs ───────────────────────────────────────────────────────────

  const StepTabs = () => (
    <div className="no-print flex rounded-2xl overflow-hidden border border-gray-200 mb-6">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isActive = state.step === step;
        const isCompleted = state.completedSteps.includes(step);
        const clickable = canNavigate(step);
        return (
          <button
            key={step}
            onClick={() => clickable && goToStep(step)}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold transition-all border-r last:border-r-0 border-gray-200 ${
              isActive
                ? "bg-neuro-navy text-white"
                : isCompleted
                ? "bg-green-600 text-white"
                : clickable
                ? "bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {isCompleted && !isActive && <Check className="w-3.5 h-3.5" />}
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );

  const NavButtons = () => (
    <div className="no-print flex justify-between mt-8">
      {state.step > 1 ? (
        <button
          onClick={prevStep}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      ) : (
        <div />
      )}
      {state.step < 4 ? (
        <button
          onClick={nextStep}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neuro-orange text-white text-sm font-bold hover:bg-neuro-orange/90 transition-colors"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <div />
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Your Situation
  // ─────────────────────────────────────────────────────────────────────────

  const Step1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Section A: Student Loans */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-neuro-orange" /> Student Loans
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Loan Balance</label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  value={state.loanBalance}
                  onChange={(e) => set("loanBalance", Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={state.interestRate}
                onChange={(e) => set("interestRate", Number(e.target.value) || 0)}
                className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => set("hasPrivateLoans", !state.hasPrivateLoans)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${
                state.hasPrivateLoans
                  ? "border-neuro-navy bg-neuro-navy text-white"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {state.hasPrivateLoans && <Check className="w-3 h-3 inline mr-1" />}Has Private Loans
            </button>
            <button
              onClick={() => set("hasConsolidated", !state.hasConsolidated)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${
                state.hasConsolidated
                  ? "border-neuro-navy bg-neuro-navy text-white"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {state.hasConsolidated && <Check className="w-3 h-3 inline mr-1" />}Has Consolidated
            </button>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current Monthly Payment (optional)</label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input
                type="number"
                value={state.currentPayment}
                onChange={(e) => set("currentPayment", Number(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section B: Income */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-neuro-orange" /> Income
          </h3>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Employment Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EMPLOYMENT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => set("employmentType", t)}
                  className={`px-3 py-3 rounded-xl text-xs font-bold border-2 transition-colors ${
                    state.employmentType === t
                      ? "border-neuro-orange bg-neuro-orange text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Annual Salary</label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  value={state.annualSalary}
                  onChange={(e) => set("annualSalary", Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Comp Model</label>
              <div className="relative mt-1">
                <select
                  value={state.compModel}
                  onChange={(e) => set("compModel", e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors appearance-none"
                >
                  {COMP_MODELS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monthly Bonus (optional)</label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  value={state.monthlyBonus}
                  onChange={(e) => set("monthlyBonus", Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">State</label>
              <div className="relative mt-1">
                <select
                  value={state.state}
                  onChange={(e) => set("state", e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors appearance-none"
                >
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Section C: Monthly Expenses */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2">
              <Calculator className="w-4 h-4 text-neuro-orange" /> Monthly Expenses
            </h3>
            <button
              onClick={resetExpenses}
              className="text-xs font-bold text-neuro-orange hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Use Defaults
            </button>
          </div>
          {EXPENSE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                {group.icon} {group.label}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {group.keys.map((k) => (
                  <div key={k}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">{EXPENSE_LABELS[k]}</label>
                    <div className="relative mt-0.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                      <input
                        type="number"
                        value={state.expenses[k] ?? 0}
                        onChange={(e) => setExpense(k, Number(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="bg-neuro-navy rounded-xl p-4 text-white flex justify-between items-center">
            <span className="text-sm font-bold text-white/70">Total Monthly Expenses</span>
            <span className="text-xl font-black">${fmt(totalExpenses)}</span>
          </div>
        </div>

        {/* Section D: Goals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2">
            <Target className="w-4 h-4 text-neuro-orange" /> Goals
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Emergency Fund (months)</label>
              <div className="relative mt-1">
                <select
                  value={state.emergencyMonths}
                  onChange={(e) => set("emergencyMonths", Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors appearance-none"
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Retirement Saving (/mo)</label>
              <div className="relative mt-1">
                <select
                  value={state.retirementSaving}
                  onChange={(e) => set("retirementSaving", Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors appearance-none"
                >
                  <option value={0}>$0/mo</option>
                  <option value={100}>$100/mo</option>
                  <option value={300}>$300/mo</option>
                  <option value={500}>$500/mo</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Open Your Own Practice?</label>
            <div className="flex gap-2">
              {["Yes", "No", "Maybe"].map((v) => (
                <button
                  key={v}
                  onClick={() => set("openPractice", v)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                    state.openPractice === v
                      ? "border-neuro-orange bg-neuro-orange text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          {state.openPractice === "Yes" && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Practice Timeline</label>
              <div className="relative mt-1">
                <select
                  value={state.practiceTimeline}
                  onChange={(e) => set("practiceTimeline", Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors appearance-none"
                >
                  <option value={1}>1 year</option>
                  <option value={2}>2 years</option>
                  <option value={3}>3 years</option>
                  <option value={5}>5 years</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Live Summary Card */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-8">
          <div className="bg-neuro-navy p-6">
            <p className="text-xs text-white/50 uppercase tracking-wide font-bold">Live Summary</p>
            <h2 className="text-xl font-heading font-black text-white mt-2">
              {state.name || "Your Finances"}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">Monthly Take-Home</span>
              <span className="text-lg font-black text-neuro-navy">${fmt(Math.round(netMonthly))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">Total Expenses</span>
              <span className="text-lg font-black text-neuro-navy">${fmt(totalExpenses)}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">
                {surplus >= 0 ? "Monthly Surplus" : "Monthly Deficit"}
              </span>
              <span className={`text-lg font-black ${surplus >= 0 ? "text-green-600" : "text-red-600"}`}>
                {surplus >= 0 ? "+" : ""}${fmt(Math.round(surplus))}
              </span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">Debt-to-Income</span>
              <span className={`text-sm font-black ${dti > 200 ? "text-red-600" : dti > 100 ? "text-neuro-orange" : "text-green-600"}`}>
                {fmtDec(dti, 0)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">Std. Payoff</span>
              <span className="text-sm font-black text-neuro-navy">{yearsToPayOff} years</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">Std. Payment</span>
              <span className="text-sm font-black text-neuro-navy">${fmt(Math.round(standardPayment))}/mo</span>
            </div>
            {/* Visual bar */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Income Allocation</p>
              <div className="flex rounded-lg overflow-hidden h-4">
                {netMonthly > 0 && (
                  <>
                    <div
                      className="bg-neuro-navy"
                      style={{ width: `${Math.min(100, (totalExpenses / netMonthly) * 100)}%` }}
                      title={`Expenses: ${Math.round((totalExpenses / netMonthly) * 100)}%`}
                    />
                    <div
                      className={surplus >= 0 ? "bg-green-500" : "bg-red-500"}
                      style={{ width: `${Math.max(0, 100 - (totalExpenses / netMonthly) * 100)}%` }}
                      title={`${surplus >= 0 ? "Surplus" : "Deficit"}: ${Math.abs(Math.round((surplus / netMonthly) * 100))}%`}
                    />
                  </>
                )}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Expenses {netMonthly > 0 ? Math.round((totalExpenses / netMonthly) * 100) : 0}%</span>
                <span className={surplus >= 0 ? "text-green-600" : "text-red-600"}>
                  {surplus >= 0 ? "Free" : "Over"} {netMonthly > 0 ? Math.abs(Math.round((surplus / netMonthly) * 100)) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Your Plan (PURCHASE GATED)
  // ─────────────────────────────────────────────────────────────────────────

  const LockedOverlay = () => (
    <div className="relative">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-neuro-navy/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-neuro-navy" />
          </div>
          <h3 className="text-xl font-heading font-black text-neuro-navy mb-2">
            Unlock Your Financial Plan
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Get personalized loan repayment strategies, tax breakdowns, budget allocations, and a 3-year roadmap.
          </p>
          <button
            onClick={handlePurchase}
            disabled={purchaseLoading}
            className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors text-lg disabled:opacity-50"
          >
            {purchaseLoading ? "Loading..." : "$29 — Unlock Your Financial Plan"}
          </button>
        </div>
      </div>
      {/* Blurred preview behind */}
      <div className="filter blur-sm pointer-events-none select-none opacity-50">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-96" />
      </div>
    </div>
  );

  const loanPlans = [
    {
      name: "SAVE Plan",
      payment: Math.round(savePayment),
      totalPaid: Math.round(saveTotalPaid),
      years: 25,
      forgiveness: "Yes (25 yr)",
      recommended: recommendedPlan === "SAVE",
    },
    {
      name: "Standard 10-Year",
      payment: Math.round(standard10Payment),
      totalPaid: Math.round(standard10Total),
      years: 10,
      forgiveness: "No",
      recommended: recommendedPlan === "Standard",
    },
    {
      name: "Aggressive 7-Year",
      payment: Math.round(aggressive7Payment),
      totalPaid: Math.round(aggressive7Total),
      years: 7,
      forgiveness: "No",
      recommended: recommendedPlan === "Aggressive",
    },
    {
      name: `Refinance (${fmtDec(refiRate, 1)}%)`,
      payment: Math.round(refiPayment),
      totalPaid: Math.round(refiTotal),
      years: 10,
      forgiveness: "No",
      recommended: false,
    },
  ];

  const checklistW2 = [
    "Set up direct deposit and verify withholding on W-4",
    "Enroll in employer benefits (health, retirement, malpractice)",
    "Set up a separate savings account for emergency fund",
    "Apply for or consolidate student loans if beneficial",
    "Register for income-driven repayment if applicable",
    "Set up automatic loan payments for 0.25% rate reduction",
    "Begin tracking expenses with a budgeting tool",
    "Open a Roth IRA if income qualifies",
    "Get renter's insurance and umbrella policy",
    "Schedule quarterly financial check-ins",
  ];

  const checklist1099 = [
    "Register your business (LLC or sole proprietor)",
    "Open a separate business bank account",
    "Set up quarterly estimated tax payments (Form 1040-ES)",
    "Track all business expenses from day one",
    "Get malpractice insurance and general liability",
    "Set up a SEP-IRA or Solo 401(k) for retirement",
    "Apply for or consolidate student loans if beneficial",
    "Set up automatic loan payments for 0.25% rate reduction",
    "Hire a CPA or tax professional for quarterly review",
    "Build 3-month operating expense reserve",
  ];

  const activeChecklist = is1099 ? checklist1099 : checklistW2;

  // Budget allocation segments
  const budgetSegments = (() => {
    const loanPmt = state.currentPayment > 0 ? state.currentPayment : Math.round(standardPayment);
    const housing = (state.expenses.Rent || 0) + (state.expenses.Utilities || 0) + (state.expenses.Insurance_Home || 0);
    const transport = (state.expenses.Car || 0) + (state.expenses.CarInsurance || 0) + (state.expenses.Gas || 0);
    const living = (state.expenses.Groceries || 0) + (state.expenses.DiningOut || 0) + (state.expenses.Phone || 0) + (state.expenses.Subscriptions || 0) + (state.expenses.Personal || 0);
    const professional = (state.expenses.Malpractice || 0) + (state.expenses.License || 0) + (state.expenses.CE || 0) + (state.expenses.Associations || 0);
    const health = (state.expenses.HealthInsurance || 0) + (state.expenses.Dental || 0);
    const emergencyContrib = Math.round((totalExpenses * state.emergencyMonths) / 24);
    const retirement = state.retirementSaving;
    const allocated = loanPmt + housing + transport + living + professional + health + emergencyContrib + retirement;
    const discretionary = Math.round(netMonthly) - allocated;

    return [
      { label: "Loans", value: loanPmt, color: "#dc2626" },
      { label: "Housing", value: housing, color: "#1a2744" },
      { label: "Transport", value: transport, color: "#6366f1" },
      { label: "Living", value: living, color: "#8b5cf6" },
      { label: "Professional", value: professional, color: "#0891b2" },
      { label: "Health", value: health, color: "#059669" },
      { label: "Emergency", value: emergencyContrib, color: "#d97706" },
      { label: "Retirement", value: retirement, color: "#2563eb" },
      { label: "Discretionary", value: Math.max(0, discretionary), color: discretionary >= 0 ? "#16a34a" : "#dc2626" },
    ].filter((s) => s.value > 0);
  })();

  const budgetTotal = budgetSegments.reduce((a, b) => a + b.value, 0);

  // Tax deductions
  const deductions = [
    { label: "Continuing Education", annualCost: (state.expenses.CE || 0) * 12, saved: Math.round((state.expenses.CE || 0) * 12 * marginalRate) },
    { label: "Malpractice Insurance", annualCost: (state.expenses.Malpractice || 0) * 12, saved: Math.round((state.expenses.Malpractice || 0) * 12 * marginalRate) },
    { label: "Student Loan Interest", annualCost: 2500, saved: Math.round(2500 * marginalRate) },
    { label: "Licensing Fees", annualCost: (state.expenses.License || 0) * 12, saved: Math.round((state.expenses.License || 0) * 12 * marginalRate) },
    { label: "Professional Associations", annualCost: (state.expenses.Associations || 0) * 12, saved: Math.round((state.expenses.Associations || 0) * 12 * marginalRate) },
  ];

  if (is1099) {
    deductions.push(
      { label: "Home Office Deduction", annualCost: 1500, saved: Math.round(1500 * marginalRate) },
      { label: "Business Mileage", annualCost: 3000, saved: Math.round(3000 * marginalRate) },
      { label: "Health Insurance Premium", annualCost: (state.expenses.HealthInsurance || 0) * 12, saved: Math.round((state.expenses.HealthInsurance || 0) * 12 * marginalRate) },
    );
  }

  const totalDeductionSavings = deductions.reduce((a, b) => a + b.saved, 0);

  const Step2 = () => {
    if (state.checkingPurchase) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!state.isPurchased) {
      return LockedOverlay();
    }

    return (
      <div className="space-y-8">
        {/* Section A: Take-Home Pay Calculator */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-neuro-orange" /> Take-Home Pay Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Gross Monthly</p>
              <p className="text-lg font-black text-neuro-navy">${fmt(Math.round(grossAnnual / 12))}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Federal Tax</p>
              <p className="text-lg font-black text-red-600">-${fmt(Math.round(federalTaxAnnual / 12))}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase">State Tax ({state.state})</p>
              <p className="text-lg font-black text-red-600">-${fmt(Math.round(stateTaxAnnual / 12))}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase">FICA {is1099 ? "(SE)" : ""}</p>
              <p className="text-lg font-black text-red-600">-${fmt(Math.round(ficaAnnual / 12))}</p>
            </div>
            {is1099 && (
              <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-200">
                <p className="text-[10px] font-bold text-yellow-700 uppercase">Quarterly Est.</p>
                <p className="text-lg font-black text-yellow-700">${fmt(Math.round(totalTaxAnnual / 4))}</p>
              </div>
            )}
            <div className="bg-neuro-navy rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-white/60 uppercase">Net Take-Home</p>
              <p className="text-lg font-black text-white">${fmt(Math.round(netMonthly))}</p>
            </div>
          </div>
          {is1099 && (
            <div className="mt-4 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700">
                As a 1099 contractor, you pay self-employment tax (15.3%). Set aside <strong>${fmt(Math.round(totalTaxAnnual / 4))}</strong> quarterly for estimated taxes (due Jan 15, Apr 15, Jun 15, Sep 15).
              </p>
            </div>
          )}
        </div>

        {/* Section B: Loan Repayment Strategy */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-neuro-orange" /> Loan Repayment Strategies
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3 px-3 text-xs font-black text-gray-400 uppercase">Plan</th>
                  <th className="text-right py-3 px-3 text-xs font-black text-gray-400 uppercase">Monthly</th>
                  <th className="text-right py-3 px-3 text-xs font-black text-gray-400 uppercase">Total Paid</th>
                  <th className="text-right py-3 px-3 text-xs font-black text-gray-400 uppercase">Years</th>
                  <th className="text-right py-3 px-3 text-xs font-black text-gray-400 uppercase">Forgiveness?</th>
                </tr>
              </thead>
              <tbody>
                {loanPlans.map((plan) => (
                  <tr
                    key={plan.name}
                    className={`border-b border-gray-50 ${
                      plan.recommended ? "bg-neuro-orange/5 border-l-4 border-l-neuro-orange" : ""
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-neuro-navy">
                      {plan.name}
                      {plan.recommended && (
                        <span className="ml-2 text-[10px] font-black text-neuro-orange bg-neuro-orange/10 px-2 py-0.5 rounded-full uppercase">
                          Recommended
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-neuro-navy">${fmt(plan.payment)}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-600">${fmt(plan.totalPaid)}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-600">{plan.years}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-600">{plan.forgiveness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section C: First 90 Days Checklist */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-neuro-orange" /> First 90 Days Checklist ({isW2 ? "W-2" : "1099"})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeChecklist.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-5 h-5 rounded border-2 border-neuro-navy flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-neuro-navy" />
                </div>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section D: Budget Allocation Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-neuro-orange" /> Budget Allocation
          </h3>
          <div className="flex rounded-xl overflow-hidden h-12 mb-4">
            {budgetSegments.map((seg) => {
              const pct = budgetTotal > 0 ? (seg.value / budgetTotal) * 100 : 0;
              if (pct < 1) return null;
              return (
                <div
                  key={seg.label}
                  className="flex items-center justify-center text-white text-[9px] font-bold px-1"
                  style={{ width: `${pct}%`, backgroundColor: seg.color, minWidth: pct > 3 ? "30px" : "0" }}
                  title={`${seg.label}: $${fmt(seg.value)}`}
                >
                  {pct > 6 && <span className="truncate">{seg.label}</span>}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {budgetSegments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
                <div>
                  <p className="text-[10px] font-bold text-gray-500">{seg.label}</p>
                  <p className="text-xs font-black text-neuro-navy">
                    ${fmt(seg.value)} <span className="text-gray-400 font-normal">({budgetTotal > 0 ? Math.round((seg.value / budgetTotal) * 100) : 0}%)</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section E: Tax Deductions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-neuro-orange" /> Tax Deductions ({Math.round(marginalRate * 100)}% Marginal Rate)
          </h3>
          <div className="space-y-2">
            {deductions.map((d) => (
              <div key={d.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-neuro-navy">{d.label}</p>
                  <p className="text-xs text-gray-400">${fmt(d.annualCost)}/yr deductible</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-green-600">Save ${fmt(d.saved)}/yr</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm font-bold text-green-800">Total Estimated Annual Tax Savings</span>
            <span className="text-xl font-black text-green-700">${fmt(totalDeductionSavings)}</span>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Your Roadmap
  // ─────────────────────────────────────────────────────────────────────────

  const Step3 = () => {
    if (!state.isPurchased) {
      return LockedOverlay();
    }

    const emergencyTarget = totalExpenses * state.emergencyMonths;
    const loanPmt = state.currentPayment > 0 ? state.currentPayment : Math.round(standardPayment);
    const monthsToEmergency = surplus > 0 ? Math.ceil(emergencyTarget / surplus) : 999;

    const yearCards = [
      {
        title: "Year 1",
        subtitle: "Survive & Stabilize",
        color: "#e97325",
        milestones: [
          `Build ${state.emergencyMonths}-month emergency fund ($${fmt(emergencyTarget)})`,
          `Start ${recommendedPlan} repayment plan at $${fmt(loanPmt)}/mo`,
          `Begin saving $${fmt(state.retirementSaving)}/mo for retirement`,
          is1099 ? "Set up quarterly tax payments and business accounting" : "Maximize employer benefits and 401(k) match",
          `Target net worth: -$${fmt(Math.max(0, state.loanBalance - loanPmt * 12))}`,
        ],
      },
      {
        title: "Year 2",
        subtitle: "Build & Grow",
        color: "#1a2744",
        milestones: [
          `Loan balance target: $${fmt(Math.max(0, state.loanBalance - loanPmt * 24))}`,
          surplus > 500 ? `Increase loan payments by $${fmt(Math.min(500, Math.round(surplus * 0.3)))}/mo` : "Seek income growth through CE or specialization",
          `Increase retirement to $${fmt(Math.min(500, state.retirementSaving + 200))}/mo`,
          state.openPractice === "Yes" ? "Begin practice planning and build startup fund" : "Negotiate raise or explore higher-paying positions",
          `Target net worth: -$${fmt(Math.max(0, state.loanBalance - loanPmt * 24 - (surplus > 0 ? surplus * 12 : 0)))}`,
        ],
      },
      {
        title: "Year 3",
        subtitle: "Accelerate",
        color: "#16a34a",
        milestones: [
          `Loan balance target: $${fmt(Math.max(0, state.loanBalance - loanPmt * 36))}`,
          "Max out retirement contributions ($6,500 Roth IRA + employer plan)",
          state.openPractice === "Yes" ? `Open practice (est. startup: $${fmt(150000)}-$${fmt(300000)})` : "Build investment portfolio beyond retirement accounts",
          `Emergency fund fully funded at $${fmt(emergencyTarget)}`,
          `Target positive cash flow of $${fmt(Math.max(0, Math.round(surplus + 500)))}/mo`,
        ],
      },
    ];

    // Loan payoff chart data (SVG)
    const chartW = 700;
    const chartH = 300;
    const chartPadL = 60;
    const chartPadR = 20;
    const chartPadT = 20;
    const chartPadB = 40;
    const plotW = chartW - chartPadL - chartPadR;
    const plotH = chartH - chartPadT - chartPadB;
    const maxYears = 25;
    const maxBalance = state.loanBalance;

    const minPaymentPoints: { x: number; y: number }[] = [];
    const planPaymentPoints: { x: number; y: number }[] = [];

    let balMin = state.loanBalance;
    let balPlan = state.loanBalance;
    const r = state.interestRate / 100 / 12;
    const minPmt = calcMonthlyPayment(state.loanBalance, state.interestRate, 25);
    const planPmt = recommendedPlan === "SAVE" ? savePayment : recommendedPlan === "Aggressive" ? aggressive7Payment : standard10Payment;

    for (let year = 0; year <= maxYears; year++) {
      const x = chartPadL + (year / maxYears) * plotW;
      minPaymentPoints.push({ x, y: chartPadT + (1 - balMin / maxBalance) * plotH });
      planPaymentPoints.push({ x, y: chartPadT + (1 - Math.max(0, balPlan) / maxBalance) * plotH });

      for (let m = 0; m < 12; m++) {
        if (balMin > 0) {
          balMin = Math.max(0, balMin * (1 + r) - minPmt);
        }
        if (balPlan > 0) {
          balPlan = Math.max(0, balPlan * (1 + r) - planPmt);
        }
      }
    }

    const toPath = (pts: { x: number; y: number }[]) =>
      pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    const areaPath = (top: { x: number; y: number }[], bottom: { x: number; y: number }[]) => {
      const fwd = top.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
      const bwd = [...bottom].reverse().map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
      return fwd + " " + bwd + " Z";
    };

    // Net worth projection
    const nwChartW = 700;
    const nwChartH = 250;
    const annualSavings = (surplus > 0 ? surplus : 0) * 12;
    const nwPoints: { x: number; y: number; val: number }[] = [];
    let nw = -state.loanBalance;
    const nwYears = 15;
    let breakEvenYear = -1;

    for (let yr = 0; yr <= nwYears; yr++) {
      nwPoints.push({
        x: chartPadL + (yr / nwYears) * (nwChartW - chartPadL - chartPadR),
        y: 0,
        val: nw,
      });
      if (breakEvenYear < 0 && nw >= 0) breakEvenYear = yr;
      nw += annualSavings + loanPmt * 12 * 0.3;
    }

    const nwMin = Math.min(...nwPoints.map((p) => p.val));
    const nwMax = Math.max(...nwPoints.map((p) => p.val));
    const nwRange = nwMax - nwMin || 1;
    const nwPlotH = nwChartH - chartPadT - chartPadB;
    nwPoints.forEach((p) => {
      p.y = chartPadT + (1 - (p.val - nwMin) / nwRange) * nwPlotH;
    });
    const nwZeroY = chartPadT + (1 - (0 - nwMin) / nwRange) * nwPlotH;

    return (
      <div className="space-y-8">
        {/* Year Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {yearCards.map((card) => (
            <div key={card.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5" style={{ backgroundColor: card.color }}>
                <p className="text-xs font-bold text-white/60 uppercase tracking-wide">{card.title}</p>
                <h3 className="text-lg font-heading font-black text-white mt-1">{card.subtitle}</h3>
              </div>
              <div className="p-5 space-y-3">
                {card.milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: card.color }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700">{m}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Loan Payoff Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-neuro-orange" /> Loan Payoff Projection
          </h3>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: "300px" }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = chartPadT + pct * plotH;
              return (
                <g key={pct}>
                  <line x1={chartPadL} y1={y} x2={chartW - chartPadR} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                  <text x={chartPadL - 8} y={y + 4} textAnchor="end" className="text-[10px]" fill="#9ca3af">
                    ${fmt(Math.round(maxBalance * (1 - pct) / 1000))}k
                  </text>
                </g>
              );
            })}
            {/* X-axis labels */}
            {[0, 5, 10, 15, 20, 25].map((yr) => {
              const x = chartPadL + (yr / maxYears) * plotW;
              return (
                <text key={yr} x={x} y={chartH - 8} textAnchor="middle" className="text-[10px]" fill="#9ca3af">
                  Yr {yr}
                </text>
              );
            })}
            {/* Shaded area between curves */}
            <path d={areaPath(minPaymentPoints, planPaymentPoints)} fill="#e97325" fillOpacity="0.1" />
            {/* Min payment line */}
            <path d={toPath(minPaymentPoints)} fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="6 4" />
            {/* Plan payment line */}
            <path d={toPath(planPaymentPoints)} fill="none" stroke="#e97325" strokeWidth="3" />
          </svg>
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gray-400" style={{ borderTop: "2px dashed #9ca3af" }} />
              <span className="text-xs text-gray-500">Minimum Payments (25yr)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-neuro-orange" />
              <span className="text-xs text-gray-500">Your Plan ({recommendedPlan})</span>
            </div>
          </div>
        </div>

        {/* Net Worth Projection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-neuro-orange" /> Net Worth Projection
          </h3>
          <svg viewBox={`0 0 ${nwChartW} ${nwChartH}`} className="w-full" style={{ maxHeight: "250px" }}>
            {/* Zero line */}
            <line x1={chartPadL} y1={nwZeroY} x2={nwChartW - chartPadR} y2={nwZeroY} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 4" />
            <text x={chartPadL - 8} y={nwZeroY + 4} textAnchor="end" className="text-[10px]" fill="#9ca3af">$0</text>
            {/* Y-axis labels */}
            <text x={chartPadL - 8} y={chartPadT + 4} textAnchor="end" className="text-[10px]" fill="#9ca3af">
              ${fmt(Math.round(nwMax / 1000))}k
            </text>
            <text x={chartPadL - 8} y={nwChartH - chartPadB + 4} textAnchor="end" className="text-[10px]" fill="#9ca3af">
              ${fmt(Math.round(nwMin / 1000))}k
            </text>
            {/* X-axis labels */}
            {[0, 5, 10, 15].map((yr) => {
              const x = chartPadL + (yr / nwYears) * (nwChartW - chartPadL - chartPadR);
              return (
                <text key={yr} x={x} y={nwChartH - 8} textAnchor="middle" className="text-[10px]" fill="#9ca3af">
                  Yr {yr}
                </text>
              );
            })}
            {/* Net worth line */}
            <path d={toPath(nwPoints)} fill="none" stroke="#1a2744" strokeWidth="3" />
            {/* Break-even marker */}
            {breakEvenYear >= 0 && breakEvenYear <= nwYears && (
              <>
                <circle
                  cx={chartPadL + (breakEvenYear / nwYears) * (nwChartW - chartPadL - chartPadR)}
                  cy={nwZeroY}
                  r="6"
                  fill="#e97325"
                />
                <text
                  x={chartPadL + (breakEvenYear / nwYears) * (nwChartW - chartPadL - chartPadR)}
                  y={nwZeroY - 14}
                  textAnchor="middle"
                  className="text-[11px]"
                  fill="#e97325"
                  fontWeight="bold"
                >
                  Break-even: Year {breakEvenYear}
                </text>
              </>
            )}
          </svg>
          {monthsToEmergency < 999 && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Emergency fund target ({state.emergencyMonths} months): ~{monthsToEmergency} months to reach at current surplus
            </p>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Print Report
  // ─────────────────────────────────────────────────────────────────────────

  const Step4 = () => {
    if (!state.isPurchased) {
      return LockedOverlay();
    }

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <div>
        <div className="no-print flex items-center gap-3 mb-6">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-neuro-navy text-white text-sm font-bold rounded-xl hover:bg-neuro-navy/90 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
          <button
            onClick={() => goToStep(1)}
            className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" /> Edit Inputs
          </button>
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-sm font-bold text-gray-400 rounded-xl hover:bg-gray-50 hover:text-red-500 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Start Over
          </button>
        </div>

        <div className="print-area bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="print-header bg-neuro-navy p-8 sm:p-10" style={{ backgroundColor: "#1a2744" }}>
            <p className="text-white/50 text-xs font-bold uppercase tracking-[0.2em]">NeuroChiro</p>
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-white mt-2">
              Your Financial Roadmap
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-white/60 text-sm">{state.name || "Student"}</span>
              <span className="text-white/30">|</span>
              <span className="text-white/40 text-sm">{today}</span>
            </div>
          </div>

          <div className="print-body p-6 sm:p-10 space-y-8">
            {/* Section 1: Financial Snapshot */}
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-neuro-orange/30">
                <div className="w-2 h-2 rounded-full bg-neuro-orange" />
                <h3 className="text-xs font-black text-neuro-orange uppercase tracking-widest">
                  Financial Snapshot
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Loan Balance</p>
                  <p className="text-xl font-black text-neuro-navy">${fmt(state.loanBalance)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Annual Income</p>
                  <p className="text-xl font-black text-neuro-navy">${fmt(grossAnnual)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Net Monthly</p>
                  <p className="text-xl font-black text-neuro-navy">${fmt(Math.round(netMonthly))}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Surplus/Deficit</p>
                  <p className={`text-xl font-black ${surplus >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {surplus >= 0 ? "+" : ""}${fmt(Math.round(surplus))}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Take-Home Breakdown */}
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-neuro-orange/30">
                <div className="w-2 h-2 rounded-full bg-neuro-orange" />
                <h3 className="text-xs font-black text-neuro-orange uppercase tracking-widest">
                  Take-Home Pay
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">Gross Monthly Income</span>
                  <span className="font-bold text-neuro-navy">${fmt(Math.round(grossAnnual / 12))}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">Federal Tax</span>
                  <span className="font-bold text-red-600">-${fmt(Math.round(federalTaxAnnual / 12))}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">State Tax ({state.state})</span>
                  <span className="font-bold text-red-600">-${fmt(Math.round(stateTaxAnnual / 12))}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">FICA{is1099 ? " (Self-Employment)" : ""}</span>
                  <span className="font-bold text-red-600">-${fmt(Math.round(ficaAnnual / 12))}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t-2 border-neuro-navy">
                  <span className="font-black text-neuro-navy">Net Monthly Take-Home</span>
                  <span className="text-xl font-black text-neuro-navy">${fmt(Math.round(netMonthly))}</span>
                </div>
              </div>
            </section>

            {/* Section 3: Loan Repayment */}
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-neuro-orange/30">
                <div className="w-2 h-2 rounded-full bg-neuro-orange" />
                <h3 className="text-xs font-black text-neuro-orange uppercase tracking-widest">
                  Recommended Repayment: {recommendedPlan}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-black text-gray-400 uppercase">Plan</th>
                      <th className="text-right py-2 px-3 text-xs font-black text-gray-400 uppercase">Monthly</th>
                      <th className="text-right py-2 px-3 text-xs font-black text-gray-400 uppercase">Total</th>
                      <th className="text-right py-2 px-3 text-xs font-black text-gray-400 uppercase">Years</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanPlans.map((plan) => (
                      <tr
                        key={plan.name}
                        className={plan.recommended ? "bg-neuro-orange/5 font-bold" : ""}
                      >
                        <td className="py-2 px-3 text-neuro-navy">
                          {plan.name} {plan.recommended && " *"}
                        </td>
                        <td className="py-2 px-3 text-right">${fmt(plan.payment)}</td>
                        <td className="py-2 px-3 text-right">${fmt(plan.totalPaid)}</td>
                        <td className="py-2 px-3 text-right">{plan.years}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 4: Budget */}
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-neuro-orange/30">
                <div className="w-2 h-2 rounded-full bg-neuro-orange" />
                <h3 className="text-xs font-black text-neuro-orange uppercase tracking-widest">
                  Monthly Budget
                </h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {budgetSegments.map((seg) => (
                  <div key={seg.label} className="text-center bg-gray-50 rounded-xl p-3">
                    <div className="w-4 h-4 rounded-sm mx-auto mb-1" style={{ backgroundColor: seg.color }} />
                    <p className="text-[10px] font-bold text-gray-500">{seg.label}</p>
                    <p className="text-sm font-black text-neuro-navy">${fmt(seg.value)}</p>
                    <p className="text-[10px] text-gray-400">{budgetTotal > 0 ? Math.round((seg.value / budgetTotal) * 100) : 0}%</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: 3-Year Milestones */}
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-neuro-orange/30">
                <div className="w-2 h-2 rounded-full bg-neuro-orange" />
                <h3 className="text-xs font-black text-neuro-orange uppercase tracking-widest">
                  3-Year Roadmap
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { yr: "Year 1", sub: "Survive & Stabilize" },
                  { yr: "Year 2", sub: "Build & Grow" },
                  { yr: "Year 3", sub: "Accelerate" },
                ].map((card) => (
                  <div key={card.yr} className="text-center bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-black text-neuro-navy uppercase">{card.yr}</p>
                    <p className="text-sm font-bold text-neuro-orange">{card.sub}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 6: Tax Savings */}
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-neuro-orange/30">
                <div className="w-2 h-2 rounded-full bg-neuro-orange" />
                <h3 className="text-xs font-black text-neuro-orange uppercase tracking-widest">
                  Estimated Tax Savings
                </h3>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-sm text-green-700">Estimated annual savings from deductions</p>
                <p className="text-3xl font-black text-green-700 mt-1">${fmt(totalDeductionSavings)}/yr</p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-10 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-center text-xs text-gray-400 italic mb-2">
              This report is for educational and planning purposes only. It does not constitute financial, tax, or legal advice.
              Consult a licensed financial advisor or CPA for personalized guidance.
            </p>
            <div className="flex justify-between text-[10px] text-gray-300">
              <span>NeuroChiro Student Financial Planner</span>
              <span>{state.name || "Student"}</span>
              <span>{today}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="financial-planner-wrapper p-4 md:p-8 max-w-6xl mx-auto">
      <style jsx global>{`
        @media print {
          .no-print,
          nav, header, footer, aside,
          [data-sidebar], [role="navigation"],
          button, .step-tabs-container {
            display: none !important;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page { margin: 0.3in 0.4in; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-area {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .financial-planner-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .print-area .print-header { padding: 20px 24px !important; }
          .print-area .print-body { padding: 16px 24px !important; }
          .print-area .print-body > section { margin-bottom: 16px !important; }
          section { page-break-inside: avoid; }
        }
      `}</style>

      {/* Page Header */}
      <div className="no-print flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-black text-neuro-navy flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-neuro-orange" /> Financial Planner
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Student-to-practice financial planning in 4 steps.
          </p>
        </div>
        <button
          onClick={resetAll}
          className="px-3 py-2 text-gray-400 hover:text-neuro-navy text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {StepTabs()}

      {state.step === 1 && Step1()}
      {state.step === 2 && Step2()}
      {state.step === 3 && Step3()}
      {state.step === 4 && Step4()}

      {state.step < 4 && NavButtons()}
    </div>
  );
}
