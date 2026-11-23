import { cache } from "../../services/cache";
import { db } from "../../services/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment,
} from "firebase/firestore";
import {
  CommunityBook,
  CommunityBookFilter,
  CommunityBookStatus,
  CommunityStats,
  EducationLevel,
} from "./types";
import { initialCommunityBooks } from "./seed";

const COMMUNITY_BOOKS_KEY = "community:books:store";

export function readStoredCommunityBooks(): CommunityBook[] {
  const raw = cache.get(COMMUNITY_BOOKS_KEY);
  if (!raw) {
    // Initialize with seed data
    cache.set(COMMUNITY_BOOKS_KEY, JSON.stringify(initialCommunityBooks));
    return initialCommunityBooks;
  }
  try {
    const list = JSON.parse(raw) as CommunityBook[];
    return Array.isArray(list) ? list : initialCommunityBooks;
  } catch {
    return initialCommunityBooks;
  }
}

export function writeStoredCommunityBooks(books: CommunityBook[]): void {
  cache.set(COMMUNITY_BOOKS_KEY, JSON.stringify(books));
}

export async function fetchCommunityBooks(
  filter?: CommunityBookFilter,
): Promise<CommunityBook[]> {
  let allBooks = readStoredCommunityBooks();

  // If online & Firebase available, try syncing
  if (db) {
    try {
      const coll = collection(db, "communityBooks");
      const snap = await getDocs(coll);
      if (!snap.empty) {
        const remoteBooks: CommunityBook[] = [];
        snap.forEach((d) => remoteBooks.push(d.data() as CommunityBook));
        // Merge remote books with local
        const mergedMap = new Map<string, CommunityBook>();
        allBooks.forEach((b) => mergedMap.set(b.id, b));
        remoteBooks.forEach((b) => mergedMap.set(b.id, b));
        allBooks = Array.from(mergedMap.values());
        writeStoredCommunityBooks(allBooks);
      }
    } catch {
      // Graceful offline fallback
    }
  }

  // Apply filters
  let filtered = allBooks;

  if (filter?.status && filter.status !== "all") {
    filtered = filtered.filter((b) => b.status === filter.status);
  } else if (!filter?.status && !filter?.uploaderUid) {
    // By default for general students, show only approved books
    filtered = filtered.filter((b) => b.status === "approved");
  }

  if (filter?.uploaderUid) {
    filtered = filtered.filter((b) => b.uploaderUid === filter.uploaderUid);
  }

  if (filter?.category && filter.category !== "All") {
    filtered = filtered.filter(
      (b) => b.category.toLowerCase() === filter.category!.toLowerCase(),
    );
  }

  if (filter?.subject && filter.subject.trim()) {
    const sub = filter.subject.trim().toLowerCase();
    filtered = filtered.filter((b) => b.subject.toLowerCase().includes(sub));
  }

  if (filter?.department && filter.department !== "All") {
    filtered = filtered.filter(
      (b) => b.department.toLowerCase() === filter.department!.toLowerCase(),
    );
  }

  if (filter?.educationLevel && filter.educationLevel !== "All") {
    filtered = filtered.filter(
      (b) => b.educationLevel === filter.educationLevel,
    );
  }

  if (filter?.search && filter.search.trim()) {
    const q = filter.search.trim().toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q),
    );
  }

  // Sort: newest first
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface NewCommunityBookInput {
  uploaderUid: string;
  uploaderName: string;
  uploaderRole: string;
  uploaderAvatar?: string;
  institutionId: string;
  title: string;
  author: string;
  subject: string;
  description: string;
  category: string;
  department: string;
  educationLevel: EducationLevel;
  coverUrl?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  copyrightAgreed: boolean;
}

export function validateBookContribution(input: NewCommunityBookInput): {
  valid: boolean;
  error?: string;
} {
  if (!input.title?.trim()) {
    return { valid: false, error: "Book title is required." };
  }
  if (!input.author?.trim()) {
    return { valid: false, error: "Author name is required." };
  }
  if (!input.subject?.trim()) {
    return { valid: false, error: "Subject is required." };
  }
  if (!input.category?.trim()) {
    return { valid: false, error: "Category is required." };
  }
  if (!input.department?.trim()) {
    return { valid: false, error: "Department is required." };
  }
  if (!input.fileUrl?.trim()) {
    return { valid: false, error: "PDF document file is required." };
  }
  if (!input.copyrightAgreed) {
    return {
      valid: false,
      error: "You must confirm that the document complies with copyright policies.",
    };
  }
  return { valid: true };
}

