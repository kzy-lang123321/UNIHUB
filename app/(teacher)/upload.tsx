import React, { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Button,
  Card,
  Field,
  Heading,
  Label,
  Page,
} from "../../src/components/ui";
import { RichText } from "../../src/components/RichText";
import { PaperUpload } from "../../src/features/courses/upload";
import { isUnits } from "../../src/features/courses/validation";
import { db } from "../../src/services/firebase";
import { useStore } from "../../src/store";
import { Course, Unit } from "../../src/types";
export default function Upload() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(params.code ?? "");
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const p = useStore((s) => s.profile)!;
  const unit = units[active];
  function patch(value: Partial<Unit>) {
    setUnits((current) =>
      current.map((u, i) => (i === active ? { ...u, ...value } : u)),
    );
  }
  async function load() {
    setBusy(true);
    try {
      if (!db) throw new Error("Configure Firebase first.");
      const snapshot = await getDoc(doc(db, "courses", code));
      const data = snapshot.data() as Course | undefined;
      if (!data || !data.teacherIds.includes(p.uid))
        throw new Error("This course is not assigned to you.");
      setCourse(data);
      setUnits(data.units);
      setActive(0);
      setMessage(
        "Course loaded. Your edits are saved only when you choose draft or publish.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to load.");
    } finally {
      setBusy(false);
    }
  }
  async function save(published: boolean) {
    setBusy(true);
    try {
      if (!db || !course) throw new Error("Load an assigned course first.");
      if (!isUnits(units))
        throw new Error(
          "Check unit titles and quiz options. Every quiz needs at least two options and a valid correct answer.",
        );
      await updateDoc(doc(db, "courses", code), { units, published });
      setMessage(
        published
          ? "Published to your students."
          : "Draft saved. Course hidden until you publish.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Save failed. Your edits remain here.",
      );
    } finally {
      setBusy(false);
    }
  }
  function format(marker: string) {
    if (!unit) return;
    patch({
      notes:
        unit.notes.slice(0, selection.start) +
        marker +
        unit.notes.slice(selection.start, selection.end) +
        marker +
        unit.notes.slice(selection.end),
    });
  }
  return (
    <Page>
      <Heading>Publish something useful.</Heading>
      <Label muted>
        Assigned courses only · Original or permitted material
      </Label>
      <Field
        value={code}
        onChangeText={(value) => {
          setCode(value);
          setCourse(null);
          setUnits([]);
        }}
        placeholder="Course code"
      />
      <Button
        disabled={busy}
        secondary
        title="Load course"
        onPress={() => {
          void load();
        }}
      />
      {course && (
        <>
          <Heading>{course.title}</Heading>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {units.map((u, i) => (
              <Button
                key={u.no}
                secondary={active !== i}
                title={`Unit ${u.no}`}
                onPress={() => setActive(i)}
              />
            ))}
            <Button
              secondary
              title="+ Unit"
              onPress={() => {
                setUnits([
                  ...units,
                  {
                    no: units.length + 1,
                    title: "New unit",
                    notes: "",
                    mcqs: [],
                    sq: [],
                    lq: [],
                  },
                ]);
                setActive(units.length);
              }}
            />
          </View>
          {unit && (
            <>
              <Card>
                <Label size={18}>Chapter notes</Label>
                <Field
                  value={unit.title}
                  onChangeText={(title) => patch({ title })}
                  placeholder="Unit title"
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button secondary title="Bold" onPress={() => format("**")} />
                  <Button
                    secondary
                    title="Italic"
                    onPress={() => format("*")}
                  />
                  <Button
                    secondary
                    title={preview ? "Edit" : "Preview"}
                    onPress={() => setPreview(!preview)}
                  />
                </View>
                {preview ? (
                  <RichText text={unit.notes} />
                ) : (
                  <Field
                    multiline
                    value={unit.notes}
                    onSelectionChange={(event) =>
                      setSelection(event.nativeEvent.selection)
                    }
                    onChangeText={(notes) => patch({ notes })}
                    placeholder="Write chapter notes…"
                    style={{ minHeight: 200, textAlignVertical: "top" }}
                  />
                )}
                <Field
                  multiline
                  value={unit.urdu ?? ""}
                  onChangeText={(urdu) => patch({ urdu })}
                  placeholder="Urdu explanation (optional)"
                  style={{ textAlign: "right" }}
                />
                <Field
                  multiline
                  value={unit.pashto ?? ""}
                  onChangeText={(pashto) => patch({ pashto })}
                  placeholder="Pashto explanation (optional)"
                  style={{ textAlign: "right" }}
                />
              </Card>
              <Card>
                <Label size={18}>Practice questions</Label>
                <Label muted>One question per line</Label>
                <Field
                  multiline
                  value={unit.sq.join("\n")}
                  onChangeText={(text) => patch({ sq: text.split("\n") })}
                  placeholder="Short questions"
                />
                <Field
                  multiline
                  value={unit.lq.join("\n")}
                  onChangeText={(text) => patch({ lq: text.split("\n") })}
                  placeholder="Long questions"
                />
              </Card>
              <Label size={19}>Multiple-choice questions</Label>
              {unit.mcqs.map((q, qi) => (
                <Card key={qi}>
                  <Field
                    value={q.question}
                    onChangeText={(question) =>
                      patch({
                        mcqs: unit.mcqs.map((item, i) =>
                          i === qi ? { ...item, question } : item,
                        ),
                      })
                    }
                    placeholder="Question"
                  />
                  {q.options.map((option, oi) => (
                    <Field
                      key={oi}
                      value={option}
                      placeholder={`Option ${oi + 1}`}
                      onChangeText={(value) =>
                        patch({
                          mcqs: unit.mcqs.map((item, i) =>
                            i === qi
                              ? {
                                  ...item,
                                  options: item.options.map((o, j) =>
                                    j === oi ? value : o,
                                  ),
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  ))}
                  <Label muted>Correct answer</Label>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {q.options.map((_, oi) => (
                      <Button
                        key={oi}
                        secondary={q.answer !== oi}
                        title={`${oi + 1}`}
                        onPress={() =>
                          patch({
                            mcqs: unit.mcqs.map((item, i) =>
                              i === qi ? { ...item, answer: oi } : item,
                            ),
                          })
                        }
                      />
                    ))}
                  </View>
                  <Field
                    value={q.explanation}
                    onChangeText={(explanation) =>
                      patch({
                        mcqs: unit.mcqs.map((item, i) =>
                          i === qi ? { ...item, explanation } : item,
                        ),
                      })
                    }
                    placeholder="Explain the answer"
                  />
                  <Button
                    secondary
                    title="Remove question"
                    onPress={() =>
                      patch({ mcqs: unit.mcqs.filter((_, i) => i !== qi) })
                    }
                  />
                </Card>
              ))}
              <Button
                secondary
                title="+ Add MCQ"
                onPress={() =>
                  patch({
                    mcqs: [
                      ...unit.mcqs,
                      {
                        question: "",
                        options: ["", "", "", ""],
                        answer: 0,
                        explanation: "",
                      },
                    ],
                  })
                }
              />
            </>
          )}
          <Button
            disabled={busy}
            secondary
            title="Save draft"
            onPress={() => {
              void save(false);
            }}
          />
          <Button
            disabled={busy}
            title="Publish"
            onPress={() => {
              void save(true);
            }}
          />
          <PaperUpload code={code} />
        </>
      )}
      <Label>{message}</Label>
    </Page>
  );
}
