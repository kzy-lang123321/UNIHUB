import React, { useEffect, useState } from "react";
import { Image, Modal, Platform, ScrollView, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  Button,
  Card,
  Field,
  Heading,
  Label,
  Page,
  Row,
} from "../../components/ui";
import { AcademicResource, ResourceKind } from "./types";
import {
  getLibrary,
  libraryRequest,
  libraryUrl,
  LibraryResponse,
  updateResource,
  uploadOriginal,
} from "./client";
import { openDocument } from "./documents";

export function AdminLibrary({
  onSignOut,
}: { onSignOut?: () => Promise<void> } = {}) {
  const [data, setData] = useState<LibraryResponse | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<AcademicResource | null>(null);
  const [preview, setPreview] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const [showExcludedMembers, setShowExcludedMembers] = useState(false);
  useEffect(() => setPage(0), [search, filter]);
  const [bulk, setBulk] = useState({
    department: "",
    programId: "",
    semester: "",
    subject: "",
    kind: "notes",
  });
  async function refresh() {
    try {
      setData(await getLibrary());
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Cannot load the library",
      );
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function change(
    resource: AcademicResource,
    changes: Partial<AcademicResource>,
  ) {
    setBusy(true);
    try {
      await updateResource(resource, changes);
      await refresh();
      setError("");
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Save failed");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function upload(
    files: { uri: string; name: string; size?: number }[],
    replacement?: string,
  ) {
    setBusy(true);
    for (const file of files) {
      setLog((rows) => [...rows, `${file.name}: uploading…`]);
      try {
        await uploadOriginal(
          file,
          (fraction) =>
            setLog((rows) => [
              ...rows.slice(0, -1),
              `${file.name}: ${Math.round(fraction * 100)}%${fraction === 1 ? " · processing original…" : ""}`,
            ]),
          replacement,
        );
        setLog((rows) => [
          ...rows.slice(0, -1),
          `${file.name}: processed; review classification`,
        ]);
      } catch (error) {
        setLog((rows) => [
          ...rows.slice(0, -1),
          `${file.name}: FAILED · ${error instanceof Error ? error.message : "Try again"}`,
        ]);
      }
    }
    setBusy(false);
    setEditing(null);
    await refresh();
  }
  async function pick(replacement?: string) {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: !replacement,
      copyToCacheDirectory: true,
    });
    if (!result.canceled)
      await upload(
        result.assets.map((a) => ({ uri: a.uri, name: a.name, size: a.size })),
        replacement,
      );
  }
  function folder() {
    if (Platform.OS !== "web") {
      setError("Choose a ZIP archive to import a folder on Android or iOS.");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.setAttribute("webkitdirectory", "");
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      const selections = files.map((f) => ({
        uri: URL.createObjectURL(f),
        name: f.webkitRelativePath || f.name,
        size: f.size,
      }));
      void upload(selections).finally(() =>
        selections.forEach((f) => URL.revokeObjectURL(f.uri)),
      );
    };
    input.click();
  }
  const rows = (data?.resources ?? []).filter(
    (r) =>
      (filter === "deleted" ? r.deleted : !r.deleted) &&
      (showExcludedMembers ||
        !(r.source === "archive" && r.status === "excluded")) &&
      (filter !== "unclassified" || !r.classificationConfirmed) &&
      (filter !== "failed" ||
        ["corrupt", "unsupported", "needs-conversion", "excluded"].includes(
          r.status,
        )) &&
      (filter !== "published" || r.published) &&
      `${r.title} ${r.originalName} ${r.relativePath} ${r.subject} ${r.programId}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const stats = data?.stats;
  const updateEdit = (changes: Partial<AcademicResource>) =>
    setEditing((current) => (current ? { ...current, ...changes } : null));
  async function showPreview(resource: AcademicResource) {
    setEditing({ ...resource });
    setPreview("");
    if (resource.hasPreview) {
      try {
        const ticket = await libraryRequest<{ path: string }>(
          `/api/materials/${resource.id}/ticket`,
          "POST",
          { download: false, preview: true },
        );
        // Preview itself remains authenticated; use a dedicated short-lived ticket.
        setPreview(libraryUrl + ticket.path);
      } catch {}
    }
  }
  return (
    <Page>
      <Row>
        <Label muted>INSTITUTION ADMIN</Label>
        {onSignOut ? (
          <Button
            secondary
            title="Sign out"
            disabled={busy}
            onPress={() => {
              setBusy(true);
              void onSignOut()
                .catch(() => setError("Could not sign out. Please try again."))
                .finally(() => setBusy(false));
            }}
          />
        ) : null}
      </Row>
      <Heading>Initial Academic Library</Heading>
      <Label>
        Original files stay intact. Suggestions are drafts until you confirm
        classification and student visibility.
      </Label>
      <Card>
        <Label size={18}>Private local file storage</Label>
        <Label muted>
          Originals are served from your computer. Firebase stores the library
          records. Cloud Storage uploads: 0 · Free Spark plan.
        </Label>
      </Card>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {[
          ["Total documents", stats?.totalDocuments],
          ["Classified books", stats?.uploadedBooks],
          ["Classified notes", stats?.uploadedNotes],
          ["Awaiting classification", stats?.awaitingClassification],
          ["Successfully processed", stats?.processed],
          ["Failed uploads / processing", stats?.failed],
          ["Exact duplicates", stats?.duplicates],
          ["Published", stats?.published],
        ].map(([label, value]) => (
          <View key={String(label)} style={{ width: "47%" }}>
            <Card>
              <Label size={22}>{value ?? "—"}</Label>
              <Label muted>{label}</Label>
            </Card>
          </View>
        ))}
      </View>
      <Label muted>
        Local originals: {((stats?.localBytes ?? 0) / 1024 ** 3).toFixed(2)} GiB
        · Cloud file storage: {stats?.uploadedBytes ?? 0} bytes
      </Label>
      <Row>
        <Button
          title="Upload files or ZIP"
          disabled={busy}
          onPress={() => {
            void pick();
          }}
        />
        <Button
          secondary
          title="Import folder"
          disabled={busy}
          onPress={folder}
        />
      </Row>
      <Button
        secondary
        title="Refresh library"
        disabled={busy}
        onPress={() => {
          void refresh();
        }}
      />
      {error ? (
        <Card>
          <Label>{error}</Label>
          <Label muted>
            Keep the local document service running. Originals have not been
            removed.
          </Label>
        </Card>
      ) : null}
      {log.length ? (
        <Card>
          <Label size={18}>Import progress</Label>
          {log.map((line, i) => (
            <Label key={i}>{line}</Label>
          ))}
        </Card>
      ) : null}
      {(data?.importIssues ?? []).map((issue, i) => (
        <Card key={i}>
          <Label>{issue.name}</Label>
          <Label muted>{issue.error}</Label>
        </Card>
      ))}
      <Field
        accessibilityLabel="Search initial library"
        placeholder="Search filename, subject, title or program"
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView horizontal>
        <Row>
          {[
            ["all", "All documents"],
            ["unclassified", "Unclassified Materials"],
            ["failed", "Needs attention"],
            ["published", "Published"],
            ["deleted", "Archived / deleted"],
          ].map(([key, title]) => (
            <Button
              key={key}
              secondary={filter !== key}
              title={title!}
              onPress={() => setFilter(key!)}
            />
          ))}
        </Row>
      </ScrollView>
      <Button
        secondary
        title={
          showExcludedMembers
            ? "Hide excluded archive entries"
            : "Show excluded archive entry report"
        }
        onPress={() => {
          setShowExcludedMembers((value) => !value);
          setPage(0);
        }}
      />
      {selected.length ? (
        <Card>
          <Label size={18}>
            Categorize {selected.length} selected documents
          </Label>
          {(
            ["department", "programId", "semester", "subject", "kind"] as const
          ).map((key) => (
            <Field
              key={key}
              accessibilityLabel={`Bulk ${key}`}
              placeholder={key}
              value={bulk[key]}
              onChangeText={(value) => setBulk((s) => ({ ...s, [key]: value }))}
            />
          ))}
          <Button
            title="Apply bulk classification draft"
            disabled={busy}
            onPress={() => {
              void (async () => {
                for (const resource of data?.resources.filter((r) =>
                  selected.includes(r.id),
                ) ?? []) {
                  if (
                    !(await change(resource, {
                      ...bulk,
                      semester: Number(bulk.semester) || null,
                      kind: bulk.kind as ResourceKind,
                      classificationConfirmed: false,
                      visibilityConfirmed: false,
                      published: false,
                    }))
                  )
                    break;
                }
                setSelected([]);
              })();
            }}
          />
        </Card>
      ) : null}
      {rows.slice(page * 25, page * 25 + 25).map((resource) => (
        <Card key={resource.id}>
          <Label size={18}>{resource.title}</Label>
          <Label muted>{resource.originalName}</Label>
          <Label muted>{resource.relativePath}</Label>
          <Label>
            {resource.published ? "Published" : "Not published"} ·{" "}
            {resource.status} · {(resource.bytes / 1048576).toFixed(1)} MiB
            {resource.duplicateOf ? " · Exact duplicate" : ""}
          </Label>
          {resource.issue ? <Label muted>{resource.issue}</Label> : null}
          <Row>
            <Button
              secondary
              title={selected.includes(resource.id) ? "Selected ✓" : "Select"}
              onPress={() =>
                setSelected((ids) =>
                  ids.includes(resource.id)
                    ? ids.filter((id) => id !== resource.id)
                    : [...ids, resource.id],
                )
              }
            />
            <Button
              title={`Review ${resource.originalName}`}
              onPress={() => {
                void showPreview(resource);
              }}
            />
          </Row>
        </Card>
      ))}
      {rows.length > 25 ? (
        <>
          <Label muted>
            Page {page + 1} of {Math.ceil(rows.length / 25)} · {rows.length}{" "}
            results
          </Label>
          <Row>
            <Button
              secondary
              title="Previous results"
              disabled={!page}
              onPress={() => setPage((n) => n - 1)}
            />
            <Button
              secondary
              title="Next results"
              disabled={(page + 1) * 25 >= rows.length}
              onPress={() => setPage((n) => n + 1)}
            />
          </Row>
        </>
      ) : null}
      {!rows.length && data ? (
        <Card>
          <Label>No documents match these filters.</Label>
        </Card>
      ) : null}
      <Modal
        visible={!!editing}
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <Page>
          {editing ? (
            <>
              <Heading>Review document</Heading>
              <Label>{editing.originalName}</Label>
              <Label muted>
                Original filename is preserved. Changes create a backup and a
                new metadata version.
              </Label>
              {preview ? (
                <Image
                  source={{ uri: preview }}
                  style={{ width: "100%", height: 280, resizeMode: "contain" }}
                  accessibilityLabel="Original document preview"
                />
              ) : null}
              <Card>
                <Label size={18}>Source preview</Label>
                <Label>
                  {editing.previewText ||
                    editing.issue ||
                    "No extractable text; open the original for review."}
                </Label>
                <Button
                  secondary
                  title="Open original / readable preview"
                  onPress={() => {
                    void openDocument(editing).catch((e: Error) =>
                      setError(e.message),
                    );
                  }}
                />
              </Card>
              <Card>
                <Label size={18}>Suggested classification</Label>
                <Label>
                  {editing.suggestions.department || "Unclassified department"}{" "}
                  · {editing.suggestions.programId || "Unclassified program"} ·{" "}
                  {editing.suggestions.semester
                    ? `Semester ${editing.suggestions.semester}`
                    : "Semester unknown"}
                </Label>
                <Label>
                  {editing.suggestions.subject || "Subject needs review"} ·{" "}
                  {editing.suggestions.kind}
                </Label>
                <Label muted>{editing.suggestions.reasons.join(". ")}</Label>
                <Button
                  secondary
                  title="Use suggestions as a draft"
                  onPress={() =>
                    updateEdit({
                      department: editing.suggestions.department,
                      programId: editing.suggestions.programId,
                      semester: editing.suggestions.semester,
                      subject: editing.suggestions.subject,
                      kind: editing.suggestions.kind,
                      published: false,
                      classificationConfirmed: false,
                      visibilityConfirmed: false,
                    })
                  }
                />
              </Card>
              {(
                [
                  "title",
                  "description",
                  "department",
                  "programId",
                  "subject",
                ] as const
              ).map((key) => (
                <View key={key}>
                  <Label>{key}</Label>
                  <Field
                    accessibilityLabel={`Document ${key}`}
                    value={editing[key]}
                    onChangeText={(value) =>
                      updateEdit({
                        [key]: value,
                        classificationConfirmed: false,
                        published: false,
                      })
                    }
                  />
                </View>
              ))}
              <Label>Semester</Label>
              <Field
                accessibilityLabel="Document semester"
                placeholder="1–8, leave blank if unknown"
                keyboardType="number-pad"
                value={editing.semester?.toString() ?? ""}
                onChangeText={(value) =>
                  updateEdit({
                    semester: value ? Number(value) : null,
                    classificationConfirmed: false,
                    published: false,
                  })
                }
              />
              <ScrollView horizontal>
                <Row>
                  {(
                    [
                      "book",
                      "notes",
                      "assignment",
                      "past-paper",
                      "handout",
                      "other",
                    ] as const
                  ).map((kind) => (
                    <Button
                      key={kind}
                      title={kind}
                      secondary={editing.kind !== kind}
                      onPress={() =>
                        updateEdit({
                          kind,
                          classificationConfirmed: false,
                          published: false,
                        })
                      }
                    />
                  ))}
                </Row>
              </ScrollView>
              <Button
                secondary
                title={
                  editing.classificationConfirmed
                    ? "Classification confirmed ✓"
                    : "Confirm correct classification"
                }
                onPress={() =>
                  updateEdit({
                    classificationConfirmed: !editing.classificationConfirmed,
                    published: false,
                  })
                }
              />
              <Button
                secondary
                title={
                  editing.visibilityConfirmed
                    ? "Student visibility confirmed ✓"
                    : "Confirm student program and semester visibility"
                }
                onPress={() =>
                  updateEdit({
                    visibilityConfirmed: !editing.visibilityConfirmed,
                    published: false,
                  })
                }
              />
              <Button
                secondary
                title={
                  editing.downloadAllowed
                    ? "Offline downloads allowed ✓"
                    : "Offline downloads disabled"
                }
                onPress={() =>
                  updateEdit({ downloadAllowed: !editing.downloadAllowed })
                }
              />
              <Button
                title="Save review without publishing"
                disabled={busy}
                onPress={() => {
                  const {
                    title,
                    description,
                    department,
                    programId,
                    semester,
                    subject,
                    kind,
                    classificationConfirmed,
                    visibilityConfirmed,
                    downloadAllowed,
                  } = editing;
                  void change(editing, {
                    title,
                    description,
                    department,
                    programId,
                    semester,
                    subject,
                    kind,
                    classificationConfirmed,
                    visibilityConfirmed,
                    downloadAllowed,
                    published: false,
                  }).then((ok) => {
                    if (ok) setEditing(null);
                  });
                }}
              />
              <Button
                title="Save and publish to assigned students"
                disabled={busy}
                onPress={() => {
                  const {
                    title,
                    description,
                    department,
                    programId,
                    semester,
                    subject,
                    kind,
                    classificationConfirmed,
                    visibilityConfirmed,
                    downloadAllowed,
                  } = editing;
                  void change(editing, {
                    title,
                    description,
                    department,
                    programId,
                    semester,
                    subject,
                    kind,
                    classificationConfirmed,
                    visibilityConfirmed,
                    downloadAllowed,
                    published: true,
                  }).then((ok) => {
                    if (ok) setEditing(null);
                  });
                }}
              />
              {editing.published ? (
                <Button
                  secondary
                  title="Unpublish document"
                  onPress={() => {
                    void change(editing, { published: false }).then((ok) => {
                      if (ok) setEditing(null);
                    });
                  }}
                />
              ) : null}
              <Button
                secondary
                title="Replace document (keep original backup)"
                disabled={busy}
                onPress={() => {
                  void pick(editing.id);
                }}
              />
              <Button
                secondary
                title="Delete from library (retain original backup)"
                disabled={busy}
                onPress={() => {
                  void change(editing, {
                    deleted: true,
                    published: false,
                  }).then((ok) => {
                    if (ok) setEditing(null);
                  });
                }}
              />
              {editing.deleted ? (
                <Button
                  secondary
                  title="Restore archived document"
                  onPress={() => {
                    void change(editing, {
                      deleted: false,
                      published: false,
                    }).then((ok) => {
                      if (ok) setEditing(null);
                    });
                  }}
                />
              ) : null}
              {error ? <Label>{error}</Label> : null}
              <Button
                secondary
                title="Close review"
                onPress={() => setEditing(null)}
              />
            </>
          ) : null}
        </Page>
      </Modal>
    </Page>
  );
}
