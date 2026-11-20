import { create } from "zustand";
import { cache } from "../services/cache";
import { syncProgress } from "../services/progress";
import { Profile, Progress } from "../types";
interface State {
  profile: Profile | null;
  dark: boolean;
  setProfile: (profile: Profile | null) => void;
  toggleDark: () => void;
  revision: number;
  update: (code: string, patch: Partial<Progress>) => void;
}
export const useStore = create<State>((set, get) => ({
  profile: null,
  dark: cache.get("dark") === "true",
  setProfile: (profile) => set({ profile }),
  toggleDark: () =>
    set((s) => {
      cache.set("dark", String(!s.dark));
      return { dark: !s.dark };
    }),
  revision: 0,
  update: (code, patch) => {
    const uid = get().profile?.uid ?? "demo";
    cache.set(
      `progress:${uid}:${code}`,
      JSON.stringify({ ...readProgress(uid, code), ...patch }),
    );
    void syncProgress(uid, code).catch(() => {});
    set((s) => ({ revision: s.revision + 1 }));
  },
}));
export function readProgress(uid: string, code: string): Progress {
  const raw = cache.get(`progress:${uid}:${code}`);
  return raw
    ? (JSON.parse(raw) as Progress)
    : { completedUnits: [], bookmarks: [], quizScores: [] };
}
