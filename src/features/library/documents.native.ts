import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Linking } from "react-native";
import { AcademicResource } from "./types";
import { fileLink } from "./client";
import { cache } from "../../services/cache";
export async function openDocument(resource: AcademicResource) {
  await Linking.openURL(await fileLink(resource));
}
export async function saveDocument(
  resource: AcademicResource,
  uid: string,
  progress: (fraction: number) => void,
) {
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error("Device storage unavailable");
  const directory = `${root}library/${uid}/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const suffix = resource.originalName.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ".bin";
  const path = `${directory}${resource.id}${suffix}`;
  const task = FileSystem.createDownloadResumable(
    await fileLink(resource, true),
    path,
    {},
    (event) =>
      progress(
        event.totalBytesExpectedToWrite
          ? event.totalBytesWritten / event.totalBytesExpectedToWrite
          : 0,
      ),
  );
  const result = await task.downloadAsync();
  if (!result || result.status !== 200) throw new Error("Download failed");
  cache.set(`original:${uid}:${resource.id}`, path);
  progress(1);
}
export async function openSavedDocument(id: string, uid: string) {
  const path = cache.get(`original:${uid}:${id}`);
  if (!path || !(await FileSystem.getInfoAsync(path)).exists)
    throw new Error("Saved document is unavailable");
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("No document viewer/share service available");
  await Sharing.shareAsync(path);
}
