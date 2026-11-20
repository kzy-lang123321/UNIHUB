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
import { PaperLink } from "../../src/components/PaperLink";
import { useCatalog } from "../../src/features/courses/catalog";
import { loadCourse } from "../../src/features/courses/service";
import { useStore } from "../../src/store";
export default function Papers() {
  const p = useStore((s) => s.profile)!;
  const catalog = useCatalog();
  const [code, setCode] = useState("");
  const [year, setYear] = useState("");
  const [university, setUniversity] = useState("");
  const [type, setType] = useState("All");
  useEffect(() => {
    if (!code && catalog.data?.[0]) setCode(catalog.data[0].code);
  }, [catalog.data, code]);
  const course = useQuery({
    queryKey: ["course", p.uid, code],
    queryFn: () => loadCourse(code, p.uid === "demo"),
    enabled: Boolean(code),
  });
  const papers =
    course.data?.papers.filter(
      (paper) =>
        (!year || String(paper.year) === year) &&
        paper.uni.toLowerCase().includes(university.toLowerCase()) &&
        (type === "All" || paper.type === type),
    ) ?? [];
  return (
    <Page>
      <Label muted>KNOW WHAT TO EXPECT</Label>
      <Heading>Practice papers.</Heading>
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
      <Field
        placeholder="Filter university / contributor"
        value={university}
        onChangeText={setUniversity}
      />
      <Field
        placeholder="Year, e.g. 2026"
        value={year}
        onChangeText={setYear}
        keyboardType="number-pad"
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {["All", "Quiz", "Assignment", "Midterm", "Final"].map((t) => (
          <Button
            key={t}
            secondary={type !== t}
            title={t}
            onPress={() => setType(t)}
          />
        ))}
      </View>
      {course.isFetching ? <Label>Loading papers…</Label> : null}
      {course.error ? (
        <Button
          title="Retry papers"
          onPress={() => {
            void course.refetch();
          }}
        />
      ) : null}
      {papers.map((paper, i) => (
        <Card key={i}>
          <Label size={18}>
            {paper.type} · {paper.year}
          </Label>
          <Label muted>{paper.uni}</Label>
          {paper.fileUrl ? (
            <PaperLink path={paper.fileUrl} title="Open paper" />
          ) : (
            <>
              <Label>
                Original practice: Write pseudocode to calculate the average of
                three numbers. (10 marks)
              </Label>
              <Label>
                Solution: Read a, b, c. Set average = (a + b + c) / 3. Display
                average. Test: 3, 6, 9 gives 6.
              </Label>
            </>
          )}
          {paper.solutionUrl ? (
            <PaperLink path={paper.solutionUrl} title="Open worked solutions" />
          ) : null}
        </Card>
      ))}
      {!papers.length && !course.isFetching ? (
        <Card>
          <Label>No published papers match these filters.</Label>
        </Card>
      ) : null}
    </Page>
  );
}
