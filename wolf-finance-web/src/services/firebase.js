import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDN5BpoVSA8FdYGPhvz8IRUr1kj4vD294k',
  authDomain: 'alpha-prep-d5b3e.firebaseapp.com',
  projectId: 'alpha-prep-d5b3e',
  storageBucket: 'alpha-prep-d5b3e.firebasestorage.app',
  messagingSenderId: '94126392497',
  appId: '1:94126392497:web:964543855c75a5408d8e90',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Create a new user account.
 * Returns Firebase UserCredential.
 */
export async function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in an existing user.
 * Returns Firebase UserCredential.
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
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns unsubscribe function
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}
