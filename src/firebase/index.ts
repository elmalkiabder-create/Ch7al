
'use client';

import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuration Firebase fournie par l'utilisateur
const firebaseConfig = {
  apiKey: "AIzaSyAJuQu1zUjvst6GevnVUAJe17ew7PhxODs",
  authDomain: "hanouti-6ce26.firebaseapp.com",
  projectId: "hanouti-6ce26",
  storageBucket: "hanouti-6ce26.firebasestorage.app",
  messagingSenderId: "252246765953",
  appId: "1:252246765953:web:726dc032c6eeba126bb880"
};

// A type guard to check if the config has all necessary properties.
function isValidFirebaseConfig(config: any): config is FirebaseOptions {
    return config &&
        typeof config.apiKey === 'string' &&
        typeof config.authDomain === 'string' &&
        typeof config.projectId === 'string' &&
        typeof config.storageBucket === 'string' &&
        typeof config.messagingSenderId === 'string' &&
        typeof config.appId === 'string';
}

function getSdks(firebaseApp: FirebaseApp): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export async function initializeFirebase(): Promise<{ firebaseApp: FirebaseApp | null; auth: Auth | null; firestore: Firestore | null }> {
  // Éviter l'initialisation pendant le build
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    console.log("Skipping Firebase initialization during build phase");
    return { firebaseApp: null, auth: null, firestore: null };
  }

  if (getApps().length) {
    const app = getApp();
    return getSdks(app);
  }

  if (isValidFirebaseConfig(firebaseConfig)) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  console.error("Firebase initialization failed: The configuration object is invalid.");
  // Return null objects if initialization fails
  return { firebaseApp: null, auth: null, firestore: null };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
