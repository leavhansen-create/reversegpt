import { db } from './firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { User } from 'firebase/auth'

export async function saveSession(user: User, sessionData: {
  topic: string
  professor: string
  score: number
  messages: any[]
}) {
  try {
    await addDoc(collection(db, 'sessions'), {
      userId: user.uid,
      userEmail: user.email,
      topic: sessionData.topic,
      professor: sessionData.professor,
      score: sessionData.score,
      messageCount: sessionData.messages.length,
      createdAt: serverTimestamp(),
    })
    console.log('Session saved!')
  } catch (error) {
    console.error('Error saving session:', error)
  }
}
