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
import { router } from "expo-router";
import {
  Button,
  Card,
  Field,
  Heading,
  Label,
  Page,
  Row,
  useColors,
} from "../../src/components/ui";
import { useStore } from "../../src/store";
import {
  BOOK_CATEGORIES,
  computeCommunityStats,
  deleteCommunityBook,
  fetchCommunityBooks,
  readStoredCommunityBooks,
  reviewCommunityBook,
} from "../../src/features/community/service";
import { CommunityBook, CommunityStats } from "../../src/features/community/types";
import { logout } from "../../src/features/auth/service";

export default function AdminCommunityReviewScreen() {
  const c = useColors();
  const profile = useStore((s) => s.profile);

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all">("pending");
  const [books, setBooks] = useState<CommunityBook[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    totalBooks: 0,
    pendingBooks: 0,
    approvedBooks: 0,
    rejectedBooks: 0,
    totalDownloads: 0,
    totalViews: 0,
    uniqueUploaders: 0,
  });

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  // Review modal
  const [reviewingBook, setReviewingBook] = useState<CommunityBook | null>(null);
  const [reviewAction, setReviewAction] = useState<"changes-requested" | "rejected" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      const all = await fetchCommunityBooks({ status: "all" });
      setStats(computeCommunityStats(all));

      let filtered = all;
      if (activeTab === "pending") {
        filtered = filtered.filter((b) => b.status === "pending" || b.status === "changes-requested");
      } else if (activeTab === "approved") {
        filtered = filtered.filter((b) => b.status === "approved");
      }

      if (selectedCategory !== "All") {
        filtered = filtered.filter((b) => b.category === selectedCategory);
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.uploaderName.toLowerCase().includes(q) ||
            b.subject.toLowerCase().includes(q),
        );
      }

      setBooks(filtered);
    } catch {
      //
    }
  }

  useEffect(() => {
    loadData();
  }, [activeTab, selectedCategory, search]);

  async function handleApprove(book: CommunityBook) {
    if (!profile) return;
    setActionBusy(true);
    try {
      await reviewCommunityBook(
        book.id,
        "approved",
        "Approved for publication in community library.",
        profile.uid,
      );
      setMessage(`"${book.title}" approved and published to community library.`);
      await loadData();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to approve.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleConfirmReviewAction() {
    if (!reviewingBook || !reviewAction || !profile) return;
    if (!reviewNotes.trim()) {
      setMessage("Please enter review feedback notes.");
      return;
    }

    setActionBusy(true);
    try {
      await reviewCommunityBook(
        reviewingBook.id,
        reviewAction,
        reviewNotes.trim(),
        profile.uid,
      );
      setMessage(
        reviewAction === "changes-requested"
          ? `Changes requested for "${reviewingBook.title}".`
          : `"${reviewingBook.title}" rejected and removed from community library.`,
      );
      setReviewingBook(null);
      setReviewAction(null);
      setReviewNotes("");
      await loadData();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRemoveBook(book: CommunityBook) {
    if (!profile) return;
    setActionBusy(true);
    try {
      await deleteCommunityBook(book.id, profile.uid, true);
      setMessage(`Removed "${book.title}" from library.`);
      await loadData();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handlePreviewFile(book: CommunityBook) {
    if (book.fileUrl.startsWith("http://") || book.fileUrl.startsWith("https://")) {
      if (Platform.OS === "web") {
        window.open(book.fileUrl, "_blank");
      } else {
        await Linking.openURL(book.fileUrl);
      }
    } else {
      setMessage(`Opening file: ${book.fileName}`);
    }
  }

  return (
    <Page>
      {/* Top Admin Navigation Switch */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: c.border,
          paddingBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => router.push("/(admin)/library")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: c.tint,
            }}
          >
            <Text style={{ color: c.muted, fontSize: 13, fontWeight: "600" }}>
              📁 Institutional Library
            </Text>
          </Pressable>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: c.accent,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
              👥 Community Moderation
            </Text>
          </View>
        </View>

        <Pressable
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login");
          }}
        >
          <Text style={{ color: "#E53935", fontSize: 13, fontWeight: "600" }}>
            Sign out
          </Text>
        </Pressable>
      </View>

      {/* Header */}
      <Row>
        <View style={{ flex: 1, gap: 4 }}>
          <Label muted size={12}>
            ADMINISTRATION DASHBOARD
          </Label>
          <Heading>Community Book Reviews</Heading>
          <Label muted size={13}>
            Review peer contributions, verify copyright compliance, and manage library topics
          </Label>
        </View>
      </Row>

      {message ? (
        <View
          style={{
            padding: 12,
            backgroundColor: "#E8F5E9",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#C8E6C9",
          }}
        >
          <Text style={{ color: "#2E7D32", fontSize: 13, fontWeight: "600" }}>
            {message}
          </Text>
        </View>
      ) : null}

      {/* Statistics Cards */}
      <Row>
        <View style={{ flex: 1 }}>
          <Card accent={stats.pendingBooks > 0}>
            <Heading>{stats.pendingBooks}</Heading>
            <Label muted size={12}>Pending Review</Label>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <Heading>{stats.approvedBooks}</Heading>
            <Label muted size={12}>Approved Books</Label>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <Heading>{stats.totalDownloads}</Heading>
            <Label muted size={12}>Downloads</Label>
          </Card>
        </View>
      </Row>

      {/* Tab Switcher */}
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
          onPress={() => setActiveTab("pending")}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            borderRadius: 10,
            backgroundColor: activeTab === "pending" ? c.accent : "transparent",
          }}
        >
          <Text
            style={{
              color: activeTab === "pending" ? "#FFFFFF" : c.text,
              fontWeight: "700",
              fontSize: 13,
            }}
          >
            Pending Queue ({stats.pendingBooks})
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          onPress={() => setActiveTab("approved")}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            borderRadius: 10,
            backgroundColor: activeTab === "approved" ? c.accent : "transparent",
          }}
        >
          <Text
            style={{
              color: activeTab === "approved" ? "#FFFFFF" : c.text,
              fontWeight: "700",
              fontSize: 13,
            }}
          >
            Approved ({stats.approvedBooks})
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          onPress={() => setActiveTab("all")}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            borderRadius: 10,
            backgroundColor: activeTab === "all" ? c.accent : "transparent",
          }}
        >
          <Text
            style={{
              color: activeTab === "all" ? "#FFFFFF" : c.text,
              fontWeight: "700",
              fontSize: 13,
            }}
          >
            All ({stats.totalBooks})
          </Text>
        </Pressable>
      </View>

      {/* Search & Category Filter */}
      <View style={{ gap: 10 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search pending submissions by title, author, uploader..."
          placeholderTextColor={c.muted}
          style={{
            backgroundColor: c.card,
            color: c.text,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.border,
          }}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {BOOK_CATEGORIES.map((cat) => {
              const sel = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: sel ? c.accent : c.card,
                    borderWidth: 1,
                    borderColor: sel ? c.accent : c.border,
                  }}
                >
                  <Text
                    style={{
                      color: sel ? "#FFFFFF" : c.text,
                      fontSize: 12,
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

      {/* List of submissions */}
      {books.length === 0 ? (
        <Card>
          <Label size={15}>No submissions found.</Label>
          <Label muted size={13}>
            {activeTab === "pending"
              ? "All submitted books have been reviewed! New submissions will appear here."
              : "No books match the selected category or search filter."}
          </Label>
        </Card>
      ) : (
        books.map((book) => {
          const isPending = book.status === "pending" || book.status === "changes-requested";

          return (
            <Card key={book.id}>
              <View style={{ gap: 12 }}>
                {/* Status + Metadata Bar */}
                <Row>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor:
                        book.status === "approved"
                          ? "#E8F5E9"
                          : book.status === "pending"
                            ? "#FFF8E1"
                            : "#FFEBEE",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          book.status === "approved"
                            ? "#2E7D32"
                            : book.status === "pending"
                              ? "#F57F17"
                              : "#C62828",
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      ● {book.status.toUpperCase()}
                    </Text>
                  </View>

                  <Label muted size={12}>
                    {(book.fileSize / (1024 * 1024)).toFixed(2)} MB · {book.fileName}
                  </Label>
                </Row>

                {/* Main Content */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {book.coverUrl ? (
                    <Image
                      source={{ uri: book.coverUrl }}
                      style={{ width: 64, height: 86, borderRadius: 8, backgroundColor: c.tint }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 64,
                        height: 86,
                        borderRadius: 8,
                        backgroundColor: c.tint,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>📄</Text>
                    </View>
                  )}

                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>
                      {book.title}
                    </Text>
                    <Label muted size={13}>
                      Author: <Text style={{ color: c.text, fontWeight: "600" }}>{book.author}</Text>
                    </Label>
                    <Label muted size={12}>
                      Subject: {book.subject} · {book.category} ({book.educationLevel})
                    </Label>
                    <Label muted size={11}>
                      Uploaded by:{" "}
                      <Text style={{ color: c.accent, fontWeight: "600" }}>
                        {book.uploaderName}
                      </Text>{" "}
                      ({book.uploaderRole}) · {new Date(book.createdAt).toLocaleDateString()}
                    </Label>
                  </View>
                </View>

                {book.description ? (
                  <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>
                    {book.description}
                  </Text>
                ) : null}

                {/* Copyright confirmation flag */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>
                    {book.copyrightAgreed ? "✅" : "⚠️"}
                  </Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>
                    {book.copyrightAgreed
                      ? "Uploader confirmed copyright compliance & academic fair-use"
                      : "Copyright agreement not confirmed"}
                  </Text>
                </View>

                {/* Review Notes if any */}
                {book.reviewNotes ? (
                  <View
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: c.tint,
                      gap: 2,
                    }}
                  >
                    <Text style={{ color: c.text, fontWeight: "700", fontSize: 12 }}>
                      Review Notes:
                    </Text>
                    <Text style={{ color: c.muted, fontSize: 12 }}>
                      {book.reviewNotes}
                    </Text>
                  </View>
                ) : null}

                {/* Action Buttons */}
                <Row>
                  <Button
                    secondary
                    title="Preview PDF ↗"
                    onPress={() => handlePreviewFile(book)}
                  />
                  {isPending ? (
                    <Button
                      title="Approve & Publish ✓"
                      onPress={() => handleApprove(book)}
                      disabled={actionBusy}
                    />
                  ) : null}
                </Row>

                {isPending ? (
                  <Row>
                    <View style={{ flex: 1 }}>
                      <Button
                        secondary
                        title="Request Changes"
                        onPress={() => {
                          setReviewingBook(book);
                          setReviewAction("changes-requested");
                          setReviewNotes("");
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        secondary
                        title="Reject & Reason"
                        onPress={() => {
                          setReviewingBook(book);
                          setReviewAction("rejected");
                          setReviewNotes("Inappropriate or copyright-infringing material.");
                        }}
                      />
                    </View>
                  </Row>
                ) : (
                  <Pressable
                    onPress={() => handleRemoveBook(book)}
                    style={{ alignSelf: "flex-end", marginTop: 4 }}
                  >
                    <Text style={{ color: "#E53935", fontSize: 12, fontWeight: "600" }}>
                      🗑️ Remove / Take Down Book
                    </Text>
                  </Pressable>
                )}
              </View>
            </Card>
          );
        })
      )}

      {/* Review Feedback / Rejection Modal */}
      {reviewingBook && reviewAction ? (
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
              <Heading>
                {reviewAction === "changes-requested"
                  ? "Request Changes from Uploader"
                  : "Reject Submission"}
              </Heading>
              <Label muted size={13}>
                Provide feedback to{" "}
                <Text style={{ fontWeight: "700", color: c.text }}>
                  {reviewingBook.uploaderName}
                </Text>{" "}
                for "{reviewingBook.title}".
              </Label>

              <TextInput
                value={reviewNotes}
                onChangeText={setReviewNotes}
                placeholder="Explain the required revisions, missing syllabus details, or reason for rejection..."
                placeholderTextColor={c.muted}
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: c.card,
                  color: c.text,
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: c.border,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
              />

              <Row>
                <View style={{ flex: 1 }}>
                  <Button
                    secondary
                    title="Cancel"
                    onPress={() => {
                      setReviewingBook(null);
                      setReviewAction(null);
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Submit Decision"
                    onPress={handleConfirmReviewAction}
                    disabled={actionBusy}
                  />
                </View>
              </Row>
            </View>
          </View>
        </Modal>
      ) : null}
    </Page>
  );
}
