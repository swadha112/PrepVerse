// npm i firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Optional (only if you want analytics)
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // storageBucket is optional unless you use Storage
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);

// Auth (use these in your app)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics (optional & guarded so it doesn’t crash in non-browser envs)
export const analyticsPromise = isSupported().then((ok) => (ok ? getAnalytics(app) : null));

export default app;
