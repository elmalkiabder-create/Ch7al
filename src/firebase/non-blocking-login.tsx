
'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

/** Initiate email/password sign-up */
export async function handleEmailSignUp(authInstance: Auth, username: string, email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName: username });
  }
  return userCredential;
}

/** Initiate email/password sign-in */
export async function handleEmailSignIn(authInstance: Auth, email: string, password: string) {
  return signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in */
export async function handleGoogleSignIn(authInstance: Auth) {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(authInstance, provider);
}
