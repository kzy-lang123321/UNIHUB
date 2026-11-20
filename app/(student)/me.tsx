import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Button,
  Card,
  Heading,
  Label,
  Page,
  Row,
  useColors,
} from "../../src/components/ui";
import { BiometricSetting } from "../../src/components/DeviceLock";
import { useCatalog } from "../../src/features/courses/catalog";
import { readProgress, useStore } from "../../src/store";
import { logout } from "../../src/features/auth/service";
import { cache } from "../../src/services/cache";
import { makePlan } from "../../src/features/planner/plan";
import { Course } from "../../src/types";
import { authenticationEnabled } from "../../src/config/access";
export default function Me() {
  const p = useStore((s) => s.profile)!;
  const dark = useStore((s) => s.dark);
  useStore((s) => s.revision);
  const c = useColors();
  const catalog = useCatalog();
  const courses = catalog.data ?? [];
  const completed = courses.reduce(
    (total, course) =>
      total + readProgress(p.uid, course.code).completedUnits.length,
    0,
  );
  const attempts = courses.reduce(
    (total, course) =>
      total + readProgress(p.uid, course.code).quizScores.length,
    0,
  );
  const saved = courses.flatMap((course) => {
    const bookmarks = readProgress(p.uid, course.code).bookmarks;
    if (!bookmarks.length) return [];
    let cached: Course | null = null;
    try {
      const raw = cache.get(
        `course:${p.uid === "demo" ? "demo" : p.institutionId}:${course.code}`,
      );
      if (raw) cached = JSON.parse(raw) as Course;
    } catch {
      /* Course opens can refresh a damaged cache. */
    }
    return bookmarks.map((unit) => ({
      course,
      unit,
      title:
        cached?.units?.find((item) => item.no === unit)?.title ??
        `Unit ${unit}`,
    }));
  });
  const exams = courses
    .flatMap((course) => {
      const date = cache.get(`exam:${p.uid}:${course.code}`);
      return date ? [{ course, date, days: makePlan(0, [], date).days }] : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextExam = exams[0];
  return (
    <Page>
      <Row>
        <View style={{ gap: 6, flex: 1 }}>
          <Label muted size={12}>
            YOUR UNIHUB
          </Label>
          <Heading>Menu</Heading>
          <Label muted>{p.displayName} · Your college space</Label>
        </View>
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: 22,
            backgroundColor: c.tint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: c.accent, fontSize: 26, fontWeight: "700" }}>
            {p.displayName.charAt(0)}
          </Text>
        </View>
      </Row>
      <Row>
        <View style={{ flex: 1 }}>
          <Card>
            <Heading>{completed}</Heading>
            <Label muted>Topics learned</Label>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <Heading>{attempts}</Heading>
            <Label muted>Practice tries</Label>
          </Card>
        </View>
      </Row>
      <Button
        title="Keep learning →"
        onPress={() => router.push("/(student)")}
      />
      <Button
        secondary
        title="Downloaded academic documents"
        onPress={() =>
          router.push({
            pathname: "/(student)/materials",
            params: { kind: "saved" },
          })
        }
      />
      <Card accent>
        <Label size={19}>
          {nextExam
            ? `${nextExam.days} days to your exam`
            : "A little plan. A lot less stress."}
        </Label>
        <Label muted>
          {nextExam
            ? nextExam.course.title
            : "Choose an exam date. We’ll help you decide what to study each day."}
        </Label>
        <Button
          secondary
          title={nextExam ? "Open my plan" : "Make my study plan"}
          onPress={() => router.push("/(student)/planner")}
        />
      </Card>
      <Row>
        <Label size={21}>Saved topics</Label>
        <Label muted>{saved.length}</Label>
      </Row>
      {saved.length ? (
        saved.map(({ course, unit, title }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open saved unit ${unit} in ${course.title}`}
            key={`${course.code}-${unit}`}
            onPress={() =>
              router.push({
                pathname: "/(student)/course",
                params: { code: course.code, unit: String(unit) },
              })
            }
            style={{
              padding: 20,
              borderRadius: 20,
              backgroundColor: c.card,
              borderWidth: 1,
              borderColor: c.border,
              gap: 6,
              minHeight: 80,
            }}
          >
            <Label>{title} ↗</Label>
            <Label muted size={12}>
              Unit {unit} · {course.code}
            </Label>
          </Pressable>
        ))
      ) : (
        <Card>
          <Label>Good ideas deserve a second look.</Label>
          <Label muted>
            Tap Save on a lesson. It will be right here when you need it.
          </Label>
        </Card>
      )}
      <Button
        secondary
        title="Practice a quiz"
        onPress={() => router.push("/(student)/quiz")}
      />
      <Card>
        <Label size={18}>Make yourself comfortable</Label>
        <Button
          secondary
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          onPress={() => useStore.getState().toggleDark()}
        />
        {authenticationEnabled ? <BiometricSetting /> : null}
      </Card>
      <Label muted size={12}>
        Akl Postgraduate College · Matta, Swat
      </Label>
      {p.uid === "demo" ? (
        <Label muted size={12}>
          Your study progress is saved on this device.
        </Label>
      ) : null}
      {authenticationEnabled ? (
        <Button
          secondary
          title={p.uid === "demo" ? "Leave demo" : "Sign out"}
          onPress={() => {
            void logout().then(() => router.replace("/"));
          }}
        />
      ) : null}
    </Page>
  );
}
