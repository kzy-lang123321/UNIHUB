export type Role = "student" | "teacher" | "admin";
export interface Profile {
  uid: string;
  role: Role;
  institutionId: string;
  institutionName?: string;
  programId: string;
  semester: number;
  displayName: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  email?: string;
  phone?: string;
  fieldOfStudy?: string;
  degreeLevel?: string;
  interests?: string[];
  website?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  isProfilePublic?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface Book {
  title: string;
  type: "open" | "linked";
  url: string;
  edition: string;
}
export interface MCQ {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}
export interface Unit {
  no: number;
  title: string;
  notes: string;
  mcqs: MCQ[];
  sq: string[];
  lq: string[];
  urdu?: string;
  pashto?: string;
}
export interface Paper {
  uni: string;
  year: number;
  type: "Quiz" | "Assignment" | "Midterm" | "Final";
  fileUrl: string;
  solutionUrl: string;
}
export interface Course {
  code: string;
  title: string;
  credit: number;
  programId: string;
  semester: number;
  institutionId: string;
  teacherIds: string[];
  published: boolean;
  books: Book[];
  materials?: Material[];
  units: Unit[];
  papers: Paper[];
  creditLine: string;
  outline: string;
}
export interface Material {
  id: string;
  title: string;
  kind: "book" | "notes";
  filename: string;
  filePath: string;
  sequence: number;
  creditLine: string;
  bytes: number;
}
export interface Progress {
  completedUnits: number[];
  quizScores: { score: number; total: number; at: string }[];
  bookmarks: number[];
}
