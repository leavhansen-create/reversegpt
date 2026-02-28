import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your real Firebase project config
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Create a new user account with email and password.
 * Returns the Firebase UserCredential.
 */
export async function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in an existing user with email and password.
 * Returns the Firebase UserCredential.
 */
export async function logIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user.
 */
export async function logOut() {
  return signOut(auth);
}

/**
 * Subscribe to auth state changes.
 * Calls callback(user) whenever the auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}
