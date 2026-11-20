import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AcademicResource,
  LibraryProfile,
} from "../src/features/library/types";
import {
  canReadResource,
  publicationError,
} from "../src/features/library/policy";
import { createLibraryServer } from "../scripts/library-server";
const admin: LibraryProfile = {
  uid: "admin-test",
  role: "admin",
  institutionId: "akl",
  programId: "bs-cs",
  semester: 1,
  mustChangePassword: false,
};
const student = { ...admin, uid: "student-test", role: "student" };
function resource(): AcademicResource {
  return {
    id: "a".repeat(64),
    institutionId: "akl",
    institutionName: "Akl",
    originalName: "Original notes.txt",
    relativePath: "Computer Science/Original notes.txt",
    title: "Original notes",
    description: "",
    department: "",
    programId: "",
    semester: null,
    subject: "",
    kind: "notes",
    suggestions: {
      department: "Computer Science",
      programId: "bs-cs",
      semester: null,
      subject: "ICT",
      kind: "notes",
      confidence: 0.55,
      reasons: ["Source filename"],
    },
    classificationConfirmed: false,
    visibilityConfirmed: false,
    published: false,
    downloadAllowed: false,
    deleted: false,
    status: "ready",
    issue: "",
    bytes: 0,
    sha256: "",
    mimeType: "text/plain",
    pages: null,
    previewText: "Original test notes",
    hasPreview: false,
    duplicateOf: null,
    source: "provided",
    storageProvider: "local",
    cloudFileUploaded: false,
    databaseRegistered: false,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}
test("library publication needs explicit confirmed classification and valid semester", () => {
  const r = resource();
  assert.ok(publicationError(r));
  r.classificationConfirmed = true;
  r.visibilityConfirmed = true;
  assert.ok(publicationError(r));
  Object.assign(r, {
    department: "Computer Science",
    programId: "bs-cs",
    semester: 1,
    subject: "ICT",
  });
  assert.equal(publicationError(r), null);
  r.status = "unsupported";
  assert.ok(publicationError(r));
});
test("student visibility is institution, program and semester scoped", () => {
  const r = {
    ...resource(),
    programId: "bs-cs",
    semester: 1,
    classificationConfirmed: true,
    visibilityConfirmed: true,
    published: true,
  };
  assert.equal(canReadResource(r, student), true);
  for (const changed of [
    { institutionId: "other" },
    { programId: "bs-botany" },
    { semester: 2 },
    { mustChangePassword: true },
    { role: "unknown" },
  ])
    assert.equal(canReadResource(r, { ...student, ...changed }), false);
  assert.equal(canReadResource({ ...r, published: false }, student), false);
  assert.equal(canReadResource({ ...r, deleted: true }, student), false);
});
test("authenticated document service enforces review, download revocation, backups and original bytes", async () => {
  const directory = mkdtempSync(join(tmpdir(), "unihub-library-test-"));
  const path = join(directory, "Original notes.txt");
  const content = "Original academic notes.\nUnchanged source.";
  writeFileSync(path, content);
  const r = resource();
  r.bytes = Buffer.byteLength(content);
  r.sha256 = createHash("sha256").update(content).digest("hex");
  writeFileSync(
    join(directory, "manifest.json"),
    JSON.stringify({
      resources: { [r.id]: r },
      privateFiles: {
        [r.id]: { sourcePath: path, readablePath: path, previewPath: "" },
      },
      importIssues: [],
    }),
  );
  const profiles: Record<string, LibraryProfile> = {
    admin,
    student,
    wrong: { ...student, semester: 2 },
  };
  const server = createLibraryServer({
    directory,
    authenticate: async (token) => {
      const p = profiles[token];
      if (!p) throw new Error("Invalid token");
      return p;
    },
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const call = (url: string, token?: string, method = "GET", data?: unknown) =>
    fetch(base + url, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { "Content-Type": "application/json" } : {}),
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  try {
    assert.equal((await call("/api/library")).status, 401);
    assert.equal(
      (
        (await (await call("/api/library", "student")).json()) as {
          resources: unknown[];
        }
      ).resources.length,
      0,
    );
    assert.equal(
      (
        await call(`/api/materials/${r.id}`, "student", "PATCH", {
          version: 1,
          published: true,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await call(`/api/materials/${r.id}`, "admin", "PATCH", {
          version: 1,
          published: true,
        })
      ).status,
      400,
    );
    const published = await call(`/api/materials/${r.id}`, "admin", "PATCH", {
      version: 1,
      department: "Computer Science",
      programId: "bs-cs",
      semester: 1,
      subject: "ICT",
      classificationConfirmed: true,
      visibilityConfirmed: true,
      published: true,
    });
    assert.equal(published.status, 200);
    assert.equal(
      (
        (await (await call("/api/library", "student")).json()) as {
          resources: unknown[];
        }
      ).resources.length,
      1,
    );
    assert.equal(
      (
        (await (await call("/api/library", "wrong")).json()) as {
          resources: unknown[];
        }
      ).resources.length,
      0,
    );
    assert.equal(
      (
        await call(`/api/materials/${r.id}/ticket`, "student", "POST", {
          download: true,
        })
      ).status,
      403,
    );
    const open = (await (
      await call(`/api/materials/${r.id}/ticket`, "student", "POST", {})
    ).json()) as { path: string };
    assert.equal(await (await call(open.path)).text(), content);
    assert.equal(
      (
        await call(`/api/materials/${r.id}`, "admin", "PATCH", {
          version: 1,
          description: "stale",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await call(`/api/materials/${r.id}`, "admin", "PATCH", {
          version: 2,
          downloadAllowed: true,
        })
      ).status,
      200,
    );
    const download = (await (
      await call(`/api/materials/${r.id}/ticket`, "student", "POST", {
        download: true,
      })
    ).json()) as { path: string };
    assert.equal(await (await call(download.path)).text(), content);
    assert.equal(
      (
        await call(`/api/materials/${r.id}`, "admin", "PATCH", {
          version: 3,
          downloadAllowed: false,
        })
      ).status,
      200,
    );
    assert.equal((await call(download.path)).status, 403);
    assert.equal(
      (
        await call(`/api/materials/${r.id}`, "admin", "PATCH", {
          version: 4,
          published: false,
        })
      ).status,
      200,
    );
    assert.equal((await call(open.path)).status, 404);
    assert.equal(readFileSync(path, "utf8"), content);
    assert.equal(readdirSync(join(directory, "backups", r.id)).length, 4);
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
    rmSync(directory, { recursive: true, force: true });
  }
});

test("uploaded originals are drafts, identical replacements preserve review, changed replacements retain backups", async () => {
  const directory = mkdtempSync(join(tmpdir(), "unihub-upload-test-"));
  const server = createLibraryServer({
    directory,
    authenticate: async () => admin,
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const upload = (content: string, replace?: string) =>
    fetch(base + "/api/import" + (replace ? `?replace=${replace}` : ""), {
      method: "POST",
      headers: {
        Authorization: "Bearer admin",
        "X-File-Name": encodeURIComponent("ICT/Lecture 01.txt"),
      },
      body: content,
    });
  try {
    const first = await upload("ICT original academic lecture\nVersion one.");
    assert.equal(first.status, 201, await first.clone().text());
    const { ids } = (await first.json()) as { ids: string[] };
    assert.equal(ids.length, 1);
    const id = ids[0];
    assert.ok(id);
    let state = JSON.parse(
      readFileSync(join(directory, "manifest.json"), "utf8"),
    );
    const oldPath = state.privateFiles[id].sourcePath;
    assert.equal(state.resources[id].published, false);
    assert.equal(state.resources[id].classificationConfirmed, false);
    const identical = await upload(
      "ICT original academic lecture\nVersion one.",
      id,
    );
    assert.equal(identical.status, 201, await identical.clone().text());
    state = JSON.parse(readFileSync(join(directory, "manifest.json"), "utf8"));
    assert.equal(state.resources[id].deleted, false);
    assert.equal(state.privateFiles[id].sourcePath, oldPath);
    const replacement = await upload(
      "ICT original academic lecture\nVersion two.",
      id,
    );
    assert.equal(replacement.status, 201, await replacement.clone().text());
    const changed = (await replacement.json()) as { ids: string[] };
    assert.notEqual(changed.ids[0], id);
    state = JSON.parse(readFileSync(join(directory, "manifest.json"), "utf8"));
    assert.equal(state.resources[id].deleted, true);
    assert.equal(state.resources[changed.ids[0]!].published, false);
    assert.equal(
      readFileSync(oldPath, "utf8"),
      "ICT original academic lecture\nVersion one.",
    );
    assert.equal(readdirSync(join(directory, "backups", id)).length, 1);
    const rejected = await upload("Uncommitted replacement", "f".repeat(64));
    assert.equal(rejected.status, 400);
    const report = (await (
      await fetch(base + "/api/library", {
        headers: { Authorization: "Bearer admin" },
      })
    ).json()) as {
      stats: { failed: number };
      importIssues: { name: string; error: string }[];
    };
    assert.equal(report.stats.failed, 1);
    assert.ok(
      report.importIssues.some((issue) =>
        issue.error.includes("Replacement target unavailable"),
      ),
    );
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
    rmSync(directory, { recursive: true, force: true });
  }
});
