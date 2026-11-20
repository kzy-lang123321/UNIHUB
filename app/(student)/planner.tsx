import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Field,
  Heading,
  Label,
  Page,
} from "../../src/components/ui";
import { cache } from "../../src/services/cache";
import { readProgress, useStore } from "../../src/store";
import { makePlan, validDate } from "../../src/features/planner/plan";
import { useCatalog } from "../../src/features/courses/catalog";
import { loadCourse } from "../../src/features/courses/service";
export default function Planner() {
  const p = useStore((s) => s.profile)!;
  useStore((s) => s.revision);
  const catalog = useCatalog();
  const [code, setCode] = useState("");
  const [date, setDate] = useState("");
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const key = `exam:${p.uid}:${code}`;
  useEffect(() => {
    if (!code && catalog.data?.[0]) setCode(catalog.data[0].code);
  }, [catalog.data, code]);
  useEffect(() => {
    const value = cache.get(key) ?? "";
    setDate(value);
    setSaved(value);
    setError("");
  }, [key]);
  const course = useQuery({
    queryKey: ["course", p.uid, code],
    queryFn: () => loadCourse(code, p.uid === "demo"),
    enabled: Boolean(code),
  });
  const progress = readProgress(p.uid, code);
  const units = course.data?.units ?? [];
  const plan = makePlan(units.length, progress.completedUnits, saved);
  return (
    <Page>
      <Label muted>LESS CRAMMING. MORE CONFIDENCE.</Label>
      <Heading>Make time for learning.</Heading>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {catalog.data?.map((c) => (
          <Button
            key={c.code}
            secondary={code !== c.code}
            title={c.code}
            onPress={() => setCode(c.code)}
          />
        ))}
      </View>
      <Card>
        <Label>{course.data?.title ?? "Choose a course"} · Exam date</Label>
        <Field
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
        />
        {error ? <Label>{error}</Label> : null}
        <Button
          disabled={!course.data}
          title="Create my plan"
          onPress={() => {
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            if (!validDate(date) || date < today) {
              setError(
                "Enter a valid upcoming exam date in YYYY-MM-DD format.",
              );
              return;
            }
            cache.set(key, date);
            setSaved(date);
            setError("");
          }}
        />
      </Card>
      {saved ? (
        <>
          <Card accent>
            <Heading>{plan.days} days to go.</Heading>
            <Label>
              {plan.remaining} units remaining · Aim for {plan.daily} unit(s)
              per day
            </Label>
            <Label muted>
              {plan.remaining === 0
                ? "All units complete. Use the time for revision."
                : "Your plan updates as you complete units."}
            </Label>
          </Card>
          <Label size={19}>Today’s focus</Label>
          {units
            .filter((u) => !progress.completedUnits.includes(u.no))
            .slice(0, Math.max(1, plan.daily))
            .map((u) => (
              <Card key={u.no}>
                <Label>{u.title}</Label>
                <Button
                  secondary
                  title="Mark complete ✓"
                  onPress={() =>
                    useStore.getState().update(code, {
                      completedUnits: [...progress.completedUnits, u.no],
                    })
                  }
                />
              </Card>
            ))}
        </>
      ) : (
        <Label muted>
          Add an exam date to turn your chapters into daily tasks.
        </Label>
      )}
      {course.error ? (
        <Button
          secondary
          title="Retry course"
          onPress={() => {
            void course.refetch();
          }}
        />
      ) : null}
    </Page>
  );
}
