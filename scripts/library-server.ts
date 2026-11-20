import { createServer, IncomingMessage, ServerResponse } from "node:http";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve, join, basename } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { fileURLToPath } from "node:url";
import {
  AcademicResource,
  LibraryProfile,
} from "../src/features/library/types";
import {
  canReadResource,
  isLibraryAdmin,
  libraryStats,
  publicationError,
} from "../src/features/library/policy";

interface PrivateFile {
  sourcePath: string;
  previewPath: string;
  readablePath: string;
}
interface LibraryState {
  resources: Record<string, AcademicResource>;
  privateFiles: Record<string, PrivateFile>;
  importIssues: { archive?: string; name: string; error: string }[];
  uploadFailures?: { name: string; error: string }[];
}
interface Options {
  directory: string;
  authenticate?: (token: string) => Promise<LibraryProfile>;
  projectId?: string;
}
const allowedFields = new Set([
  "title",
  "description",
  "department",
  "programId",
  "semester",
  "subject",
  "kind",
  "classificationConfirmed",
  "visibilityConfirmed",
  "downloadAllowed",
  "published",
  "deleted",
]);
function readJson<T>(path: string, fallback: T): T {
  return existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as T)
    : fallback;
}
function send(response: ServerResponse, status: number, data: unknown) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}
async function body(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    length += Buffer.byteLength(chunk);
    if (length > 32768) throw new Error("Request too large");
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<
    string,
    unknown
  >;
}
export function createLibraryServer(options: Options) {
  const directory = resolve(options.directory);
  mkdirSync(directory, { recursive: true });
  const manifest = join(directory, "manifest.json");
  let state = readJson<LibraryState>(manifest, {
    resources: {},
    privateFiles: {},
    importIssues: [],
  });
  let mutation = Promise.resolve();
  const tickets = new Map<
    string,
    {
      id: string;
      token: string;
      expires: number;
      download: boolean;
      preview: boolean;
    }
  >();
  const authenticate =
    options.authenticate ??
    (async (token: string): Promise<LibraryProfile> => {
      if (!getApps().length) initializeApp({ projectId: options.projectId });
      const decoded = await getAuth().verifyIdToken(token);
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${options.projectId}/databases/(default)/documents/users/${decoded.uid}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error("Institution profile unavailable");
      const document = (await response.json()) as {
        fields: Record<
          string,
          {
            stringValue?: string;
            integerValue?: string;
            booleanValue?: boolean;
          }
        >;
      };
      const f = document.fields;
      return {
        uid: decoded.uid,
        role: f.role?.stringValue ?? "",
        institutionId: f.institutionId?.stringValue ?? "",
        programId: f.programId?.stringValue ?? "",
        semester: Number(f.semester?.integerValue),
        mustChangePassword: f.mustChangePassword?.booleanValue,
      };
    });
  function save() {
    const temp = manifest + ".tmp";
    writeFileSync(temp, JSON.stringify(state));
    renameSync(temp, manifest);
  }
  async function sync(resource: AcademicResource, token: string) {
    if (!options.projectId || options.authenticate) return;
    const encode = (input: unknown): unknown =>
      input === null
        ? { nullValue: null }
        : typeof input === "string"
          ? { stringValue: input }
          : typeof input === "boolean"
            ? { booleanValue: input }
            : typeof input === "number"
              ? Number.isInteger(input)
                ? { integerValue: String(input) }
                : { doubleValue: input }
              : Array.isArray(input)
                ? { arrayValue: { values: input.map(encode) } }
                : {
                    mapValue: {
                      fields: Object.fromEntries(
                        Object.entries(input as Record<string, unknown>).map(
                          ([key, value]) => [key, encode(value)],
                        ),
                      ),
                    },
                  };
    const data = encode({ ...resource, databaseRegistered: true }) as {
      mapValue: { fields: unknown };
    };
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${options.projectId}/databases/(default)/documents/academicMaterials/${resource.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: data.mapValue.fields }),
      },
    );
    if (!response.ok)
      throw new Error(
        `Database synchronization failed (${response.status}); no local change committed.`,
      );
    resource.databaseRegistered = true;
  }
  async function inspectUpload(path: string, name: string) {
    await new Promise<void>((done, reject) => {
      const process = spawn(
        "python",
        [
          "scripts/library-ingest.py",
          "--state",
          directory,
          "--single",
          path,
          "--name",
          name,
          "--render-office",
        ],
        { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] },
      );
      let error = "";
      process.stderr.on("data", (chunk: Buffer) => {
        error = (error + chunk.toString()).slice(-3000);
      });
      process.on("error", reject);
      process.on("close", (code) =>
        code === 0
          ? done()
          : reject(new Error(error || "Document processing failed")),
      );
    });
    state = readJson(manifest, state);
    return readJson<{ ids: string[] }>(join(directory, "last-import.json"), {
      ids: [],
    }).ids;
  }
  return createServer(async (request, response) => {
    const origin = request.headers.origin;
    const permittedOrigins = (
      process.env.LIBRARY_ALLOWED_ORIGINS ??
      "http://localhost:8081,http://127.0.0.1:8081"
    ).split(",");
    if (origin && !permittedOrigins.includes(origin))
      return send(response, 403, { error: "Origin not allowed" });
    if (origin) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
    }
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization,Content-Type,X-File-Name",
    );
    response.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PATCH,DELETE,OPTIONS",
    );
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname === "/health")
      return send(response, 200, {
        ready: true,
        storage: "local",
        cloudUploads: false,
      });
    try {
      let profile: LibraryProfile,
        token = "",
        ticket:
          | {
              id: string;
              token: string;
              expires: number;
              download: boolean;
              preview: boolean;
            }
          | undefined;
      if (url.pathname.startsWith("/file/")) {
        ticket = tickets.get(url.pathname.slice(6));
        if (!ticket || ticket.expires < Date.now())
          return send(response, 401, { error: "File link expired" });
        profile = await authenticate(ticket.token);
      } else {
        token = request.headers.authorization?.replace(/^Bearer /, "") ?? "";
        if (!token)
          return send(response, 401, {
            error: "Sign in to access the academic library",
          });
        try {
          profile = await authenticate(token);
        } catch {
          return send(response, 401, {
            error: "Invalid sign-in or institution profile",
          });
        }
      }
      if (profile.mustChangePassword !== false)
        return send(response, 403, {
          error: "Change your temporary password first",
        });
      const admin = isLibraryAdmin(profile);
      if (url.pathname === "/api/library" && request.method === "GET") {
        const resources = Object.values(state.resources).filter((r) =>
          canReadResource(r, profile),
        );
        return send(response, 200, {
          resources,
          ...(admin
            ? {
                stats: {
                  ...libraryStats(resources),
                  failed:
                    libraryStats(resources).failed +
                    (state.uploadFailures?.length ?? 0),
                },
                importIssues: [
                  ...state.importIssues,
                  ...(state.uploadFailures ?? []),
                ],
              }
            : {}),
          storageProvider: "local",
          cloudUploads: false,
        });
      }
      if (url.pathname === "/api/import" && request.method === "POST") {
        if (!admin)
          return send(response, 403, { error: "Admin access required" });
        const name = decodeURIComponent(
          String(request.headers["x-file-name"] ?? "document"),
        );
        if (
          !name ||
          name.length > 1000 ||
          name.split(/[\\/]/).some((part) => part === "..") ||
          name.includes("\0")
        )
          return send(response, 400, { error: "Invalid filename" });
        const incoming = join(directory, "incoming");
        mkdirSync(incoming, { recursive: true });
        const path = join(incoming, randomUUID());
        let length = 0;
        request.on("data", (chunk: Buffer) => {
          length += chunk.length;
          if (length > 512 * 1024 ** 2)
            request.destroy(new Error("Upload exceeds 512 MiB"));
        });
        await pipeline(request, createWriteStream(path, { flags: "wx" }));
        // Retain the original basename/extension for Office and archive detection.
        const originalDirectory = join(directory, "uploads", randomUUID());
        mkdirSync(originalDirectory, { recursive: true });
        const original = join(
          originalDirectory,
          basename(name.replaceAll("\\", "/")),
        );
        renameSync(path, original);
        const job = mutation.then(async () => {
          const replaceId = url.searchParams.get("replace");
          const previous = replaceId ? state.resources[replaceId] : undefined;
          const previousFile = replaceId
            ? state.privateFiles[replaceId]
            : undefined;
          if (
            replaceId &&
            (!previous || previous.institutionId !== profile.institutionId)
          )
            throw new Error("Replacement target unavailable");
          const ids = await inspectUpload(original, name);
          if (
            replaceId &&
            ids.includes(replaceId) &&
            previous &&
            previousFile
          ) {
            state.resources[replaceId] = previous;
            state.privateFiles[replaceId] = previousFile;
            save();
            return ids;
          }
          if (replaceId) {
            if (!previous || previous.institutionId !== profile.institutionId)
              throw new Error("Replacement target unavailable");
            const backup = join(directory, "backups", previous.id);
            mkdirSync(backup, { recursive: true });
            writeFileSync(
              join(backup, `${previous.version}-${Date.now()}.json`),
              JSON.stringify({
                resource: previous,
                files: previousFile,
              }),
              { flag: "wx" },
            );
            const archived = {
              ...previous,
              deleted: true,
              published: false,
              version: previous.version + 1,
              updatedAt: new Date().toISOString(),
            };
            await sync(archived, token);
            state.resources[replaceId] = archived;
          }
          for (const id of ids) {
            const resource = state.resources[id];
            if (
              resource &&
              !(resource.source === "archive" && resource.status === "excluded")
            ) {
              await sync(resource, token);
            }
          }
          save();
          return ids;
        });
        mutation = job.then(
          () => {},
          () => {},
        );
        let ids: string[];
        try {
          ids = await job;
        } catch (error) {
          state.uploadFailures ??= [];
          state.uploadFailures.push({
            name,
            error:
              error instanceof Error
                ? error.message
                : "Upload processing failed",
          });
          save();
          throw error;
        }
        return send(response, 201, {
          ids,
          status:
            "Processed; awaiting administrator classification and visibility review",
        });
      }
      const match = url.pathname.match(
        /^\/api\/materials\/([a-f0-9]{64})(?:\/(ticket|preview))?$/,
      );
      const id = ticket?.id ?? match?.[1];
      const resource = id ? state.resources[id] : undefined;
      if (!resource || !canReadResource(resource, profile))
        return send(response, 404, { error: "Document unavailable" });
      if (request.method === "PATCH" && match && !match[2]) {
        if (!admin)
          return send(response, 403, { error: "Admin access required" });
        const changes = await body(request);
        const operation = mutation.then(async () => {
          const current = state.resources[id!]!;
          if (changes.version !== current.version)
            throw new Error("CONFLICT: Document changed; reload before saving");
          const next = { ...current };
          for (const [key, value] of Object.entries(changes)) {
            if (key === "version") continue;
            if (!allowedFields.has(key))
              throw new Error(`Field is not editable: ${key}`);
            if (
              [
                "classificationConfirmed",
                "visibilityConfirmed",
                "downloadAllowed",
                "published",
                "deleted",
              ].includes(key) &&
              typeof value !== "boolean"
            )
              throw new Error("Expected a boolean value");
            if (
              [
                "title",
                "description",
                "department",
                "programId",
                "subject",
                "kind",
              ].includes(key) &&
              (typeof value !== "string" || value.length > 5000)
            )
              throw new Error("Invalid text field");
            if (
              key === "semester" &&
              value !== null &&
              (!Number.isInteger(value) ||
                Number(value) < 1 ||
                Number(value) > 8)
            )
              throw new Error("Semester must be 1–8 or unassigned");
            Object.assign(next, { [key]: value });
          }
          if (
            ![
              "book",
              "notes",
              "assignment",
              "past-paper",
              "handout",
              "other",
            ].includes(next.kind)
          )
            throw new Error("Invalid document type");
          if (next.deleted) next.published = false;
          if (next.published) {
            const error = publicationError(next);
            if (error) throw new Error(error);
          }
          const backup = join(directory, "backups", current.id);
          mkdirSync(backup, { recursive: true });
          writeFileSync(
            join(backup, `${current.version}-${Date.now()}.json`),
            JSON.stringify({
              resource: current,
              files: state.privateFiles[current.id],
            }),
            { flag: "wx" },
          );
          next.version++;
          next.updatedAt = new Date().toISOString();
          await sync(next, token);
          state.resources[id!] = next;
          save();
          return next;
        });
        mutation = operation.then(
          () => {},
          () => {},
        );
        return send(response, 200, await operation);
      }
      if (match?.[2] === "ticket" && request.method === "POST") {
        const options = await body(request);
        const download = options.download === true;
        if (download && !admin && !resource.downloadAllowed)
          return send(response, 403, {
            error: "Offline download is not permitted",
          });
        const key = randomUUID();
        tickets.set(key, {
          id: resource.id,
          token,
          download,
          preview: options.preview === true,
          expires: Date.now() + 120000,
        });
        for (const [key, value] of tickets)
          if (value.expires < Date.now()) tickets.delete(key);
        return send(response, 200, {
          path: `/file/${key}`,
          originalName: resource.originalName,
          expiresIn: 120,
        });
      }
      if (request.method === "GET" && (ticket || match?.[2] === "preview")) {
        if (ticket?.download && !admin && !resource.downloadAllowed)
          return send(response, 403, {
            error: "Offline download is no longer permitted",
          });
        const info = state.privateFiles[resource.id];
        const path = ticket
          ? ticket.preview
            ? info?.previewPath
            : ticket.download
              ? info?.sourcePath
              : info?.readablePath
          : info?.previewPath;
        if (!path || !existsSync(path))
          return send(response, 404, {
            error:
              "Original file/preview is unavailable; contact your administrator",
          });
        if (!admin && !["ready", "needs-ocr"].includes(resource.status))
          return send(response, 403, { error: "Document is not readable yet" });
        const size = statSync(path).size;
        const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
        const start = range ? Number(range[1]) : 0,
          end =
            range && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
        if (start > end || start >= size) {
          response.writeHead(416, { "Content-Range": `bytes */${size}` });
          response.end();
          return;
        }
        response.writeHead(range ? 206 : 200, {
          "Content-Security-Policy": "sandbox",
          "Content-Type":
            !ticket || ticket.preview
              ? "image/webp"
              : path.toLowerCase().endsWith(".pdf")
                ? "application/pdf"
                : resource.mimeType,
          "Content-Length": end - start + 1,
          "Accept-Ranges": "bytes",
          ...(range
            ? { "Content-Range": `bytes ${start}-${end}/${size}` }
            : {}),
          "Content-Disposition": `${ticket?.download || !["ready", "needs-ocr"].includes(resource.status) ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(resource.originalName)}`,
          "Cache-Control": "private,no-store",
        });
        await pipeline(createReadStream(path, { start, end }), response);
        return;
      }
      send(response, 405, { error: "Method not supported" });
    } catch (error) {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      const message =
        error instanceof Error ? error.message : "Library operation failed";
      send(response, message.startsWith("CONFLICT:") ? 409 : 400, {
        error: message,
      });
    }
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const settings = readFileSync(".env", "utf8");
  const config = settings
    .match(/^EXPO_PUBLIC_FIREBASE_PROJECT_ID=(.+)$/m)?.[1]
    ?.trim();
  if (!config)
    throw new Error(
      "Configure the Firebase project before starting the document service",
    );
  const port = Number(process.env.LIBRARY_PORT ?? 8787);
  const directory =
    process.env.LIBRARY_STATE_ROOT ??
    settings.match(/^LIBRARY_STATE_ROOT=(.+)$/m)?.[1]?.trim() ??
    ".library";
  createLibraryServer({ directory, projectId: config }).listen(
    port,
    process.env.LIBRARY_BIND ?? "127.0.0.1",
    () =>
      console.log(
        `UniHub document service: http://127.0.0.1:${port} (authenticated, local originals; no paid cloud file storage)`,
      ),
  );
}
