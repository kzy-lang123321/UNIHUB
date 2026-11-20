import { test, expect } from "@playwright/test";
test.use({ reducedMotion: "reduce" });
async function start(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("tab", { name: "Home", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Username", exact: true }),
  ).toHaveCount(0);
}
test("student preview contains no fictional courses or unpublished original materials", async ({
  page,
}) => {
  await start(page);
  await expect(page.getByText("Your feed is ready")).toBeVisible();
  await page.getByRole("tab", { name: "Library", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Books & notes · Browse or search files",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Academic Library", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "No published materials yet",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Thinking like a programmer", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Think Python", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: "test-results/academic-library-empty.png",
    fullPage: true,
  });
});
test("downloaded section stays available while offline and never substitutes sample books", async ({
  page,
  context,
}) => {
  await start(page);
  await page.getByRole("tab", { name: "Menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Downloaded academic documents", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No downloaded documents", exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await page
    .getByRole("textbox", { name: "Search academic library" })
    .fill("biology");
  await expect(
    page.getByRole("heading", { name: "No downloaded documents", exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
});
test("admin review form uses actual provided metadata and requires explicit classification and visibility", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:8890/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", {
      name: "Initial Academic Library",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search initial library" })
    .fill("ICT Fazal ali CH 4/Lecture # 01.pdf");
  await page
    .getByRole("button", { name: "Review Lecture # 01.pdf", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review document", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Document semester" }),
  ).toHaveValue("");
  await page
    .getByRole("button", {
      name: "Save and publish to assigned students",
      exact: true,
    })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByText(
        "Confirm classification and student visibility before publishing.",
        { exact: true },
      ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Use suggestions as a draft", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Document department" })
    .fill("Computer Science");
  await page.getByRole("textbox", { name: "Document programId" }).fill("bs-cs");
  await page.getByRole("textbox", { name: "Document semester" }).fill("1");
  await page.getByRole("textbox", { name: "Document subject" }).fill("ICT");
  await page
    .getByRole("button", {
      name: "Confirm correct classification",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Confirm student program and semester visibility",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Offline downloads disabled", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/admin-library-review.png",
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Save and publish to assigned students",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review document", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/Published · ready|Published · needs-ocr/),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("a provided PDF is saved byte-for-byte and reopens offline", async ({
  page,
  context,
}) => {
  await page.goto("http://127.0.0.1:8890/");
  await page.waitForFunction(() => !!(window as any).__libraryOffline);
  const result = await page.evaluate(async () => {
    const api = (window as any).__libraryOffline;
    await api.saveDocument(api.resource, "offline-test", () => {});
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("unihub-originals", 1);
      request.onsuccess = () => resolve(request.result);
    });
    const saved = await new Promise<any>((resolve) => {
      const request = db
        .transaction("documents")
        .objectStore("documents")
        .get(`offline-test:${api.resource.id}`);
      request.onsuccess = () => resolve(request.result);
    });
    const bytes = await saved.blob.arrayBuffer();
    const digest = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      (x) => x.toString(16).padStart(2, "0"),
    ).join("");
    db.close();
    return {
      digest,
      expected: api.resource.sha256,
      bytes: bytes.byteLength,
      expectedBytes: api.resource.bytes,
    };
  });
  expect(result.digest).toBe(result.expected);
  expect(result.bytes).toBe(result.expectedBytes);
  await context.setOffline(true);
  const popup = page.waitForEvent("popup");
  await page.evaluate(async () => {
    const api = (window as any).__libraryOffline;
    await api.openSavedDocument(api.resource.id, "offline-test");
  });
  await expect.poll(() => popup.then((p) => p.url())).toContain("blob:");
  await context.setOffline(false);
});
