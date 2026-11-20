import { test } from "node:test";
import assert from "node:assert/strict";
import { createGuestProfile } from "../src/config/access";
import {
  canReadResource,
  isLibraryAdmin,
} from "../src/features/library/policy";
import type { AcademicResource } from "../src/features/library/types";

test("account-free entry is a student session and cannot read private drafts", () => {
  const guest = createGuestProfile();
  assert.equal(guest.role, "student");
  assert.equal(guest.mustChangePassword, false);
  assert.equal(isLibraryAdmin(guest), false);
  const draft = {
    institutionId: guest.institutionId,
    programId: guest.programId,
    semester: guest.semester,
    published: false,
    deleted: false,
    classificationConfirmed: false,
    visibilityConfirmed: false,
  } as AcademicResource;
  assert.equal(canReadResource(draft, guest), false);
  guest.role = "admin";
  assert.equal(createGuestProfile().role, "student");
});
