import React, { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Button, Heading, Label, Page } from "./ui";
import { cache } from "../services/cache";
import { useStore } from "../store";
export function DeviceLock({ children }: { children: React.ReactNode }) {
  const profile = useStore((s) => s.profile);
  const [locked, setLocked] = useState(
    Boolean(profile && cache.get(`biometric:${profile.uid}`) === "true"),
  );
  const [error, setError] = useState("");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (
        state === "background" &&
        profile &&
        cache.get(`biometric:${profile.uid}`) === "true"
      )
        setLocked(true);
    });
    return () => subscription.remove();
  }, [profile]);
  if (!locked || !profile || Platform.OS === "web") return children;
  return (
    <Page>
      <Heading>Welcome back.</Heading>
      <Label>Unlock your study space with your device authentication.</Label>
      <Button
        title="Unlock UniHub"
        onPress={() => {
          void LocalAuthentication.authenticateAsync({
            promptMessage: "Unlock UniHub",
            disableDeviceFallback: false,
          }).then((result) => {
            if (result.success) setLocked(false);
            else setError("Unlock cancelled. Try again.");
          });
        }}
      />
      <Label>{error}</Label>
    </Page>
  );
}
export function BiometricSetting() {
  const p = useStore((s) => s.profile);
  const [enabled, setEnabled] = useState(
    p ? cache.get(`biometric:${p.uid}`) === "true" : false,
  );
  const [message, setMessage] = useState("");
  if (Platform.OS === "web" || !p) return null;
  return (
    <>
      <Button
        secondary
        title={enabled ? "Disable device unlock" : "Enable biometric unlock"}
        onPress={() => {
          void (async () => {
            if (enabled) {
              cache.remove(`biometric:${p.uid}`);
              setEnabled(false);
              return;
            }
            if (
              !(await LocalAuthentication.hasHardwareAsync()) ||
              !(await LocalAuthentication.isEnrolledAsync())
            ) {
              setMessage("Set up biometrics in your device settings first.");
              return;
            }
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: "Enable UniHub unlock",
            });
            if (result.success) {
              cache.set(`biometric:${p.uid}`, "true");
              setEnabled(true);
            }
          })();
        }}
      />
      {message ? <Label>{message}</Label> : null}
    </>
  );
}
