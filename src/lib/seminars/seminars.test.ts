import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSeminarDates, timezoneForCity, isUpcoming, zonedIso } from "./dates.ts";
import { seminarSlug } from "./slug.ts";
import { formatMoney, formatSeminarAddress, formatSeminarLocation, priceLabel, seatsLeftLabel, seminarMetaTitle } from "./format.ts";
import { normalizeAgenda } from "./agenda.ts";
import { resolveSeminarHost } from "./host.ts";
import { resolveSeminarCoordinates } from "./geo.ts";
import { appendUtm, memberTicketPrice, seatsAvailable } from "./utm.ts";
import { fulfillSeminarSession, releaseSeminarHold, refundSeminarCharge, type SeminarStore } from "./fulfill.ts";
import { buildTicketCheckoutSession } from "./checkout-params.ts";
import { buildIcs } from "./ics.ts";

describe("seminar dates", () => {
  it("parses the live date strings", () => {
    assert.deepEqual(parseSeminarDates("May 29 – May 30, 2026"), { start: "2026-05-29", end: "2026-05-30", year: "2026" });
    assert.deepEqual(parseSeminarDates("June 6-7, 2026"), { start: "2026-06-06", end: "2026-06-07", year: "2026" });
    assert.equal(parseSeminarDates("November 6-7, 2026")?.start, "2026-11-06");
    assert.equal(parseSeminarDates("May 14, 2026")?.end, "2026-05-14");
    assert.equal(parseSeminarDates("February 31, 2026"), null);
  });

  it("treats parsed end dates as the upcoming boundary", () => {
    const now = Date.parse("2026-10-30T12:00:00Z");
    assert.equal(isUpcoming("2026-11-07", false, now), true);
    assert.equal(isUpcoming("2026-10-25", false, now), false);
    assert.equal(timezoneForCity("Davenport"), "America/Chicago");
    assert.equal(timezoneForCity("Perth", "AU"), "Australia/Perth");
  });

  it("formats a zoned timestamp", () => {
    assert.equal(zonedIso("2026-11-06", "09:00", "America/New_York"), "2026-11-06T09:00:00-05:00");
    assert.equal(zonedIso("2026-06-06", "09:00", "Australia/Adelaide"), "2026-06-06T09:00:00+09:30");
  });
});

describe("slugs and prices", () => {
  it("builds the live slugs", () => {
    assert.equal(seminarSlug("The IN8 Summit 2026 — Perth", "Perth", "2026"), "the-in8-summit-2026-perth");
    assert.equal(seminarSlug("The Brave Practice Event", "Fort Lauderdale", "2026"), "the-brave-practice-event-fort-lauderdale-2026");
    assert.equal(seminarSlug("MLS ONE | CATALYST — Atlanta, GA", "Atlanta", "2026"), "mls-one-catalyst-atlanta-ga-2026");
  });

  it("shows A$ and never a fake Free", () => {
    assert.match(formatMoney(395, "AUD"), /A\$|AUD/);
    assert.equal(priceLabel({ price: 0, country: "AU" }), "See pricing");
    assert.equal(priceLabel({ price: 0, priceFrom: 0, tickets: [{ price: 0 }] }), "Free");
    assert.equal(priceLabel({ price: 379, currency: "USD" }), "from $379");
  });

  it("counts seats and member prices", () => {
    assert.equal(seatsAvailable({ capacity: 10, sold: 8, pendingHolds: 1 }), 1);
    assert.equal(seatsAvailable({ capacity: null, sold: 1, pendingHolds: 0 }), null);
    assert.equal(seatsLeftLabel(10, 8), null);
    assert.equal(seatsLeftLabel(10, 9), "1 seats left");
    const member = memberTicketPrice({ price: 100, isMember: true, discountPct: 10 });
    assert.equal(member.amount, 90);
    assert.equal(member.memberDiscountApplied, true);
  });

  it("appends utm without dropping existing params", () => {
    const url = appendUtm("https://example.com/register?ref=1", "the-brave-practice-event-fort-lauderdale-2026");
    assert.match(url, /utm_source=neurochiro/);
    assert.match(url, /utm_medium=seminar/);
    assert.match(url, /ref=1/);
    assert.throws(() => appendUtm("http://example.com", "x"));
  });
});

describe("checkout and webhook", () => {
  it("omits payment method types and tax", () => {
    const params = buildTicketCheckoutSession({
      slug: "demo",
      title: "Demo",
      ticketName: "General",
      currency: "usd",
      unitAmountCents: 1000,
      email: "a@b.co",
      registrationId: "reg",
      seminarId: "sem",
      now: Date.parse("2026-10-30T00:00:00Z"),
    });
    assert.equal("payment_method_types" in params, false);
    assert.equal("automatic_tax" in params, false);
    assert.equal(params.metadata.type, "seminar_ticket");
    assert.equal(params.line_items[0].price_data.unit_amount, 1000);
  });

  it("marks a ticket paid once", async () => {
    let sold = 0;
    let status = "pending";
    const store: SeminarStore = {
      async markPaid() {
        if (status === "paid") return "already";
        status = "paid";
        return "paid";
      },
      async incrementSold() { sold += 1; },
      async enqueueReminders() {},
      async cancelPending() { status = "cancelled"; },
      async markRefunded() {
        if (status === "refunded") return "already";
        status = "refunded";
        sold -= 1;
        return "refunded";
      },
      async savePackage() {},
      async saveFeatured() {},
      async expirePackage() {},
    };
    const session = { id: "cs_1", payment_status: "paid", amount_total: 1000, currency: "usd", metadata: { type: "seminar_ticket", registration_id: "reg", seminar_id: "sem" } };
    assert.equal((await fulfillSeminarSession(store, session)).result, "paid");
    assert.equal((await fulfillSeminarSession(store, session)).result, "already");
    assert.equal(sold, 1);
    await releaseSeminarHold(store, { id: "cs_1", metadata: { type: "seminar_ticket", registration_id: "reg" } });
    assert.equal(await refundSeminarCharge(store, "pi_1"), "refunded");
    assert.equal(await refundSeminarCharge(store, "pi_1"), "already");
  });
});

