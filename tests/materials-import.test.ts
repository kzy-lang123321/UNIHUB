import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

test("import preflight permits a reviewed dry run and rejects changed or escaping sources", () => {
  const directory = mkdtempSync(join(tmpdir(), "unihub-import-"));
  try {
    const root = join(directory, "source");
    mkdirSync(root);
    const file = join(root, "lecture.pdf");
    const outside = join(directory, "outside.pdf");
    const content = "%PDF-1.4\nOriginal test notes";
    writeFileSync(file, content);
    writeFileSync(outside, content);
    const manifest = join(directory, "manifest.csv");
    const row = {
      approved: "yes",
      review_flags: "",
      course_code: "TEST-101",
      program_id: "bs-cs",
      semester: "1",
      kind: "notes",
      title: "Test lecture",
      credit_line: "Test author",
      sharing_permission: "Original test content",
      sequence: "1",
      source_path: file,
      sha256: createHash("sha256").update(content).digest("hex"),
      relative_path: "lecture.pdf",
    };
    const save = () =>
      writeFileSync(
        manifest,
        [
          Object.keys(row).join(","),
          Object.values(row)
            .map((value) => `"${value.replaceAll('"', '""')}"`)
            .join(","),
        ].join("\n"),
      );
    const run = () =>
      spawnSync(
        process.execPath,
        [
          "node_modules/tsx/dist/cli.mjs",
          "scripts/import-materials.ts",
          "--manifest",
          manifest,
          "--source",
          root,
        ],
        { encoding: "utf8", timeout: 30000 },
      );
    save();
    const valid = run();
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /Dry run: 1 approved PDFs/);
    writeFileSync(file, "changed");
    assert.match(run().stderr, /Source changed since inventory/);
    row.source_path = outside;
    save();
    assert.match(run().stderr, /File outside approved source folder/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
