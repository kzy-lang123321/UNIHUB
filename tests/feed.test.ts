import { test } from "node:test";
import assert from "node:assert/strict";
import {
  biteSize,
  courseFeed,
  visibleFeed,
} from "../src/features/courses/feed";
import { demoCourses } from "../src/features/courses/demo";
import { isUnits } from "../src/features/courses/validation";
import { seedCourse } from "../src/features/courses/seed";
test("short cards preserve every word and decimal values", () => {
  const text =
    "A variable can store 3.14. A boolean stores true or false. Try one example yourself.";
  const parts = biteSize(text, 8);
  assert.equal(parts.join(" "), text);
  assert.ok(parts.every((part) => part.split(" ").length <= 8));
  assert.ok(parts.some((part) => part.includes("3.14.")));
});
test("sentence boundaries are preserved when sentences fit", () =>
  assert.deepEqual(
    biteSize("Read the question carefully. Make a plan before coding.", 7),
    ["Read the question carefully.", "Make a plan before coding."],
  ));
test("a nonpositive word limit fails instead of hanging", () =>
  assert.throws(() => biteSize("A lesson", 0), RangeError));
test("next uncompleted topic comes first without dropping completed content", () => {
  const cards = courseFeed(seedCourse, [1]);
  assert.equal(cards[0]?.unitNo, 2);
  assert.ok(cards.some((card) => card.unitNo === 1));
  assert.equal(new Set(cards.map((card) => card.id)).size, cards.length);
  assert.equal(
    cards.filter((card) => card.kind === "question").length,
    seedCourse.units.flatMap((unit) => unit.mcqs).length,
  );
});
test("edited quiz content gets a new saved-answer identity", () => {
  const before = courseFeed(seedCourse).find(
    (card) => card.kind === "question",
  );
  const edited = structuredClone(seedCourse);
  edited.units[0]!.mcqs[0]!.question = "A newly published question";
  const after = courseFeed(edited).find((card) => card.kind === "question");
  assert.notEqual(before?.id, after?.id);
});
test("sample feed spans distinct courses with valid original content", () => {
  assert.equal(demoCourses.length, 3);
  assert.ok(demoCourses.every((course) => isUnits(course.units)));
  const cards = demoCourses.flatMap((course) => courseFeed(course));
  assert.equal(new Set(cards.map((card) => card.code)).size, 3);
  assert.equal(new Set(cards.map((card) => card.id)).size, cards.length);
});
test("translated topic explanation appears once, with questions retained", () => {
  const cards = courseFeed(seedCourse);
  const translated = visibleFeed(cards, "اردو");
  assert.equal(
    translated.filter((card) => card.kind === "lesson" && card.unitNo === 1)
      .length,
    1,
  );
  assert.equal(
    translated.filter((card) => card.kind === "question").length,
    cards.filter((card) => card.kind === "question").length,
  );
});
