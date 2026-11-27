import test from "node:test";
import assert from "node:assert/strict";
import { billingNavSubtitle, billingPlan, billingView } from "./billing-view.ts";

const founding = { tier: "pro" as const, source: "founding" as const, isFounder: true };
const paying = { tier: "pro" as const, source: "stripe" as const, isFounder: false };
const comped = { tier: "pro" as const, source: "comped" as const, isFounder: false };
const free = { tier: "free" as const, source: "none" as const, isFounder: false };

const sub = (overrides: Record<string, unknown> = {}) => ({
  status: "active",
  price: 99,
  currency: "usd",
  interval: "month",
  intervalCount: 1,
  cancelAtPeriodEnd: false,
  nextBilling: "Dec 21, 2026",
  ...overrides,
});

test("billingView distinguishes included, stripe, free and errors", () => {
  assert.equal(billingView(founding, { noCustomer: true }), "included");
  assert.equal(billingView(founding, { noCustomer: false }), "included_with_stripe");
  assert.equal(billingView(paying, { subscription: sub() }), "stripe");
  assert.equal(billingView(free, { noCustomer: true }), "free");
  assert.equal(billingView(paying, { error: "down" }), "error");
  assert.equal(billingView(paying, null), "error");
});

test("a live Stripe subscription wins over a comped or founding flag", () => {
  assert.equal(billingView(comped, { subscription: sub() }), "stripe");
  assert.equal(billingView(founding, { subscription: sub({ price: 39 }) }), "stripe");
  assert.equal(billingView(paying, { subscription: sub({ status: "past_due" }) }), "stripe");
});

test("Pro with no live subscription is included, which is how comped members show", () => {
  assert.equal(billingView(comped, { noCustomer: true }), "included");
  assert.equal(billingView(comped, { subscription: null }), "included_with_stripe");
  assert.equal(billingView(paying, { subscription: sub({ status: "canceled" }) }), "included_with_stripe");
  assert.equal(billingView(paying, { subscription: null }), "included_with_stripe");
  assert.equal(billingView(free, { subscription: sub({ status: "canceled" }) }), "free");
});

test("billingPlan shows the real Stripe price, status and date", () => {
  const regular = billingPlan(paying, { subscription: sub() });
  assert.deepEqual(regular, {
    view: "stripe",
    planName: "Pro",
    priceLabel: "$99/mo",
    statusLabel: "Active",
    statusTone: "booked",
    dateLabel: "Renews Dec 21, 2026",
  });

  const foundingMonthly = billingPlan(founding, { subscription: sub({ price: 39 }) });
  assert.equal(foundingMonthly.planName, "Founding member");
  assert.equal(foundingMonthly.priceLabel, "$39/mo");

  const foundingYear = billingPlan(founding, { subscription: sub({ price: 397, interval: "month", intervalCount: 12, nextBilling: "Nov 27, 2027" }) });
  assert.equal(foundingYear.priceLabel, "$397/yr");
  assert.equal(foundingYear.dateLabel, "Renews Nov 27, 2027");

  const uk = billingPlan(paying, { subscription: sub({ price: 79, currency: "gbp" }) });
  assert.equal(uk.priceLabel, "£79/mo");

  const pastDue = billingPlan(paying, { subscription: sub({ status: "past_due" }) });
  assert.equal(pastDue.statusLabel, "Past due");
  assert.equal(pastDue.statusTone, "follow");

  const ending = billingPlan(founding, { subscription: sub({ price: 397, intervalCount: 12, cancelAtPeriodEnd: true, nextBilling: "Nov 30, 2026" }) });
  assert.equal(ending.dateLabel, "Ends Nov 30, 2026");

  const noDate = billingPlan(paying, { subscription: sub({ nextBilling: "---" }) });
  assert.equal(noDate.dateLabel, null);
});

test("billingPlan for comped and free members has no price or status", () => {
  const c = billingPlan(comped, { noCustomer: true });
  assert.equal(c.view, "included");
  assert.equal(c.planName, "Pro");
  assert.equal(c.priceLabel, null);
  assert.equal(c.statusLabel, null);
  assert.equal(billingPlan(founding, { noCustomer: true }).planName, "Founding member");
  assert.equal(billingPlan(free, { noCustomer: true }).planName, "Free");
});

test("billing nav subtitle follows the customer", () => {
  assert.equal(billingNavSubtitle({ ...founding, hasStripeCustomer: false }), "Your plan");
  assert.equal(billingNavSubtitle({ ...founding, hasStripeCustomer: true }), "Your plan, invoices, payment method");
  assert.equal(billingNavSubtitle({ ...free, hasStripeCustomer: false }), "Upgrade to Pro");
  assert.equal(billingNavSubtitle({ ...paying, hasStripeCustomer: true }), "Your plan, invoices, payment method");
});
