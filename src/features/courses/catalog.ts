import { useQuery } from "@tanstack/react-query";
import { auth, configured } from "../../services/firebase";
import { cache } from "../../services/cache";
import { useStore } from "../../store";
import { Book, Material } from "../../types";
export interface Summary {
  code: string;
  title: string;
  credit: number;
  semester: number;
  programId: string;
  books: Book[];
  materials?: Material[];
}
interface Value {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  arrayValue?: { values?: Value[] };
  mapValue?: { fields?: Record<string, Value> };
}
interface QueryRow {
  document?: { name: string; fields: Record<string, Value> };
  error?: { message: string };
}
function text(v?: Value) {
  return v?.stringValue ?? "";
}
function decode(row: NonNullable<QueryRow["document"]>): Summary {
  const f = row.fields;
  return {
    code: row.name.split("/").pop()!,
    title: text(f.title),
    credit: Number(f.credit?.integerValue ?? 0),
    semester: Number(f.semester?.integerValue ?? 1),
    programId: text(f.programId),
    materials: (f.materials?.arrayValue?.values ?? []).map((m) => {
      const v = m.mapValue?.fields ?? {};
      return {
        id: text(v.id),
        title: text(v.title),
        kind: text(v.kind) === "book" ? "book" : "notes",
        filename: text(v.filename),
        filePath: text(v.filePath),
        sequence: Number(v.sequence?.integerValue ?? 0),
        creditLine: text(v.creditLine),
        bytes: Number(v.bytes?.integerValue ?? 0),
      };
    }),
    books: (f.books?.arrayValue?.values ?? []).map((b) => {
      const fields = b.mapValue?.fields ?? {};
      return {
        title: text(fields.title),
        type: text(fields.type) === "open" ? "open" : "linked",
        url: text(fields.url),
        edition: text(fields.edition),
      };
    }),
  };
}
export function useCatalog() {
  const p = useStore((s) => s.profile)!;
  return useQuery({
    queryKey: ["catalog", "provided-library", p.uid, p.institutionId],
    queryFn: async (): Promise<Summary[]> => {
      if (p.uid === "demo") return [];
      const key = `catalog:provided-library:${p.institutionId}`;
      try {
        if (!configured || !auth?.currentUser)
          throw new Error("Sign in to load courses.");
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(
          `https://firestore.googleapis.com/v1/projects/${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              structuredQuery: {
                from: [{ collectionId: "courses" }],
                select: {
                  fields: [
                    "title",
                    "credit",
                    "semester",
                    "programId",
                    "books",
                    "materials",
                  ].map((fieldPath) => ({ fieldPath })),
                },
                where: {
                  compositeFilter: {
                    op: "AND",
                    filters: [
                      {
                        fieldFilter: {
                          field: { fieldPath: "institutionId" },
                          op: "EQUAL",
                          value: { stringValue: p.institutionId },
                        },
                      },
                      {
                        fieldFilter: {
                          field: { fieldPath: "published" },
                          op: "EQUAL",
                          value: { booleanValue: true },
                        },
                      },
                    ],
                  },
                },
              },
            }),
          },
        );
        if (!response.ok)
          throw new Error(
            "Unable to load your catalog. Check your connection or contact your admin.",
          );
        const rows = (await response.json()) as QueryRow[];
        const summaries = rows.flatMap((row) =>
          row.document ? [decode(row.document)] : [],
        );
        cache.set(key, JSON.stringify(summaries));
        return summaries;
      } catch (error) {
        const saved = cache.get(key);
        if (saved) return JSON.parse(saved) as Summary[];
        throw error;
      }
    },
  });
}
