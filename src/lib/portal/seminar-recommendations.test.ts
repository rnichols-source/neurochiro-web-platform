import test from "node:test";
import assert from "node:assert/strict";
import {
  filterUpcomingRecommendations,
  recommendationChips,
  seminarStatRows,
} from "./seminar-recommendations.ts";

const now = Date.parse("2026-10-31T16:00:00Z");

test("filterUpcomingRecommendations drops past dates and keeps later ones", () => {
  const rows = filterUpcomingRecommendations(
    [
      { id: "past", dates: "Oct 24–25, 2026", relevance: 90 },
      { id: "full-past", dates: "October 24-25, 2026", relevance: 80 },
      { id: "later", dates: "November 21–22, 2026", relevance: 10 },
      { id: "sooner", dates: "November 7-8, 2026", relevance: 1 },
    ],
    now,
  );
  assert.deepEqual(
    rows.map((row) => row.id),
    ["sooner", "later"],
  );
});

test("recommendation chips stay true and stop at two", () => {
  const chips = recommendationChips(
    {
      city: "Atlanta",
      ce_hours: 12,
      title: "Pediatric adjusting",
      tags: ["pediatrics"],
    },
    { city: "Atlanta", state: "Georgia", specialties: ["Pediatrics", "Neurology"] },
  );
  assert.deepEqual(chips, ["Near you", "12 CE hours"]);
});

test("seminar stats use plain singular and plural sentences", () => {
  assert.equal(seminarStatRows({
    totalSeminars: 1,
    totalAttendees: 0,
    avgRating: 0,
    reviewCount: 0,
    totalCEDelivered: 0,
  })[0].value, "1 seminar");
  assert.equal(seminarStatRows({
    totalSeminars: 1,
    totalAttendees: 0,
    avgRating: 0,
    reviewCount: 0,
    totalCEDelivered: 0,
  })[2].value, "No reviews yet");
  assert.equal(seminarStatRows({
    totalSeminars: 2,
    totalAttendees: 4,
    avgRating: 4.8,
    reviewCount: 12,
    totalCEDelivered: 0,
  })[2].value, "4.8 average from 12 reviews");
});
