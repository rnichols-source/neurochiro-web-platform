import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkinWindow } from "./checkin-window.ts";

const zone = "America/New_York";

describe("check-in window", () => {
  it("refuses more than 2 hours before the start", () => {
    const result = checkinWindow({
      now: new Date("2026-11-06T11:59:00Z"),
      startsAt: "2026-11-06T14:00:00Z",
      endsAt: "2026-11-07T22:00:00Z",
      timeZone: zone,
    });
    assert.deepEqual(result, { ok: false, reason: "too_early" });
  });

  it("allows exactly 2 hours before the start", () => {
    const result = checkinWindow({
      now: new Date("2026-11-06T12:00:00Z"),
      startsAt: "2026-11-06T14:00:00Z",
      endsAt: "2026-11-07T22:00:00Z",
      timeZone: zone,
    });
    assert.deepEqual(result, { ok: true });
  });

  it("allows a check-in on the last day", () => {
    const result = checkinWindow({
      now: new Date("2026-11-08T04:00:00Z"),
      startsAt: "2026-11-06T14:00:00Z",
      endsAt: "2026-11-07T22:00:00Z",
      timeZone: zone,
    });
    assert.deepEqual(result, { ok: true });
  });

  it("refuses after the last day", () => {
    const result = checkinWindow({
      now: new Date("2026-11-08T05:01:00Z"),
      startsAt: "2026-11-06T14:00:00Z",
      endsAt: "2026-11-07T22:00:00Z",
      timeZone: zone,
    });
    assert.deepEqual(result, { ok: false, reason: "ended" });
  });

  it("uses the seminar date and start time when there is no timestamp", () => {
    const early = checkinWindow({
      now: new Date("2026-11-06T11:00:00Z"),
      startDate: "2026-11-06",
      endDate: "2026-11-06",
      startTime: "9:00 AM",
      timeZone: zone,
    });
    const open = checkinWindow({
      now: new Date("2026-11-06T13:00:00Z"),
      startDate: "2026-11-06",
      endDate: "2026-11-06",
      startTime: "09:00",
      timeZone: zone,
    });
    assert.deepEqual(early, { ok: false, reason: "too_early" });
    assert.deepEqual(open, { ok: true });
  });

  it("allows check-in when the seminar has no dates", () => {
    assert.deepEqual(checkinWindow({ now: new Date("2026-11-06T12:00:00Z") }), { ok: true });
  });
});