describe("calendar", () => {
  it("includes the timezone id", () => {
    const ics = buildIcs({
      slug: "the-brave-practice-event-fort-lauderdale-2026",
      title: "The Brave Practice Event",
      startDate: "2026-11-06",
      endDate: "2026-11-07",
      timeZone: "America/New_York",
      city: "Fort Lauderdale",
      venueName: null,
      venueAddress: null,
      location: null,
      description: "Two days",
    });
    assert.match(ics, /DTSTART;TZID=America\/New_York:20261106T090000/);
    assert.match(ics, /DTEND;TZID=America\/New_York:20261107T170000/);
    assert.match(ics, /LOCATION:Fort Lauderdale/);
    assert.doesNotMatch(ics, /Fort Lauderdale, Fort Lauderdale/);
  });
});

describe("locations", () => {
  it("drops repeated city and country tokens", () => {
    assert.equal(formatSeminarLocation({
      city: "Davenport",
      location: "Davenport, IA",
      country: "United States",
    }), "Davenport, IA");
    assert.equal(formatSeminarAddress({
      city: "Fort Lauderdale",
      location: "Fort Lauderdale, FL",
      country: "United States",
      venueAddress: "Fort Lauderdale, FL",
    }), "Fort Lauderdale, FL");
    assert.equal(formatSeminarAddress({
      city: "Fort Lauderdale",
      location: "Fort Lauderdale, FL",
      country: "United States",
      venueName: "Westin Fort Lauderdale Beach Resort",
      venueAddress: "Fort Lauderdale",
    }), "Westin Fort Lauderdale Beach Resort, Fort Lauderdale, FL");
    assert.equal(seminarMetaTitle("MLS ONE | CATALYST — Davenport, IA", "Davenport, IA", "Nov 21–22, 2026"), "MLS ONE | CATALYST — Davenport, IA — Nov 21–22, 2026 | NeuroChiro Seminars");
  });
});

describe("agenda", () => {
  it("renders nested item titles and keeps real pre days", () => {
    const agenda = normalizeAgenda([
      { day: "November 4, 2026", items: [{ time: "4:00 PM", title: "Check-in", description: "Registration opens" }] },
      { day: "November 5, 2026", items: [{ time: "9:00 AM", title: "Vendor setup" }] },
      { day: "November 6, 2026", items: [{ time: "8:30 AM", title: "Adjusting intensive" }] },
      { day: "Empty", items: [{ time: "", title: "Session" }] },
    ]);
    const titles = agenda.flatMap((day) => day.items.map((item) => item.title));
    assert.deepEqual(titles, ["Check-in", "Vendor setup", "Adjusting intensive"]);
    assert.equal(titles.includes("Session"), false);
    assert.equal(agenda[0].label, "November 4, 2026");
  });
});

describe("host attribution", () => {
  it("shows the instructor instead of the admin host", () => {
    const credit = resolveSeminarHost({
      hosts: null,
      instructorName: "Dr. Wade Port, Jim Deegan D.C. & MLS Staff",
      hostDoctor: { slug: "raymond-nichols", first_name: "Raymond", last_name: "Nichols", photo_url: null, clinic_name: "NeuroChiro" },
    });
    assert.equal(credit.name, "Dr. Wade Port, Jim Deegan D.C. & MLS Staff");
    assert.equal(credit.verified, false);
    assert.equal(credit.profileSlug, null);
  });

  it("credits an external doctor only when no instructor is set", () => {
    const credit = resolveSeminarHost({
      hosts: null,
      instructorName: null,
      hostDoctor: { slug: "waldo-amadeo-dc", first_name: "Waldo", last_name: "Amadeo", photo_url: null, clinic_name: null },
    });
    assert.equal(credit.name, "Waldo Amadeo");
    assert.equal(credit.verified, true);
    assert.equal(credit.profileSlug, "waldo-amadeo-dc");
  });
});

describe("coordinates", () => {
  it("uses the static city table when latitude is missing", () => {
    const point = resolveSeminarCoordinates({ city: "Davenport", location: "Davenport, IA", country: "United States" });
    assert.equal(point?.lat, 41.5236);
    assert.equal(resolveSeminarCoordinates({ city: "Nowhere", country: "United States" }), null);
    const stored = resolveSeminarCoordinates({ latitude: 1.5, longitude: 2.5, city: "Davenport" });
    assert.deepEqual(stored, { lat: 1.5, lng: 2.5 });
  });
});
