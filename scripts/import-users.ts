import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { parseCsv } from "../src/features/auth/csv";
initializeApp({ credential: applicationDefault() });
const file = process.argv[2];
if (!file) throw new Error("Usage: npx tsx scripts/import-users.ts users.csv");
const rows = parseCsv(readFileSync(file, "utf8"));
if (rows.shift()?.join(",") !== "username,name,role,program,semester")
  throw new Error("Expected header: username,name,role,program,semester");
for (const row of rows) {
  const [username, name, role, program, semester] = row;
  if (
    !username ||
    !/^[a-z0-9._-]+$/i.test(username) ||
    !name ||
    !role ||
    !["student", "teacher", "admin"].includes(role) ||
    !program ||
    !semester ||
    !/^[1-8]$/.test(semester)
  )
    throw new Error(
      `Invalid row for ${username ?? "unknown"}. Check the CSV columns.`,
    );
  const password = randomBytes(18).toString("base64url");
  const user = await getAuth().createUser({
    email: `${username.toLowerCase()}@akl.unihub.app`,
    password,
    displayName: name,
  });
  try {
    await getFirestore()
      .doc(`users/${user.uid}`)
      .set({
        role,
        institutionId: "akl",
        programId: program,
        semester: Number(semester),
        displayName: name,
        mustChangePassword: true,
      });
    await getAuth().setCustomUserClaims(user.uid, {
      role,
      institutionId: "akl",
    });
  } catch (error) {
    await getAuth().deleteUser(user.uid);
    throw error;
  }
  console.log(
    `${username}: temporary password ${password} — deliver privately; do not retain logs.`,
  );
}
