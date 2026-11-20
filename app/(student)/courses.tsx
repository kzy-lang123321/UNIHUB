import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import {
  Button,
  Card,
  Heading,
  Label,
  Page,
  Row,
  useColors,
} from "../../src/components/ui";
import { useCatalog } from "../../src/features/courses/catalog";
import { useStore } from "../../src/store";
export default function Courses() {
  const p = useStore((s) => s.profile)!;
  const { data: catalog = [], isPending, error, refetch } = useCatalog();
  const [semester, setSemester] = useState(p.semester);
  const [program, setProgram] = useState(p.programId);
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ padding: 22, paddingTop: 35, gap: 18 }}>
        <Label muted>EXPLORE YOUR CURRICULUM</Label>
        <Heading>Small steps. Big ideas.</Heading>
        <Label>
          {program === "bs-cs" ? "BS Computer Science" : program} · 4-year
          program
        </Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[...new Set([p.programId, ...catalog.map((c) => c.programId)])].map(
            (id) => (
              <Button
                key={id}
                secondary={program !== id}
                title={id.toUpperCase()}
                onPress={() => setProgram(id)}
              />
            ),
          )}
        </View>
        {isPending ? <Label>Loading your catalog…</Label> : null}
        {error ? (
          <Button
            secondary
            title="Retry catalog"
            onPress={() => {
              void refetch();
            }}
          />
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              secondary={semester !== n}
              title={`${n}`}
              onPress={() => setSemester(n)}
            />
          ))}
        </View>
        <Row>
          <Label size={19}>Semester {semester}</Label>
          <Label muted>
            {
              catalog.filter(
                (x) => x.semester === semester && x.programId === program,
              ).length
            }{" "}
            course(s)
          </Label>
        </Row>
      </View>
      <FlashList
        data={catalog.filter(
          (x) => x.semester === semester && x.programId === program,
        )}
        contentContainerStyle={{ padding: 22 }}
        renderItem={({ item }) => (
          <Card>
            <Label muted>
              {item.code} · {item.credit} CREDIT HOURS
            </Label>
            <Heading>{item.title}</Heading>
            <Label muted>Notes, practice & resources</Label>
            <Button
              title="Open course →"
              onPress={() =>
                router.push({
                  pathname: "/(student)/course",
                  params: { code: item.code },
                })
              }
            />
          </Card>
        )}
        ListEmptyComponent={
          <Card>
            <Label>
              Your institution hasn’t published courses for this semester yet.
            </Label>
          </Card>
        }
      />
    </View>
  );
}
