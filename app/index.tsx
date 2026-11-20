import { Redirect } from "expo-router";
import { useStore } from "../src/store";
export default function Index() {
  const p = useStore((s) => s.profile);
  return (
    <Redirect
      href={
        !p
          ? "/(auth)/login"
          : p.mustChangePassword
            ? "/(auth)/password"
            : p.role === "student"
              ? "/(student)"
              : p.role === "teacher"
                ? "/(teacher)"
                : "/(admin)/library"
      }
    />
  );
}
