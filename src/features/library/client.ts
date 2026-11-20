import { auth } from "../../services/firebase";
import { AcademicResource, LibraryStats } from "./types";
export const libraryUrl =
  process.env.EXPO_PUBLIC_LIBRARY_API_URL ?? "http://127.0.0.1:8787";
export async function libraryRequest<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const token = await auth?.currentUser?.getIdToken();
  if (!token)
    throw new Error(
      "Sign in with your institution account to access the library.",
    );
  const response = await fetch(libraryUrl + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(result.error ?? "Library service unavailable");
  return result;
}
export interface LibraryResponse {
  resources: AcademicResource[];
  stats?: LibraryStats;
  importIssues?: { archive?: string; name: string; error: string }[];
  cloudUploads: boolean;
  storageProvider: string;
}
export const getLibrary = () => libraryRequest<LibraryResponse>("/api/library");
export const updateResource = (
  resource: AcademicResource,
  changes: Partial<AcademicResource>,
) =>
  libraryRequest<AcademicResource>(`/api/materials/${resource.id}`, "PATCH", {
    ...changes,
    version: resource.version,
  });
export async function fileLink(resource: AcademicResource, download = false) {
  const ticket = await libraryRequest<{ path: string }>(
    `/api/materials/${resource.id}/ticket`,
    "POST",
    { download },
  );
  return libraryUrl + ticket.path;
}
export async function uploadOriginal(
  file: { uri: string; name: string; size?: number },
  progress: (fraction: number) => void,
  replaceId?: string,
) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in before uploading");
  if ((file.size ?? 0) > 64 * 1024 ** 2)
    throw new Error(
      `${file.name}: upload from the mobile/browser picker is limited to 64 MiB; use the local folder importer for larger originals.`,
    );
  const blob = await (await fetch(file.uri)).blob();
  await new Promise<void>((done, reject) => {
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      libraryUrl + "/api/import" + (replaceId ? `?replace=${replaceId}` : ""),
    );
    request.setRequestHeader("Authorization", `Bearer ${token}`);
    request.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) progress(event.loaded / event.total);
    };
    request.onerror = () =>
      reject(
        new Error(
          `${file.name}: transfer failed; original selection unchanged`,
        ),
      );
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        progress(1);
        done();
      } else {
        let message = request.responseText;
        try {
          message = (JSON.parse(message) as { error: string }).error;
        } catch {}
        reject(new Error(message));
      }
    };
    request.send(blob);
  });
}
