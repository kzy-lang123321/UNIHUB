import { test } from "node:test";
import assert from "node:assert/strict";
import { isUnits } from "../src/features/courses/validation";
import { seedCourse } from "../src/features/courses/seed";
import { parseCsv } from "../src/features/auth/csv";
test("sample units have valid questions and answer indexes", () =>
  assert.equal(isUnits(seedCourse.units), true));
test("rejects duplicate units and out-of-range quiz answers", () => {
  assert.equal(isUnits([...seedCourse.units, seedCourse.units[0]]), false);
  const units = structuredClone(seedCourse.units);
  units[0]!.mcqs[0]!.answer = 99;
  assert.equal(isUnits(units), false);
});
test("CSV supports names with commas and escaped quotation marks", () => {
  assert.deepEqual(
    parseCsv('username,name\r\na1,"Khan, Ayesha"\r\na2,"A ""quoted"" name"'),
    [
      ["username", "name"],
      ["a1", "Khan, Ayesha"],
      ["a2", 'A "quoted" name'],
    ],
  );
});
test("CSV rejects unclosed quotes", () =>
  assert.throws(() => parseCsv('"unfinished')));
