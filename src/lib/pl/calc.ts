/**
 * Pure P&L math. Amounts are dollars (or the doctor's currency units),
 * rounded to cents. No dates are built with toISOString(), because that
 * shifts the month for clinics outside UTC.
 */

export const MAX_MONEY = 1_000_000_000_000;
export const CONTRA_INCOME_IDS = ["4500", "4600"] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  US: "USD", USA: "USD", "UNITED STATES": "USD", "UNITED STATES OF AMERICA": "USD",
  CA: "CAD", CANADA: "CAD",
  GB: "GBP", UK: "GBP", "UNITED KINGDOM": "GBP", "GREAT BRITAIN": "GBP", ENGLAND: "GBP",
  SCOTLAND: "GBP", WALES: "GBP", "NORTHERN IRELAND": "GBP",
  AU: "AUD", AUSTRALIA: "AUD",
  NZ: "NZD", "NEW ZEALAND": "NZD",
  IE: "EUR", IRELAND: "EUR",
  DE: "EUR", GERMANY: "EUR",
  FR: "EUR", FRANCE: "EUR",
  ES: "EUR", SPAIN: "EUR",
  IT: "EUR", ITALY: "EUR",
  NL: "EUR", NETHERLANDS: "EUR", "THE NETHERLANDS": "EUR",
  BE: "EUR", BELGIUM: "EUR",
  AT: "EUR", AUSTRIA: "EUR",
  PT: "EUR", PORTUGAL: "EUR",
  FI: "EUR", FINLAND: "EUR",
  GR: "EUR", GREECE: "EUR",
  LU: "EUR", LUXEMBOURG: "EUR",
  EE: "EUR", ESTONIA: "EUR",
  LV: "EUR", LATVIA: "EUR",
  LT: "EUR", LITHUANIA: "EUR",
  SK: "EUR", SLOVAKIA: "EUR",
  SI: "EUR", SLOVENIA: "EUR",
  MT: "EUR", MALTA: "EUR",
  CY: "EUR", CYPRUS: "EUR",
  HR: "EUR", CROATIA: "EUR",
  EU: "EUR", EUROPE: "EUR",
  AE: "AED", UAE: "AED", "UNITED ARAB EMIRATES": "AED",
  IN: "INR", INDIA: "INR",
};

const EXTRA_TIME_ZONES: Record<string, string> = {
  IE: "Europe/Dublin", IRELAND: "Europe/Dublin",
  AE: "Asia/Dubai", UAE: "Asia/Dubai", "UNITED ARAB EMIRATES": "Asia/Dubai",
  IN: "Asia/Kolkata", INDIA: "Asia/Kolkata",
  DE: "Europe/Berlin", GERMANY: "Europe/Berlin",
  FR: "Europe/Paris", FRANCE: "Europe/Paris",
  ES: "Europe/Madrid", SPAIN: "Europe/Madrid",
  IT: "Europe/Rome", ITALY: "Europe/Rome",
  NL: "Europe/Amsterdam", NETHERLANDS: "Europe/Amsterdam",
  BE: "Europe/Brussels", BELGIUM: "Europe/Brussels",
  AT: "Europe/Vienna", AUSTRIA: "Europe/Vienna",
  PT: "Europe/Lisbon", PORTUGAL: "Europe/Lisbon",
  FI: "Europe/Helsinki", FINLAND: "Europe/Helsinki",
  GR: "Europe/Athens", GREECE: "Europe/Athens",
  LU: "Europe/Luxembourg", LUXEMBOURG: "Europe/Luxembourg",
  EE: "Europe/Tallinn", ESTONIA: "Europe/Tallinn",
  LV: "Europe/Riga", LATVIA: "Europe/Riga",
  LT: "Europe/Vilnius", LITHUANIA: "Europe/Vilnius",
  SK: "Europe/Bratislava", SLOVAKIA: "Europe/Bratislava",
  SI: "Europe/Ljubljana", SLOVENIA: "Europe/Ljubljana",
  MT: "Europe/Malta", MALTA: "Europe/Malta",
  CY: "Asia/Nicosia", CYPRUS: "Asia/Nicosia",
  HR: "Europe/Zagreb", CROATIA: "Europe/Zagreb",
  EU: "Europe/Berlin",
};

