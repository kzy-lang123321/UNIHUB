import { initializeApp, getApps } from "firebase/app";
import { createAuth } from "./authPersistence";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { authenticationEnabled } from "../config/access";
export const configured = Boolean(process.env.EXPO_PUBLIC_FIREBASE_API_KEY);
const app = configured
  ? (getApps()[0] ??
    initializeApp({
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    }))
  : null;
export const auth = app && authenticationEnabled ? createAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
