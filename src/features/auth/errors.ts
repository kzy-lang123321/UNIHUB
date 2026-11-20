export function signInErrorCode(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return "unknown";
}

export function signInErrorMessage(error: unknown): string {
  switch (signInErrorCode(error)) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Username or password is incorrect. If you changed your temporary password, use your new password.";
    case "auth/network-request-failed":
    case "unavailable":
    case "deadline-exceeded":
      return "Cannot connect to sign-in. Check your phone's internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Wait a few minutes, then try again.";
    case "auth/user-disabled":
      return "Your account is disabled. Contact your administrator.";
    case "permission-denied":
      return "Your account signed in, but your college profile could not be accessed. Contact your administrator.";
    case "auth/operation-not-allowed":
    case "auth/app-not-authorized":
    case "auth/invalid-api-key":
    case "auth/unauthorized-domain":
      return "College sign-in needs an administrator's attention. Please contact your administrator.";
    default:
      return error instanceof Error && !error.message.startsWith("Firebase:")
        ? error.message
        : "Sign-in could not finish. Please try again.";
  }
}
