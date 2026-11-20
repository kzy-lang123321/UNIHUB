export type PostKind = "note" | "question";
export interface CampusPost {
  id: string;
  body: string;
  kind: PostKind;
  createdAt: number;
  editedAt?: number;
}
export interface CampusComment {
  id: string;
  postId: string;
  body: string;
  createdAt: number;
}
export interface CampusSpace {
  posts: CampusPost[];
  comments: CampusComment[];
  saved: string[];
  liked: string[];
}
export function emptySpace(): CampusSpace {
  return { posts: [], comments: [], saved: [], liked: [] };
}
export function readSpace(raw?: string): {
  space: CampusSpace;
  damaged: boolean;
} {
  if (!raw) return { space: emptySpace(), damaged: false };
  try {
    const value = JSON.parse(raw) as CampusSpace;
    if (
      !value ||
      !Array.isArray(value.posts) ||
      !Array.isArray(value.comments) ||
      !Array.isArray(value.saved) ||
      !Array.isArray(value.liked)
    )
      throw new Error("Invalid local feed");
    const validPost = (p: CampusPost) =>
      p &&
      typeof p.id === "string" &&
      typeof p.body === "string" &&
      p.body.trim().length > 0 &&
      p.body.length <= 5000 &&
      ["note", "question"].includes(p.kind) &&
      Number.isFinite(p.createdAt);
    const validComment = (c: CampusComment) =>
      c &&
      typeof c.id === "string" &&
      typeof c.postId === "string" &&
      typeof c.body === "string" &&
      c.body.trim().length > 0 &&
      c.body.length <= 1000 &&
      Number.isFinite(c.createdAt);
    const posts = value.posts.filter(validPost);
    const comments = value.comments.filter(validComment);
    const saved = value.saved.filter((id) => typeof id === "string");
    const liked = value.liked.filter((id) => typeof id === "string");
    return {
      space: { posts, comments, saved, liked },
      damaged:
        posts.length !== value.posts.length ||
        comments.length !== value.comments.length ||
        saved.length !== value.saved.length ||
        liked.length !== value.liked.length,
    };
  } catch {
    return { space: emptySpace(), damaged: true };
  }
}
export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}
export function writePost(space: CampusSpace, post: CampusPost): CampusSpace {
  const body = post.body.trim();
  if (!body || body.length > 5000)
    throw new Error("Write a note of 1–5,000 characters.");
  return {
    ...space,
    posts: [{ ...post, body }, ...space.posts.filter((p) => p.id !== post.id)],
  };
}
export function removePost(space: CampusSpace, id: string): CampusSpace {
  return {
    ...space,
    posts: space.posts.filter((p) => p.id !== id),
    comments: space.comments.filter((c) => c.postId !== id),
    liked: space.liked.filter((v) => v !== id),
    saved: space.saved.filter((v) => v !== id),
  };
}
export function writeComment(
  space: CampusSpace,
  comment: CampusComment,
): CampusSpace {
  const body = comment.body.trim();
  if (!body || body.length > 1000)
    throw new Error("Write a comment of 1–1,000 characters.");
  return { ...space, comments: [...space.comments, { ...comment, body }] };
}
export function relativeTime(time: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - time) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d`;
  return new Date(time).toLocaleDateString();
}
