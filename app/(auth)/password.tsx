import React, { useState } from "react";
import { Redirect, router } from "expo-router";
import { Button, Field, Heading, Label, Page } from "../../src/components/ui";
import { changePassword } from "../../src/features/auth/service";
import { authenticationEnabled } from "../../src/config/access";
export default function Password() {
  return authenticationEnabled ? <ChangePassword /> : <Redirect href="/" />;
}
function ChangePassword() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  return (
    <Page>
      <Heading>Make it yours</Heading>
      <Label>
        Set a new password before accessing your institution. Use at least 12
        characters.
      </Label>
      <Field
        secureTextEntry
        value={value}
        onChangeText={setValue}
        placeholder="New password"
      />
      <Label>{error}</Label>
      <Button
        title="Save password"
        onPress={() => {
          void changePassword(value)
            .then(() => router.replace("/"))
            .catch((e: unknown) =>
              setError(
                e instanceof Error ? e.message : "Try signing in again.",
              ),
            );
        }}
      />
    </Page>
  );
}
