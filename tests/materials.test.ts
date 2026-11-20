import { test } from "node:test";
import assert from "node:assert/strict";
import {
  matchMaterial,
  orderMaterials,
} from "../src/features/courses/materials";
import type { Material } from "../src/types";
const material = (
  id: string,
  sequence: number,
  filename: string,
): Material => ({
  id,
  sequence,
  filename,
  title: "Cell biology",
  kind: "notes",
  filePath: "institutions/akl/courses/BIO/a.pdf",
  creditLine: "Lecturer Khan",
  bytes: 100,
});
test("lecture order and natural filename order remain separate without mutating input", () => {
  const rows = [
    material("a", 1, "Lecture 10.pdf"),
    material("b", 2, "Lecture 2.pdf"),
  ];
  assert.deepEqual(
    orderMaterials(rows).map((m) => m.id),
    ["a", "b"],
  );
  assert.deepEqual(
    orderMaterials(rows, true).map((m) => m.id),
    ["b", "a"],
  );
  assert.equal(rows[0]?.id, "a");
});
test("search combines filename, course context, and lecturer with every query word", () => {
  const row = material("a", 1, "Lecture 2.pdf");
  assert.equal(
    matchMaterial(row, "khan 2 semester", "Botany Semester 4"),
    true,
  );
  assert.equal(matchMaterial(row, "khan physics", "Botany Semester 4"), false);
  assert.equal(matchMaterial(row, ""), true);
});
