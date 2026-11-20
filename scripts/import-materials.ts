import { createReadStream, readFileSync } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, isAbsolute, relative } from "node:path";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { parseCsv } from "../src/features/auth/csv";
import type { Material } from "../src/types";

// Dry-run is the default. No file is uploaded and no database is touched without --commit.
const args = process.argv.slice(2);
const value = (flag: string): string => {
  const index = args.indexOf(flag);
  const result = index >= 0 ? args[index + 1] : undefined;
  if (!result || result.startsWith("--"))
    throw new Error(`Missing value for ${flag}`);
  return result;
};
if (!args.includes("--manifest") || !args.includes("--source"))
  throw new Error(
    "Usage: npx tsx scripts/import-materials.ts --manifest artifacts/materials/import-manifest.csv --source 'E:\\akl project' [--commit --project PROJECT_ID --bucket BUCKET]",
  );
const commit = args.includes("--commit");
const parsed = parseCsv(
  readFileSync(value("--manifest"), "utf8").replace(/^\uFEFF/, ""),
);
const header = parsed.shift() ?? [];
const rows = parsed.map((cells) =>
  Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""])),
);
const root = await realpath(value("--source"));
const selected = rows.filter((r) => r.approved?.trim().toLowerCase() === "yes");
const plan: {
  code: string;
  programId: string;
  semester: number;
  path: string;
  material: Material;
  sha: string;
}[] = [];
const sequences = new Set<string>();
for (const row of selected) {
  if (/exclude-|exact-duplicate/.test(row.review_flags ?? ""))
    throw new Error(`Excluded row: ${row.relative_path}`);
  if (
    !/^[a-zA-Z0-9._-]+$/.test(row.course_code ?? "") ||
    !/^[a-z0-9-]+$/.test(row.program_id ?? "") ||
    !/^[1-8]$/.test(row.semester ?? "")
  )
    throw new Error(
      `Missing verified course/program/semester: ${row.relative_path}`,
    );
  if (
    !["book", "notes"].includes(row.kind ?? "") ||
    !row.title?.trim() ||
    !row.credit_line?.trim() ||
    !row.sharing_permission?.trim()
  )
    throw new Error(
      `Missing title, kind, author credit or sharing permission: ${row.relative_path}`,
    );
  const sequence = Number(row.sequence);
  if (
    !Number.isSafeInteger(sequence) ||
    sequence < 1 ||
    sequences.has(`${row.course_code}:${sequence}`)
  )
    throw new Error(
      `Sequence must be positive and unique within course: ${row.relative_path}`,
    );
  sequences.add(`${row.course_code}:${sequence}`);
  const path = await realpath(row.source_path!);
  const rel = relative(root, path);
  if (
    rel === ".." ||
    rel.startsWith("..\\") ||
    rel.startsWith("../") ||
    isAbsolute(rel)
  )
    throw new Error(
      `File outside approved source folder: ${row.relative_path}`,
    );
  if (!path.toLowerCase().endsWith(".pdf"))
    throw new Error(
      `Convert Office documents to PDF before importing: ${row.relative_path}`,
    );
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  const sha = hash.digest("hex");
  if (sha !== row.sha256)
    throw new Error(`Source changed since inventory: ${row.relative_path}`);
  const info = await stat(path);
  plan.push({
    code: row.course_code!,
    programId: row.program_id!,
    semester: Number(row.semester),
    path,
    sha,
    material: {
      id: sha,
      title: row.title.trim(),
      kind: row.kind as "book" | "notes",
      filename: basename(path),
      filePath: `institutions/akl/courses/${row.course_code}/${sha}.pdf`,
      sequence,
      creditLine: row.credit_line.trim(),
      bytes: info.size,
    },
  });
}
plan.sort(
  (a, b) =>
    a.code.localeCompare(b.code) || a.material.sequence - b.material.sequence,
);
console.log(
  `${commit ? "Upload" : "Dry run"}: ${plan.length} approved PDFs, ${(plan.reduce((sum, item) => sum + item.material.bytes, 0) / 1048576).toFixed(1)} MiB.`,
);
if (!commit) {
  for (const item of plan)
    console.log(
      `${item.code} / ${item.material.sequence} / ${item.material.title}`,
    );
} else {
  if (!args.includes("--project") || !args.includes("--bucket"))
    throw new Error("--commit requires explicit --project and --bucket.");
  initializeApp({
    credential: applicationDefault(),
    projectId: value("--project"),
    storageBucket: value("--bucket"),
  });
  const db = getFirestore();
  // Validate every destination before uploading any bytes. Never alter published courses.
  for (const item of plan) {
    const course = (await db.doc(`courses/${item.code}`).get()).data();
    if (
      !course ||
      course.institutionId !== "akl" ||
      course.programId !== item.programId ||
      course.semester !== item.semester ||
      course.published !== false
    )
      throw new Error(
        `Destination ${item.code} must be an existing matching draft course.`,
      );
    const existing = (course.materials ?? []) as Material[];
    if (
      existing.some(
        (m) =>
          m.sequence === item.material.sequence && m.id !== item.material.id,
      )
    )
      throw new Error(`Sequence conflict in ${item.code}.`);
  }
  for (const item of plan) {
    const bucket = getStorage().bucket();
    const file = bucket.file(item.material.filePath);
    const [exists] = await file.exists();
    if (exists) {
      const [metadata] = await file.getMetadata();
      if (metadata.metadata?.sha256 !== item.sha)
        throw new Error(`Stored checksum conflict: ${item.material.filePath}`);
    } else {
      await bucket.upload(item.path, {
        destination: item.material.filePath,
        resumable: true,
        preconditionOpts: { ifGenerationMatch: 0 },
        metadata: {
          contentType: "application/pdf",
          cacheControl: "private,max-age=3600",
          metadata: { sha256: item.sha },
        },
      });
    }
    await db.runTransaction(async (transaction) => {
      const reference = db.doc(`courses/${item.code}`);
      const current = (await transaction.get(reference)).data();
      if (
        !current ||
        current.published !== false ||
        current.institutionId !== "akl" ||
        current.programId !== item.programId ||
        current.semester !== item.semester
      )
        throw new Error(`Course changed during upload: ${item.code}`);
      const materials = (current.materials ?? []) as Material[];
      if (
        materials.some(
          (m) =>
            m.sequence === item.material.sequence && m.id !== item.material.id,
        )
      )
        throw new Error(`Sequence conflict in ${item.code}.`);
      transaction.update(reference, {
        materials: [
          ...materials.filter((m) => m.id !== item.material.id),
          item.material,
        ].sort((a, b) => a.sequence - b.sequence),
      });
    });
    console.log(
      `Ready in draft: ${item.code} / ${item.material.sequence} / ${item.material.title}`,
    );
  }
  console.log(
    "Import complete. Review courses before publishing. Rerunning reuses files by checksum.",
  );
}
