import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../components/ui";
import { SocialIcon, SocialIconName } from "../../components/SocialIcon";
import { Summary, useCatalog } from "../courses/catalog";
import { useStore } from "../../store";
import { CampusPost, PostKind, relativeTime } from "./model";
import { useCampusSpace } from "./store";

type Entry =
  | { id: string; type: "post"; post: CampusPost }
  | { id: string; type: "course"; course: Summary };
type Sheet = "compose" | "search" | "activity" | "comments" | "options" | null;

export default function CampusFeed({
  savedOnly = false,
}: {
  savedOnly?: boolean;
}) {
  const profile = useStore((s) => s.profile)!;
  const dark = useStore((s) => s.dark);
  const c = useColors();
  const insets = useSafeAreaInsets();
  const wide = useWindowDimensions().width >= 700;
  const local = useCampusSpace(profile.uid);
  const catalog = useCatalog();
  const list = useRef<FlatList<Entry>>(null);
  const [filter, setFilter] = useState("all");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<PostKind>("note");
  const [editId, setEditId] = useState<string>();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Entry | null>(null);
  const [comment, setComment] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const entries = useMemo(() => {
    const posts: Entry[] = [...local.space.posts]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((post) => ({ id: post.id, type: "post", post }));
    const courses: Entry[] = (catalog.data ?? [])
      .filter(
        (v) =>
          v.programId === profile.programId && v.semester === profile.semester,
      )
      .map((course) => ({
        id: `course:${course.code}`,
        type: "course",
        course,
      }));
    return [...posts, ...courses].filter((entry) => {
      if (savedOnly && !local.space.saved.includes(entry.id)) return false;
      if (filter === "materials" && entry.type !== "course") return false;
      if (
        (filter === "note" || filter === "question") &&
        (entry.type !== "post" || entry.post.kind !== filter)
      )
        return false;
      const text =
        entry.type === "post"
          ? entry.post.body
          : `${entry.course.title} ${entry.course.code}`;
      return text.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    });
  }, [
    local.space,
    catalog.data,
    profile.programId,
    profile.semester,
    savedOnly,
    filter,
    query,
  ]);
  const title = (entry: Entry) =>
    entry.type === "post" ? entry.post.body : entry.course.title;
  function close() {
    Keyboard.dismiss();
    setSheet(null);
    setMessage("");
  }
  function compose(type: PostKind = "note", post?: CampusPost) {
    setKind(post?.kind ?? type);
    setBody(post?.body ?? "");
    setEditId(post?.id);
    setMessage("");
    setSheet("compose");
  }
  function openMaterials(type?: string) {
    close();
    router.push({
      pathname: "/(student)/materials",
      params: {
        ...(type ? { kind: type } : {}),
        ...(search ? { search } : {}),
      },
    });
  }
  function post() {
    try {
      local.post(body, kind, editId);
      close();
      list.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save your note.");
    }
  }
  async function share(entry: Entry) {
    try {
      await Share.share({
        message:
          entry.type === "post"
            ? entry.post.body
            : `${entry.course.title} (${entry.course.code})\nStudying on UniHub.`,
      });
    } catch {
      setMessage("Sharing is unavailable. Your note is still saved.");
    }
  }
  function avatar(size = 42, label = profile.displayName.charAt(0)) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: c.tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{ color: c.accent, fontWeight: "800", fontSize: size * 0.42 }}
        >
          {label.toUpperCase()}
        </Text>
      </View>
    );
  }
  function iconButton(
    name: SocialIconName,
    label: string,
    onPress: () => void,
    active = false,
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => ({
          minWidth: 44,
          minHeight: 44,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 24,
          backgroundColor: active ? c.tint : c.bg,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <SocialIcon name={name} color={active ? c.accent : c.text} size={22} />
      </Pressable>
    );
  }
  function button(
    label: string,
    action: () => void,
    secondary = false,
    disabled = false,
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={action}
        style={({ pressed }) => ({
          minHeight: 46,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 9,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: secondary ? c.tint : c.accent,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={{
            color: secondary ? c.accent : dark ? "#111827" : "#FFF",
            fontWeight: "700",
            fontSize: 15,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }
  const cardStyle = {
    backgroundColor: c.card,
    borderRadius: wide ? 12 : 0,
    borderColor: c.border,
    borderWidth: wide ? StyleSheet.hairlineWidth : 0,
  };
  const activities = [
    ...local.space.posts.map((p) => ({
      id: p.id,
      at: p.editedAt ?? p.createdAt,
      text: `${p.editedAt ? "Edited" : "Added"} a ${p.kind === "note" ? "study note" : "question"}`,
      detail: p.body,
    })),
    ...local.space.comments.map((v) => ({
      id: v.id,
      at: v.createdAt,
      text: "Added a comment",
      detail: v.body,
    })),
  ].sort((a, b) => b.at - a.at);
  const shortcuts: {
    label: string;
    icon: SocialIconName;
    color: string;
    tint: string;
    action: () => void;
  }[] = [
    {
      label: "Your note",
      icon: "plus",
      color: c.accent,
      tint: c.tint,
      action: () => compose(),
    },
    {
      label: "Books",
      icon: "book",
      color: "#1877F2",
      tint: "#E8F1FF",
      action: () => openMaterials("book"),
    },
    {
      label: "Lectures",
      icon: "edit",
      color: "#8A49D6",
      tint: "#F1EAFE",
      action: () => openMaterials("notes"),
    },
    {
      label: "Past papers",
      icon: "saved",
      color: "#D57E12",
      tint: "#FFF3DD",
      action: () => openMaterials("past-paper"),
    },
    {
      label: "Study plan",
      icon: "book",
      color: "#188567",
      tint: "#E3F5ED",
      action: () => router.push("/(student)/planner"),
    },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={{
          backgroundColor: c.card,
          paddingTop: Math.max(insets.top, 12),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.border,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 680,
            alignSelf: "center",
            paddingHorizontal: 16,
            paddingBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              flex: 1,
              fontSize: savedOnly ? 29 : 33,
              fontWeight: "800",
              letterSpacing: -1.5,
              color: savedOnly ? c.text : c.accent,
            }}
          >
            {savedOnly ? "Saved" : "unihub"}
          </Text>
          {iconButton(
            "search",
            savedOnly ? "Search saved posts" : "Search UniHub",
            () => {
              setSearch(query);
              setSheet("search");
            },
          )}
          {iconButton("bell", "Your activity", () => setSheet("activity"))}
        </View>
      </View>
      <FlatList
        ref={list}
        data={entries}
        keyExtractor={(item) => item.id}
        refreshing={catalog.isRefetching}
        onRefresh={() => {
          void catalog.refetch();
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: "100%",
          maxWidth: 680,
          alignSelf: "center",
          paddingHorizontal: wide ? 14 : 0,
          paddingTop: 8,
          paddingBottom: 24,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={
          <View style={{ gap: 8, marginBottom: 8 }}>
            {!savedOnly ? (
              <>
                <View style={[cardStyle, { padding: 14, gap: 13 }]}>
                  <View style={s.row}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open your menu"
                      onPress={() => router.push("/(student)/me")}
                    >
                      {avatar()}
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Post a study note"
                      onPress={() => compose()}
                      style={{
                        flex: 1,
                        borderRadius: 25,
                        borderWidth: 1,
                        borderColor: c.border,
                        minHeight: 46,
                        paddingHorizontal: 16,
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: c.muted, fontSize: 16 }}>
                        What are you learning today?
                      </Text>
                    </Pressable>
                  </View>
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: c.border,
                    }}
                  />
                  <View style={{ flexDirection: "row" }}>
                    {[
                      {
                        label: "Note",
                        icon: "edit" as const,
                        color: c.accent,
                        action: () => compose("note"),
                      },
                      {
                        label: "Question",
                        icon: "comment" as const,
                        color: "#CB861A",
                        action: () => compose("question"),
                      },
                      {
                        label: "Study plan",
                        icon: "book" as const,
                        color: "#8A49D6",
                        action: () => router.push("/(student)/planner"),
                      },
                    ].map((item) => (
                      <Pressable
                        key={item.label}
                        accessibilityRole="button"
                        accessibilityLabel={`Create ${item.label.toLowerCase()}`}
                        onPress={item.action}
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          minHeight: 40,
                        }}
                      >
                        <SocialIcon
                          name={item.icon}
                          color={item.color}
                          size={20}
                        />
                        <Text
                          style={{
                            color: c.muted,
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={[cardStyle, { paddingVertical: 15, gap: 14 }]}>
                  <View style={[s.row, { paddingHorizontal: 16 }]}>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 17,
                        fontWeight: "700",
                        color: c.text,
                      }}
                    >
                      Your campus
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push("/(student)/explore")}
                      style={{ minHeight: 32, justifyContent: "center" }}
                    >
                      <Text style={{ color: c.accent, fontWeight: "600" }}>
                        See all
                      </Text>
                    </Pressable>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}
                  >
                    {shortcuts.map((item) => (
                      <Pressable
                        key={item.label}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${item.label.toLowerCase()}`}
                        onPress={item.action}
                        style={({ pressed }) => ({
                          width: 88,
                          alignItems: "center",
                          gap: 9,
                          opacity: pressed ? 0.65 : 1,
                        })}
                      >
                        <View
                          style={{
                            padding: 3,
                            borderRadius: 40,
                            borderWidth: 2,
                            borderColor: item.color,
                          }}
                        >
                          <View
                            style={{
                              width: 60,
                              height: 60,
                              backgroundColor: item.tint,
                              borderRadius: 30,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <SocialIcon
                              name={item.icon}
                              color={item.color}
                              size={26}
                            />
                          </View>
                        </View>
                        <Text
                          style={{
                            color: c.text,
                            fontWeight: "600",
                            fontSize: 12,
                          }}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </>
            ) : (
              <View style={[cardStyle, { padding: 16, gap: 12 }]}>
                <Text
                  style={{ fontSize: 16, color: c.text, fontWeight: "600" }}
                >
                  Keep the good stuff close.
                </Text>
                <Text style={{ color: c.muted, lineHeight: 21 }}>
                  Your saved posts live here. Open downloaded books and notes
                  for offline reading.
                </Text>
                {button(
                  "Downloaded documents",
                  () =>
                    router.push({
                      pathname: "/(student)/materials",
                      params: { kind: "saved" },
                    }),
                  true,
                )}
              </View>
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 14,
                paddingVertical: 4,
                gap: 8,
              }}
            >
              {[
                ["all", savedOnly ? "All saved" : "For you"],
                ["note", "Notes"],
                ["question", "Questions"],
                ["materials", "Materials"],
              ].map(([value, label]) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === value }}
                  onPress={() => setFilter(value!)}
                  style={{
                    paddingHorizontal: 17,
                    minHeight: 38,
                    justifyContent: "center",
                    borderRadius: 22,
                    backgroundColor: filter === value ? c.tint : c.card,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 14,
                      color: filter === value ? c.accent : c.muted,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {query ? (
              <View
                style={{
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={{ flex: 1, color: c.muted }}>
                  Results for “{query}”
                </Text>
                {iconButton("close", "Clear search", () => setQuery(""))}
              </View>
            ) : null}
            {local.damaged ? (
              <Text style={{ margin: 16, color: c.muted }}>
                Some earlier notes could not be opened. A recovery copy is kept
                on this device when you next save.
              </Text>
            ) : null}
            {message && !sheet ? (
              <Text
                accessibilityRole="alert"
                style={{ marginHorizontal: 16, color: c.muted }}
              >
                {message}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View
            style={[
              cardStyle,
              {
                padding: 28,
                paddingVertical: 35,
                alignItems: "center",
                gap: 13,
              },
            ]}
          >
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: c.tint,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 3,
              }}
            >
              <SocialIcon
                name={savedOnly ? "saved" : "book"}
                color={c.accent}
                size={34}
              />
            </View>
            <Text
              accessibilityRole="header"
              style={{
                color: c.text,
                fontSize: 23,
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: -0.5,
              }}
            >
              {query
                ? "No matching posts"
                : savedOnly
                  ? "Save it for later"
                  : "Your feed is ready"}
            </Text>
            <Text
              style={{
                color: c.muted,
                lineHeight: 23,
                fontSize: 15,
                textAlign: "center",
                maxWidth: 330,
              }}
            >
              {query
                ? "Try another word or search the academic library."
                : savedOnly
                  ? "Tap the bookmark on a post to find it here whenever you need it."
                  : "Published course materials and the study notes you write will appear here."}
            </Text>
            <View
              style={{ marginTop: 7, gap: 10, width: "100%", maxWidth: 300 }}
            >
              {query
                ? button("Clear search", () => setQuery(""))
                : savedOnly
                  ? button("Go to your feed", () => router.push("/(student)"))
                  : button("Write your first note", () => compose())}
              {!savedOnly
                ? button(
                    "Explore the library",
                    () => router.push("/(student)/explore"),
                    true,
                  )
                : null}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const liked = local.space.liked.includes(item.id),
            saved = local.space.saved.includes(item.id);
          const comments = local.space.comments.filter(
            (v) => v.postId === item.id,
          );
          return (
            <View style={[cardStyle, { overflow: "hidden" }]}>
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingTop: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {item.type === "post"
                  ? avatar()
                  : avatar(42, item.course.title.charAt(0))}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={{ color: c.text, fontSize: 15, fontWeight: "700" }}
                  >
                    {item.type === "post" ? "You" : item.course.title}
                  </Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>
                    {item.type === "post"
                      ? `${relativeTime(item.post.createdAt)}${item.post.editedAt ? " · Edited" : ""} · On this device`
                      : `${item.course.code} · Your semester`}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={saved ? "Unsave post" : "Save post"}
                  accessibilityState={{ selected: saved }}
                  onPress={() => local.save(item.id)}
                  style={s.iconTouch}
                >
                  <SocialIcon
                    name="saved"
                    color={saved ? c.accent : c.muted}
                    size={21}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Post options"
                  onPress={() => {
                    setSelected(item);
                    setConfirmDelete(false);
                    setSheet("options");
                  }}
                  style={s.iconTouch}
                >
                  <Text
                    style={{
                      color: c.muted,
                      fontSize: 24,
                      fontWeight: "700",
                      marginTop: -10,
                    }}
                  >
                    …
                  </Text>
                </Pressable>
              </View>
              {item.type === "post" ? (
                <View
                  style={{ paddingHorizontal: 16, paddingVertical: 15, gap: 8 }}
                >
                  <Text
                    style={{
                      color:
                        item.post.kind === "question" ? "#AB7119" : c.accent,
                      fontSize: 11,
                      fontWeight: "700",
                      letterSpacing: 0.8,
                    }}
                  >
                    {item.post.kind === "question"
                      ? "STUDY QUESTION"
                      : "STUDY NOTE"}
                  </Text>
                  <Text
                    selectable
                    numberOfLines={expanded[item.id] ? undefined : 7}
                    style={{ color: c.text, fontSize: 18, lineHeight: 27 }}
                  >
                    {item.post.body}
                  </Text>
                  {item.post.body.length > 280 ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        setExpanded((v) => ({ ...v, [item.id]: !v[item.id] }))
                      }
                    >
                      <Text
                        style={{
                          color: c.muted,
                          fontWeight: "600",
                          paddingVertical: 5,
                        }}
                      >
                        {expanded[item.id] ? "See less" : "See more"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.course.title}`}
                  onPress={() =>
                    router.push({
                      pathname: "/(student)/course",
                      params: { code: item.course.code },
                    })
                  }
                  style={{
                    backgroundColor: c.tint,
                    marginTop: 14,
                    padding: 24,
                    gap: 12,
                  }}
                >
                  <SocialIcon name="book" color={c.accent} size={32} />
                  <Text
                    style={{
                      color: c.accent,
                      fontSize: 11,
                      fontWeight: "800",
                      letterSpacing: 1.2,
                    }}
                  >
                    COURSE MATERIALS
                  </Text>
                  <Text
                    style={{
                      color: c.text,
                      fontWeight: "700",
                      fontSize: 26,
                      lineHeight: 33,
                    }}
                  >
                    {item.course.title}
                  </Text>
                  <Text style={{ color: c.muted }}>
                    Semester {item.course.semester} · {item.course.credit}{" "}
                    credit hours
                  </Text>
                  <Text
                    style={{ color: c.accent, fontWeight: "700", marginTop: 4 }}
                  >
                    Open course →
                  </Text>
                </Pressable>
              )}
              {liked || comments.length > 0 ? (
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: 16,
                    paddingBottom: 10,
                  }}
                >
                  <Text style={{ flex: 1, color: c.muted, fontSize: 12 }}>
                    {liked ? "You liked this" : ""}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setSelected(item);
                      setSheet("comments");
                    }}
                  >
                    <Text style={{ color: c.muted, fontSize: 12 }}>
                      {comments.length
                        ? `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`
                        : ""}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              <View
                style={{
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: c.border,
                  marginHorizontal: 14,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 5,
                  paddingVertical: 4,
                }}
              >
                {[
                  {
                    label: liked ? "Liked" : "Like",
                    icon: "like" as const,
                    action: () => local.like(item.id),
                    active: liked,
                  },
                  {
                    label: "Comment",
                    icon: "comment" as const,
                    action: () => {
                      setSelected(item);
                      setComment("");
                      setSheet("comments");
                    },
                    active: false,
                  },
                  {
                    label: "Share",
                    icon: "share" as const,
                    action: () => {
                      void share(item);
                    },
                    active: false,
                  },
                ].map((action) => (
                  <Pressable
                    key={action.label}
                    accessibilityRole="button"
                    accessibilityLabel={
                      action.label === "Liked"
                        ? "Unlike post"
                        : `${action.label} post`
                    }
                    onPress={action.action}
                    style={({ pressed }) => ({
                      flex: 1,
                      minHeight: 43,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      borderRadius: 7,
                      backgroundColor: pressed ? c.bg : "transparent",
                    })}
                  >
                    <SocialIcon
                      name={action.icon}
                      size={20}
                      color={action.active ? c.accent : c.muted}
                    />
                    <Text
                      style={{
                        color: action.active ? c.accent : c.muted,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          entries.length ? (
            <Text
              style={{
                color: c.muted,
                textAlign: "center",
                padding: 25,
                fontSize: 12,
              }}
            >
              You’re all caught up.
            </Text>
          ) : null
        }
      />
      <Modal
        visible={sheet !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={close}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            flex: 1,
            backgroundColor: c.card,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 680,
              alignSelf: "center",
              flex: 1,
            }}
          >
            <View
              style={{
                paddingHorizontal: 12,
                paddingBottom: 10,
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: c.border,
              }}
            >
              {iconButton("close", "Close dialog", close)}
              <Text
                accessibilityRole="header"
                style={{
                  color: c.text,
                  flex: 1,
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                {sheet === "compose"
                  ? editId
                    ? "Edit post"
                    : "Create post"
                  : sheet === "search"
                    ? "Search UniHub"
                    : sheet === "activity"
                      ? "Your activity"
                      : sheet === "comments"
                        ? "Comments"
                        : "Post options"}
              </Text>
              {sheet === "compose"
                ? button(editId ? "Save" : "Post", post, false, !body.trim())
                : null}
            </View>
            {sheet === "compose" ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 18, gap: 18 }}
              >
                <View style={s.row}>
                  {avatar()}
                  <View style={{ gap: 5 }}>
                    <Text
                      style={{ color: c.text, fontWeight: "700", fontSize: 16 }}
                    >
                      You
                    </Text>
                    <Text style={{ color: c.muted, fontSize: 12 }}>
                      Only on this device for now
                    </Text>
                  </View>
                </View>
                <View style={s.row}>
                  {(["note", "question"] as const).map((value) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      onPress={() => setKind(value)}
                      style={{
                        paddingVertical: 9,
                        paddingHorizontal: 16,
                        backgroundColor: kind === value ? c.tint : c.bg,
                        borderRadius: 18,
                      }}
                    >
                      <Text
                        style={{
                          color: kind === value ? c.accent : c.muted,
                          fontWeight: "600",
                        }}
                      >
                        {value === "note" ? "Study note" : "Question"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  accessibilityLabel="Study post"
                  multiline
                  autoFocus
                  maxLength={5000}
                  textAlignVertical="top"
                  placeholder={
                    kind === "note"
                      ? "What are you learning today?"
                      : "What would you like to understand?"
                  }
                  placeholderTextColor={c.muted}
                  value={body}
                  onChangeText={setBody}
                  style={{
                    minHeight: 220,
                    color: c.text,
                    fontSize: 23,
                    lineHeight: 33,
                    padding: 0,
                  }}
                />
                <Text style={{ color: c.muted, fontSize: 12 }}>
                  {body.length.toLocaleString()} / 5,000
                </Text>
              </ScrollView>
            ) : null}
            {sheet === "search" ? (
              <View style={{ padding: 18, gap: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: c.bg,
                    borderRadius: 24,
                    paddingHorizontal: 15,
                    gap: 10,
                  }}
                >
                  <SocialIcon name="search" color={c.muted} size={20} />
                  <TextInput
                    accessibilityLabel="Search feed"
                    autoFocus
                    value={search}
                    onChangeText={setSearch}
                    placeholder={
                      savedOnly
                        ? "Search saved posts"
                        : "Search posts or a subject"
                    }
                    placeholderTextColor={c.muted}
                    returnKeyType="search"
                    onSubmitEditing={() => {
                      setQuery(search.trim());
                      close();
                    }}
                    style={{
                      flex: 1,
                      color: c.text,
                      minHeight: 49,
                      fontSize: 16,
                    }}
                  />
                </View>
                {button(
                  savedOnly ? "Search saved posts" : "Search your feed",
                  () => {
                    setQuery(search.trim());
                    close();
                  },
                )}
                {button("Search books & notes", () => openMaterials(), true)}
                <Text style={{ color: c.muted, lineHeight: 22 }}>
                  Search your own posts here, or explore the college’s approved
                  academic library.
                </Text>
              </View>
            ) : null}
            {sheet === "activity" ? (
              <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
                {activities.length ? (
                  activities.map((item) => (
                    <View
                      key={item.id}
                      style={[s.row, { alignItems: "flex-start" }]}
                    >
                      {avatar(40)}
                      <View style={{ flex: 1, gap: 5 }}>
                        <Text style={{ color: c.text, fontWeight: "600" }}>
                          {item.text}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={{ color: c.muted, lineHeight: 21 }}
                        >
                          {item.detail}
                        </Text>
                        <Text style={{ color: c.accent, fontSize: 12 }}>
                          {relativeTime(item.at)} · This device
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      paddingVertical: 50,
                      gap: 15,
                      alignItems: "center",
                    }}
                  >
                    <SocialIcon name="bell" color={c.accent} size={40} />
                    <Text
                      style={{ color: c.text, fontSize: 21, fontWeight: "700" }}
                    >
                      You’re all caught up
                    </Text>
                    <Text
                      style={{
                        color: c.muted,
                        textAlign: "center",
                        lineHeight: 23,
                      }}
                    >
                      Your notes and comments will appear here as you use
                      UniHub.
                    </Text>
                  </View>
                )}
              </ScrollView>
            ) : null}
            {sheet === "comments" && selected ? (
              <>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ padding: 16, gap: 16 }}
                >
                  <Text
                    numberOfLines={3}
                    style={{ color: c.text, lineHeight: 23 }}
                  >
                    {title(selected)}
                  </Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>
                    Comments are saved on this device.
                  </Text>
                  {local.space.comments
                    .filter((v) => v.postId === selected.id)
                    .map((item) => (
                      <View
                        key={item.id}
                        style={[s.row, { alignItems: "flex-start" }]}
                      >
                        {avatar(33)}
                        <View style={{ flex: 1, gap: 5 }}>
                          <View
                            style={{
                              backgroundColor: c.bg,
                              padding: 12,
                              borderRadius: 15,
                              gap: 5,
                            }}
                          >
                            <Text
                              style={{
                                color: c.text,
                                fontWeight: "700",
                                fontSize: 13,
                              }}
                            >
                              You
                            </Text>
                            <Text style={{ color: c.text, lineHeight: 22 }}>
                              {item.body}
                            </Text>
                          </View>
                          <Text
                            style={{
                              color: c.muted,
                              fontSize: 11,
                              paddingLeft: 9,
                            }}
                          >
                            {relativeTime(item.createdAt)}
                          </Text>
                        </View>
                      </View>
                    ))}
                </ScrollView>
                <View
                  style={{
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: c.border,
                    padding: 12,
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <TextInput
                    accessibilityLabel="Write a comment"
                    placeholder="Add a thought…"
                    placeholderTextColor={c.muted}
                    value={comment}
                    onChangeText={setComment}
                    maxLength={1000}
                    multiline
                    style={{
                      flex: 1,
                      minHeight: 46,
                      maxHeight: 120,
                      color: c.text,
                      backgroundColor: c.bg,
                      borderRadius: 22,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  />
                  {button(
                    "Send",
                    () => {
                      try {
                        local.comment(selected.id, comment);
                        setComment("");
                        Keyboard.dismiss();
                      } catch (e) {
                        setMessage(
                          e instanceof Error
                            ? e.message
                            : "Could not save comment.",
                        );
                      }
                    },
                    false,
                    !comment.trim(),
                  )}
                </View>
              </>
            ) : null}
            {sheet === "options" && selected ? (
              <View style={{ padding: 18, gap: 16 }}>
                <Text
                  numberOfLines={3}
                  style={{ color: c.text, fontSize: 17, lineHeight: 25 }}
                >
                  {title(selected)}
                </Text>
                {confirmDelete ? (
                  <>
                    <Text style={{ color: c.muted, lineHeight: 22 }}>
                      Delete this note and its comments from this device?
                    </Text>
                    {button("Delete note", () => {
                      local.remove(selected.id);
                      close();
                    })}
                    {button("Keep note", () => setConfirmDelete(false), true)}
                  </>
                ) : (
                  <>
                    {button(
                      local.space.saved.includes(selected.id)
                        ? "Remove from saved"
                        : "Save for later",
                      () => {
                        local.save(selected.id);
                        close();
                      },
                      true,
                    )}
                    {selected.type === "post" ? (
                      <>
                        {button(
                          "Edit note",
                          () => compose(selected.post.kind, selected.post),
                          true,
                        )}
                        {button(
                          "Delete note",
                          () => setConfirmDelete(true),
                          true,
                        )}
                      </>
                    ) : (
                      button("Open course", () => {
                        const code = selected.course.code;
                        close();
                        router.push({
                          pathname: "/(student)/course",
                          params: { code },
                        });
                      })
                    )}
                  </>
                )}
              </View>
            ) : null}
            {message && sheet ? (
              <Text
                accessibilityRole="alert"
                style={{ color: c.muted, padding: 16 }}
              >
                {message}
              </Text>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 11 },
  iconTouch: {
    minWidth: 34,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
