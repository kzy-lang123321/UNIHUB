import { AcademicResource, LibraryProfile, LibraryStats } from "./types";
export function isLibraryAdmin(profile: LibraryProfile) {
  return profile.role === "admin" && profile.mustChangePassword === false;
}
export function canReadResource(
  resource: AcademicResource,
  profile: LibraryProfile,
) {
  if (!["student", "teacher", "admin"].includes(profile.role)) return false;
  if (
    resource.institutionId !== profile.institutionId ||
    profile.mustChangePassword !== false
  )
    return false;
  if (isLibraryAdmin(profile)) return true;
  return (
    !resource.deleted &&
    resource.published &&
    resource.classificationConfirmed &&
    resource.visibilityConfirmed &&
    resource.programId === profile.programId &&
    resource.semester === profile.semester
  );
}
export function publicationError(resource: AcademicResource): string | null {
  if (resource.deleted) return "Restore this document before publishing.";
  if (!["ready", "needs-ocr"].includes(resource.status))
    return "This document must be readable before publication.";
  if (!resource.classificationConfirmed || !resource.visibilityConfirmed)
    return "Confirm classification and student visibility before publishing.";
  if (
    !resource.department.trim() ||
    !resource.programId.trim() ||
    !resource.subject.trim() ||
    !resource.title.trim() ||
    !Number.isInteger(resource.semester) ||
    (resource.semester ?? 0) < 1 ||
    (resource.semester ?? 0) > 8
  )
    return "Choose a department, program, semester (1–8), subject and title.";
  return null;
}
export function libraryStats(resources: AcademicResource[]): LibraryStats {
  const rows = resources.filter(
    (r) => !r.deleted && !(r.source === "archive" && r.status === "excluded"),
  );
  return {
    totalDocuments: rows.length,
    uploadedBooks: rows.filter((r) => r.kind === "book").length,
    uploadedNotes: rows.filter((r) => r.kind === "notes").length,
    awaitingClassification: rows.filter(
      (r) => !r.classificationConfirmed && r.status !== "excluded",
    ).length,
    processed: rows.filter((r) => ["ready", "needs-ocr"].includes(r.status))
      .length,
    failed: rows.filter((r) => r.status === "corrupt").length,
    duplicates: rows.filter((r) => !!r.duplicateOf).length,
    localBytes: rows
      .filter((r) => !r.duplicateOf)
      .reduce((sum, r) => sum + r.bytes, 0),
    uploadedBytes: rows
      .filter((r) => r.cloudFileUploaded && !r.duplicateOf)
      .reduce((sum, r) => sum + r.bytes, 0),
    published: rows.filter((r) => r.published).length,
  };
}
