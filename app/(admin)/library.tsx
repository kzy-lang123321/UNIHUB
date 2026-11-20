import { router } from "expo-router";
import { logout } from "../../src/features/auth/service";
import { AdminLibrary } from "../../src/features/library/AdminLibrary";

export default function Library() {
  return (
    <AdminLibrary
      onSignOut={async () => {
        await logout();
        router.replace("/(auth)/login");
      }}
    />
  );
}
