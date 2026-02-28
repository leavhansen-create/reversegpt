import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Manages the user's daily streak.
 * Reads from and writes to Firestore users/{uid}.
 *
 * Returns:
 *   streak       - current streak count (number)
 *   streakActive - true if streak is healthy (lesson completed today)
 *   recordActivity - call this when a lesson is completed
 */
export function useStreak(uid) {
  const [streak, setStreak] = useState(0);
  const [streakActive, setStreakActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    async function fetchStreak() {
      try {
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;

        const { streak: currentStreak, lastActivityDate } = snap.data();
        const now = new Date();

        if (lastActivityDate) {
          const last = lastActivityDate.toDate();
          const daysDiff = daysBetween(last, now);

          if (daysDiff === 0) {
            // Completed a lesson today — streak is active
            setStreak(currentStreak ?? 0);
            setStreakActive(true);
          } else if (daysDiff === 1) {
            // Last activity was yesterday — streak is intact but not yet active today
            setStreak(currentStreak ?? 0);
            setStreakActive(false);
          } else {
            // Streak broken
            setStreak(0);
            setStreakActive(false);
          }
        } else {
          setStreak(0);
          setStreakActive(false);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchStreak();
  }, [uid]);

  async function recordActivity() {
    if (!uid) return;

    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const { streak: currentStreak, lastActivityDate } = snap.data();
    const now = new Date();

    let newStreak = currentStreak ?? 0;

    if (lastActivityDate) {
      const last = lastActivityDate.toDate();
      const daysDiff = daysBetween(last, now);

      if (daysDiff === 0) {
        // Already recorded today, no change
        setStreakActive(true);
        return;
      } else if (daysDiff === 1) {
        // Consecutive day — increment
        newStreak += 1;
      } else {
        // Streak broken — restart
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await updateDoc(userRef, {
      streak: newStreak,
      lastActivityDate: serverTimestamp(),
    });

    setStreak(newStreak);
    setStreakActive(true);
  }

  return { streak, streakActive, loading, recordActivity };
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round(Math.abs((d2 - d1) / (1000 * 60 * 60 * 24)));
}
