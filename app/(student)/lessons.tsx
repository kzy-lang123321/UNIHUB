import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";
import { router } from "expo-router";
import { useCatalog } from "../../src/features/courses/catalog";
import { loadCourse } from "../../src/features/courses/service";
import {
  courseFeed,
  FeedCard,
  visibleFeed,
} from "../../src/features/courses/feed";
import { StudyCard, FeedLanguage } from "../../src/components/StudyCard";
import { readProgress, useStore } from "../../src/store";
import { cache } from "../../src/services/cache";

export default function Learn() {
  const p = useStore((s) => s.profile)!;
  const revision = useStore((s) => s.revision);
  const catalog = useCatalog();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const courses = useMemo(
    () =>
      catalog.data?.filter(
        (c) => c.programId === p.programId && c.semester === p.semester,
      ) ?? [],
    [catalog.data, p.programId, p.semester],
  );
  const [height, setHeight] = useState(620);
  const [active, setActive] = useState(0);
  const [language, setLanguage] = useState<FeedLanguage>(() => {
    const saved = cache.get(`feed-language:${p.uid}`);
    return saved === "اردو" || saved === "پښتو" ? saved : "English";
  });
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const list = useRef<FlashListRef<FeedCard>>(null);
  const restored = useRef(false);
  const activeRef = useRef(0);
  const resumeKey = `feed-resume:${p.uid}`;
  const feed = useInfiniteQuery({
    queryKey: ["feed", p.uid, courses.map((c) => c.code).join(",")],
    initialPageParam: Math.max(
      0,
      courses.findIndex(
        (c) => c.code === (cache.get(resumeKey) ?? "").split("/")[0],
      ),
    ),
    enabled: courses.length > 0,
    refetchOnWindowFocus: false,
    queryFn: async ({ pageParam }) => {
      const summary = courses[pageParam];
      if (!summary) throw new Error("No more courses.");
      const course = await loadCourse(summary.code, p.uid === "demo");
      return courseFeed(
        course,
        readProgress(p.uid, course.code).completedUnits,
      );
    },
    getNextPageParam: (_last, _pages, lastPageParam) =>
      lastPageParam + 1 < courses.length ? lastPageParam + 1 : undefined,
  });
  const allCards = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);
  const cards = useMemo(
    () => visibleFeed(allCards, language),
    [allCards, language],
  );
  function changeLanguage() {
    const next: FeedLanguage =
      language === "English"
        ? "اردو"
        : language === "اردو"
          ? "پښتو"
          : "English";
    const current = cards[activeRef.current];
    const nextCards = visibleFeed(allCards, next);
    const exact = nextCards.findIndex((card) => card.id === current?.id);
    const index = Math.max(
      0,
      exact >= 0
        ? exact
        : nextCards.findIndex(
            (card) =>
              card.code === current?.code && card.unitNo === current?.unitNo,
          ),
    );
    setLanguage(next);
    cache.set(`feed-language:${p.uid}`, next);
    setActive(index);
    activeRef.current = index;
    if (nextCards[index]) cache.set(resumeKey, nextCards[index].id);
    setTimeout(
      () =>
        list.current?.scrollToOffset({
          offset: index * height,
          animated: false,
        }),
      80,
    );
  }
  useEffect(() => {
    if (!cards.length || restored.current) return;
    restored.current = true;
    const saved = cache.get(resumeKey);
    const index = cards.findIndex((c) => c.id === saved);
    if (index > 0) {
      const timer = setTimeout(() => {
        list.current?.scrollToIndex({ index, animated: false });
        setActive(index);
        activeRef.current = index;
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [cards, resumeKey]);
  function move(index: number) {
    if (index < cards.length) {
      list.current?.scrollToIndex({ index, animated: !reduced });
      setActive(index);
      activeRef.current = index;
      const card = cards[index];
      if (card) cache.set(resumeKey, card.id);
    } else {
      setActive(cards.length);
      activeRef.current = cards.length;
      list.current?.scrollToEnd({ animated: !reduced });
      if (feed.hasNextPage && !feed.isFetchingNextPage)
        void feed.fetchNextPage();
    }
  }
  function answer(card: FeedCard, choice: number) {
    if (card.kind !== "question") return;
    const key = `feed-answer:${p.uid}:${card.id}`;
    if (cache.get(key) !== undefined) return;
    cache.set(key, String(choice));
    const progress = readProgress(p.uid, card.code);
    useStore.getState().update(card.code, {
      quizScores: [
        ...progress.quizScores,
        {
          score: choice === card.question.answer ? 1 : 0,
          total: 1,
          at: new Date().toISOString(),
        },
      ],
    });
  }
  const title =
    courses.length === 1
      ? courses[0]?.title
      : "Your semester, one idea at a time";
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.row}>
          <Text style={styles.brand}>
            ◈ UniHub<Text style={styles.brandDot}>.</Text>
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change lesson language. Current language ${language}`}
            onPress={changeLanguage}
            style={styles.language}
          >
            <Text style={styles.languageText}>{language} ⌄</Text>
          </Pressable>
        </View>
        <View style={[styles.row, { marginTop: 16 }]}>
          <View style={styles.row}>
            <View style={styles.selected}>
              <Text style={styles.selectedText}>For you</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(student)/me")}
              style={styles.smallButton}
            >
              <Text style={styles.muted}>Saved ↗</Text>
            </Pressable>
          </View>
          <Text testID="feed-position" style={styles.counter}>
            {cards.length
              ? `${Math.min(active + 1, cards.length)} / ${cards.length} ideas`
              : "YOUR SEMESTER"}
          </Text>
        </View>
      </View>
      <View
        style={{ flex: 1 }}
        onLayout={(event) =>
          setHeight(Math.max(320, event.nativeEvent.layout.height))
        }
      >
        {catalog.isPending || (!cards.length && feed.isFetching) ? (
          <View style={styles.center}>
            <ActivityIndicator color="#B9E9AB" />
            <Text style={styles.muted}>Getting your next idea ready…</Text>
          </View>
        ) : catalog.error || (feed.error && !cards.length) ? (
          <View style={styles.center}>
            <Text style={styles.endTitle}>Let’s try that again.</Text>
            <Text style={styles.endBody}>
              Check your connection. Saved lessons still work offline.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.cta}
              onPress={() => {
                void catalog.refetch();
                void feed.refetch();
              }}
            >
              <Text style={styles.ctaText}>Try again</Text>
            </Pressable>
          </View>
        ) : !courses.length ? (
          <View style={styles.center}>
            <Text style={styles.endTitle}>Your space is ready.</Text>
            <Text style={styles.endBody}>
              Your teacher hasn’t published lessons for this semester yet.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.cta}
              onPress={() => router.push("/(student)/courses")}
            >
              <Text style={styles.ctaText}>Explore courses</Text>
            </Pressable>
          </View>
        ) : (
          <FlashList
            ref={list}
            data={cards}
            extraData={{ revision, language, hints }}
            keyExtractor={(card) => card.id}
            pagingEnabled
            snapToInterval={height}
            decelerationRate="fast"
            disableIntervalMomentum
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (feed.hasNextPage && !feed.isFetchingNextPage)
                void feed.fetchNextPage();
            }}
            onViewableItemsChanged={({ viewableItems }) => {
              const visible = viewableItems.find(
                (v) => v.isViewable && v.index !== null,
              );
              if (visible?.index !== null && visible?.index !== undefined) {
                if (visible.index !== activeRef.current) {
                  activeRef.current = visible.index;
                  setActive(visible.index);
                }
                const card = cards[visible.index];
                if (card && cache.get(resumeKey) !== card.id)
                  cache.set(resumeKey, card.id);
              }
            }}
            viewabilityConfig={{ itemVisiblePercentThreshold: 65 }}
            renderItem={({ item: card, index }) => {
              const progress = readProgress(p.uid, card.code);
              const raw = cache.get(`feed-answer:${p.uid}:${card.id}`);
              const parsed = raw === undefined ? null : Number(raw);
              const selected =
                card.kind === "question" &&
                parsed !== null &&
                Number.isInteger(parsed) &&
                parsed >= 0 &&
                parsed < card.question.options.length
                  ? parsed
                  : null;
              return (
                <StudyCard
                  card={card}
                  active={index === active}
                  height={height}
                  saved={progress.bookmarks.includes(card.unitNo)}
                  completed={progress.completedUnits.includes(card.unitNo)}
                  selected={selected}
                  revealed={hints[card.id] ?? false}
                  language={language}

                  onSave={() =>
                    useStore.getState().update(card.code, {
                      bookmarks: progress.bookmarks.includes(card.unitNo)
                        ? progress.bookmarks.filter((n) => n !== card.unitNo)
                        : [...progress.bookmarks, card.unitNo],
                    })
                  }
                  onAnswer={(choice) => answer(card, choice)}
                  onReveal={() =>
                    setHints((current) => ({ ...current, [card.id]: true }))
                  }
                  onOpen={() =>
                    router.push({
                      pathname: "/(student)/course",
                      params: { code: card.code, unit: String(card.unitNo) },
                    })
                  }
                  onNext={() => {
                    if (
                      card.kind === "lesson" &&
                      card.part === card.parts &&
                      !progress.completedUnits.includes(card.unitNo)
                    )
                      useStore.getState().update(card.code, {
                        completedUnits: [
                          ...progress.completedUnits,
                          card.unitNo,
                        ],
                      });
                    move(index + 1);
                  }}
                />
              );
            }}
            ListFooterComponent={
              <View style={[styles.center, { height, padding: 36 }]}>
                {feed.isFetchingNextPage ? (
                  <>
                    <ActivityIndicator color="#B9E9AB" />
                    <Text style={styles.muted}>Loading your next course…</Text>
                  </>
                ) : feed.hasNextPage ? (
                  <Pressable
                    accessibilityRole="button"
                    style={styles.cta}
                    onPress={() => {
                      void feed.fetchNextPage();
                    }}
                  >
                    <Text style={styles.ctaText}>Load more lessons</Text>
                  </Pressable>
                ) : (
                  <>
                    <Text style={styles.endIcon}>✦</Text>
                    <Text style={styles.endTitle}>A little wiser.</Text>
                    <Text style={styles.endBody}>
                      You’ve reached the end of your published lessons. Take a
                      break, review an idea, or explore another course.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      style={styles.cta}
                      onPress={() => move(0)}
                    >
                      <Text style={styles.ctaText}>Review from the start</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      style={styles.smallButton}
                      onPress={() => router.push("/(student)/courses")}
                    >
                      <Text style={styles.languageText}>Explore courses →</Text>
                    </Pressable>
                  </>
                )}
              </View>
            }
          />
        )}{" "}
      </View>
      <View style={styles.bottomHint}>
        <Text numberOfLines={1} style={styles.hint}>
          {title}
        </Text>
        <Text style={styles.hint}>Swipe up ↑</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0E2921" },
  header: {
    width: "100%",
    maxWidth: 656,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: {
    color: "#EEF4D8",
    fontWeight: "800",
    fontSize: 23,
    letterSpacing: -0.8,
  },
  brandDot: { color: "#B9E9AB" },
  language: {
    backgroundColor: "#244637",
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: 18,
    justifyContent: "center",
  },
  languageText: { color: "#D6E8C7", fontSize: 14, fontWeight: "600" },
  selected: {
    backgroundColor: "#C0E6AB",
    borderRadius: 20,
    paddingHorizontal: 18,
    minHeight: 36,
    justifyContent: "center",
  },
  selectedText: { color: "#193A29", fontSize: 13, fontWeight: "700" },
  smallButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  muted: { color: "#A5BFAA", fontSize: 13 },
  counter: { fontSize: 10, letterSpacing: 1, color: "#9CB69E" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: 28,
  },
  endTitle: {
    fontSize: 34,
    lineHeight: 40,
    color: "#F0F3D7",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -1,
  },
  endBody: {
    color: "#ADC9B4",
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 360,
  },
  endIcon: { fontSize: 64, color: "#B9E9AB" },
  cta: {
    minHeight: 54,
    backgroundColor: "#C0E6AB",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 18,
  },
  ctaText: { color: "#163B27", fontWeight: "700", fontSize: 15 },
  bottomHint: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  hint: { color: "#88A88F", fontSize: 10, flexShrink: 1 },
});
