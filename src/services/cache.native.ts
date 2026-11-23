import { MMKV } from "react-native-mmkv";

const native = new MMKV({ id: "unihub-content" });

export const cache = {
  get: (key: string): string | undefined => native.getString(key),
  set: (key: string, value: string): void => {
    native.set(key, value);
  },
  remove: (key: string): void => {
    native.delete(key);
  },
};
