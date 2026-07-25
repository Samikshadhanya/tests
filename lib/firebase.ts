import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, type Auth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, type Firestore } from 'firebase/firestore';

const getAuthDomain = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.host;
  }
  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'medhome-e2dd2.firebaseapp.com';
};

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: getAuthDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.warn('Missing Firebase environment variables. Running in guest mode.');
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth = null as any;
let db: Firestore = null as any;
let googleProvider: GoogleAuthProvider = null as any;

try {
  if (firebaseConfig.apiKey) {
    auth = getAuth(app);
    auth.setPersistence(browserLocalPersistence);
    db = initializeFirestore(app, { localCache: persistentLocalCache() });
    googleProvider = new GoogleAuthProvider();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, auth, db, googleProvider };
