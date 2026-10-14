import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, Firestore, setLogLevel } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'
import firebaseConfigJson from '@/firebase-applet-config.json'
import '@/lib/suppress-firestore-logs'

// Suppress internal Firestore idle stream timeout logs
try {
  setLogLevel('silent')
} catch {}

// Environment variables or fallback to provisioned configuration
const firebaseConfig = {
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    firebaseConfigJson.projectId,
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    process.env.FIREBASE_APP_ID ||
    firebaseConfigJson.appId,
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    firebaseConfigJson.apiKey,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.FIREBASE_AUTH_DOMAIN ||
    firebaseConfigJson.authDomain,
  firestoreDatabaseId:
    process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ||
    process.env.FIREBASE_FIRESTORE_DATABASE_ID ||
    firebaseConfigJson.firestoreDatabaseId ||
    '(default)',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    firebaseConfigJson.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseConfigJson.messagingSenderId,
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const db: Firestore =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app)

let authInstance: Auth | null = null
try {
  if (firebaseConfig.apiKey) {
    authInstance = getAuth(app)
  }
} catch {
  // Gracefully handle unconfigured apiKey
}

export const auth: Auth = authInstance as Auth

export { firebaseConfig }
export default app
