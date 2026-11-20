import { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
export function createAuth(app: FirebaseApp) {
  return getAuth(app);
}
