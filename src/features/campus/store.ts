import { useMemo } from "react";
import { create } from "zustand";
import { cache } from "../../services/cache";
import {
  CampusSpace,
  readSpace,
  writePost,
  writeComment,
  removePost,
  toggleId,
  PostKind,
} from "./model";

const useChanges = create<{ revision: number }>(() => ({ revision: 0 }));
let counter = 0;
const nextId = () =>
  `${Date.now().toString(36)}-${(++counter).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export function useCampusSpace(uid: string) {
  const revision = useChanges((s) => s.revision);
  const key = `campus-space:v1:${uid}`;
  const current = useMemo(() => readSpace(cache.get(key)), [key, revision]);
  function update(change: (space: CampusSpace) => CampusSpace) {
    const raw = cache.get(key);
    const previous = readSpace(raw);
    const next = change(previous.space);
    if (previous.damaged && raw)
      cache.set(`${key}:recovery:${Date.now()}`, raw);
    cache.set(key, JSON.stringify(next));
    useChanges.setState((s) => ({ revision: s.revision + 1 }));
  }
  return {
    ...current,
    post(body: string, kind: PostKind, editId?: string) {
      update((space) => {
        const existing = space.posts.find((p) => p.id === editId);
        return writePost(space, {
          id: existing?.id ?? nextId(),
          body,
          kind,
          createdAt: existing?.createdAt ?? Date.now(),
          ...(existing ? { editedAt: Date.now() } : {}),
        });
      });
    },
    comment(postId: string, body: string) {
      update((s) =>
        writeComment(s, { id: nextId(), postId, body, createdAt: Date.now() }),
      );
    },
    save(id: string) {
      update((s) => ({ ...s, saved: toggleId(s.saved, id) }));
    },
    like(id: string) {
      update((s) => ({ ...s, liked: toggleId(s.liked, id) }));
    },
    remove(id: string) {
      update((s) => removePost(s, id));
    },
  };
}
