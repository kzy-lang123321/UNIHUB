import React from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Button, Card, Heading, Label, Page } from "../../src/components/ui";
import { db } from "../../src/services/firebase";
import { useStore } from "../../src/store";
export default function Dashboard() {
  const p = useStore((s) => s.profile)!;
  const q = useQuery({
    queryKey: ["assigned", p.uid],
    queryFn: async () => {
      if (!db) return [];
      const result = await getDocs(
        query(
          collection(db, "courses"),
          where("institutionId", "==", p.institutionId),
          where("teacherIds", "array-contains", p.uid),
        ),
      );
      return result.docs.map((d) => ({
        code: d.id,
        title: String(d.data().title),
        published: d.data().published === true,
      }));
    },
  });
  return (
    <Page>
      <Label muted>TEACHER WORKSPACE</Label>
      <Heading>Hello, {p.displayName}.</Heading>
      <Label>Your assigned courses</Label>
      {q.isPending && <Label>Loading assigned courses…</Label>}
      {q.error && (
        <Label>
          Couldn’t load courses. Check your connection and Firestore indexes.
        </Label>
      )}
      {q.data?.map((c) => (
        <Card key={c.code}>
          <Label muted>
            {c.code} · {c.published ? "Published" : "Draft"}
          </Label>
          <Heading>{c.title}</Heading>
          <Button
            title="Edit course"
            onPress={() =>
              router.push({
                pathname: "/(teacher)/upload",
                params: { code: c.code },
              })
            }
          />
        </Card>
      ))}
      {q.data?.length === 0 && (
        <Card>
          <Label>
            No assigned courses yet. Ask your institution admin to assign a
            course.
          </Label>
        </Card>
      )}
    </Page>
  );
}
