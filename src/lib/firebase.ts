import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import jsonConfig from "../../firebase-applet-config.json";

// Support both firebase-applet-config.json and VITE_FIREBASE_* environment variables for Vercel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || jsonConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || jsonConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || jsonConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || jsonConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || jsonConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || jsonConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || jsonConfig.firestoreDatabaseId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Ensure local persistence is set
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Could not set local persistence for Firebase Auth:", err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup is blocked by iframe or browser, fallback to redirect or throw detailed message
    if (error?.code === "auth/popup-blocked" || error?.code === "auth/cancelled-popup-request") {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError) {
        console.error("Redirect login error:", redirectError);
        throw redirectError;
      }
    }
    console.error("Google Sign In Error:", error);
    throw error;
  }
}

export async function logOut() {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

export { onAuthStateChanged, type User };
