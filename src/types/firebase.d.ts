import { Persistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Firebase exports this from its React Native entry, while its default TS entry
// describes browser exports. Keep the declaration scoped to the real native API.
declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: Pick<typeof AsyncStorage, "getItem" | "setItem" | "removeItem">,
  ): Persistence;
}
