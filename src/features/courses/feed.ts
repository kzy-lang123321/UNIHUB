import { Course, MCQ } from "../../types";

interface BaseCard {
  id: string;
  code: string;
  courseTitle: string;
  unitNo: number;
  title: string;
  credit: string;
}
export interface LessonCard extends BaseCard {
  kind: "lesson";
  body: string;
  part: number;
  parts: number;
  urdu?: string;
  pashto?: string;
}
export interface QuestionCard extends BaseCard {
  kind: "question";
  question: MCQ;
}
export interface RecallCard extends BaseCard {
  kind: "recall";
  prompt: string;
  hint: string;
}
export type FeedCard = LessonCard | QuestionCard | RecallCard;
export type FeedLanguage = "English" | "اردو" | "پښتو";

export function visibleFeed(
  cards: FeedCard[],
  language: FeedLanguage,
): FeedCard[] {
  return cards.filter(
    (card) =>
      card.kind !== "lesson" ||
      language === "English" ||
      !(language === "اردو" ? card.urdu : card.pashto) ||
      card.part === card.parts,
  );
}

function fingerprint(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function biteSize(text: string, maxWords = 28): string[] {
  if (!Number.isInteger(maxWords) || maxWords < 1)
    throw new RangeError("Use a positive word limit.");
  const normalized = text.trim().replace(/\s+/g, " ");
  const sentences: string[] = [];
  let start = 0;
  for (let i = 0; i < normalized.length; i++) {
    if (
      /[.!?۔؟]/.test(normalized[i]!) &&
      (i === normalized.length - 1 || normalized[i + 1] === " ")
    ) {
      sentences.push(normalized.slice(start, i + 1).trim());
      start = i + 1;
    }
  }
  if (start < normalized.length) sentences.push(normalized.slice(start).trim());
  const parts: string[] = [];
  let current: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(" ").filter(Boolean);
    if (current.length + words.length > maxWords && current.length) {
      parts.push(current.join(" "));
      current = [];
    }
    while (words.length > maxWords)
      parts.push(words.splice(0, maxWords).join(" "));
    current.push(...words);
  }
  if (current.length) parts.push(current.join(" "));
  return parts.length
    ? parts
    : ["Your teacher is preparing notes for this topic."];
}

export function courseFeed(
  course: Course,
  completed: number[] = [],
): FeedCard[] {
  const units = [
    ...course.units.filter((u) => !completed.includes(u.no)),
    ...course.units.filter((u) => completed.includes(u.no)),
  ];
  return units.flatMap((unit) => {
    const base: BaseCard = {
      id: "",
      code: course.code,
      courseTitle: course.title,
      unitNo: unit.no,
      title: unit.title,
      credit: course.creditLine,
    };
    const parts = biteSize(unit.notes);
    const lessons: FeedCard[] = parts.map((body, index) => ({
      ...base,
      id: `${course.code}/${unit.no}/read/${index}-${fingerprint(body)}`,
      kind: "lesson",
      body,
      part: index + 1,
      parts: parts.length,
      urdu: unit.urdu,
      pashto: unit.pashto,
    }));
    const questions: FeedCard[] = unit.mcqs.map((question, index) => ({
      ...base,
      id: `${course.code}/${unit.no}/quiz/${index}-${fingerprint(JSON.stringify(question))}`,
      kind: "question",
      question,
    }));
    if (!questions.length && unit.sq[0])
      questions.push({
        ...base,
        id: `${course.code}/${unit.no}/recall/${fingerprint(unit.sq[0])}`,
        kind: "recall",
        prompt: unit.sq[0],
        hint: unit.notes,
      });
    return [...lessons, ...questions];
  });
}
