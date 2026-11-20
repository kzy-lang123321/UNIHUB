import React, { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { router } from "expo-router";
import { syncProgress } from "../../src/services/progress";
import { Linking, Share } from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Field,
  Heading,
  Label,
  Page,
  Row,
} from "../../src/components/ui";
import { loadCourse } from "../../src/features/courses/service";
import { readProgress, useStore } from "../../src/store";
import { RichText } from "../../src/components/RichText";
import { PaperLink } from "../../src/components/PaperLink";
import { cache } from "../../src/services/cache";
export default function Course() {
  const p = useStore((s) => s.profile)!;
  const { code: requestedCode, unit: requestedUnit } = useLocalSearchParams<{
    code?: string;
    unit?: string;
  }>();
  const code = requestedCode ?? "CS-101";
  useEffect(() => {
    void syncProgress(p.uid, code)
      .then(() => useStore.setState((s) => ({ revision: s.revision + 1 })))
      .catch(() => {});
  }, [p.uid, code]);
  useStore((s) => s.revision);
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["course", p.uid, code],
    queryFn: () => loadCourse(code, p.uid === "demo"),
  });
  const [unitNo, setUnitNo] = useState(Number(requestedUnit) || 1);
  useEffect(() => {
    const next = Number(requestedUnit) || 1;
    setUnitNo(next);
    setHighlight(cache.get(`highlight:${p.uid}:${code}:${next}`) === "true");
    setNote(cache.get(`note:${p.uid}:${code}:${next}`) ?? "");
  }, [requestedUnit, code, p.uid]);
  const [language, setLanguage] = useState("English");
  const [highlight, setHighlight] = useState(
    cache.get(`highlight:${p.uid}:${code}:1`) === "true",
  );
  const [note, setNote] = useState(cache.get(`note:${p.uid}:${code}:1`) ?? "");
  const progress = readProgress(p.uid, code);
  if (isPending)
    return (
      <Page>
        <Card>
          <Heading>Opening your course…</Heading>
          <Label muted>Loading units and resources</Label>
        </Card>
      </Page>
    );
  if (!data)
    return (
      <Page>
        <Label>
          {error instanceof Error ? error.message : "Unable to load course."}
        </Label>
        <Button
          title="Try again"
          onPress={() => {
            void refetch();
          }}
        />
      </Page>
    );
  const unit = data.units.find((x) => x.no === unitNo) ?? data.units[0]!;
  return (
    <Page>
      <Label muted>
        {data.code} · {data.credit} CREDIT HOURS · SAVED FOR OFFLINE
      </Label>
      <Heading>{data.title}</Heading>
      <Button
        secondary
        title="Course books & notes"
        onPress={() =>
          router.push({ pathname: "/(student)/materials", params: { code } })
        }
      />
      <Card>
        <Label size={18}>Course outline</Label>
        <Label muted>{data.outline}</Label>
      </Card>
      <Row>
        {data.units.map((u) => (
          <Button
            key={u.no}
            title={`Unit ${u.no}`}
            secondary={unitNo !== u.no}
            onPress={() => {
              setUnitNo(u.no);
              setHighlight(
                cache.get(`highlight:${p.uid}:${code}:${u.no}`) === "true",
              );
              setNote(cache.get(`note:${p.uid}:${code}:${u.no}`) ?? "");
            }}
          />
        ))}
      </Row>
      <Heading>{unit.title}</Heading>
      <Row>
        {["English", "اردو", "پښتو"].map((l) => (
          <Button
            key={l}
            title={l}
            secondary={language !== l}
            onPress={() => setLanguage(l)}
          />
        ))}
      </Row>
      <Card accent={highlight}>
        <RichText
          text={
            language === "English"
              ? unit.notes
              : (language === "اردو" ? unit.urdu : unit.pashto) ||
                "An explanation in this language has not been published for this unit."
          }
        />
        <Label muted size={12}>
          {unit.notes.split(/\s+/).length} words · {data.creditLine}
        </Label>
      </Card>
      <Row>
        <Button
          secondary
          title={highlight ? "Clear highlight" : "Highlight unit"}
          onPress={() => {
            cache.set(
              `highlight:${p.uid}:${code}:${unitNo}`,
              String(!highlight),
            );
            setHighlight(!highlight);
          }}
        />
        <Button
          secondary
          title={
            progress.bookmarks.includes(unitNo) ? "Bookmarked ✓" : "Bookmark"
          }
          onPress={() =>
            useStore.getState().update(data.code, {
              bookmarks: progress.bookmarks.includes(unitNo)
                ? progress.bookmarks.filter((n) => n !== unitNo)
                : [...progress.bookmarks, unitNo],
            })
          }
        />
      </Row>
      <Field
        placeholder="Your private study notes…"
        multiline
        value={note}
        onChangeText={(value) => {
          setNote(value);
          cache.set(`note:${p.uid}:${code}:${unitNo}`, value);
        }}
      />
      <Button
        title={
          progress.completedUnits.includes(unitNo)
            ? "Completed ✓ · Tap to undo"
            : "Mark unit complete"
        }
        onPress={() =>
          useStore.getState().update(data.code, {
            completedUnits: progress.completedUnits.includes(unitNo)
              ? progress.completedUnits.filter((n) => n !== unitNo)
              : [...progress.completedUnits, unitNo],
          })
        }
      />
      <Card>
        <Label size={18}>Check your understanding</Label>
        {[...unit.sq, ...unit.lq].map((q) => (
          <Label key={q}>• {q}</Label>
        ))}
      </Card>
      <Label size={19}>Books & resources</Label>
      {data.books.map((b) => (
        <Card key={b.title}>
          <Label>{b.title}</Label>
          <Label muted>
            {b.type === "open"
              ? "Open access"
              : "Buy or borrow · No PDF hosted"}
          </Label>
          <Button
            secondary
            title="Visit source ↗"
            onPress={() => {
              void Linking.openURL(b.url);
            }}
          />
        </Card>
      ))}
      {data.papers
        .filter((paper) => paper.fileUrl)
        .map((paper, i) => (
          <Card key={i}>
            <Label>
              {paper.type} · {paper.year}
            </Label>
            <Label muted>{paper.uni}</Label>
            <PaperLink path={paper.fileUrl} title="Open paper" />
            {paper.solutionUrl ? (
              <PaperLink path={paper.solutionUrl} title="Open solution" />
            ) : null}
          </Card>
        ))}
      <Button
        secondary
        title="Share course title"
        onPress={() => {
          void Share.share({ message: `${data.code}: ${data.title}` });
        }}
      />
    </Page>
  );
}
