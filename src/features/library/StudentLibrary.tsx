import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Field,
  Heading,
  Label,
  Row,
  useColors,
} from "../../components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AcademicResource } from "./types";
import { getLibrary } from "./client";
import { openDocument, openSavedDocument, saveDocument } from "./documents";
import { cache } from "../../services/cache";
import { useStore } from "../../store";

export default function StudentLibrary() {
  const p = useStore((s) => s.profile)!;
  const c = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ search?: string; kind?: string }>();
  const [search, setSearch] = useState(params.search ?? ""),
    [kind, setKind] = useState(params.kind ?? "all"),
    [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setSearch(params.search ?? "");
    setKind(params.kind ?? "all");
    setSubject("");
  }, [params.search, params.kind]);
  const [working, setWorking] = useState("");
  const [revision, setRevision] = useState(0);
  const key = `academic-library:${p.uid}:${p.programId}:${p.semester}`;
  const savedKey = `academic-downloads:${p.uid}`;
  let saved: AcademicResource[] = [];
  try {
    saved = JSON.parse(cache.get(savedKey) ?? "[]") as AcademicResource[];
  } catch {}
  const query = useQuery({
    queryKey: ["academic-library", p.uid, p.programId, p.semester],
    queryFn: async () => {
      if (p.uid === "demo") return [];
      try {
        const result = (await getLibrary()).resources;
        cache.set(key, JSON.stringify(result));
        return result;
      } catch (error) {
        if (error instanceof TypeError) {
          const previous = cache.get(key);
          if (previous) return JSON.parse(previous) as AcademicResource[];
        }
        throw error;
      }
    },
  });
  const resources = query.data ?? [];
  const visible = (kind === "saved" ? saved : resources).filter(
    (r) =>
      (kind === "all" || kind === "saved" || r.kind === kind) &&
      (!subject || r.subject === subject) &&
      `${r.title} ${r.originalName} ${r.subject} ${r.department}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const subjects = [...new Set(resources.map((r) => r.subject))].sort();
  async function run(id: string, operation: () => Promise<void>) {
    setWorking(id);
    setMessage("");
    try {
      await operation();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Document could not be opened",
      );
    } finally {
      setWorking("");
    }
  }
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        paddingTop: Math.max(insets.top, 12),
      }}
    >
      <FlashList
        data={visible}
        extraData={revision}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 20 }}>
            <Heading>Academic Library</Heading>
            <Label muted>
              Akl Postgraduate College · {p.programId} · Semester {p.semester}
            </Label>
            <Label>
              Books, lecture notes and original documents approved for your
              program and semester.
            </Label>
            <Field
              accessibilityLabel="Search academic library"
              placeholder="Search title, original filename or subject"
              value={search}
              onChangeText={setSearch}
            />
            <ScrollView horizontal>
              <Row>
                {[
                  "all",
                  "book",
                  "notes",
                  "assignment",
                  "past-paper",
                  "handout",
                  "other",
                  "saved",
                ].map((value) => (
                  <Button
                    key={value}
                    secondary={kind !== value}
                    title={
                      value === "saved"
                        ? "Downloaded"
                        : value === "all"
                          ? "All resources"
                          : value
                    }
                    onPress={() => setKind(value)}
                  />
                ))}
              </Row>
            </ScrollView>
            {subjects.length ? (
              <ScrollView horizontal>
                <Row>
                  <Button
                    secondary={!!subject}
                    title="All subjects"
                    onPress={() => setSubject("")}
                  />
                  {subjects.map((value) => (
                    <Button
                      key={value}
                      secondary={subject !== value}
                      title={value}
                      onPress={() => setSubject(value)}
                    />
                  ))}
                </Row>
              </ScrollView>
            ) : null}
            <Button
              secondary
              title="Sync approved materials"
              onPress={() => {
                void query.refetch();
              }}
            />
            {query.error ? (
              <Card>
                <Label>The document service is unavailable.</Label>
                <Label muted>
                  {query.error.message} Downloaded documents remain available on
                  this device.
                </Label>
              </Card>
            ) : null}
            {message ? (
              <Card>
                <Label>{message}</Label>
              </Card>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Label muted>
              {item.institutionName} / {item.department} / {item.programId} /
              Semester {item.semester} / {item.subject}
            </Label>
            <Label size={20}>{item.title}</Label>
            <Label muted>
              {item.originalName} · {item.kind} ·{" "}
              {item.pages ? `${item.pages} pages · ` : ""}
              {(item.bytes / 1048576).toFixed(1)} MiB
            </Label>
            {item.description ? <Label>{item.description}</Label> : null}
            <Button
              title={`Open ${item.title}`}
              disabled={!!working}
              onPress={() => {
                void run(item.id, () =>
                  kind === "saved"
                    ? openSavedDocument(item.id, p.uid)
                    : openDocument(item),
                );
              }}
            />
            {item.downloadAllowed && kind !== "saved" ? (
              <Button
                secondary
                title={
                  working === item.id
                    ? "Downloading…"
                    : "Save original for offline reading"
                }
                disabled={!!working}
                onPress={() => {
                  void run(item.id, async () => {
                    await saveDocument(item, p.uid, (fraction) =>
                      setMessage(`Download: ${Math.round(fraction * 100)}%`),
                    );
                    const next = [
                      ...saved.filter((r) => r.id !== item.id),
                      item,
                    ];
                    cache.set(savedKey, JSON.stringify(next));
                    setRevision((n) => n + 1);
                    setMessage(
                      "Saved. Open Downloaded to read without internet.",
                    );
                  });
                }}
              />
            ) : kind !== "saved" ? (
              <Label muted>
                Offline downloads are disabled by your administrator.
              </Label>
            ) : null}
          </Card>
        )}
        ListEmptyComponent={
          <Card>
            <Heading>
              {query.isPending
                ? "Loading library…"
                : kind === "saved"
                  ? "No downloaded documents"
                  : "No published materials yet"}
            </Heading>
            <Label>
              {kind === "saved"
                ? "Save a permitted document while online to read it here later."
                : "Your college will publish the provided materials after classification and visibility review. Empty subjects stay available for future uploads."}
            </Label>
          </Card>
        }
      />
    </View>
  );
}
