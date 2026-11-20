export interface LocalNote {
  id: string;
  title: string;
  kind: "book" | "notes";
  filename: string;
  programId: string;
  semester: number;
  courseCode: string;
  courseTitle: string;
  sequence: number;
  creditLine: string;
  pages: { no: number; text: string; method: string; hasImages: boolean }[];
}
export const notes: LocalNote[];
