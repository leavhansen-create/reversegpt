import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const APP_NAME = 'admin'

export function getAdminDb() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && 'FIREBASE_PROJECT_ID',
      !clientEmail && 'FIREBASE_CLIENT_EMAIL',
      !privateKey && 'FIREBASE_PRIVATE_KEY',
    ].filter(Boolean).join(', ')
    throw new Error(`Missing Firebase Admin env vars: ${missing}`)
  }

  // Use a named app to avoid the "[DEFAULT] already exists" race on concurrent requests
  const existing = getApps().find((a) => a.name === APP_NAME)
  const app = existing ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, APP_NAME)

  return getFirestore(app)
}

export function withTimeout<T>(promise: Promise<T>, ms = 8000, label = 'Firestore'): Promise<T> {
  const timeout = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  )
  return Promise.race([promise, timeout])
}
