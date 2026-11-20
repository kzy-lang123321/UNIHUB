import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { Profile } from "../../types";
import { useStore } from "../../store";
import { cache } from "../../services/cache";
export async function login(username: string, password: string): Promise<void> {
  if (!auth || !db)
    throw new Error(
      "Your institution has not enabled sign-in yet. Please try the demo.",
    );
  if (!/^[a-z0-9._-]+$/i.test(username))
    throw new Error("Use your institution username.");
  const result = await signInWithEmailAndPassword(
    auth,
    `${username.toLowerCase()}@akl.unihub.app`,
    password,
  );
  const snapshot = await getDoc(doc(db, "users", result.user.uid));
  const data = snapshot.data();
  if (
    !data ||
    !["student", "teacher", "admin"].includes(String(data.role)) ||
    data.institutionId !== "akl"
  ) {
    await signOut(auth);
    throw new Error(
      "Your institution profile is unavailable. Contact your admin.",
    );
  }
  useStore.getState().setProfile({ ...data, uid: result.user.uid } as Profile);
}
export function observeAuth(onReady: () => void) {
  if (!auth || !db) {
    onReady();
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    try {
      if (user && db) {
        let profile: Profile | null = null;
        try {
          const snapshot = await getDoc(doc(db, "users", user.uid));
          const data = snapshot.data();
          if (
            data &&
            ["student", "teacher", "admin"].includes(String(data.role)) &&
            data.institutionId === "akl"
          ) {
            profile = { ...data, uid: user.uid } as Profile;
            cache.set("profile:" + user.uid, JSON.stringify(profile));
          }
        } catch {
          const saved = cache.get("profile:" + user.uid);
          if (saved) profile = JSON.parse(saved) as Profile;
        }
        useStore.getState().setProfile(profile);
      } else useStore.getState().setProfile(null);
    } catch {
      useStore.getState().setProfile(null);
    } finally {
      onReady();
    }
  });
}
export async function changePassword(password: string) {
  if (!auth?.currentUser || !db)
    throw new Error("Sign in again to change your password.");
  if (password.length < 12) throw new Error("Use at least 12 characters.");
  await updatePassword(auth.currentUser, password);
  await updateDoc(doc(db, "users", auth.currentUser.uid), {
    mustChangePassword: false,
  });
  const profile = useStore.getState().profile;
  if (profile)
    useStore.getState().setProfile({ ...profile, mustChangePassword: false });
}
export async function logout() {
  if (auth) await signOut(auth);
  useStore.getState().setProfile(null);
}
