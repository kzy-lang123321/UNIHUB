const memoryStore = new Map<string, string>();

export const cache = {
  get: (key: string): string | undefined => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key) ?? undefined;
    }
    return memoryStore.get(key);
  },
  set: (key: string, value: string): void => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    } else {
      memoryStore.set(key, value);
    }
  },
  remove: (key: string): void => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    } else {
      memoryStore.delete(key);
    }
  },
};
