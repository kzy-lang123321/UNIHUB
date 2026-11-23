import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Button, Card, Field, Heading, Label, Row, useColors } from "../../components/ui";
import {
  BOOK_CATEGORIES,
  EDUCATION_LEVELS,
  uploadCommunityBook,
} from "./service";
import { CommunityBook, EducationLevel } from "./types";
import { useStore } from "../../store";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (book: CommunityBook) => void;
}

export function CommunityUploadModal({ visible, onClose, onSuccess }: Props) {
  const profile = useStore((s) => s.profile);
  const c = useColors();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>("Computer Science");
  const [department, setDepartment] = useState(profile?.programId?.toUpperCase() ?? "Computer Science");
  const [educationLevel, setEducationLevel] = useState<EducationLevel>("Undergraduate");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [copyrightAgreed, setCopyrightAgreed] = useState(false);

  // File state
  const [file, setFile] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handlePickPdf() {
    setError("");
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || !res.assets[0]) return;

      const asset = res.assets[0];
      if (asset.size && asset.size > 50 * 1024 * 1024) {
        throw new Error("File exceeds 50 MB limit. Please select a smaller PDF.");
      }

      setFile({
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? 1024,
        mimeType: asset.mimeType ?? "application/pdf",
      });

      // Autofill title from filename if title is empty
      if (!title.trim()) {
        const cleanName = asset.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " ");
        setTitle(cleanName);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to pick file.");
    }
  }

  async function handleSubmit() {
    if (!profile) return;
    setError("");

    if (!file) {
      setError("Please choose a PDF document to contribute.");
      return;
    }
    if (!title.trim()) {
      setError("Please provide the book or note title.");
      return;
    }
    if (!author.trim()) {
      setError("Please provide the author or lecturer name.");
      return;
    }
    if (!subject.trim()) {
      setError("Please specify the course subject.");
      return;
    }
    if (!copyrightAgreed) {
      setError("You must confirm copyright & academic fair-use guidelines.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await uploadCommunityBook({
        uploaderUid: profile.uid,
        uploaderName: profile.displayName,
        uploaderRole: profile.role,
        uploaderAvatar: profile.avatarUrl,
        institutionId: profile.institutionId || "akl",
        title: title.trim(),
        author: author.trim(),
        subject: subject.trim(),
        description: description.trim(),
        category,
        department: department.trim(),
        educationLevel,
        coverUrl: coverUrl.trim() || undefined,
        fileUrl: file.uri,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.mimeType,
        copyrightAgreed: true,
      });

      // Reset
      setTitle("");
      setAuthor("");
      setSubject("");
      setDescription("");
      setCoverUrl("");
      setFile(null);
      setCopyrightAgreed(false);

      onSuccess(created);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.65)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: c.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "92%",
            paddingTop: 20,
            paddingBottom: 30,
            paddingHorizontal: 20,
          }}
        >
          <Row>
            <View style={{ flex: 1 }}>
              <Label muted size={12}>
                COMMUNITY BOOK CONTRIBUTION
              </Label>
              <Heading>Upload Book / Notes</Heading>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close upload modal"
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: c.tint,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: c.accent, fontSize: 18, fontWeight: "700" }}>✕</Text>
            </Pressable>
          </Row>

          <ScrollView style={{ marginTop: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 16, paddingBottom: 20 }}>
              {/* Important Review Notice */}
              <Card accent>
                <Label size={13}>
                  ℹ️ <Text style={{ fontWeight: "700" }}>Pending Review Notice:</Text> Uploaded
                  books initially enter a pending-review state. Administrators review content to
                  ensure academic relevance and copyright compliance before publication.
                </Label>
              </Card>

              {error ? (
                <View
                  style={{
                    backgroundColor: "#FFEBEE",
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#FFCDD2",
                  }}
                >
                  <Text style={{ color: "#C62828", fontSize: 13, fontWeight: "600" }}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* PDF File Picker */}
              <Card>
                <Label size={14}>Select PDF Document *</Label>
                {file ? (
                  <View
                    style={{
                      padding: 12,
                      backgroundColor: c.tint,
                      borderRadius: 12,
                      gap: 4,
                    }}
                  >
                    <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>
                      📄 {file.name}
                    </Text>
                    <Label muted size={12}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to submit
                    </Label>
                    <Pressable onPress={() => setFile(null)} style={{ marginTop: 6 }}>
                      <Text style={{ color: "#E53935", fontSize: 12, fontWeight: "600" }}>
                        Remove & choose another file
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Button
                    secondary
                    title="Choose PDF File from Device"
                    onPress={handlePickPdf}
                  />
                )}
              </Card>

              {/* Book Metadata */}
              <Field label="Book / Material Title *">
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Operating Systems: Three Easy Pieces"
                  placeholderTextColor={c.muted}
                  style={{
                    backgroundColor: c.card,
                    color: c.text,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                />
              </Field>

              <Field label="Author / Instructor *">
                <TextInput
                  value={author}
                  onChangeText={setAuthor}
                  placeholder="e.g. Remzi H. Arpaci-Dusseau"
                  placeholderTextColor={c.muted}
                  style={{
                    backgroundColor: c.card,
                    color: c.text,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                />
              </Field>

              <Field label="Subject / Course *">
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="e.g. Operating Systems / CS-301"
                  placeholderTextColor={c.muted}
                  style={{
                    backgroundColor: c.card,
                    color: c.text,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                />
              </Field>

              {/* Category selector */}
              <View style={{ gap: 8 }}>
                <Label size={13}>Category *</Label>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {BOOK_CATEGORIES.filter((cat) => cat !== "All").map((cat) => {
                      const sel = category === cat;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => setCategory(cat)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: sel ? c.accent : c.card,
                            borderWidth: 1,
                            borderColor: sel ? c.accent : c.border,
                          }}
                        >
                          <Text
                            style={{
                              color: sel ? "#FFFFFF" : c.text,
                              fontSize: 13,
                              fontWeight: sel ? "700" : "500",
                            }}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Education Level selector */}
              <View style={{ gap: 8 }}>
                <Label size={13}>Education Level *</Label>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {EDUCATION_LEVELS.map((level) => {
                    const sel = educationLevel === level;
                    return (
                      <Pressable
                        key={level}
                        onPress={() => setEducationLevel(level)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: sel ? c.accent : c.card,
                          borderWidth: 1,
                          borderColor: sel ? c.accent : c.border,
                        }}
                      >
                        <Text
                          style={{
                            color: sel ? "#FFFFFF" : c.text,
                            fontSize: 13,
                            fontWeight: sel ? "700" : "500",
                          }}
                        >
                          {level}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Field label="Department">
                <TextInput
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="e.g. Computer Science / Management"
                  placeholderTextColor={c.muted}
                  style={{
                    backgroundColor: c.card,
                    color: c.text,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                />
              </Field>

              <Field label="Description & Overview">
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  placeholder="Brief summary of chapters, syllabus topics, and notes included..."
                  placeholderTextColor={c.muted}
                  style={{
                    backgroundColor: c.card,
                    color: c.text,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                    minHeight: 70,
                    textAlignVertical: "top",
                  }}
                />
              </Field>

              <Field label="Optional Cover Image URL">
                <TextInput
                  value={coverUrl}
                  onChangeText={setCoverUrl}
                  placeholder="https://example.com/cover.jpg"
                  placeholderTextColor={c.muted}
                  style={{
                    backgroundColor: c.card,
                    color: c.text,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                />
              </Field>

              {/* Copyright declaration */}
              <Pressable
                onPress={() => setCopyrightAgreed(!copyrightAgreed)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: c.card,
                  borderWidth: 1,
                  borderColor: copyrightAgreed ? c.accent : c.border,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: copyrightAgreed ? c.accent : c.muted,
                    backgroundColor: copyrightAgreed ? c.accent : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {copyrightAgreed ? (
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900" }}>✓</Text>
                  ) : null}
                </View>
                <Text style={{ flex: 1, color: c.text, fontSize: 13, lineHeight: 18 }}>
                  I confirm that this contribution complies with institutional fair-use and
                  copyright rules, and does not contain copyrighted or restricted material.
                </Text>
              </Pressable>

              <Button
                title={submitting ? "Uploading Book..." : "Submit for Review →"}
                onPress={handleSubmit}
                disabled={submitting}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
