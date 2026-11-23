import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { cache } from "../../services/cache";
import { useStore } from "../../store";
import { Profile } from "../../types";

const PROFILE_CACHE_PREFIX = "profile:";

export function getCachedProfile(uid: string): Profile | null {
  const raw = cache.get(PROFILE_CACHE_PREFIX + uid);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function saveCachedProfile(profile: Profile): void {
  cache.set(PROFILE_CACHE_PREFIX + profile.uid, JSON.stringify(profile));
  // If this profile belongs to the currently active user in store, update store too
  const current = useStore.getState().profile;
  if (current?.uid === profile.uid) {
    useStore.getState().setProfile(profile);
  }
}

export async function fetchProfile(uid: string): Promise<Profile | null> {
  // Check local cache first
  const cached = getCachedProfile(uid);

  if (!db || uid === "demo") {
    return cached;
  }

  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      const profile: Profile = {
        ...(cached ?? {}),
        ...data,
        uid,
      } as Profile;
      saveCachedProfile(profile);
      return profile;
    }
  } catch {
    // Return cached if offline or error
  }

  return cached;
}

export interface ProfileUpdateInput {
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  email?: string;
  phone?: string;
  institutionName?: string;
  fieldOfStudy?: string;
  degreeLevel?: string;
  interests?: string[];
  website?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  isProfilePublic?: boolean;
}

export function validateProfileUpdate(input: ProfileUpdateInput): { valid: boolean; error?: string } {
  if (input.displayName !== undefined && !input.displayName.trim()) {
    return { valid: false, error: "Display name cannot be empty." };
  }
  if (input.username !== undefined && input.username.trim()) {
    if (!/^[a-z0-9_.-]{3,30}$/i.test(input.username.trim())) {
      return {
        valid: false,
        error: "Username must be 3-30 characters and contain letters, numbers, dots, hyphens or underscores.",
      };
    }
  }
  if (input.bio !== undefined && input.bio.length > 500) {
    return { valid: false, error: "Bio cannot exceed 500 characters." };
  }
  if (input.phone !== undefined && input.phone.trim()) {
    if (!/^[+0-9\s()-]{7,20}$/.test(input.phone.trim())) {
      return { valid: false, error: "Please enter a valid phone number." };
    }
  }
  return { valid: true };
}

export async function updateUserProfile(
  uid: string,
  updates: ProfileUpdateInput,
): Promise<Profile> {
  const validation = validateProfileUpdate(updates);
  if (!validation.valid) {
    throw new Error(validation.error ?? "Invalid profile data.");
  }

  const existing = getCachedProfile(uid) ?? useStore.getState().profile;
  if (!existing) {
    throw new Error("No existing profile found for user.");
  }

  const cleanUpdates: Partial<Profile> = {
    ...updates,
    displayName: updates.displayName?.trim() ?? existing.displayName,
    username: updates.username !== undefined ? updates.username.trim().toLowerCase() : existing.username,
    bio: updates.bio !== undefined ? updates.bio.trim() : existing.bio,
    updatedAt: new Date().toISOString(),
  };

  const updatedProfile: Profile = {
    ...existing,
    ...cleanUpdates,
  };

  saveCachedProfile(updatedProfile);

  // Sync to Firestore if authenticated & not demo
  if (db && uid !== "demo") {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        ...cleanUpdates,
        updatedAt: updatedProfile.updatedAt,
      });
    } catch {
      // Local cache remains updated for offline resilience
    }
  }

  return updatedProfile;
}
