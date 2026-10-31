import test from "node:test";
import assert from "node:assert/strict";
import { classYearOptions } from "./class-years.ts";

test("class year chips start at the current Eastern year", () => {
  const years = classYearOptions(new Date("2026-10-31T16:00:00Z"), [
    { graduation_year: 2024 },
    { graduation_year: "2032" },
    { graduation_year: null },
  ]);
  assert.deepEqual(years.slice(0, 5), [2024, 2026, 2027, 2028, 2029]);
  assert.equal(years[0], 2024);
  assert.ok(years.includes(2030));
  assert.ok(years.includes(2032));
});
