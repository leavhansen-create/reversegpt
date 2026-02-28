import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, setDoc, increment } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { colors } from '../constants/colors';
import { units, WOLF_STAGES } from '../data/units';

const TOTAL_HEARTS = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function starsFromHearts(hearts) {
  if (hearts === TOTAL_HEARTS) return 3;
  if (hearts >= 3) return 2;
  return 1;
}

function motivationalMessage(hearts) {
  if (hearts === TOTAL_HEARTS) return 'Perfect! Not a scratch on you. 🐺';
  if (hearts >= 3) return 'Strong work, wolf.';
  return 'Tough lesson — but you made it.';
}

function getNewWolfStage(completedUnitCount) {
  const reversed = [...WOLF_STAGES].reverse();
  return (reversed.find((s) => completedUnitCount >= s.unlocksAtUnit - 1) ?? WOLF_STAGES[0]).stage;
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  colors.primaryLight, colors.xp, colors.streak,
  '#6A1B9A', '#0288D1', colors.heart, '#A5D6A7',
];

function Confetti() {
  const pieces = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${4 + ((i * 4.3) % 92)}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${((i * 0.11) % 1.4).toFixed(2)}s`,
    duration: `${(1.3 + (i % 5) * 0.18).toFixed(2)}s`,
    size: 7 + (i % 4) * 2,
    isCircle: i % 3 === 0,
  }));

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-16px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(600deg); opacity: 0; }
        }
      `}</style>
      <div style={s.confettiContainer}>
        {pieces.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: 0,
              left: p.left,
              width: p.size,
              height: p.size,
              borderRadius: p.isCircle ? '50%' : '2px',
              backgroundColor: p.color,
              animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
            }}
          />
        ))}
      </div>
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function UnitCompleteScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const unitId = parseInt(searchParams.get('unit'), 10);
  const xpEarned = parseInt(searchParams.get('xp'), 10) || 0;
  const heartsRemaining = parseInt(searchParams.get('hearts'), 10);
  const hearts = isNaN(heartsRemaining) ? TOTAL_HEARTS : heartsRemaining;

  const currentIdx = units.findIndex((u) => u.id === unitId);
  const unit = units[currentIdx] ?? null;
  const nextUnit = currentIdx >= 0 ? (units[currentIdx + 1] ?? null) : null;

  const stars = starsFromHearts(hearts);
  const message = motivationalMessage(hearts);

  async function handleContinue() {
    const uid = auth.currentUser?.uid;
    if (!uid || saving) return;

    setSaving(true);
    try {
      const newCurrentUnit = nextUnit ? nextUnit.id : 'complete';
      const completedCount = currentIdx + 1;
      const newWolfStage = getNewWolfStage(completedCount);

      await setDoc(
        doc(db, 'users', uid),
        {
          xp: increment(xpEarned),
          currentUnit: newCurrentUnit,
          wolfStage: newWolfStage,
        },
        { merge: true }
      );

      navigate('/home');
    } catch (err) {
      console.error('Failed to save progress:', err);
      setSaving(false);
    }
  }

  return (
    <div style={s.page}>
      <Confetti />

      <motion.div
        style={s.card}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.38, ease: [0.34, 1.1, 0.64, 1] }}
      >
        {/* Wolf */}
        <motion.span
          style={s.wolfEmoji}
          animate={{ scale: [1, 1.13, 1] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
        >
          🐺
        </motion.span>

        <h1 style={s.title}>Unit Complete!</h1>

        {unit && (
          <p style={s.unitName}>
            {unit.emoji} {unit.name}
          </p>
        )}

        {/* Stars — spring in one by one */}
        <div style={s.starsRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.span
              key={i}
              style={{ fontSize: 34, opacity: i < stars ? 1 : 0.2 }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.25 + i * 0.13,
                type: 'spring',
                stiffness: 280,
                damping: 16,
              }}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        {/* XP pill */}
        <motion.div
          style={s.xpPill}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
        >
          <span style={s.xpText}>⭐ +{xpEarned} XP</span>
        </motion.div>

        {/* Hearts */}
        <div style={s.heartsRow}>
          {Array.from({ length: TOTAL_HEARTS }).map((_, i) => (
            <span key={i} style={{ fontSize: 22, lineHeight: 1 }}>
              {i < hearts ? '❤️' : '🖤'}
            </span>
          ))}
        </div>

        {/* Motivational message */}
        <p style={s.message}>{message}</p>

        {/* Next unit preview */}
        {nextUnit ? (
          <div style={s.nextCard}>
            <span style={s.nextLabel}>Up next</span>
            <span style={s.nextName}>
              {nextUnit.emoji} {nextUnit.name}
            </span>
            <span style={s.nextBiome}>{nextUnit.biomeName}</span>
          </div>
        ) : (
          <div style={{ ...s.nextCard, backgroundColor: colors.primaryPale }}>
            <span style={{ ...s.nextLabel, color: colors.primaryMid }}>
              You've reached the end
            </span>
            <span style={{ ...s.nextName, color: colors.primary }}>
              🏆 The Alpha Hunt awaits
            </span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={saving}
          style={{
            ...s.continueButton,
            opacity: saving ? 0.72 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Continue the Journey →'}
        </button>
      </motion.div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: colors.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '480px',
    backgroundColor: colors.background,
    borderRadius: '24px',
    padding: '44px 28px 36px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.09)',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },

  wolfEmoji: {
    fontSize: '80px',
    lineHeight: 1,
    display: 'block',
    marginBottom: '16px',
  },
  title: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '32px',
    fontWeight: 800,
    color: colors.primary,
    margin: '0 0 6px',
    letterSpacing: '-0.5px',
  },
  unitName: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '16px',
    color: colors.textSecondary,
    margin: '0 0 20px',
  },
  starsRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  xpPill: {
    backgroundColor: colors.xpLight,
    borderRadius: '99px',
    padding: '8px 22px',
    marginBottom: '16px',
    border: `1.5px solid ${colors.xp}33`,
  },
  xpText: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '18px',
    fontWeight: 800,
    color: colors.xp,
  },
  heartsRow: {
    display: 'flex',
    gap: '4px',
    marginBottom: '12px',
  },
  message: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '16px',
    fontWeight: 700,
    color: colors.text,
    margin: '0 0 28px',
  },

  // Next unit card
  nextCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: '14px',
    padding: '14px 18px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    textAlign: 'left',
  },
  nextLabel: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '11px',
    fontWeight: 700,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  nextName: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '16px',
    fontWeight: 700,
    color: colors.text,
  },
  nextBiome: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '13px',
    color: colors.textSecondary,
  },

  continueButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: colors.primary,
    color: '#fff',
    fontFamily: "'Nunito', sans-serif",
    fontSize: '17px',
    fontWeight: 700,
    border: 'none',
    borderRadius: '14px',
    boxShadow: '0 4px 14px rgba(27,94,32,0.28)',
    transition: 'opacity 0.15s ease',
  },
};
