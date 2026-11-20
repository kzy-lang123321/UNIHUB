import { Unit } from "../../types";
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}
export function isUnits(value: unknown): value is Unit[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100)
    return false;
  const numbers = new Set<number>();
  return value.every((u: unknown) => {
    if (
      !record(u) ||
      typeof u.no !== "number" ||
      !Number.isInteger(u.no) ||
      u.no < 1 ||
      numbers.has(u.no) ||
      typeof u.title !== "string" ||
      !u.title.trim() ||
      typeof u.notes !== "string" ||
      u.notes.length > 100000 ||
      !strings(u.sq) ||
      !strings(u.lq) ||
      !Array.isArray(u.mcqs)
    )
      return false;
    numbers.add(u.no);
    if (
      (u.urdu !== undefined && typeof u.urdu !== "string") ||
      (u.pashto !== undefined && typeof u.pashto !== "string")
    )
      return false;
    return u.mcqs.every(
      (q: unknown) =>
        record(q) &&
        typeof q.question === "string" &&
        strings(q.options) &&
        q.options.length >= 2 &&
        typeof q.answer === "number" &&
        Number.isInteger(q.answer) &&
        q.answer >= 0 &&
        q.answer < q.options.length &&
        typeof q.explanation === "string",
    );
  });
}
