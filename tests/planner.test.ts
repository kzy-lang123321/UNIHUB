import { test } from "node:test";
import assert from "node:assert/strict";
import { makePlan, validDate } from "../src/features/planner/plan";
test("splits remaining work across calendar days", () => {
  assert.deepEqual(
    makePlan(8, [1, 2], "2026-11-08", new Date(2026, 10, 5, 23)),
    { days: 3, daily: 2, remaining: 6 },
  );
});
test("past dates do not produce negative quotas", () => {
  assert.deepEqual(makePlan(3, [], "2026-11-01", new Date(2026, 10, 5)), {
    days: 0,
    daily: 3,
    remaining: 3,
  });
});
test("completed work produces zero tasks", () => {
  assert.equal(
    makePlan(3, [1, 2, 3], "2026-11-08", new Date(2026, 10, 5)).daily,
    0,
  );
});
test("invalid calendar dates are rejected", () => {
  assert.equal(validDate("2026-02-31"), false);
  assert.equal(validDate("2028-02-29"), true);
  assert.equal(validDate("2026-02-29"), false);
});
