import React, { useState } from "react";
import { Linking } from "react-native";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../services/firebase";
import { Button, Label } from "./ui";
export function PaperLink({ path, title }: { path: string; title: string }) {
  const [error, setError] = useState("");
  return (
    <>
      <Button
        secondary
        title={title}
        onPress={() => {
          void (async () => {
            try {
              if (!storage && !path.startsWith("https://"))
                throw new Error("Storage is unavailable.");
              const url = path.startsWith("https://")
                ? path
                : await getDownloadURL(ref(storage!, path));
              await Linking.openURL(url);
            } catch {
              setError(
                "Unable to open this file. Check your connection and access.",
              );
            }
          })();
        }}
      />
      {error ? <Label>{error}</Label> : null}
    </>
  );
}
