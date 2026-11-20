import { test, expect } from "@playwright/test";
test("Facebook style local feed supports creating, commenting, saving and deleting notes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:8081");
  await expect(
    page.getByRole("tab", { name: "Home", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Your feed is ready", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/campus-home.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Post a study note", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Study post", exact: true })
    .fill("My revision plan for tomorrow");
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(
    page
      .getByText("My revision plan for tomorrow", { exact: true })
      .and(page.locator(':not([aria-hidden="true"] *)')),
  ).toBeVisible();
  await page.getByRole("button", { name: "Like post", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unlike post", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save post", exact: true }).click();
  await page.getByRole("button", { name: "Comment post", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Write a comment", exact: true })
    .fill("Remember to review my notes");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("Remember to review my notes", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("tab", { name: "Saved", exact: true }).click();
  await expect(
    page
      .getByText("My revision plan for tomorrow", { exact: true })
      .and(page.locator(':not([aria-hidden="true"] *)')),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByText("My revision plan for tomorrow", { exact: true })
      .and(page.locator(':not([aria-hidden="true"] *)')),
  ).toBeVisible();
  await page.getByRole("button", { name: "Post options", exact: true }).click();
  await page.getByRole("button", { name: "Edit note", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Study post", exact: true })
    .fill("My updated revision plan");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page
      .getByText("My updated revision plan", { exact: true })
      .and(page.locator(':not([aria-hidden="true"] *)')),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close dialog", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/campus-post.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Post options", exact: true }).click();
  await page.getByRole("button", { name: "Delete note", exact: true }).click();
  await page.getByRole("button", { name: "Delete note", exact: true }).click();
  await expect(
    page
      .getByText("My updated revision plan", { exact: true })
      .and(page.locator(':not([aria-hidden="true"] *)')),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Library", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Books & notes · Browse or search files",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/campus-library.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