export async function uploadCommunityBook(
  input: NewCommunityBookInput,
): Promise<CommunityBook> {
  const check = validateBookContribution(input);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const now = new Date().toISOString();
  const id = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newBook: CommunityBook = {
    ...input,
    id,
    title: input.title.trim(),
    author: input.author.trim(),
    subject: input.subject.trim(),
    description: input.description?.trim() || "",
    category: input.category.trim(),
    department: input.department.trim(),
    educationLevel: input.educationLevel,
    status: "pending", // CRITICAL: starts in pending-review state
    downloadsCount: 0,
    viewsCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const current = readStoredCommunityBooks();
  current.unshift(newBook);
  writeStoredCommunityBooks(current);

  if (db && input.uploaderUid !== "demo") {
    try {
      await setDoc(doc(db, "communityBooks", id), newBook);
    } catch {
      // Retained in local store
    }
  }

  return newBook;
}

export async function updateCommunityBook(
  id: string,
  updates: Partial<Pick<CommunityBook, "title" | "author" | "subject" | "description" | "category" | "department" | "educationLevel" | "coverUrl">>,
  requesterUid: string,
  isAdmin = false,
): Promise<CommunityBook> {
  const books = readStoredCommunityBooks();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Book not found.");

  const target = books[idx]!;
  if (!isAdmin && target.uploaderUid !== requesterUid) {
    throw new Error("You do not have permission to edit this book.");
  }

  const now = new Date().toISOString();
  const updated: CommunityBook = {
    ...target,
    ...updates,
    updatedAt: now,
  };

  // If changes requested and student updates, reset to pending
  if (!isAdmin && target.status === "changes-requested") {
    updated.status = "pending";
  }

  books[idx] = updated;
  writeStoredCommunityBooks(books);

  if (db) {
    try {
      await updateDoc(doc(db, "communityBooks", id), {
        ...updates,
        status: updated.status,
        updatedAt: now,
      });
    } catch {}
  }

  return updated;
}

export async function deleteCommunityBook(
  id: string,
  requesterUid: string,
  isAdmin = false,
): Promise<void> {
  const books = readStoredCommunityBooks();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Book not found.");

  const target = books[idx]!;
  if (!isAdmin && target.uploaderUid !== requesterUid) {
    throw new Error("You do not have permission to delete this book.");
  }

  books.splice(idx, 1);
  writeStoredCommunityBooks(books);

  if (db) {
    try {
      await deleteDoc(doc(db, "communityBooks", id));
    } catch {}
  }
}

export async function reviewCommunityBook(
  id: string,
  status: "approved" | "rejected" | "changes-requested",
  reviewNotes: string,
  reviewerUid: string,
): Promise<CommunityBook> {
  const books = readStoredCommunityBooks();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Book not found.");

  const now = new Date().toISOString();
  const updated: CommunityBook = {
    ...books[idx]!,
    status,
    reviewNotes: reviewNotes.trim(),
    reviewedBy: reviewerUid,
    reviewedAt: now,
    updatedAt: now,
  };

  books[idx] = updated;
  writeStoredCommunityBooks(books);

  if (db) {
    try {
      await updateDoc(doc(db, "communityBooks", id), {
        status,
        reviewNotes: reviewNotes.trim(),
        reviewedBy: reviewerUid,
        reviewedAt: now,
        updatedAt: now,
      });
    } catch {}
  }

  return updated;
}

export async function incrementBookStats(
  id: string,
  type: "view" | "download",
): Promise<void> {
  const books = readStoredCommunityBooks();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) return;

  if (type === "view") {
    books[idx]!.viewsCount += 1;
  } else {
    books[idx]!.downloadsCount += 1;
  }

  writeStoredCommunityBooks(books);

  if (db) {
    try {
      await updateDoc(doc(db, "communityBooks", id), {
        [type === "view" ? "viewsCount" : "downloadsCount"]: increment(1),
      });
    } catch {}
  }
}

export function computeCommunityStats(books: CommunityBook[]): CommunityStats {
  const uploaders = new Set(books.map((b) => b.uploaderUid));
  return {
    totalBooks: books.length,
    pendingBooks: books.filter((b) => b.status === "pending").length,
    approvedBooks: books.filter((b) => b.status === "approved").length,
    rejectedBooks: books.filter((b) => b.status === "rejected").length,
    totalDownloads: books.reduce((sum, b) => sum + (b.downloadsCount || 0), 0),
    totalViews: books.reduce((sum, b) => sum + (b.viewsCount || 0), 0),
    uniqueUploaders: uploaders.size,
  };
}

export const BOOK_CATEGORIES = [
  "All",
  "Computer Science",
  "Mathematics",
  "Physics",
  "Engineering",
  "Business",
  "Literature",
  "Social Sciences",
  "General",
] as const;

export const EDUCATION_LEVELS: EducationLevel[] = [
  "Undergraduate",
  "Postgraduate",
  "Intermediate",
  "General",
];
