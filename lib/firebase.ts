import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAMaQyiMm1mcBd4-aPLtXpg9bR2u9sQ31U",
  authDomain: "reversegpt-c0e10.firebaseapp.com",
  projectId: "reversegpt-c0e10",
  storageBucket: "reversegpt-c0e10.firebasestorage.app",
  messagingSenderId: "147744783339",
  appId: "1:147744783339:web:86486088adaf91555cb7ae",
  measurementId: "G-Q1FEM63QRW"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
