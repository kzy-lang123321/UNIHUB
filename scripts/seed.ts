import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { seedCourse, institution } from "../src/features/courses/seed";
initializeApp({ credential: applicationDefault() });
const db = getFirestore();
await db.doc("institutions/akl").set(institution);
await db
  .doc("programs/bs-cs")
  .set({ name: "BS Computer Science", institutionId: "akl", semesters: 8 });
await db.doc("courses/CS-101").set(seedCourse);
console.log("Seeded institution, program, and CS-101.");
