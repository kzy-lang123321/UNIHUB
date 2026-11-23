import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Heading,
  Label,
  Page,
  Row,
  useColors,
} from "../../src/components/ui";
import { SocialIcon } from "../../src/components/SocialIcon";
import { useStore } from "../../src/store";
import {
  BOOK_CATEGORIES,
  EDUCATION_LEVELS,
  deleteCommunityBook,
  fetchCommunityBooks,
  incrementBookStats,
  updateCommunityBook,
} from "../../src/features/community/service";
import { CommunityBook } from "../../src/features/community/types";
import { CommunityUploadModal } from "../../src/features/community/CommunityUploadModal";

export default function CommunityLibraryScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const params = useLocalSearchParams<{ tab?: string; category?: string }>();

  const [activeTab, setActiveTab] = useState<"explore" | "my-uploads">(
    params.tab === "my-uploads" ? "my-uploads" : "explore",
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(params.category ?? "All");
  const [educationLevel, setEducationLevel] = useState<string>("All");

  const [books, setBooks] = useState<CommunityBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Edit modal state
  const [editingBook, setEditingBook] = useState<CommunityBook | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Status message
  const [message, setMessage] = useState("");

  async function loadBooks() {
    setLoading(true);
    try {
      const list = await fetchCommunityBooks(
        activeTab === "my-uploads"
          ? {
              uploaderUid: profile?.uid,
              status: "all",
              category: category === "All" ? undefined : category,
              search,
              educationLevel: educationLevel === "All" ? undefined : educationLevel,
            }
          : {
              status: "approved",
              category: category === "All" ? undefined : category,
              search,
              educationLevel: educationLevel === "All" ? undefined : educationLevel,
            },
      );
      setBooks(list);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, [activeTab, category, educationLevel, search]);

  async function handleOpenBook(book: CommunityBook) {
    await incrementBookStats(book.id, "view");
    // Reload local count in background
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, viewsCount: b.viewsCount + 1 } : b)),
    );

    if (book.fileUrl.startsWith("http://") || book.fileUrl.startsWith("https://")) {
      if (Platform.OS === "web") {
        window.open(book.fileUrl, "_blank");
      } else {
        await Linking.openURL(book.fileUrl);
      }
    } else {
      setMessage(`Opening ${book.title}...`);
    }
  }

  async function handleDownloadBook(book: CommunityBook) {
    await incrementBookStats(book.id, "download");
    setBooks((prev) =>
      prev.map((b) =>
        b.id === book.id ? { ...b, downloadsCount: b.downloadsCount + 1 } : b,
      ),
    );
    if (book.fileUrl.startsWith("http://") || book.fileUrl.startsWith("https://")) {
      if (Platform.OS === "web") {
        window.open(book.fileUrl, "_blank");
      } else {
        await Linking.openURL(book.fileUrl);
      }
    } else {
      setMessage(`Downloading ${book.title}...`);
    }
  }

  async function handleDelete(book: CommunityBook) {
    if (!profile) return;
    try {
      await deleteCommunityBook(book.id, profile.uid, profile.role === "admin");
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      setMessage("Book removed successfully.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to delete.");
    }
  }

  async function handleSaveEdit() {
    if (!editingBook || !profile) return;
    try {
      const updated = await updateCommunityBook(
        editingBook.id,
        {
          title: editTitle.trim(),
          author: editAuthor.trim(),
          subject: editSubject.trim(),
          description: editDescription.trim(),
        },
        profile.uid,
        profile.role === "admin",
      );
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setEditingBook(null);
      setMessage("Book details updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to update book.");
    }
  }

  return (
    <Page>
      {/* Header */}
      <Row>
        <View style={{ flex: 1, gap: 4 }}>
          <Label muted size={12}>
            COMMUNITY LEARNING
          </Label>
          <Heading>Community Library</Heading>
          <Label muted size={13}>
            Discover and contribute educational books & lecture guides
          </Label>
        </View>
        <Button
          title="+ Contribute"
          onPress={() => setShowUploadModal(true)}
        />
      </Row>

      {message ? (
        <View
          style={{
            padding: 12,
            backgroundColor: c.tint,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <Text style={{ color: c.accent, fontSize: 13, fontWeight: "600" }}>{message}</Text>
        </View>
      ) : null}

      {/* Tabs: Explore Books vs My Uploads */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: c.card,
          borderRadius: 14,
          padding: 4,
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        <Pressable
          accessibilityRole="tab"
          onPress={() => setActiveTab("explore")}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            borderRadius: 10,
            backgroundColor: activeTab === "explore" ? c.accent : "transparent",
          }}
        >
          <Text
            style={{
              color: activeTab === "explore" ? "#FFFFFF" : c.text,
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            Explore Books
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          onPress={() => setActiveTab("my-uploads")}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            borderRadius: 10,
            backgroundColor: activeTab === "my-uploads" ? c.accent : "transparent",
          }}
        >
          <Text
            style={{
              color: activeTab === "my-uploads" ? "#FFFFFF" : c.text,
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            My Contributions
          </Text>
        </Pressable>
      </View>

      {/* Search Input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: c.card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.border,
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        <SocialIcon name="search" size={18} color={c.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title, author, subject, category..."
          placeholderTextColor={c.muted}
          style={{
            flex: 1,
            height: 48,
            color: c.text,
            fontSize: 14,
          }}
        />
        {search ? (
          <Pressable onPress={() => setSearch("")}>
            <Text style={{ color: c.muted, fontSize: 16 }}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8, paddingVertical: 2 }}>
          {BOOK_CATEGORIES.map((cat) => {
            const isSel = category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: isSel ? c.accent : c.card,
                  borderWidth: 1,
                  borderColor: isSel ? c.accent : c.border,
                }}
              >
                <Text
                  style={{
                    color: isSel ? "#FFFFFF" : c.text,
                    fontSize: 13,
                    fontWeight: isSel ? "700" : "500",
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Education Level Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8, paddingVertical: 2 }}>
          {["All", ...EDUCATION_LEVELS].map((lvl) => {
            const isSel = educationLevel === lvl;
            return (
              <Pressable
                key={lvl}
                onPress={() => setEducationLevel(lvl)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: isSel ? c.tint : c.card,
                  borderWidth: 1,
                  borderColor: isSel ? c.accent : c.border,
                }}
              >
                <Text
                  style={{
                    color: isSel ? c.accent : c.muted,
                    fontSize: 12,
                    fontWeight: isSel ? "700" : "500",
                  }}
                >
                  {lvl}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Book list */}
      {books.length === 0 ? (
        <Card>
          <Label size={16}>
            {activeTab === "my-uploads"
              ? "You haven't uploaded any books yet."
              : "No books match your current filters."}
          </Label>
          <Label muted size={13}>
            {activeTab === "my-uploads"
              ? "Share textbooks, reference manuals, or class notes to help your fellow students learn."
              : "Try switching categories or clearing search keywords."}
          </Label>
          {activeTab === "my-uploads" ? (
            <Button
              title="Upload your first book"
              onPress={() => setShowUploadModal(true)}
            />
          ) : null}
        </Card>
      ) : (
        books.map((book) => {
          const isOwner = profile?.uid === book.uploaderUid || profile?.role === "admin";
          const statusColors: Record<string, { bg: string; text: string }> = {
            approved: { bg: "#E8F5E9", text: "#2E7D32" },
            pending: { bg: "#FFF8E1", text: "#F57F17" },
            "changes-requested": { bg: "#FFF3E0", text: "#E65100" },
            rejected: { bg: "#FFEBEE", text: "#C62828" },
          };
          const badge = statusColors[book.status] ?? statusColors.pending!;

          return (
            <Card key={book.id}>
              <View style={{ gap: 12 }}>
                {/* Status Badge for My Uploads */}
                {activeTab === "my-uploads" ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: badge.bg,
                      }}
                    >
                      <Text
                        style={{
                          color: badge.text,
                          fontSize: 12,
                          fontWeight: "700",
                          textTransform: "uppercase",
                        }}
                      >
                        ● {book.status.replace("-", " ")}
                      </Text>
                    </View>
                    {book.status === "pending" ? (
                      <Label muted size={12}>
                        Under admin review
                      </Label>
                    ) : null}
                  </View>
                ) : null}

                {/* Review feedback note if changes requested */}
                {book.reviewNotes ? (
                  <View
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: badge.bg,
                    }}
                  >
                    <Text style={{ color: badge.text, fontSize: 12, fontWeight: "600" }}>
                      Admin Note: {book.reviewNotes}
                    </Text>
                  </View>
                ) : null}

                {/* Book Details Row */}
                <View style={{ flexDirection: "row", gap: 14 }}>
                  {/* Cover */}
                  {book.coverUrl ? (
                    <Image
                      source={{ uri: book.coverUrl }}
                      style={{
                        width: 72,
                        height: 98,
                        borderRadius: 10,
                        backgroundColor: c.tint,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 72,
                        height: 98,
                        borderRadius: 10,
                        backgroundColor: c.tint,
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: c.accent,
                          fontSize: 26,
                        }}
                      >
                        📖
                      </Text>
                    </View>
                  )}

                  {/* Metadata */}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      style={{
                        color: c.text,
                        fontSize: 17,
                        fontWeight: "700",
                        lineHeight: 22,
                      }}
                    >
                      {book.title}
                    </Text>
                    <Label muted size={13}>
                      by <Text style={{ fontWeight: "600", color: c.text }}>{book.author}</Text>
                    </Label>
                    <Label muted size={12}>
                      {book.subject} · {book.educationLevel}
                    </Label>

                    {/* Tags */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: c.tint,
                        }}
                      >
                        <Text style={{ color: c.accent, fontSize: 11, fontWeight: "600" }}>
                          {book.category}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: c.border,
                        }}
                      >
                        <Text style={{ color: c.muted, fontSize: 11, fontWeight: "500" }}>
                          {book.department}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Description */}
                {book.description ? (
                  <Text
                    style={{
                      color: c.muted,
                      fontSize: 13,
                      lineHeight: 18,
                    }}
                    numberOfLines={3}
                  >
                    {book.description}
                  </Text>
                ) : null}

                {/* Footer metrics & actions */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTopWidth: 1,
                    borderTopColor: c.border,
                    paddingTop: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Text style={{ color: c.muted, fontSize: 12 }}>
                      👁️ {book.viewsCount} views
                    </Text>
                    <Text style={{ color: c.muted, fontSize: 12 }}>
                      📥 {book.downloadsCount} downloads
                    </Text>
                  </View>

                  <Text style={{ color: c.muted, fontSize: 11 }}>
                    Uploaded by {book.uploaderName}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Read Book ↗"
                      onPress={() => handleOpenBook(book)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      secondary
                      title="Download PDF"
                      onPress={() => handleDownloadBook(book)}
                    />
                  </View>
                </View>

                {/* Author controls */}
                {isOwner && activeTab === "my-uploads" ? (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      gap: 16,
                      marginTop: 4,
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        setEditingBook(book);
                        setEditTitle(book.title);
                        setEditAuthor(book.author);
                        setEditSubject(book.subject);
                        setEditDescription(book.description);
                      }}
                    >
                      <Text style={{ color: c.accent, fontSize: 13, fontWeight: "600" }}>
                        ✏️ Edit Details
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete(book)}>
                      <Text style={{ color: "#E53935", fontSize: 13, fontWeight: "600" }}>
                        🗑️ Delete
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </Card>
          );
        })
      )}

      {/* Edit Book Modal */}
      {editingBook ? (
        <Modal visible animationType="fade" transparent>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.65)",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: c.bg,
                borderRadius: 20,
                padding: 20,
                gap: 14,
              }}
            >
              <Heading>Edit Contribution</Heading>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Title"
                placeholderTextColor={c.muted}
                style={{
                  backgroundColor: c.card,
                  color: c.text,
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              />
              <TextInput
                value={editAuthor}
                onChangeText={setEditAuthor}
                placeholder="Author"
                placeholderTextColor={c.muted}
                style={{
                  backgroundColor: c.card,
                  color: c.text,
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              />
              <TextInput
                value={editSubject}
                onChangeText={setEditSubject}
                placeholder="Subject"
                placeholderTextColor={c.muted}
                style={{
                  backgroundColor: c.card,
                  color: c.text,
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              />
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description"
                multiline
                placeholderTextColor={c.muted}
                style={{
                  backgroundColor: c.card,
                  color: c.text,
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: c.border,
                  minHeight: 60,
                }}
              />
              <Row>
                <View style={{ flex: 1 }}>
                  <Button secondary title="Cancel" onPress={() => setEditingBook(null)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Save Changes" onPress={handleSaveEdit} />
                </View>
              </Row>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* Upload Modal */}
      <CommunityUploadModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(newBook) => {
          setActiveTab("my-uploads");
          setBooks((prev) => [newBook, ...prev]);
          setMessage("Book uploaded successfully! It is now pending administrator review.");
        }}
      />
    </Page>
  );
}
