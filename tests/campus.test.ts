import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptySpace,
  readSpace,
  writePost,
  writeComment,
  removePost,
  toggleId,
} from "../src/features/campus/model";
test("local posts persist without invented content and reject blank text", () => {
  assert.deepEqual(readSpace().space, emptySpace());
  assert.throws(() =>
    writePost(emptySpace(), { id: "p", body: " ", kind: "note", createdAt: 1 }),
  );
  const space = writePost(emptySpace(), {
    id: "p",
    body: " My own revision note ",
    kind: "note",
    createdAt: 1,
  });
  assert.equal(space.posts[0]?.body, "My own revision note");
  assert.deepEqual(readSpace(JSON.stringify(space)), { space, damaged: false });
  const edited = writePost(space, {
    ...space.posts[0]!,
    body: "Updated revision",
    editedAt: 2,
  });
  assert.equal(edited.posts.length, 1);
  assert.equal(edited.posts[0]?.createdAt, 1);
});
test("deleting a post removes its comments, likes and saved reference only", () => {
  let space = writePost(emptySpace(), {
    id: "p",
    body: "My question",
    kind: "question",
    createdAt: 1,
  });
  space = writeComment(space, {
    id: "c",
    postId: "p",
    body: "My answer",
    createdAt: 2,
  });
  space.saved = ["p", "other"];
  space.liked = ["p"];
  assert.deepEqual(removePost(space, "p"), {
    posts: [],
    comments: [],
    saved: ["other"],
    liked: [],
  });
  assert.equal(space.comments.length, 1);
  assert.deepEqual(toggleId(toggleId([], "p"), "p"), []);
});
test("damaged local data is flagged while readable notes are retained", () => {
  const space = writePost(emptySpace(), {
    id: "p",
    body: "Keep this note",
    kind: "note",
    createdAt: 1,
  });
  const result = readSpace(
    JSON.stringify({ ...space, posts: [...space.posts, { body: 4 }] }),
  );
  assert.equal(result.damaged, true);
  assert.deepEqual(result.space.posts, space.posts);
  assert.equal(readSpace("{").damaged, true);
});
