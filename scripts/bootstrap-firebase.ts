import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { seedCourse, institution } from "../src/features/courses/seed";

const project = process.argv[2];
const access = process.env.UNIHUB_GOOGLE_ACCESS_TOKEN;
if (!project || !/^[a-z][a-z0-9-]+$/.test(project) || !access)
  throw new Error(
    "Supply project ID and an ephemeral UNIHUB_GOOGLE_ACCESS_TOKEN from an authorized local Google sign-in.",
  );
const headers = {
  Authorization: `Bearer ${access}`,
  "x-goog-user-project": project,
  "Content-Type": "application/json",
};
async function request(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error(
      `Firebase setup request failed (${response.status}): ${await response.text()}`,
    );
  return response.json() as Promise<Record<string, unknown>>;
}
function value(input: unknown): unknown {
  if (typeof input === "string") return { stringValue: input };
  if (typeof input === "boolean") return { booleanValue: input };
  if (typeof input === "number")
    return Number.isInteger(input)
      ? { integerValue: String(input) }
      : { doubleValue: input };
  if (Array.isArray(input)) return { arrayValue: { values: input.map(value) } };
  if (input && typeof input === "object")
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(input).map(([key, item]) => [key, value(item)]),
        ),
      },
    };
  return { nullValue: null };
}
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
async function createDocument(path: string, data: unknown) {
  const response = await fetch(`${base}/${path}?currentDocument.exists=false`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      fields: (value(data) as { mapValue: { fields: unknown } }).mapValue
        .fields,
    }),
  });
  if (!response.ok && response.status !== 409)
    throw new Error(
      `Cannot provision ${path} (${response.status}): ${await response.text()}`,
    );
}
await createDocument("institutions/akl", institution);
await createDocument("programs/bs-cs", {
  name: "BS Computer Science",
  institutionId: "akl",
  semesters: 8,
});
await createDocument("courses/CS-101", seedCourse);
console.log(
  "Institution and original sample course ready; existing data preserved.",
);
mkdirSync("artifacts", { recursive: true });
const credentialsPath = "artifacts/admin-credentials.json";
if (existsSync(credentialsPath)) {
  console.log(
    "A local admin credential file already exists. No account or password was changed.",
  );
} else {
  const password =
    process.env.UNIHUB_INITIAL_ADMIN_PASSWORD ??
    randomBytes(24).toString("base64url");
  if (password.length < 6)
    throw new Error("Firebase requires at least six password characters.");
  const email = "admin@akl.unihub.app";
  const account = await request(
    `https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts`,
    "POST",
    { email, password, displayName: "UniHub Administrator" },
  );
  const uid = account.localId;
  if (typeof uid !== "string")
    throw new Error("Admin account creation returned no UID.");
  // Write the private recovery detail before profile provisioning so interrupted setup is recoverable.
  writeFileSync(
    credentialsPath,
    JSON.stringify(
      {
        project,
        username: "admin",
        email,
        password,
        uid,
        mustChangePassword: true,
      },
      null,
      2,
    ),
    { flag: "wx", mode: 0o600 },
  );
  await createDocument(`users/${uid}`, {
    role: "admin",
    institutionId: "akl",
    programId: "bs-cs",
    semester: 1,
    displayName: "UniHub Administrator",
    mustChangePassword: true,
  });
  await request(
    `https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:update`,
    "POST",
    {
      localId: uid,
      customAttributes: JSON.stringify({ role: "admin", institutionId: "akl" }),
    },
  );
  console.log(
    `Admin provisioned. Temporary credentials are in ${credentialsPath}; change the password on first sign-in.`,
  );
}
