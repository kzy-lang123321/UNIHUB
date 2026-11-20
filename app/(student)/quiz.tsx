import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Heading, Label, Page } from "../../src/components/ui";
import { loadCourse } from "../../src/features/courses/service";
import { useCatalog } from "../../src/features/courses/catalog";
import { readProgress, useStore } from "../../src/store";
export default function Quiz() {
  const p = useStore((s) => s.profile)!;
  useStore((s) => s.revision);
  const catalog = useCatalog();
  const [code, setCode] = useState("");
  const [chapter, setChapter] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!code && catalog.data?.[0]) setCode(catalog.data[0].code);
  }, [catalog.data, code]);
  const course = useQuery({
    queryKey: ["course", p.uid, code],
    queryFn: () => loadCourse(code, p.uid === "demo"),
    enabled: Boolean(code),
  });
  function reset() {
    setIndex(0);
    setScore(0);
    setSelected(null);
    setDone(false);
  }
  const questions =
    course.data?.units
      .filter((u) => chapter === 0 || u.no === chapter)
      .flatMap((u) => u.mcqs) ?? [];
  const q = questions[index];
  const progress = readProgress(p.uid, code);
  return (
    <Page>
      <Label muted>PRACTICE MAKES PROGRESS</Label>
      <Heading>Test your understanding.</Heading>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {catalog.data?.map((c) => (
          <Button
            key={c.code}
            secondary={code !== c.code}
            title={c.code}
            onPress={() => {
              setCode(c.code);
              setChapter(0);
              reset();
            }}
          />
        ))}
      </View>
      <Label>{course.data?.title ?? "Choose a published course"}</Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          secondary={chapter !== 0}
          title="All chapters"
          onPress={() => {
            setChapter(0);
            reset();
          }}
        />
        {course.data?.units.map((u) => (
          <Button
            key={u.no}
            secondary={chapter !== u.no}
            title={`Unit ${u.no}`}
            onPress={() => {
              setChapter(u.no);
              reset();
            }}
          />
        ))}
      </View>
      {course.isFetching && <Label muted>Loading practice questions…</Label>}
      {course.error && (
        <Button
          secondary
          title="Retry questions"
          onPress={() => {
            void course.refetch();
          }}
        />
      )}
      {done ? (
        <Card accent>
          <Heading>
            {score} / {questions.length}
          </Heading>
          <Label>Every attempt is a step forward.</Label>
          <Button title="Practice again" onPress={reset} />
        </Card>
      ) : q ? (
        <Card>
          <Label muted>
            QUESTION {index + 1} OF {questions.length}
          </Label>
          <Heading>{q.question}</Heading>
          {q.options.map((option, i) => (
            <Button
              key={`${i}-${option}`}
              title={`${selected === i ? "● " : ""}${option}`}
              secondary={selected !== i}
              disabled={selected !== null}
              onPress={() => {
                setSelected(i);
                if (i === q.answer) setScore((s) => s + 1);
              }}
            />
          ))}
          {selected !== null && (
            <>
              <Label>
                {selected === q.answer ? "Correct. " : "Keep learning. "}
                {q.explanation}
              </Label>
              <Button
                title={
                  index === questions.length - 1
                    ? "See results"
                    : "Next question →"
                }
                onPress={() => {
                  if (index === questions.length - 1) {
                    useStore.getState().update(code, {
                      quizScores: [
                        ...progress.quizScores,
                        {
                          score,
                          total: questions.length,
                          at: new Date().toISOString(),
                        },
                      ],
                    });
                    setDone(true);
                  } else {
                    setIndex((i) => i + 1);
                    setSelected(null);
                  }
                }}
              />
            </>
          )}
        </Card>
      ) : (
        !course.isFetching && (
          <Card>
            <Label>No questions published for this chapter yet.</Label>
          </Card>
        )
      )}
      <Label size={19}>Recent practice</Label>
      {progress.quizScores
        .slice(-5)
        .reverse()
        .map((s, i) => (
          <Card key={`${s.at}-${i}`}>
            <Label>
              {s.score}/{s.total} · {new Date(s.at).toLocaleDateString()}
            </Label>
          </Card>
        ))}
      <Card>
        <Label size={18}>Entry-test track</Label>
        <Label muted>ECAT · NTS · GAT</Label>
        <Label>
          Institution-approved question sets have not been published yet.
        </Label>
      </Card>
    </Page>
  );
}
