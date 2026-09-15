import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";
import { PUBLIC_ENV } from "./public-env";
const firebaseConfig = {
    apiKey: PUBLIC_ENV.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: PUBLIC_ENV.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: PUBLIC_ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: PUBLIC_ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: PUBLIC_ENV.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: PUBLIC_ENV.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
// Lazy initialize storage to prevent crashing in Remotion runtime
let storageInstance: ReturnType<typeof getStorage> | null = null;

export const getFirebaseStorage = () => {
    if (!storageInstance) {
        storageInstance = getStorage(app);
    }
    return storageInstance;
};

export default app;
