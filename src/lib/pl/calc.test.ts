import assert from "node:assert/strict";
import test from "node:test";
import { PL_SECTIONS, PROFIT_COACHING, SCALING_EXAMPLES } from "../../app/(doctor)/doctor/pl-analyzer/pl-data.ts";
import {
  averageMoney,
  buildStatement,
  categorySeries,
  coachingNote,
  coachingText,
  compareToSaved,
  currencyForCountry,
  currentMonthInZone,
  figuresFromSnapshot,
  figuresFromStatement,
  formatMoney,
  gapAnalysis,
  healthScore,
  monthLabel,
  normalizeAmount,
  parseMoneyInput,
  periodChange,
  recentSnapshots,
  roundMoney,
  shiftMonth,
  topProblems,
  toCents,
  valuesMatch,
  yearToDate,
} from "./calc.ts";

const sections = PL_SECTIONS;

test("rounds money to cents, including the 1.005 case", () => {
  assert.equal(roundMoney(1.005), 1.01);
  assert.equal(roundMoney(2.675), 2.68);
  assert.equal(roundMoney(-1.005), -1.01);
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
  assert.equal(roundMoney(Number.NaN), 0);
  assert.equal(roundMoney(Number.POSITIVE_INFINITY), 0);
  assert.equal(roundMoney(0), 0);
  assert.equal(roundMoney(-0), 0);
  assert.equal(toCents(10.1) + toCents(10.2), 2030);
});

test("parses typed money and rejects bad input", () => {
  assert.deepEqual(parseMoneyInput("1,234.56"), { ok: true, text: "1234.56", amount: 1234.56 });
  assert.deepEqual(parseMoneyInput("-12.5"), { ok: true, text: "-12.5", amount: -12.5 });
  assert.deepEqual(parseMoneyInput(""), { ok: true, text: "", amount: 0 });
  assert.equal(parseMoneyInput("12.345").ok, false);
  assert.equal(parseMoneyInput("abc").ok, false);
  assert.equal(parseMoneyInput("1000000000001").ok, false);
});

test("refunds and sales tax reduce income when entered as positive numbers", () => {
  assert.equal(normalizeAmount("4500", 300), -300);
  assert.equal(normalizeAmount("4500", -300), -300);
  assert.equal(normalizeAmount("4020", 300), 300);
  const statement = buildStatement({ "4020": 1000, "4500": 100, "5010": 50, "6110": 200 }, sections);
  assert.equal(statement.totalIncome, 900);
  assert.equal(statement.totalCogs, 50);
  assert.equal(statement.grossProfit, 850);
  assert.equal(statement.totalExpenses, 200);
  assert.equal(statement.netIncome, 650);
  assert.equal(statement.totalCosts, 250);
  assert.ok(statement.profitMargin != null && Math.abs(statement.profitMargin - (650 / 900) * 100) < 0.0001);
});

test("zero income does not divide and does not pretend the margin is zero", () => {
  const statement = buildStatement({ "6110": 500 }, sections);
  assert.equal(statement.totalIncome, 0);
  assert.equal(statement.netIncome, -500);
  assert.equal(statement.profitMargin, null);
  assert.equal(gapAnalysis(statement, sections).length, 0);
  assert.equal(topProblems(statement, sections).length, 0);
  assert.equal(healthScore(statement, sections), 0);
  assert.equal(buildStatement({}, sections).hasAnyInput, false);
});

test("negative net profit stays negative and very large inputs are ignored", () => {
  const statement = buildStatement({ "4020": 100, "6110": 250.129 }, sections);
  assert.equal(statement.netIncome, -150.13);
  assert.ok((statement.profitMargin || 0) < 0);
  const huge = buildStatement({ "4020": 1e15 }, sections);
  assert.equal(huge.totalIncome, 0);
});

