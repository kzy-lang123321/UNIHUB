import { Platform } from "react-native";
import { MMKV } from "react-native-mmkv";
const native =
  Platform.OS === "web" ? null : new MMKV({ id: "unihub-content" });
export const cache = {
  get: (key: string): string | undefined =>
    native
      ? native.getString(key)
      : typeof localStorage !== "undefined"
        ? (localStorage.getItem(key) ?? undefined)
        : undefined,
  set: (key: string, value: string): void => {
    if (native) native.set(key, value);
    else if (typeof localStorage !== "undefined")
      localStorage.setItem(key, value);
  },
  remove: (key: string): void => {
    if (native) native.delete(key);
    else if (typeof localStorage !== "undefined") localStorage.removeItem(key);
  },
};
