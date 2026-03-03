import { useState, useEffect } from 'react'
import { auth, googleProvider } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  const signOutUser = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return { user, loading, signInWithGoogle, signOutUser }
}
