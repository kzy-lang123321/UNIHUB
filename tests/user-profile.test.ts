import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateProfileUpdate,
  updateUserProfile,
  getCachedProfile,
  saveCachedProfile,
} from "../src/features/profile/service";
import { cache } from "../src/services/cache";
import { useStore } from "../src/store";
import { Profile } from "../src/types";

test("validates profile updates properly", () => {
  // Empty display name should fail
  assert.equal(validateProfileUpdate({ displayName: "   " }).valid, false);

  // Invalid username characters or length should fail
  assert.equal(validateProfileUpdate({ username: "a" }).valid, false);
  assert.equal(validateProfileUpdate({ username: "invalid space" }).valid, false);
  assert.equal(validateProfileUpdate({ username: "valid.user_123" }).valid, true);

  // Overlong bio should fail
  const longBio = "a".repeat(501);
  assert.equal(validateProfileUpdate({ bio: longBio }).valid, false);

  // Valid phone should pass
  assert.equal(validateProfileUpdate({ phone: "+92 300 1234567" }).valid, true);
  assert.equal(validateProfileUpdate({ phone: "invalid phone letters" }).valid, false);
});

test("updates user profile in local cache and store correctly", async () => {
  const initialProfile: Profile = {
    uid: "test-user-01",
    role: "student",
    institutionId: "akl",
    programId: "bs-cs",
    semester: 4,
    displayName: "Original Name",
    mustChangePassword: false,
  };

  useStore.getState().setProfile(initialProfile);
  saveCachedProfile(initialProfile);

  const updated = await updateUserProfile("test-user-01", {
    displayName: "Updated Name",
    username: "updated_username",
    bio: "Passionate about Computer Science and AI.",
    interests: ["React Native", "Machine Learning", "Algorithms"],
    isProfilePublic: true,
  });

  assert.equal(updated.displayName, "Updated Name");
  assert.equal(updated.username, "updated_username");
  assert.equal(updated.bio, "Passionate about Computer Science and AI.");
  assert.deepEqual(updated.interests, ["React Native", "Machine Learning", "Algorithms"]);
  assert.equal(updated.isProfilePublic, true);

  // Check cached version
  const cached = getCachedProfile("test-user-01");
  assert.equal(cached?.displayName, "Updated Name");

  // Check store version
  const storeProfile = useStore.getState().profile;
  assert.equal(storeProfile?.displayName, "Updated Name");
});
