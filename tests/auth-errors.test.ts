import { test } from "node:test";
import assert from "node:assert/strict";
import {
  signInErrorCode,
  signInErrorMessage,
} from "../src/features/auth/errors";

test("mobile sign-in distinguishes connectivity failures from rejected credentials", () => {
  const network = signInErrorMessage({ code: "auth/network-request-failed" });
  assert.match(network, /internet connection/);
  assert.doesNotMatch(network, /password is incorrect/);
  assert.match(
    signInErrorMessage({ code: "auth/invalid-credential" }),
    /new password/,
  );
});

test("profile access and throttling do not get reported as wrong passwords", () => {
  assert.match(signInErrorMessage({ code: "permission-denied" }), /profile/);
  assert.match(signInErrorMessage({ code: "auth/too-many-requests" }), /Wait/);
  assert.equal(
    signInErrorCode({
      code: "auth/network-request-failed",
      password: "private",
    }),
    "auth/network-request-failed",
  );
  assert.equal(
    signInErrorMessage(new Error("Use your institution username.")),
    "Use your institution username.",
  );
  assert.equal(
    signInErrorMessage({
      code: "auth/unknown",
      message: "private server response",
    }),
    "Sign-in could not finish. Please try again.",
  );
});
