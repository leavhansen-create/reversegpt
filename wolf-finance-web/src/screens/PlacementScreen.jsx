import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { colors } from '../constants/colors';

// ─── Placement questions ────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 1,
    prompt: 'What does a business need to survive?',
    options: ['Customers', 'Money', 'Both customers and money', 'A big office'],
    correctIndex: 2,
  },
  {
    id: 2,
    prompt: 'If you earn $100 and spend $60, what do you have left?',
    options: ['$40', '$60', '$100', '$160'],
    correctIndex: 0,
  },
  {
    id: 3,
    prompt: 'What is revenue?',
    options: [
      'Money a company spends',
      'Money a company earns from selling',
      'Money a company borrows',
      'Money a company saves',
    ],
    correctIndex: 1,
  },
  {
    id: 4,
    prompt: 'What is profit?',
    options: [
      'Total money earned',
      'Money left after paying all costs',
      'Money borrowed from a bank',
      'Total assets owned',
    ],
    correctIndex: 1,
  },
  {
    id: 5,
    prompt: 'Which of these is a financial statement?',
    options: [
      'A business plan',
      'An income statement',
      'A marketing report',
      'A job description',
    ],
    correctIndex: 1,
  },
  {
    id: 6,
    prompt: 'What does the income statement show?',
    options: [
      'What a company owns and owes',
      'How much cash moved in and out',
      'Revenue, costs, and profit over a period',
      "The company's stock price",
    ],
    correctIndex: 2,
  },
  {
    id: 7,
    prompt: 'What is the balance sheet?',
    options: [
      'A summary of revenue and expenses',
      'A snapshot of what a company owns and owes at a point in time',
      'A record of cash movements',
      'A list of employees',
    ],
    correctIndex: 1,
  },
  {
    id: 8,
    prompt: 'What does EBITDA stand for?',
    options: [
      'Earnings Before Interest Taxes Depreciation and Amortization',
      'Estimated Business Income Tax and Dividend Amount',
      'Equity Based Investment Total Dividend Allocation',
      'None of the above',
    ],
    correctIndex: 0,
  },
  {
    id: 9,
    prompt: 'If a company has $1M revenue and 20% net margin, what is net income?',
    options: ['$20,000', '$200,000', '$800,000', '$1.2M'],
    correctIndex: 1,
  },
  {
    id: 10,
    prompt: 'What is a DCF valuation?',
    options: [
      "A method to value a company based on its future cash flows discounted to today",
      'A way to compare companies using revenue multiples',
      "A calculation of a company's total debt",
      'A measure of how liquid a company is',
    ],
    correctIndex: 0,
  },
];

// ─── Scoring → starting biome ───────────────────────────────────────────────

const RESULT_MAP = [
  {
    minCorrect: 9,
    biome: 'summit',
    biomeName: 'The Summit',
    emoji: '🏔️',
    description: "You're already thinking like an analyst.",
  },
  {
    minCorrect: 7,
    biome: 'river',
    biomeName: 'The River',
    emoji: '🌊',
    description: "Strong foundations — you're ready for cash flow.",
  },
  {
    minCorrect: 5,
    biome: 'mountains',
    biomeName: 'The Mountains',
    emoji: '⛰️',
    description: "Good instincts — we'll sharpen them up here.",
  },
  {
    minCorrect: 3,
    biome: 'forest',
    biomeName: 'The Forest',
    emoji: '🌲',
    description: "The statements await. Let's build your foundation.",
  },
  {
    minCorrect: 0,
    biome: 'meadow',
    biomeName: 'The Meadow',
    emoji: '🌿',
    description: "Every alpha starts as a cub. Let's begin.",
  },
];

