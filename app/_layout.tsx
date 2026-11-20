import React, { useEffect, useState } from "react";
import { Stack, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { observeAuth } from "../src/features/auth/service";
import { Label, Page } from "../src/components/ui";
import { DeviceLock } from "../src/components/DeviceLock";
import { StatusBar } from "expo-status-bar";
import { useStore } from "../src/store";
import {
  authenticationEnabled,
  createGuestProfile,
} from "../src/config/access";
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 300000, retry: 1 } },
});
export default function Layout() {
  const [ready, setReady] = useState(false);
  const route = useSegments().join("/");
  const feed = route === "(student)/lessons";
  const dark = useStore((state) => state.dark);
  useEffect(() => {
    if (!authenticationEnabled) {
      useStore.getState().setProfile(createGuestProfile());
      setReady(true);
      return;
    }
    return observeAuth(() => setReady(true));
  }, []);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <StatusBar style={feed || dark ? "light" : "dark"} />
        {ready ? (
          authenticationEnabled ? (
            <DeviceLock>
              <Stack screenOptions={{ headerShown: false }} />
            </DeviceLock>
          ) : (
            <Stack screenOptions={{ headerShown: false }} />
          )
        ) : (
          <Page>
            <Label>Opening your study space…</Label>
          </Page>
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
