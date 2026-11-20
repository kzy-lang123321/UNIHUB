import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { cache } from "./cache";
import { Progress } from "../types";
export async function syncProgress(uid: string, code: string): Promise<void> {
  if (!db || uid === "demo") return;
  const key = `progress:${uid}:${code}`;
  const local = cache.get(key);
  const reference = doc(db, "progress", uid, "courses", code);
  if (local) {
    await setDoc(reference, JSON.parse(local) as Progress);
  } else {
    const result = await getDoc(reference);
    if (result.exists()) cache.set(key, JSON.stringify(result.data()));
  }
}
