import React from "react";
import { router } from "expo-router";
import { Button, Heading, Label, Page } from "../../src/components/ui";
import { logout } from "../../src/features/auth/service";
import { useStore } from "../../src/store";
export default function Profile() {
  const p = useStore((s) => s.profile)!;
  return (
    <Page>
      <Heading>{p.displayName}</Heading>
      <Label>Teacher · Akl Postgraduate College</Label>
      <Button
        secondary
        title="Toggle dark mode"
        onPress={() => useStore.getState().toggleDark()}
      />
      <Button
        title="Sign out"
        onPress={() => {
          void logout().then(() => router.replace("/"));
        }}
      />
    </Page>
  );
}
