import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateBookContribution,
  uploadCommunityBook,
  fetchCommunityBooks,
  updateCommunityBook,
  deleteCommunityBook,
  reviewCommunityBook,
  incrementBookStats,
  computeCommunityStats,
  readStoredCommunityBooks,
  writeStoredCommunityBooks,
} from "../src/features/community/service";
import { initialCommunityBooks } from "../src/features/community/seed";

test("validates book contribution fields and copyright agreement", () => {
  const base = {
    uploaderUid: "u1",
    uploaderName: "Uploader",
    uploaderRole: "student",
    institutionId: "akl",
    title: "Test Book",
    author: "Test Author",
    subject: "Computer Science",
    description: "Good book",
    category: "Computer Science",
    department: "Computer Science",
    educationLevel: "Undergraduate" as const,
    fileUrl: "https://example.com/file.pdf",
    fileName: "file.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    copyrightAgreed: true,
  };

  assert.equal(validateBookContribution(base).valid, true);

  // Missing title
  assert.equal(validateBookContribution({ ...base, title: "   " }).valid, false);

  // Missing author
  assert.equal(validateBookContribution({ ...base, author: "" }).valid, false);

  // Missing subject
  assert.equal(validateBookContribution({ ...base, subject: "" }).valid, false);

  // Missing file
  assert.equal(validateBookContribution({ ...base, fileUrl: "" }).valid, false);

  // Missing copyright agreement
  assert.equal(validateBookContribution({ ...base, copyrightAgreed: false }).valid, false);
});

test("uploaded book starts in pending review state and can be approved by admin", async () => {
  // Reset store to initial seed
  writeStoredCommunityBooks([...initialCommunityBooks]);

  const newBook = await uploadCommunityBook({
    uploaderUid: "student-99",
    uploaderName: "Tariq Student",
    uploaderRole: "student",
    institutionId: "akl",
    title: "Distributed Systems Engineering",
    author: "Martin Kleppmann",
    subject: "Distributed Systems",
    description: "Reliability, scalability and maintainability of data intensive apps.",
    category: "Computer Science",
    department: "Computer Science",
    educationLevel: "Undergraduate",
    fileUrl: "https://example.com/ddia.pdf",
    fileName: "ddia.pdf",
    fileSize: 5000000,
    mimeType: "application/pdf",
    copyrightAgreed: true,
  });

  // Verify status is pending
  assert.equal(newBook.status, "pending");
  assert.equal(newBook.downloadsCount, 0);

  // General student query should NOT see pending books
  const approvedBooks = await fetchCommunityBooks({ status: "approved" });
  assert.equal(approvedBooks.some((b) => b.id === newBook.id), false);

  // Uploader query SHOULD see their own pending book
  const myUploads = await fetchCommunityBooks({ uploaderUid: "student-99", status: "all" });
  assert.equal(myUploads.some((b) => b.id === newBook.id), true);

  // Admin approves book
  const approved = await reviewCommunityBook(
    newBook.id,
    "approved",
    "Verified and compliant with college syllabus.",
    "admin-uid",
  );
  assert.equal(approved.status, "approved");
  assert.equal(approved.reviewedBy, "admin-uid");

  // Now general student query DOES see the approved book
  const updatedApprovedList = await fetchCommunityBooks({ status: "approved" });
  assert.equal(updatedApprovedList.some((b) => b.id === newBook.id), true);
});

test("tracks view and download statistics accurately", async () => {
  const books = readStoredCommunityBooks();
  const testBook = books[0]!;
  const initialViews = testBook.viewsCount;
  const initialDownloads = testBook.downloadsCount;

  await incrementBookStats(testBook.id, "view");
  await incrementBookStats(testBook.id, "download");

  const refreshedBooks = readStoredCommunityBooks();
  const updated = refreshedBooks.find((b) => b.id === testBook.id)!;
  assert.equal(updated.viewsCount, initialViews + 1);
  assert.equal(updated.downloadsCount, initialDownloads + 1);

  const stats = computeCommunityStats(refreshedBooks);
  assert.ok(stats.totalBooks > 0);
  assert.ok(stats.approvedBooks > 0);
  assert.ok(stats.totalDownloads > 0);
});

test("author can update details and delete their uploaded book", async () => {
  const newBook = await uploadCommunityBook({
    uploaderUid: "author-123",
    uploaderName: "Author",
    uploaderRole: "student",
    institutionId: "akl",
    title: "Draft Notes",
    author: "Author",
    subject: "Physics",
    description: "Initial draft",
    category: "Physics",
    department: "Physics",
    educationLevel: "Undergraduate",
    fileUrl: "https://example.com/draft.pdf",
    fileName: "draft.pdf",
    fileSize: 1000,
    mimeType: "application/pdf",
    copyrightAgreed: true,
  });

  // Non-author cannot edit
  await assert.rejects(async () => {
    await updateCommunityBook(newBook.id, { title: "Hacked" }, "other-user", false);
  });

  // Author can edit
  const edited = await updateCommunityBook(
    newBook.id,
    { title: "Refined Physics Notes" },
    "author-123",
    false,
  );
  assert.equal(edited.title, "Refined Physics Notes");

  // Author can delete
  await deleteCommunityBook(newBook.id, "author-123", false);
  const remaining = readStoredCommunityBooks();
  assert.equal(remaining.some((b) => b.id === newBook.id), false);
});
