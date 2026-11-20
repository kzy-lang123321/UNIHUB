import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { notes } from "../src/content/notes";

test("bundled notes have unique identities, ordered pages and nonempty original text", () => {
  assert.equal(new Set(notes.map((n) => n.id)).size, notes.length);
  for (const note of notes) {
    assert.ok(note.creditLine && note.courseCode && note.pages.length);
    assert.deepEqual(
      note.pages.map((p) => p.no),
      [...note.pages.map((p) => p.no)].sort((a, b) => a - b),
    );
    assert.ok(note.pages.every((p) => p.text.trim()));
  }
});
test("local publisher refuses unreviewed text without changing bundled content", () => {
  const directory = mkdtempSync(join(tmpdir(), "unihub-local-notes-"));
  try {
    const manifest = join(directory, "manifest.csv");
    writeFileSync(manifest, "approved,text_reviewed\nyes,no\n");
    const before = readFileSync("src/content/notes.js", "utf8");
    const result = spawnSync(
      process.execPath,
      [
        "node_modules/tsx/dist/cli.mjs",
        "scripts/publish-local-notes.ts",
        "--manifest",
        manifest,
        "--write",
      ],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /No reviewed text selected/);
    assert.equal(readFileSync("src/content/notes.js", "utf8"), before);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a reviewed but incomplete conversion cannot be published", () => {
  const directory = mkdtempSync(join(tmpdir(), "unihub-incomplete-note-"));
  try {
    const sha = "a".repeat(64);
    const manifest = join(directory, "manifest.csv");
    writeFileSync(
      manifest,
      `approved,text_reviewed,sha256,program_id,course_code,semester,kind,title,sequence,credit_line,sharing_permission,relative_path\nyes,yes,${sha},bs-cs,TEST-101,1,notes,Original test,1,Test author,Original test,lecture.pdf\n`,
    );
    writeFileSync(
      join(directory, `${sha}.json`),
      JSON.stringify({
        id: sha,
        pageCount: 2,
        pages: [
          {
            no: 1,
            text: "Only one page",
            method: "text",
            needsOcr: false,
            hasImages: false,
          },
        ],
      }),
    );
    const result = spawnSync(
      process.execPath,
      [
        "node_modules/tsx/dist/cli.mjs",
        "scripts/publish-local-notes.ts",
        "--manifest",
        manifest,
        "--drafts",
        directory,
      ],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Unfinished OCR/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
