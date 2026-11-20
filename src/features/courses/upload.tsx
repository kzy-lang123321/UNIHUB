import React, { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { ref, uploadBytesResumable } from "firebase/storage";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { Button, Card, Field, Label } from "../../components/ui";
import { db, storage } from "../../services/firebase";
import { useStore } from "../../store";
export function PaperUpload({ code }: { code: string }) {
  const profile = useStore((s) => s.profile)!;
  const [credit, setCredit] = useState("");
  const [permitted, setPermitted] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  async function pick() {
    try {
      if (!storage || !db) throw new Error("Configure Firebase Storage first.");
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset || !asset.size || asset.size >= 10 * 1024 * 1024)
        throw new Error("Choose a PDF smaller than 10 MB.");
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const path = `institutions/${profile.institutionId}/courses/${code}/${Date.now()}-${asset.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const task = uploadBytesResumable(ref(storage, path), blob, {
        contentType: "application/pdf",
      });
      setProgress(0);
      await new Promise<void>((resolve, reject) =>
        task.on(
          "state_changed",
          (snapshot) =>
            setProgress(snapshot.bytesTransferred / snapshot.totalBytes),
          reject,
          resolve,
        ),
      );
      await updateDoc(doc(db, "courses", code), {
        papers: arrayUnion({
          uni: credit.trim(),
          year: new Date().getFullYear(),
          type: "Assignment",
          fileUrl: path,
          solutionUrl: "",
        }),
      });
      setMessage(
        "PDF uploaded as an assignment. Publish the course when ready.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setProgress(null);
    }
  }
  return (
    <Card>
      <Label size={18}>Upload an original assignment PDF</Label>
      <Label muted>
        Under 10 MB. Copyrighted book PDFs are prohibited. Give the author or
        contributor credit.
      </Label>
      <Field
        placeholder="Credit line / contributor"
        value={credit}
        onChangeText={setCredit}
      />
      <Button
        secondary
        title={
          permitted
            ? "Permission confirmed ✓"
            : "I own this or have permission to share"
        }
        onPress={() => setPermitted(!permitted)}
      />
      <Button
        title={
          progress === null
            ? "Choose PDF & upload"
            : `Uploading ${Math.round(progress * 100)}%`
        }
        disabled={!permitted || !credit.trim() || progress !== null}
        onPress={() => {
          void pick();
        }}
      />
      <Label>{message}</Label>
    </Card>
  );
}