export type PlItem = {
  id: string;
  minPct: number;
  maxPct: number;
  midPct: number;
  label?: string;
  coachingOver?: string;
  coachingUnder?: string;
};

export type PlCategory = {
  id: string;
  label?: string;
  minPct: number;
  maxPct: number;
  items: PlItem[];
};

export type PlSection = {
  id?: string;
  type: "income" | "cogs" | "expenses";
  categories: PlCategory[];
};

export type Statement = {
  values: Record<string, number>;
  totalIncome: number;
  totalCogs: number;
  grossProfit: number;
  totalExpenses: number;
  totalCosts: number;
  netIncome: number;
  profitMargin: number | null;
  hasAnyInput: boolean;
};

export type MonthFigures = {
  month: string;
  income: number;
  cogs: number;
  expenses: number;
  net: number;
  margin: number | null;
  currency: string | null;
};

export type PeriodChange = {
  delta: number;
  percent: number | null;
};

export type YearToDate = {
  income: number;
  cogs: number;
  expenses: number;
  net: number;
  margin: number | null;
  averageIncome: number | null;
  averageNet: number | null;
  included: string[];
  missing: string[];
  mixedCurrency: boolean;
};

export function toCents(amount: number): number {
  if (!Number.isFinite(amount) || Object.is(amount, -0)) return 0;
  const negative = amount < 0;
  const abs = Math.abs(amount);
  if (abs > MAX_MONEY) return (negative ? -1 : 1) * MAX_MONEY * 100;
  const [whole, frac = ""] = abs.toFixed(6).split(".");
  const hundredths = Number(frac.slice(0, 2));
  const next = Number(frac[2] || "0");
  let cents = Number(whole) * 100 + hundredths;
  if (next >= 5) cents += 1;
  return negative ? -cents : cents;
}

export function roundMoney(amount: number): number {
  return toCents(amount) / 100;
}

export function addMoney(a: number, b: number): number {
  return (toCents(a) + toCents(b)) / 100;
}

export function sumMoney(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + toCents(amount), 0) / 100;
}

export function averageMoney(total: number, count: number): number | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  return Math.round(toCents(total) / count) / 100;
}

export function currencyForCountry(country: string | null | undefined): string {
  if (!country) return "USD";
  const key = country.trim().replace(/\./g, "").replace(/\s+/g, " ").toUpperCase();
  return CURRENCY_BY_COUNTRY[key] || "USD";
}

export function extraTimeZone(country: string | null | undefined): string | null {
  if (!country) return null;
  const key = country.trim().replace(/\./g, "").replace(/\s+/g, " ").toUpperCase();
  return EXTRA_TIME_ZONES[key] || null;
}

export function formatMoney(amount: number, currency = "USD"): string {
  const rounded = roundMoney(amount);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);
  } catch {
    const sign = rounded < 0 ? "-" : "";
    return `${sign}${currency} ${Math.abs(rounded).toFixed(2)}`;
  }
}

export function formatCompactMoney(amount: number, currency = "USD"): string {
  const rounded = roundMoney(amount);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(rounded);
  } catch {
    return formatMoney(rounded, currency);
  }
}

export function currencyPrefix(currency = "USD"): string {
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value || currency;
  } catch {
    return currency;
  }
}

