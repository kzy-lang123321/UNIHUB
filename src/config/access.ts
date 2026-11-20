import type { Profile } from "../types";

// Temporary account-free mode. Enable explicitly when institution sign-in returns.
export const authenticationEnabled =
  process.env.EXPO_PUBLIC_AUTH_ENABLED === "true";

export function createGuestProfile(): Profile {
  return {
    uid: "demo",
    role: "student",
    institutionId: "akl",
    programId: "bs-cs",
    semester: 1,
    displayName: "Learner",
    mustChangePassword: false,
  };
}
