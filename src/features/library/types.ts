export type ResourceKind =
  "book" | "notes" | "assignment" | "past-paper" | "handout" | "other";
export type ProcessingStatus =
  | "ready"
  | "needs-ocr"
  | "needs-conversion"
  | "unsupported"
  | "corrupt"
  | "excluded"
  | "archive";
export interface AcademicResource {
  id: string;
  institutionId: string;
  institutionName: string;
  originalName: string;
  relativePath: string;
  title: string;
  description: string;
  department: string;
  programId: string;
  semester: number | null;
  subject: string;
  kind: ResourceKind;
  suggestions: {
    department: string;
    programId: string;
    semester: number | null;
    subject: string;
    kind: ResourceKind;
    confidence: number;
    reasons: string[];
  };
  classificationConfirmed: boolean;
  visibilityConfirmed: boolean;
  published: boolean;
  downloadAllowed: boolean;
  deleted: boolean;
  status: ProcessingStatus;
  issue: string;
  bytes: number;
  sha256: string;
  mimeType: string;
  pages: number | null;
  previewText: string;
  hasPreview: boolean;
  duplicateOf: string | null;
  source: "provided" | "upload" | "archive";
  storageProvider: "local";
  cloudFileUploaded: boolean;
  databaseRegistered: boolean;
  version: number;
  updatedAt: string;
}
export interface LibraryProfile {
  uid: string;
  role: string;
  institutionId: string;
  programId: string;
  semester: number;
  mustChangePassword?: boolean;
}
export interface LibraryStats {
  totalDocuments: number;
  uploadedBooks: number;
  uploadedNotes: number;
  awaitingClassification: number;
  processed: number;
  failed: number;
  duplicates: number;
  localBytes: number;
  uploadedBytes: number;
  published: number;
}
