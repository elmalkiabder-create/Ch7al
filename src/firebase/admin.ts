import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuration Firebase pour le serveur
const firebaseConfig = {
  apiKey: "AIzaSyAJuQu1zUjvst6GevnVUAJe17ew7PhxODs",
  authDomain: "hanouti-6ce26.firebaseapp.com",
  projectId: "hanouti-6ce26",
  storageBucket: "hanouti-6ce26.firebasestorage.app",
  messagingSenderId: "252246765953",
  appId: "1:252246765953:web:726dc032c6eeba126bb880"
};

interface AdminServices {
  adminApp: FirebaseApp;
  adminDb: Firestore;
  adminStorage: FirebaseStorage;
}

let adminApp: FirebaseApp | undefined;
let adminDb: Firestore | undefined;
let adminStorage: FirebaseStorage | undefined;

/**
 * Initialize Firebase Admin services on server side.
 */
function initializeAdminApp(): void {
  if (getApps().length) {
    adminApp = getApp();
  } else {
    adminApp = initializeApp(firebaseConfig);
  }
  
  if (adminApp) {
    adminDb = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
  }
}

/**
 * Gets initialized Firebase Admin services.
 * It will attempt to initialize them on first call if they haven't been already.
 * Updated: 2025-01-08 - Fix for Server Actions build issue
 */
export async function getAdminServices(): Promise<AdminServices> {
  if (adminApp === undefined) {
    initializeAdminApp();
  }
  
  if (!adminApp || !adminDb || !adminStorage) {
    throw new Error('Firebase Admin services could not be initialized');
  }
  
  return { adminApp, adminDb, adminStorage };
}

// Export par défaut pour éviter les problèmes avec Next.js Server Actions
export default getAdminServices;
