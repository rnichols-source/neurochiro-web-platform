import test from "node:test";
import assert from "node:assert/strict";
import { billingNavSubtitle, billingView } from "./billing-view.ts";

const founding = { tier: "pro" as const, source: "founding" as const, isFounder: true };
const paying = { tier: "pro" as const, source: "stripe" as const, isFounder: false };
const free = { tier: "free" as const, source: "none" as const, isFounder: false };

test("billingView distinguishes included, stripe, free and errors", () => {
  assert.equal(billingView(founding, { noCustomer: true }), "included");
  assert.equal(billingView(founding, { noCustomer: false }), "included_with_stripe");
  assert.equal(billingView(paying, {}), "stripe");
  assert.equal(billingView(free, { noCustomer: true }), "free");
  assert.equal(billingView(paying, { error: "down" }), "error");
  assert.equal(billingView(paying, null), "error");
});

test("billing nav subtitle follows the customer", () => {
  assert.equal(billingNavSubtitle({ ...founding, hasStripeCustomer: false }), "Your plan");
  assert.equal(billingNavSubtitle({ ...founding, hasStripeCustomer: true }), "Your plan, invoices, payment method");
  assert.equal(billingNavSubtitle({ ...free, hasStripeCustomer: false }), "Upgrade to Pro");
  assert.equal(billingNavSubtitle({ ...paying, hasStripeCustomer: true }), "Your plan, invoices, payment method");
});
