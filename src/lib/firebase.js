import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

if (typeof window !== 'undefined') {
  console.info('[sync] firebase config', {
    projectId: firebaseConfig.projectId || 'MISSING',
    hasApiKey: !!firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain || 'MISSING',
  })
}

// IndexedDB persistence — survives connection drops, PWA background cycles, offline
let db
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    // Force long-polling: the default WebChannel streaming connection never
    // established here (every snapshot stayed fromCache:true with no error),
    // which is the classic signature of a proxy/ISP that buffers the stream
    // indefinitely. Long-polling closes each response immediately and gets
    // through. Auto-detect must be off when force is on.
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: false,
  })
  if (typeof window !== 'undefined') console.info('[sync] Firestore: persistent cache + long-polling active')
} catch (e) {
  if (typeof window !== 'undefined') console.warn('[sync] Firestore: persistent cache failed, using memory cache', e?.message || e)
  db = getFirestore(app)
}

export { db }

export default app;