import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';

export const XP_VALUES = {
  CORRECT_ANSWER: 10,
  BONUS_PERFECT: 25,   // All 5 hearts remaining at lesson end
  BONUS_GOOD: 10,      // 3-4 hearts remaining at lesson end
};

/**
 * Manages the user's XP.
 *
 * Returns:
 *   xp        - current total XP (number)
 *   addXP     - call with an amount to increment XP in Firestore and state
 *   loading   - true while fetching initial value
 */
export function useXP(uid) {
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    async function fetchXP() {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          setXp(snap.data().xp ?? 0);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchXP();
  }, [uid]);

  async function addXP(amount) {
    if (!uid || !amount) return;

    setXp((prev) => prev + amount);

    await updateDoc(doc(db, 'users', uid), {
      xp: increment(amount),
    });
  }

  /**
   * Calculate the XP earned for a completed lesson.
   * @param {number} heartsRemaining - Hearts left at end of lesson (0-5)
   * @param {number} correctAnswers  - Number of correct answers
   * @returns {{ total: number, breakdown: object }}
   */
  function calculateLessonXP(heartsRemaining, correctAnswers) {
    const base = correctAnswers * XP_VALUES.CORRECT_ANSWER;
    let bonus = 0;

    if (heartsRemaining === 5) {
      bonus = XP_VALUES.BONUS_PERFECT;
    } else if (heartsRemaining >= 3) {
      bonus = XP_VALUES.BONUS_GOOD;
    }

    return {
      total: base + bonus,
      breakdown: { base, bonus },
    };
  }

  return { xp, addXP, calculateLessonXP, loading };
}