export function formatPercent(value: number | null, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatSignedMoney(amount: number, currency = "USD"): string {
  const rounded = roundMoney(amount);
  const formatted = formatMoney(Math.abs(rounded), currency);
  if (rounded > 0) return `+${formatted}`;
  if (rounded < 0) return `-${formatted.replace(/^-/, "")}`;
  return formatted;
}

export function moneyInputText(amount: number): string {
  if (!amount) return "";
  return roundMoney(amount).toFixed(2);
}

export function parseMoneyInput(raw: string): { ok: true; text: string; amount: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  const cleaned = trimmed.replace(/[\s$£€₹,]/g, "").replace(/[A-Za-z]/g, "");
  if (trimmed !== "" && !/\d/.test(trimmed) && cleaned !== "-" && cleaned !== "." && cleaned !== "-.") {
    return { ok: false, error: "Use a number with up to 2 decimal places." };
  }
  if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") {
    return { ok: true, text: cleaned, amount: 0 };
  }
  if (!/^-?\d*\.?\d{0,2}$/.test(cleaned)) {
    return { ok: false, error: "Use a number with up to 2 decimal places." };
  }
  const negative = cleaned.startsWith("-");
  const body = negative ? cleaned.slice(1) : cleaned;
  const [whole, frac = ""] = body.split(".");
  if ((whole || "").length > 15) return { ok: false, error: "That number is too large." };
  const cents = Number(whole || "0") * 100 + Number((frac + "00").slice(0, 2));
  if (!Number.isFinite(cents) || cents / 100 > MAX_MONEY) {
    return { ok: false, error: "That number is too large." };
  }
  return { ok: true, text: cleaned, amount: (negative ? -cents : cents) / 100 };
}

export function isMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthLabel(month: string): string {
  if (!isMonthKey(month)) return month;
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1;
  return `${MONTH_NAMES[index]} ${year}`;
}

export function shortMonthLabel(month: string): string {
  if (!isMonthKey(month)) return month;
  const index = Number(month.slice(5, 7)) - 1;
  return `${SHORT_MONTHS[index]} ${month.slice(2, 4)}`;
}

