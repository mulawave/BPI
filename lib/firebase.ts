'use client';

import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const envConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

export function resolveFirebaseConfig(override?: FirebaseOptions) {
  const merged: FirebaseOptions = {
    ...envConfig,
    ...override,
  };

  const missing = Object.entries(merged)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return { config: merged, missing };
}

export function getFirebaseDb(override?: FirebaseOptions): Firestore {
  if (cachedDb) return cachedDb;

  const { config, missing } = resolveFirebaseConfig(override);

  if (missing.length) {
    console.error('[firebase] Missing config keys:', missing.join(', '));
    throw new Error(`Missing Firebase config: ${missing.join(', ')}`);
  }

  cachedApp = getApps().length ? getApp() : initializeApp(config);
  cachedDb = getFirestore(cachedApp);

  if (typeof window !== 'undefined') {
    console.log('[firebase] projectId:', cachedApp.options?.projectId);
  }

  return cachedDb;
}