test("month names and shifts ignore UTC and leap-day traps", () => {
  assert.equal(monthLabel("2024-02"), "February 2024");
  assert.equal(shiftMonth("2026-03", -1), "2026-02");
  assert.equal(shiftMonth("2026-03", 1), "2026-04");
  assert.equal(shiftMonth("2024-02", 1), "2024-03");
  assert.equal(shiftMonth("2024-02", -1), "2024-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("nope", 1), "nope");
});

test("a clinic's current month is the local month, not the UTC month", () => {
  assert.equal(currentMonthInZone("Australia/Sydney", new Date("2026-02-28T14:00:00Z")), "2026-03");
  assert.equal(currentMonthInZone("America/Los_Angeles", new Date("2026-03-01T06:00:00Z")), "2026-02");
  assert.equal(currentMonthInZone("America/New_York", new Date("2024-02-29T15:00:00Z")), "2024-02");
  assert.equal(currentMonthInZone("Pacific/Auckland", new Date("2024-02-29T11:30:00Z")), "2024-03");
  assert.equal(currentMonthInZone("Asia/Dubai", new Date("2026-04-30T21:00:00Z")), "2026-05");
  assert.equal(currentMonthInZone("Asia/Kolkata", new Date("2026-12-31T18:30:00Z")), "2027-01");
  assert.equal(currentMonthInZone("Europe/Dublin", new Date("2026-03-29T00:30:00Z")), "2026-03");
  assert.equal(currentMonthInZone("Not/AZone", new Date("2026-06-15T12:00:00Z")), "2026-06");
});

test("currency follows the doctor's country", () => {
  assert.equal(currencyForCountry("US"), "USD");
  assert.equal(currencyForCountry("Canada"), "CAD");
  assert.equal(currencyForCountry("GB"), "GBP");
  assert.equal(currencyForCountry("Australia"), "AUD");
  assert.equal(currencyForCountry("NZ"), "NZD");
  assert.equal(currencyForCountry("Ireland"), "EUR");
  assert.equal(currencyForCountry("Germany"), "EUR");
  assert.equal(currencyForCountry("UAE"), "AED");
  assert.equal(currencyForCountry("India"), "INR");
  assert.equal(currencyForCountry(null), "USD");
  assert.equal(currencyForCountry("Atlantis"), "USD");
  assert.match(formatMoney(1234.5, "AUD"), /1,234\.50/);
  assert.match(formatMoney(-20, "GBP"), /20\.00/);
  assert.match(formatMoney(10, "EUR"), /10\.00/);
});

test("saved months keep the newest history and costs come from the line items", () => {
  const rows = [
    { month: "2024-01" },
    { month: "2026-03" },
    { month: "2025-06" },
  ];
  assert.deepEqual(recentSnapshots(rows, 2).map((row) => row.month), ["2025-06", "2026-03"]);

  const snapshot = {
    month: "2026-03",
    expenses: { "4020": 10000, "5010": 1000, "6110": 4000 },
    collections_cents: 999999,
    profit_margin: 1,
    currency: "CAD",
  };
  const figures = figuresFromSnapshot(snapshot, sections);
  assert.equal(figures.income, 10000);
  assert.equal(figures.cogs, 1000);
  assert.equal(figures.expenses, 4000);
  assert.equal(figures.net, 5000);
  assert.equal(figures.cogs + figures.expenses, 5000);

  const legacy = figuresFromSnapshot({
    month: "2025-01",
    expenses: {},
    collections_cents: 10000,
    profit_margin: 25,
  }, sections);
  assert.equal(legacy.income, 100);
  assert.equal(legacy.net, 25);
  assert.equal(legacy.expenses, 75);
});

test("year to date, averages, and comparisons skip missing months and mixed currencies", () => {
  const march = figuresFromStatement("2026-03", buildStatement({ "4020": 300, "6110": 100 }, sections), "USD");
  const saved = [
    figuresFromStatement("2026-01", buildStatement({ "4020": 100, "6110": 40 }, sections), "USD"),
    figuresFromStatement("2025-03", buildStatement({ "4020": 200, "6110": 80 }, sections), "USD"),
  ];
  const ytd = yearToDate("2026-03", saved, march);
  assert.deepEqual(ytd.included, ["2026-01", "2026-03"]);
  assert.deepEqual(ytd.missing, ["2026-02"]);
  assert.equal(ytd.income, 400);
  assert.equal(ytd.expenses, 140);
  assert.equal(ytd.net, 260);
  assert.equal(ytd.averageIncome, 200);
  assert.equal(ytd.averageNet, 130);
  assert.equal(ytd.mixedCurrency, false);

  const mixed = yearToDate("2026-03", [
    figuresFromStatement("2026-01", buildStatement({ "4020": 100 }, sections), "EUR"),
  ], march);
  assert.equal(mixed.mixedCurrency, true);
  assert.equal(mixed.income, 0);

  const mom = compareToSaved(march, saved, "2026-02");
  assert.equal(mom, null);
  const yoy = compareToSaved(march, saved, "2025-03");
  assert.ok(yoy);
  assert.equal(yoy?.income.delta, 100);
  assert.equal(yoy?.income.percent, 50);
  assert.equal(periodChange(50, 0).percent, null);
  assert.equal(periodChange(-50, -100).percent, 50);
  assert.equal(averageMoney(10, 0), null);
  assert.equal(averageMoney(10, 3), 3.33);
});

test("example practices produce a finite statement and refund coaching", () => {
  for (const example of SCALING_EXAMPLES) {
    const statement = buildStatement(example.lineItems, sections);
    assert.equal(statement.hasAnyInput, true);
    assert.ok(statement.totalIncome > 0);
    assert.ok(statement.profitMargin != null && Number.isFinite(statement.profitMargin));
    assert.ok(healthScore(statement, sections) >= 0 && healthScore(statement, sections) <= 100);
    assert.equal(valuesMatch(example.lineItems, statement.values), true);
  }
  const refund = sections.flatMap((section) => section.categories.flatMap((category) => category.items)).find((item) => item.id === "4500");
  assert.ok(refund);
  const text = coachingText(refund!, -80, 1000);
  assert.match(text || "", /8\.0%/);
  assert.ok((coachingNote(-4, PROFIT_COACHING) || "").length > 0);
  assert.equal(coachingNote(null, PROFIT_COACHING), null);
  assert.equal(coachingNote(60, PROFIT_COACHING)?.includes("55%") || coachingNote(60, PROFIT_COACHING)?.includes("remarkable"), true);
});

test("category trends do not explode when a saved month has no income", () => {
  const series = categorySeries([
    { month: "2026-01", expenses: { "6110": 100 }, collections_cents: 0, profit_margin: 0 },
    { month: "2026-02", expenses: { "4020": 1000, "6110": 100 }, collections_cents: 0, profit_margin: 0 },
  ], sections);
  const marketing = series.find((row) => row.category.items.some((item) => item.id === "6110"));
  assert.ok(marketing);
  assert.ok(marketing?.pcts.every((pct) => Number.isFinite(pct)));
  assert.equal(marketing?.pcts[0], 0);
});