export function shiftMonth(month: string, delta: number): string {
  if (!isMonthKey(month) || !Number.isFinite(delta)) return month;
  const year = Number(month.slice(0, 4));
  const mon = Number(month.slice(5, 7));
  const index = year * 12 + (mon - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = index - nextYear * 12;
  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth + 1).padStart(2, "0")}`;
}

export function currentMonthInZone(timeZone: string, now = new Date()): string {
  const read = (zone: string) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
    }).formatToParts(now);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    if (!year || !month) return null;
    const key = `${year}-${month}`;
    return isMonthKey(key) ? key : null;
  };
  try {
    return read(timeZone) || read("UTC") || "1970-01";
  } catch {
    return read("UTC") || "1970-01";
  }
}

export function formatDateInZone(now: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      timeZone,
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" }).format(now);
  }
}

export function isContraIncome(id: string): boolean {
  return (CONTRA_INCOME_IDS as readonly string[]).includes(id);
}

export function normalizeAmount(id: string, amount: number): number {
  const rounded = roundMoney(amount);
  if (!Number.isFinite(rounded) || rounded === 0) return 0;
  if (isContraIncome(id) && rounded > 0) return -rounded;
  return rounded;
}

export function normalizeValues(values: Record<string, unknown> | null | undefined): Record<string, number> {
  if (!values) return {};
  const out: Record<string, number> = {};
  for (const [id, raw] of Object.entries(values)) {
    if (id.startsWith("__")) continue;
    const amount = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    if (!Number.isFinite(amount) || Math.abs(amount) > MAX_MONEY) continue;
    const normalized = normalizeAmount(id, amount);
    if (normalized !== 0) out[id] = normalized;
  }
  return out;
}

export function valuesMatch(a: Record<string, unknown> | null | undefined, b: Record<string, unknown> | null | undefined): boolean {
  const left = normalizeValues(a);
  const right = normalizeValues(b);
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if ((left[key] || 0) !== (right[key] || 0)) return false;
  }
  return true;
}

function sectionTotal(section: PlSection | undefined, values: Record<string, number>): number {
  if (!section) return 0;
  const cents = section.categories.reduce((sum, category) => {
    return sum + category.items.reduce((inner, item) => inner + toCents(values[item.id] || 0), 0);
  }, 0);
  return cents / 100;
}

export function buildStatement(raw: Record<string, unknown> | null | undefined, sections: PlSection[]): Statement {
  const values = normalizeValues(raw);
  const totalIncome = sectionTotal(sections.find((section) => section.type === "income"), values);
  const totalCogs = sectionTotal(sections.find((section) => section.type === "cogs"), values);
  const totalExpenses = sectionTotal(sections.find((section) => section.type === "expenses"), values);
  const grossProfit = (toCents(totalIncome) - toCents(totalCogs)) / 100;
  const netIncome = (toCents(grossProfit) - toCents(totalExpenses)) / 100;
  const totalCosts = (toCents(totalCogs) + toCents(totalExpenses)) / 100;
  const profitMargin = totalIncome > 0 ? (netIncome / totalIncome) * 100 : null;
  return {
    values,
    totalIncome,
    totalCogs,
    grossProfit,
    totalExpenses,
    totalCosts,
    netIncome,
    profitMargin,
    hasAnyInput: Object.keys(values).length > 0,
  };
}

export function linePercent(value: number, income: number): number {
  if (!(income > 0) || !Number.isFinite(value)) return 0;
  return (value / income) * 100;
}

export type BenchmarkTone = "good" | "close" | "bad";

export function benchmarkTone(pct: number, minPct: number, maxPct: number): BenchmarkTone {
  if (!Number.isFinite(pct)) return "bad";
  if (pct >= minPct && pct <= maxPct) return "good";
  const distMin = Math.abs(pct - minPct);
  const distMax = Math.abs(pct - maxPct);
  if ((pct < minPct && distMin <= 2) || (pct > maxPct && distMax <= 2)) return "close";
  return "bad";
}

export function healthScore(statement: Statement, sections: PlSection[]): number {
  if (!statement.hasAnyInput || statement.totalIncome <= 0) return 0;
  const margin = statement.profitMargin ?? 0;
  let profitPts = 5;
  if (margin >= 40) profitPts = 40;
  else if (margin >= 35) profitPts = 35;
  else if (margin >= 30) profitPts = 28;
  else if (margin >= 25) profitPts = 20;
  else if (margin >= 20) profitPts = 12;

  const expenseSection = sections.find((section) => section.type === "expenses");
  let withinBenchmark = 0;
  let totalCats = 0;
  for (const category of expenseSection?.categories || []) {
    const catTotal = category.items.reduce((sum, item) => sum + Math.abs(statement.values[item.id] || 0), 0);
    if (catTotal > 0) {
      totalCats += 1;
      const catPct = (catTotal / statement.totalIncome) * 100;
      if (catPct >= category.minPct && catPct <= category.maxPct) withinBenchmark += 1;
    }
  }
  const expRatio = totalCats > 0 ? withinBenchmark / totalCats : 0;
  let expPts = 5;
  if (expRatio >= 1) expPts = 30;
  else if (expRatio >= 0.8) expPts = 24;
  else if (expRatio >= 0.6) expPts = 18;
  else if (expRatio >= 0.4) expPts = 12;

  const revPts = (statement.values["4035"] || 0) > 0 ? 15 : 10;
  const cogsPct = (statement.totalCogs / statement.totalIncome) * 100;
  let cogsPts = 5;
  if (cogsPct < 8) cogsPts = 15;
  else if (cogsPct < 12) cogsPts = 10;

  return profitPts + expPts + revPts + cogsPts;
}

export type GapRow = {
  category: PlCategory;
  catTotal: number;
  catPct: number;
  gap: number;
};

export function gapAnalysis(statement: Statement, sections: PlSection[]): GapRow[] {
  if (!(statement.totalIncome > 0)) return [];
  const expenseSection = sections.find((section) => section.type === "expenses");
  const rows: GapRow[] = [];
  for (const category of expenseSection?.categories || []) {
    const catTotal = category.items.reduce((sum, item) => addMoney(sum, statement.values[item.id] || 0), 0);
    if (catTotal <= 0) continue;
    const catPct = (catTotal / statement.totalIncome) * 100;
    rows.push({ category, catTotal, catPct, gap: catPct - category.maxPct });
  }
  return rows.sort((a, b) => b.gap - a.gap);
}

export type ProblemRow = { item: PlItem; actualPct: number; gapDollar: number };
export type WinRow = { item: PlItem; actualPct: number; savings: number };

function watchedItems(sections: PlSection[], kinds: Array<PlSection["type"]>): PlItem[] {
  return sections
    .filter((section) => kinds.includes(section.type))
    .flatMap((section) => section.categories.flatMap((category) => category.items));
}

export function topProblems(statement: Statement, sections: PlSection[]): ProblemRow[] {
  if (!(statement.totalIncome > 0)) return [];
  const problems: ProblemRow[] = [];
  for (const item of watchedItems(sections, ["expenses", "cogs"])) {
    const value = statement.values[item.id] || 0;
    if (value <= 0 || item.maxPct <= 0) continue;
    const actualPct = (value / statement.totalIncome) * 100;
    if (actualPct > item.maxPct) {
      const gapDollar = (toCents(value) - toCents((item.midPct / 100) * statement.totalIncome)) / 100;
      problems.push({ item, actualPct, gapDollar });
    }
  }
  return problems.sort((a, b) => b.gapDollar - a.gapDollar).slice(0, 3);
}

export function quickWins(statement: Statement, sections: PlSection[]): WinRow[] {
  if (!(statement.totalIncome > 0)) return [];
  const wins: WinRow[] = [];
  for (const item of watchedItems(sections, ["expenses"])) {
    const value = statement.values[item.id] || 0;
    if (value <= 0 || item.maxPct <= 0) continue;
    const actualPct = (value / statement.totalIncome) * 100;
    if (actualPct > item.maxPct) {
      const savings = (toCents(value) - toCents((item.midPct / 100) * statement.totalIncome)) / 100;
      if (savings > 0) wins.push({ item, actualPct, savings });
    }
  }
  return wins.sort((a, b) => b.savings - a.savings).slice(0, 5);
}

export function coachingText(item: PlItem, value: number, income: number): string | null {
  if (value === 0 || !(income > 0)) return null;
  const pct = (value / income) * 100;
  const label = `${Math.abs(pct).toFixed(1)}%`;
  if (item.maxPct <= 0) {
    if (pct < item.minPct && item.coachingOver) return item.coachingOver.replace("[X]", label);
    return null;
  }
  if (pct > item.maxPct && item.coachingOver) return item.coachingOver.replace("[X]", label);
  if (pct < item.minPct && item.minPct > 0 && item.coachingUnder) return item.coachingUnder.replace("[X]", label);
  return null;
}

export function coachingNote(margin: number | null, bands: Array<{ minPct: number; maxPct: number; note: string }>): string | null {
  if (margin == null || !Number.isFinite(margin) || bands.length === 0) return null;
  const hit = bands.find((band) => margin >= band.minPct && margin < band.maxPct);
  if (hit) return hit.note;
  if (margin < bands[0].minPct) return bands[0].note;
  return bands[bands.length - 1].note;
}

export function periodChange(current: number, previous: number): PeriodChange {
  const delta = (toCents(current) - toCents(previous)) / 100;
  if (previous === 0) return { delta, percent: current === 0 ? 0 : null };
  return { delta, percent: (delta / Math.abs(previous)) * 100 };
}

export type StoredSnapshot = {
  month: string;
  expenses: Record<string, number> | null;
  collections_cents: number;
  profit_margin: number;
  currency?: string | null;
};

export function snapshotFields(month: string, statement: Statement, currency: string) {
  return {
    month,
    expenses: statement.values,
    collections_cents: toCents(statement.totalIncome),
    profit_margin: statement.profitMargin == null ? 0 : Math.round(statement.profitMargin * 10000) / 10000,
    net_income_cents: toCents(statement.netIncome),
    currency,
  };
}

export function figuresFromStatement(month: string, statement: Statement, currency: string | null): MonthFigures {
  return {
    month,
    income: statement.totalIncome,
    cogs: statement.totalCogs,
    expenses: statement.totalExpenses,
    net: statement.netIncome,
    margin: statement.profitMargin,
    currency,
  };
}

function knownIds(sections: PlSection[]): Set<string> {
  return new Set(sections.flatMap((section) => section.categories.flatMap((category) => category.items.map((item) => item.id))));
}

export function figuresFromSnapshot(snapshot: StoredSnapshot, sections: PlSection[]): MonthFigures {
  const expenses = snapshot.expenses || {};
  const ids = knownIds(sections);
  const hasLines = Object.keys(expenses).some((key) => ids.has(key));
  if (hasLines) {
    return figuresFromStatement(snapshot.month, buildStatement(expenses, sections), snapshot.currency || null);
  }
  const income = roundMoney((Number(snapshot.collections_cents) || 0) / 100);
  const margin = Number(snapshot.profit_margin);
  const net = income > 0 && Number.isFinite(margin) ? roundMoney((margin / 100) * income) : 0;
  const costs = (toCents(income) - toCents(net)) / 100;
  return {
    month: snapshot.month,
    income,
    cogs: 0,
    expenses: costs,
    net,
    margin: income > 0 && Number.isFinite(margin) ? margin : null,
    currency: snapshot.currency || null,
  };
}

export function recentSnapshots<T extends { month: string }>(rows: T[], limit = 120): T[] {
  return [...rows].sort((a, b) => b.month.localeCompare(a.month)).slice(0, limit).sort((a, b) => a.month.localeCompare(b.month));
}

export function yearToDate(selectedMonth: string, saved: MonthFigures[], live: MonthFigures): YearToDate {
  const empty: YearToDate = {
    income: 0, cogs: 0, expenses: 0, net: 0, margin: null,
    averageIncome: null, averageNet: null, included: [], missing: [], mixedCurrency: false,
  };
  if (!isMonthKey(selectedMonth)) return empty;
  const year = selectedMonth.slice(0, 4);
  const end = Number(selectedMonth.slice(5, 7));
  const byMonth = new Map(saved.map((row) => [row.month, row]));
  const parts: MonthFigures[] = [];
  const included: string[] = [];
  const missing: string[] = [];
  for (let month = 1; month <= end; month += 1) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const source = key === live.month ? live : byMonth.get(key);
    const hasNumbers = source && (source.income !== 0 || source.cogs !== 0 || source.expenses !== 0 || source.net !== 0);
    if (source && hasNumbers) {
      parts.push(source);
      included.push(key);
    } else {
      missing.push(key);
    }
  }
  const currencies = new Set(parts.map((part) => part.currency || live.currency || "USD"));
  if (currencies.size > 1) {
    return { ...empty, included, missing, mixedCurrency: true };
  }
  const income = sumMoney(parts.map((part) => part.income));
  const cogs = sumMoney(parts.map((part) => part.cogs));
  const expenses = sumMoney(parts.map((part) => part.expenses));
  const net = sumMoney(parts.map((part) => part.net));
  return {
    income,
    cogs,
    expenses,
    net,
    margin: income > 0 ? (net / income) * 100 : null,
    averageIncome: averageMoney(income, included.length),
    averageNet: averageMoney(net, included.length),
    included,
    missing,
    mixedCurrency: false,
  };
}

export type Comparison = {
  month: string;
  income: PeriodChange;
  net: PeriodChange;
  marginPoints: number | null;
};

export function compareToSaved(live: MonthFigures, saved: MonthFigures[], month: string): Comparison | null {
  const prior = saved.find((row) => row.month === month);
  if (!prior) return null;
  return {
    month,
    income: periodChange(live.income, prior.income),
    net: periodChange(live.net, prior.net),
    marginPoints: live.margin != null && prior.margin != null ? live.margin - prior.margin : null,
  };
}

export function categorySeries(
  snapshots: StoredSnapshot[],
  sections: PlSection[],
): Array<{ category: PlCategory; pcts: number[]; trend: number }> {
  const ordered = recentSnapshots(snapshots);
  if (ordered.length < 2) return [];
  const expenseSection = sections.find((section) => section.type === "expenses");
  return (expenseSection?.categories || [])
    .map((category) => {
      const pcts = ordered.map((snapshot) => {
        const figures = figuresFromSnapshot(snapshot, sections);
        const total = category.items.reduce((sum, item) => addMoney(sum, (snapshot.expenses || {})[item.id] || 0), 0);
        return linePercent(total, figures.income);
      });
      const first = pcts[0] || 0;
      const last = pcts[pcts.length - 1] || 0;
      return { category, pcts, trend: last - first };
    })
    .filter((row) => row.pcts.some((pct) => pct !== 0));
}

export function allowedLineIds(sections: PlSection[]): Set<string> {
  return knownIds(sections);
}

export function sanitizeLineValues(input: unknown, allowed: Set<string>): Record<string, number> {
  if (!input || typeof input !== "object") return {};
  const raw: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (allowed.has(key)) raw[key] = value;
  }
  return normalizeValues(raw);
}
