import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { cache } from "../../services/cache";
import { Course } from "../../types";
import { isUnits } from "./validation";
export async function loadCourse(code: string, demo: boolean): Promise<Course> {
  const key = `course:${demo ? "demo" : "akl"}:${code}`;
  if (demo) {
    throw new Error(
      "Sample courses are not part of the initial academic library. Materials appear after administrator review.",
    );
  }
  try {
    if (!db) throw new Error("Firebase is not configured.");
    const snapshot = await getDoc(doc(db, "courses", code));
    if (!snapshot.exists())
      throw new Error("This course is not available yet.");
    const course = { ...snapshot.data(), code } as Course;
    if (!isUnits(course.units))
      throw new Error(
        "This course needs a valid published outline. Contact your teacher.",
      );
    cache.set(key, JSON.stringify(course));
    return course;
  } catch (error) {
    const saved = cache.get(key);
    if (saved) {
      try {
        const course = JSON.parse(saved) as Course;
        if (isUnits(course.units)) return course;
      } catch {
        cache.remove(key);
      }
    }
    throw error;
  }
}
