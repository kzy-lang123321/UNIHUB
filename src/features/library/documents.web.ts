import { AcademicResource } from "./types";
import { fileLink } from "./client";
export async function openDocument(resource: AcademicResource) {
  const page = window.open("about:blank", "_blank");
  try {
    const url = await fileLink(resource);
    if (page) {
      page.opener = null;
      page.location.href = url;
    } else window.location.assign(url);
  } catch (error) {
    page?.close();
    throw error;
  }
}
const database = () =>
  new Promise<IDBDatabase>((done, reject) => {
    const request = indexedDB.open("unihub-originals", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("documents", { keyPath: "id" });
    request.onsuccess = () => done(request.result);
    request.onerror = () => reject(request.error);
  });
export async function saveDocument(
  resource: AcademicResource,
  uid: string,
  progress: (fraction: number) => void,
) {
  const response = await fetch(await fileLink(resource, true));
  if (!response.ok) throw new Error("Download failed");
  const blob = await response.blob();
  const db = await database();
  await new Promise<void>((done, reject) => {
    const tx = db.transaction("documents", "readwrite");
    tx.objectStore("documents").put({
      id: `${uid}:${resource.id}`,
      resource,
      blob,
    });
    tx.oncomplete = () => done();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  progress(1);
}
export async function openSavedDocument(id: string, uid: string) {
  const db = await database();
  const saved = await new Promise<
    { resource: AcademicResource; blob: Blob } | undefined
  >((done, reject) => {
    const request = db
      .transaction("documents")
      .objectStore("documents")
      .get(`${uid}:${id}`);
    request.onsuccess = () => done(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (!saved) throw new Error("Document is not downloaded on this device");
  const url = URL.createObjectURL(saved.blob),
    link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 300000);
}
