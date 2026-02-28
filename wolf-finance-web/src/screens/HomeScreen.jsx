import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { colors } from '../constants/colors';
import { units } from '../data/units';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// currentUnit in Firestore is either:
//   - a biome string ('meadow', 'forest', …) — set by PlacementScreen
//   - a unit id number (1, 2, 3, …)          — set by UnitCompleteScreen
//   - 'complete'                              — all units done
function getCurrentIndex(currentUnit) {
  if (currentUnit === 'complete') return units.length; // all completed
  if (typeof currentUnit === 'number') {
    const idx = units.findIndex((u) => u.id === currentUnit);
    return idx === -1 ? 0 : idx;
  }
  // Legacy biome string from placement test → first unit of that biome
  const idx = units.findIndex((u) => u.biome === currentUnit);
  return idx === -1 ? 0 : idx;
}

function getStatus(unitIndex, currentIndex) {
  if (unitIndex < currentIndex) return 'completed';
  if (unitIndex === currentIndex) return 'current';
  return 'locked';
}

// Show a biome label whenever the biome changes from the previous unit
function getBiomeLabel(index) {
  if (index === 0) return units[0].biomeName;
  if (units[index].biome !== units[index - 1].biome) return units[index].biomeName;
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (snap.exists()) setUserData(snap.data());
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={s.page}>
        <span style={{ fontSize: 48 }}>🐺</span>
      </div>
    );
  }

  const currentIndex = getCurrentIndex(userData?.currentUnit ?? 'meadow');
  const xp = userData?.xp ?? 0;
  const streak = userData?.streak ?? 0;

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* ── Top bar ── */}
        <div style={s.topBar}>
          <div style={s.statChip}>
            <span style={s.statEmoji}>🔥</span>
            <span style={s.statValue}>{streak}</span>
          </div>

          <div style={s.titleBlock}>
            <span style={s.topTitle}>The Wolf's Journey</span>
          </div>

          <div style={s.statChip}>
            <span style={s.statEmoji}>⭐</span>
            <span style={s.statValue}>{xp.toLocaleString()}</span>
          </div>
        </div>

        <div style={s.divider} />

        {/* ── Path ── */}
        <div style={s.pathWrapper}>
          {units.map((unit, index) => {
            const status = getStatus(index, currentIndex);
            const biomeLabel = getBiomeLabel(index);
            const isCurrent = status === 'current';
            const isCompleted = status === 'completed';
            const isLocked = status === 'locked';
            const isLast = index === units.length - 1;

            return (
              <div key={unit.id} style={s.nodeRow}>
                {/* Biome section label */}
                {biomeLabel && (
                  <div style={{
                    ...s.biomeLabel,
                    color: isLocked ? colors.textMuted : unit.color,
                    borderColor: isLocked ? colors.border : unit.color + '44',
                    backgroundColor: isLocked ? colors.surface : unit.color + '18',
                  }}>
                    {unit.emoji} {biomeLabel}
                  </div>
                )}

                {/* Wolf indicator */}
                {isCurrent && (
                  <motion.div
                    style={s.wolfIndicator}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    🐺
                  </motion.div>
                )}

                {/* Node + connector */}
                <div style={s.nodeColumn}>
                  {/* Circle */}
                  <button
                    onClick={() => navigate(`/lesson?unit=${unit.id}`)}
                    disabled={!isCurrent}
                    style={{
                      ...s.nodeCircle,
                      width: isCurrent ? 80 : 72,
                      height: isCurrent ? 80 : 72,
                      backgroundColor: isLocked ? '#E0E0E0' : isCompleted ? colors.primary : unit.color,
                      boxShadow: isCurrent
                        ? `0 0 0 4px #fff, 0 0 0 7px ${colors.primary}55, 0 8px 24px ${unit.color}66`
                        : isCompleted
                        ? `0 2px 8px ${colors.primary}33`
                        : 'none',
                      cursor: isCurrent ? 'pointer' : 'default',
                      border: isCurrent ? `2.5px solid ${colors.primary}` : '2px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: isCurrent ? 36 : 30, lineHeight: 1 }}>
                      {isCompleted ? '✓' : isLocked ? '🔒' : unit.emoji}
                    </span>
                  </button>

                  {/* Connector line */}
                  {!isLast && (
                    <div style={{
                      ...s.connector,
                      borderColor: index < currentIndex ? colors.primary : '#D0D0D0',
                      borderStyle: index < currentIndex ? 'solid' : 'dashed',
                    }} />
                  )}
                </div>

                {/* Label */}
                <div style={s.nodeLabelBlock}>
                  <span style={{
                    ...s.nodeName,
                    color: isLocked ? colors.textMuted : isCurrent ? colors.primary : colors.text,
                    fontWeight: isCurrent ? 800 : isCompleted ? 700 : 400,
                  }}>
                    {unit.name}
                  </span>
                  {isCurrent && (
                    <span style={s.tapHint}>Tap to begin →</span>
                  )}
                  {isCompleted && (
                    <span style={s.completedHint}>Completed</span>
                  )}
                  {isLocked && (
                    <span style={s.lockedHint}>{unit.biomeName}</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Bottom padding node */}
          <div style={{ height: 48 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: colors.background,
    display: 'flex',
    justifyContent: 'center',
    overflowY: 'auto',
  },
  container: {
    width: '100%',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
  },

  // Top bar
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 12px',
    position: 'sticky',
    top: 0,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  statChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: colors.primaryPale,
    borderRadius: '99px',
    padding: '6px 12px',
    minWidth: '60px',
    justifyContent: 'center',
  },
  statEmoji: {
    fontSize: '16px',
    lineHeight: 1,
  },
  statValue: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '15px',
    fontWeight: 800,
    color: colors.primary,
  },
  titleBlock: {
    flex: 1,
    textAlign: 'center',
    padding: '0 8px',
  },
  topTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  divider: {
    height: '1px',
    backgroundColor: colors.border,
    margin: '0 20px',
  },

  // Path
  pathWrapper: {
    padding: '24px 20px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // Biome label
  biomeLabel: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '5px 14px',
    borderRadius: '99px',
    border: '1.5px solid',
    marginBottom: '16px',
    marginTop: '8px',
  },

  // Each row
  nodeRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  wolfIndicator: {
    fontSize: '28px',
    marginBottom: '4px',
    lineHeight: 1,
  },

  // Circle + connector column
  nodeColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  nodeCircle: {
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'box-shadow 0.2s ease, transform 0.15s ease',
    flexShrink: 0,
    fontFamily: "'Nunito', sans-serif",
    color: '#fff',
    fontSize: '22px',
    fontWeight: 700,
    padding: 0,
  },
  connector: {
    width: 0,
    height: '40px',
    borderLeft: '2px dashed',
    marginTop: '2px',
    marginBottom: '2px',
  },

  // Label
  nodeLabelBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    marginBottom: '4px',
    marginTop: '6px',
    textAlign: 'center',
    maxWidth: '260px',
  },
  nodeName: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '15px',
    lineHeight: 1.3,
  },
  tapHint: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: colors.primaryLight,
  },
  completedHint: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '12px',
    color: colors.primaryLight,
    fontWeight: 600,
  },
  lockedHint: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '12px',
    color: colors.textMuted,
  },
};
