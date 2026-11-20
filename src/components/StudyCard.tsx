import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FeedCard, FeedLanguage } from "../features/courses/feed";

export type { FeedLanguage } from "../features/courses/feed";
interface Props {
  card: FeedCard;
  active: boolean;
  height: number;
  saved: boolean;
  completed: boolean;
  selected: number | null;
  revealed: boolean;
  language: FeedLanguage;
  onSave: () => void;
  onAnswer: (choice: number) => void;
  onReveal: () => void;
  onNext: () => void;
  onOpen: () => void;
}

function Action({
  title,
  onPress,
  secondary = false,
  label,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        secondary ? styles.secondary : styles.primary,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Text
        style={{
          color: secondary ? "#D9EEE3" : "#102E23",
          fontWeight: "700",
          fontSize: 16,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function StudyCard(p: Props) {
  const { card } = p;
  const content = useRef<ScrollView>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const scrollable = contentHeight > viewportHeight + 3;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (p.selected !== null) {
      const timer = setTimeout(
        () => content.current?.scrollToEnd({ animated: !reduced }),
        80,
      );
      return () => clearTimeout(timer);
    }
  }, [p.selected, card.id, reduced]);
  const translated =
    card.kind === "lesson"
      ? p.language === "اردو"
        ? card.urdu
        : p.language === "پښتو"
          ? card.pashto
          : undefined
      : undefined;
  const body = card.kind === "lesson" ? translated || card.body : "";
  const rtl = /[\u0600-\u06ff]/.test(body);
  return (
    <View
      aria-hidden={!p.active}
      importantForAccessibility={p.active ? "auto" : "no-hide-descendants"}
      style={[styles.page, { height: p.height }]}
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {card.kind === "lesson"
                ? "✦  QUICK LESSON"
                : card.kind === "question"
                  ? "◎  QUICK CHECK"
                  : "↗  THINK ABOUT IT"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              p.saved ? "Unsave this lesson" : "Save this lesson"
            }
            onPress={p.onSave}
            style={styles.save}
          >
            <Text
              style={{ fontSize: 19, color: p.saved ? "#A1EFBE" : "#D9EEE3" }}
            >
              {p.saved ? "✓" : "＋"}
            </Text>
            <Text style={styles.small}>{p.saved ? "Saved" : "Save"}</Text>
          </Pressable>
        </View>
        <ScrollView
          ref={content}
          scrollEnabled={scrollable}
          bounces={false}
          onLayout={(event) =>
            setViewportHeight(event.nativeEvent.layout.height)
          }
          onContentSizeChange={(_width, height) => setContentHeight(height)}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 16, paddingTop: 12, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={scrollable}
        >
          <Text style={styles.meta}>
            {card.code} / UNIT {card.unitNo}
            {card.kind === "lesson" && card.parts > 1 && !translated
              ? `  /  ${card.part} OF ${card.parts}`
              : ""}
          </Text>
          <Text
            accessibilityRole="header"
            style={[
              styles.title,
              card.kind !== "lesson" && { fontSize: 26, lineHeight: 32 },
            ]}
          >
            {card.kind === "question"
              ? card.question.question
              : card.kind === "recall"
                ? card.prompt
                : card.title}
          </Text>
          {card.kind === "lesson" ? (
            <>
              <Text
                selectable
                style={[
                  styles.body,
                  {
                    textAlign: rtl ? "right" : "left",
                    writingDirection: rtl ? "rtl" : "ltr",
                  },
                ]}
              >
                {body}
              </Text>
              {p.language !== "English" && !translated ? (
                <Text style={styles.small}>
                  English shown · This explanation is not available in{" "}
                  {p.language} yet.
                </Text>
              ) : null}
            </>
          ) : card.kind === "question" ? (
            <View style={{ gap: 8 }}>
              {card.question.options.map((option, index) => {
                const answered = p.selected !== null;
                const correct = answered && index === card.question.answer;
                const wrong = answered && index === p.selected && !correct;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={option}
                    accessibilityState={{
                      selected: p.selected === index,
                      disabled: answered,
                    }}
                    disabled={answered}
                    key={index}
                    onPress={() => p.onAnswer(index)}
                    style={[
                      styles.option,
                      correct && styles.correct,
                      wrong && styles.wrong,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionLetter,
                        correct && { backgroundColor: "#A1EFBE" },
                      ]}
                    >
                      <Text
                        style={{
                          color: correct ? "#143628" : "#C0D8C8",
                          fontWeight: "700",
                        }}
                      >
                        {correct ? "✓" : String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        correct && { color: "#BDF8CE" },
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
              {p.selected !== null ? (
                <View accessibilityLiveRegion="polite" style={styles.insight}>
                  <Text style={styles.feedback}>
                    {p.selected === card.question.answer
                      ? "That’s right. "
                      : "Good try. "}
                    {card.question.explanation}
                  </Text>
                </View>
              ) : (
                <Text style={styles.small}>
                  Tap an answer. No timer, no pressure.
                </Text>
              )}
            </View>
          ) : (
            <>
              <Text style={styles.body}>
                Take a moment to explain it in your own words.
              </Text>
              {p.revealed ? (
                <View style={styles.insight}>
                  <Text style={styles.feedback}>{card.hint}</Text>
                </View>
              ) : (
                <Action secondary title="Show a hint" onPress={p.onReveal} />
              )}
            </>
          )}
        </ScrollView>
        <View style={{ gap: 14 }}>
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              onPress={p.onOpen}
              style={{ minHeight: 44, justifyContent: "center", flex: 1 }}
            >
              <Text numberOfLines={1} style={styles.courseLink}>
                {card.courseTitle} ↗
              </Text>
              <Text numberOfLines={1} style={styles.credit}>
                {card.credit}
              </Text>
            </Pressable>
            <Text style={styles.meta}>
              {card.kind === "question" ? "PRACTICE" : "~1 MIN"}
            </Text>
          </View>
          <Action
            title={
              card.kind === "question" && p.selected === null
                ? "Skip for now ↓"
                : card.kind === "lesson" &&
                    card.part === card.parts &&
                    !p.completed
                  ? "Got it. Next ↓"
                  : "Next ↓"
            }
            onPress={p.onNext}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 12,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 620,
    flex: 1,
    padding: 20,
    borderRadius: 28,
    backgroundColor: "#183D31",
    borderWidth: 1,
    borderColor: "#315444",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  badge: {
    backgroundColor: "#264C3B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: "#B7EACA",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  save: {
    minWidth: 54,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  small: { color: "#AEC7B7", fontSize: 12, lineHeight: 19 },
  meta: {
    color: "#A2BCAA",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: {
    color: "#F1F5D9",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    letterSpacing: -0.8,
  },
  body: { color: "#E4EEDC", fontSize: 19, lineHeight: 31 },
  languages: {
    flexDirection: "row",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "#102E24",
    padding: 4,
    borderRadius: 18,
  },
  language: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  activeLanguage: { backgroundColor: "#C0E6AB" },
  insight: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#234A39",
    borderRadius: 18,
    padding: 16,
  },
  action: {
    minHeight: 54,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  primary: { backgroundColor: "#C0E6AB" },
  secondary: { backgroundColor: "#315340" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#41604C",
    backgroundColor: "#204534",
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#345640",
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1, fontSize: 16, lineHeight: 23, color: "#ECF2DD" },
  correct: { borderColor: "#9AE6B2", backgroundColor: "#285A3D" },
  wrong: { borderColor: "#D4A98A", backgroundColor: "#503F33" },
  feedback: { color: "#DEF0D3", fontSize: 15, lineHeight: 24, flex: 1 },
  courseLink: { color: "#DDEBD4", fontSize: 12, fontWeight: "600" },
  credit: { color: "#8EAB99", fontSize: 9, marginTop: 3 },
});