function getResult(correctCount) {
  return RESULT_MAP.find((r) => correctCount >= r.minCorrect);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PlacementScreen() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState(null);   // index of chosen option
  const [answers, setAnswers] = useState([]);        // array of booleans
  const [phase, setPhase] = useState('question');    // 'question' | 'result'
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const current = QUESTIONS[questionIndex];
  const progress = (questionIndex / QUESTIONS.length) * 100;
  const correctCount = answers.filter(Boolean).length;
  const result = getResult(correctCount);

  function handleSelect(index) {
    if (selected !== null) return; // already answered
    setSelected(index);
  }

  function handleNext() {
    const isCorrect = selected === current.correctIndex;
    const newAnswers = [...answers, isCorrect];

    if (questionIndex < QUESTIONS.length - 1) {
      setAnswers(newAnswers);
      setSelected(null);
      setQuestionIndex((i) => i + 1);
    } else {
      setAnswers(newAnswers);
      setPhase('result');
    }
  }

  async function handleStartJourney() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'users', uid), {
        placementComplete: true,
        startingUnit: result.biome,
        currentUnit: result.biome,
      }, { merge: true });
      navigate('/home');
    } catch (err) {
      console.error('Failed to save placement result:', err);
      setSaving(false);
    }
  }

  if (phase === 'result') {
    return <ResultScreen result={result} correctCount={correctCount} onStart={handleStartJourney} saving={saving} />;
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <p style={s.headerLabel}>Finding your starting point 🐺</p>
          <div style={s.progressTrack}>
            <motion.div
              style={s.progressFill}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <p style={s.progressText}>
            {questionIndex + 1} <span style={{ color: colors.textMuted }}>/ {QUESTIONS.length}</span>
          </p>
        </div>

        {/* Question + options */}
        <AnimatePresence mode="wait">
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={s.questionArea}
          >
            <p style={s.questionText}>{current.prompt}</p>

            <div style={s.optionsList}>
              {current.options.map((option, i) => {
                const isSelected = selected === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    style={{
                      ...s.optionButton,
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primaryPale : colors.background,
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? 700 : 400,
                      transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                    }}
                  >
                    <span style={{ ...s.optionLetter, backgroundColor: isSelected ? colors.primary : colors.surface, color: isSelected ? '#fff' : colors.textSecondary }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        <AnimatePresence>
          {selected !== null && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={handleNext}
              style={s.nextButton}
            >
              {questionIndex < QUESTIONS.length - 1 ? 'Next →' : 'See my results'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({ result, correctCount, onStart, saving }) {
  return (
    <motion.div
      style={s.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ ...s.card, textAlign: 'center' }}>
        <span style={s.resultWolf}>🐺</span>
        <h2 style={s.resultTitle}>You're ready to begin!</h2>
        <p style={s.resultScore}>
          {correctCount} / {QUESTIONS.length} correct
        </p>

        <div style={s.resultBiomeCard}>
          <span style={s.resultBiomeEmoji}>{result.emoji}</span>
          <p style={s.resultBiomeLabel}>Your starting point</p>
          <p style={s.resultBiomeName}>{result.biomeName}</p>
          <p style={s.resultBiomeDesc}>{result.description}</p>
        </div>

        <button
          onClick={onStart}
          disabled={saving}
          style={{ ...s.nextButton, marginTop: 0, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving…' : 'Start your journey →'}
        </button>
      </div>
    </motion.div>
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
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: colors.background,
    borderRadius: '24px',
    padding: '32px 28px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    border: `1px solid ${colors.border}`,
  },
  header: {
    marginBottom: '28px',
  },
  headerLabel: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '14px',
    fontWeight: 600,
    color: colors.textSecondary,
    margin: '0 0 10px',
    textAlign: 'center',
    letterSpacing: '0.2px',
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: colors.surface,
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: '99px',
  },
  progressText: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: colors.text,
    textAlign: 'right',
    margin: '6px 0 0',
  },
  questionArea: {
    marginBottom: '8px',
  },
  questionText: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '20px',
    fontWeight: 800,
    color: colors.text,
    lineHeight: 1.4,
    margin: '0 0 24px',
    textAlign: 'center',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  optionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid',
    borderRadius: '12px',
    backgroundColor: colors.background,
    fontFamily: "'Nunito', sans-serif",
    fontSize: '15px',
    color: colors.text,
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, background-color 0.15s ease, transform 0.1s ease',
  },
  optionLetter: {
    flexShrink: 0,
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },
  nextButton: {
    display: 'block',
    width: '100%',
    marginTop: '20px',
    padding: '16px',
    backgroundColor: colors.primary,
    color: '#fff',
    fontFamily: "'Nunito', sans-serif",
    fontSize: '17px',
    fontWeight: 700,
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(27,94,32,0.28)',
    transition: 'opacity 0.15s ease',
  },
  // Result screen
  resultWolf: {
    fontSize: '72px',
    display: 'block',
    marginBottom: '12px',
  },
  resultTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '28px',
    fontWeight: 800,
    color: colors.primary,
    margin: '0 0 6px',
  },
  resultScore: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '15px',
    color: colors.textSecondary,
    margin: '0 0 28px',
  },
  resultBiomeCard: {
    backgroundColor: colors.primaryPale,
    borderRadius: '16px',
    padding: '24px 20px',
    marginBottom: '28px',
    border: `1.5px solid ${colors.primaryLight}33`,
  },
  resultBiomeEmoji: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '10px',
  },
  resultBiomeLabel: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '12px',
    fontWeight: 700,
    color: colors.primaryMid,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '0 0 4px',
  },
  resultBiomeName: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '22px',
    fontWeight: 800,
    color: colors.primary,
    margin: '0 0 8px',
  },
  resultBiomeDesc: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '15px',
    color: colors.primaryMid,
    margin: 0,
    lineHeight: 1.5,
  },
};
