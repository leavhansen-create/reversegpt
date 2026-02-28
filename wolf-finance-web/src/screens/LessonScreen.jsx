import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../constants/colors';
import { questions } from '../data/questions';
import { units } from '../data/units';

const TOTAL_HEARTS = 5;
const XP_PER_CORRECT = 10;
const XP_BONUS_PERFECT = 25;
const XP_BONUS_GOOD = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gradeFreeText(userAnswer, expectedConcepts) {
  const lower = userAnswer.toLowerCase();
  return expectedConcepts.some((concept) =>
    concept.toLowerCase().split(' ').every((word) => lower.includes(word))
  );
}

function calcXP(correctCount, heartsRemaining) {
  const base = correctCount * XP_PER_CORRECT;
  const bonus =
    heartsRemaining === TOTAL_HEARTS
      ? XP_BONUS_PERFECT
      : heartsRemaining >= 3
      ? XP_BONUS_GOOD
      : 0;
  return base + bonus;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeartBar({ hearts, shaking }) {
  return (
    <div style={s.heartBar}>
      {Array.from({ length: TOTAL_HEARTS }).map((_, i) => (
        <motion.span
          key={i}
          style={{ fontSize: 20, lineHeight: 1 }}
          animate={shaking && i === hearts ? { x: [0, -4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.35 }}
        >
          {i < hearts ? '❤️' : '🖤'}
        </motion.span>
      ))}
    </div>
  );
}

function MCQOptions({ question, selected, submitted, onSelect }) {
  return (
    <div style={s.optionsList}>
      {question.options.map((option, i) => {
        const isSelected = selected === i;
        const isCorrect = i === question.correctIndex;
        let borderColor = colors.border;
        let bg = colors.background;
        let textColor = colors.text;
        let fontWeight = 400;

        if (submitted) {
          if (isCorrect) {
            borderColor = colors.primaryLight;
            bg = colors.successLight;
            textColor = colors.primary;
            fontWeight = 700;
          } else if (isSelected && !isCorrect) {
            borderColor = colors.error;
            bg = colors.errorLight;
            textColor = colors.error;
          }
        } else if (isSelected) {
          borderColor = colors.primary;
          bg = colors.primaryPale;
          textColor = colors.primary;
          fontWeight = 700;
        }

        return (
          <button
            key={i}
            onClick={() => !submitted && onSelect(i)}
            disabled={submitted}
            style={{
              ...s.optionButton,
              borderColor,
              backgroundColor: bg,
              color: textColor,
              fontWeight,
              cursor: submitted ? 'default' : 'pointer',
            }}
          >
            <span style={{
              ...s.optionLetter,
              backgroundColor: submitted && isCorrect
                ? colors.primary
                : isSelected && !submitted
                ? colors.primary
                : colors.surface,
              color: (submitted && isCorrect) || (isSelected && !submitted) ? '#fff' : colors.textSecondary,
            }}>
              {String.fromCharCode(65 + i)}
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

function FreeTextInput({ value, onChange, onSubmit, submitted, loading }) {
  return (
    <div style={s.freeTextWrapper}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer..."
        disabled={submitted || loading}
        style={{
          ...s.textarea,
          borderColor: value && !submitted ? colors.primary : colors.border,
          boxShadow: value && !submitted ? `0 0 0 3px ${colors.primaryPale}` : 'none',
          opacity: submitted ? 0.7 : 1,
        }}
        rows={4}
      />
      {!submitted && (
        <button
          onClick={onSubmit}
          disabled={!value.trim() || loading}
          style={{
            ...s.checkButton,
            opacity: !value.trim() || loading ? 0.5 : 1,
            cursor: !value.trim() || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Checking…' : 'Check answer'}
        </button>
      )}
    </div>
  );
}

function FeedbackBar({ isCorrect, explanation, onNext, isLast }) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      style={{
        ...s.feedbackBar,
        backgroundColor: isCorrect ? '#F1F8E9' : '#FFEBEE',
        borderTopColor: isCorrect ? colors.primaryLight : colors.errorLight,
      }}
    >
      <div style={s.feedbackContent}>
        <span style={{ fontSize: 22 }}>{isCorrect ? '✅' : '❌'}</span>
        <div style={s.feedbackText}>
          <p style={{
            ...s.feedbackHeadline,
            color: isCorrect ? colors.primary : colors.error,
          }}>
            {isCorrect ? 'Correct!' : 'Not quite.'}
          </p>
          <p style={s.feedbackExplanation}>{explanation}</p>
        </div>
      </div>
      <button
        onClick={onNext}
        style={{
          ...s.nextButton,
          backgroundColor: isCorrect ? colors.primary : colors.error,
        }}
      >
        {isLast ? 'Finish lesson' : 'Next →'}
      </button>
    </motion.div>
  );
}

function OutOfHeartsScreen({ onRetry, onHome }) {
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <span style={{ fontSize: 64 }}>💔</span>
          <h2 style={{ ...s.heading, marginTop: 16 }}>Out of hearts!</h2>
          <p style={s.subtext}>Don't give up — every alpha fails before they succeed.</p>
          <button onClick={onRetry} style={{ ...s.nextButton, width: '100%', marginTop: 32 }}>
            Try again
          </button>
          <button onClick={onHome} style={s.ghostButton}>
            Back to map
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LessonScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const unitId = parseInt(searchParams.get('unit'), 10);
  const unit = units.find((u) => u.id === unitId);
  const lessonQuestions = questions.filter((q) => q.unitId === unitId);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [hearts, setHearts] = useState(TOTAL_HEARTS);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState(null);       // MCQ selected index
  const [freeText, setFreeText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);       // { isCorrect, explanation }
  const [shakingHeart, setShakingHeart] = useState(false);
  const [phase, setPhase] = useState('question');       // 'question' | 'out-of-hearts'

  const currentQ = lessonQuestions[questionIndex];
  const isMCQ = currentQ?.type === 'mcq';
  const isLast = questionIndex === lessonQuestions.length - 1;
  const progress = lessonQuestions.length
    ? ((questionIndex) / lessonQuestions.length) * 100
    : 0;

  // Handle no questions for this unit gracefully
  if (!lessonQuestions.length || !currentQ) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={{ textAlign: 'center', color: colors.textSecondary, padding: 40 }}>
            No questions yet for this unit. Check back soon!
          </p>
          <button onClick={() => navigate('/')} style={{ ...s.nextButton, width: '100%' }}>
            Back to map
          </button>
        </div>
      </div>
    );
  }

  function submitAnswer(isCorrect) {
    setSubmitted(true);
    setFeedback({ isCorrect, explanation: currentQ.explanation });

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      const newHearts = hearts - 1;
      setShakingHeart(true);
      setTimeout(() => setShakingHeart(false), 400);
      setHearts(newHearts);
      if (newHearts === 0) {
        // Delay so the red feedback bar is briefly visible before switching
        setTimeout(() => setPhase('out-of-hearts'), 900);
      }
    }
  }

  function handleMCQSelect(index) {
    if (submitted) return;
    setSelected(index);
    submitAnswer(index === currentQ.correctIndex);
  }

  function handleFreeTextSubmit() {
    const isCorrect = gradeKeyword(freeText, currentQ.expectedConcepts);
    submitAnswer(isCorrect);
  }

  function handleNext() {
    if (isLast) {
      const earned = calcXP(correctCount, hearts);
      navigate(`/unit-complete?unit=${unitId}&xp=${earned}&hearts=${hearts}`);
      return;
    }
    setQuestionIndex((i) => i + 1);
    setSelected(null);
    setFreeText('');
    setSubmitted(false);
    setFeedback(null);
  }

  function handleRetry() {
    setQuestionIndex(0);
    setHearts(TOTAL_HEARTS);
    setCorrectCount(0);
    setSelected(null);
    setFreeText('');
    setSubmitted(false);
    setFeedback(null);
    setPhase('question');
  }

  if (phase === 'out-of-hearts') {
    return (
      <OutOfHeartsScreen
        onRetry={handleRetry}
        onHome={() => navigate('/')}
      />
    );
  }

  const accentColor = unit?.color ?? colors.primary;

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* ── Top bar ── */}
        <div style={s.topBar}>
          <button onClick={() => navigate('/')} style={s.exitButton}>✕</button>

          <div style={s.progressTrack}>
            <motion.div
              style={{ ...s.progressFill, backgroundColor: accentColor }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          <HeartBar hearts={hearts} shaking={shakingHeart} />
        </div>

        {/* ── Unit label ── */}
        <div style={{ ...s.unitLabel, color: accentColor }}>
          {unit?.emoji ?? '📖'} {unit?.name ?? 'Lesson'}
        </div>

        {/* ── Question + inputs ── */}
        <div style={s.questionArea}>
          <AnimatePresence mode="wait">
            <motion.div
              key={questionIndex}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <p style={s.questionText}>{currentQ.prompt}</p>

              {isMCQ ? (
                <MCQOptions
                  question={currentQ}
                  selected={selected}
                  submitted={submitted}
                  onSelect={handleMCQSelect}
                />
              ) : (
                <FreeTextInput
                  value={freeText}
                  onChange={setFreeText}
                  onSubmit={handleFreeTextSubmit}
                  submitted={submitted}
                  loading={false}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Feedback bar ── */}
        <AnimatePresence>
          {feedback && (
            <FeedbackBar
              isCorrect={feedback.isCorrect}
              explanation={feedback.explanation}
              onNext={handleNext}
              isLast={isLast}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Keyword grader: passes if any concept has all its words present in the answer
function gradeKeyword(userAnswer, expectedConcepts = []) {
  const lower = userAnswer.toLowerCase();
  return expectedConcepts.some((concept) =>
    concept.toLowerCase().split(' ').every((word) => lower.includes(word))
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: colors.background,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: colors.background,
  },

  // Top bar
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 16px 12px',
  },
  exitButton: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: colors.surface,
    border: 'none',
    fontSize: '14px',
    color: colors.textSecondary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
  },
  progressTrack: {
    flex: 1,
    height: '8px',
    backgroundColor: colors.surface,
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '99px',
    minWidth: '4px',
  },
  heartBar: {
    display: 'flex',
    gap: '2px',
    flexShrink: 0,
  },

  // Unit label
  unitLabel: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    padding: '0 20px 16px',
    textAlign: 'center',
  },

  // Question area
  questionArea: {
    flex: 1,
    padding: '8px 20px 120px',
    overflowY: 'auto',
  },
  questionText: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '20px',
    fontWeight: 800,
    color: colors.text,
    lineHeight: 1.45,
    marginBottom: '28px',
    textAlign: 'center',
  },

  // MCQ options
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
    fontFamily: "'Nunito', sans-serif",
    fontSize: '15px',
    textAlign: 'left',
    transition: 'border-color 0.15s, background-color 0.15s',
  },
  optionLetter: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    transition: 'background-color 0.15s, color 0.15s',
  },

  // Free text
  freeTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    fontFamily: "'Nunito', sans-serif",
    color: colors.text,
    backgroundColor: colors.surface,
    border: `1.5px solid ${colors.border}`,
    borderRadius: '12px',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.5,
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  checkButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: colors.primary,
    color: '#fff',
    fontFamily: "'Nunito', sans-serif",
    fontSize: '16px',
    fontWeight: 700,
    border: 'none',
    borderRadius: '12px',
    transition: 'opacity 0.15s',
  },

  // Feedback bar
  feedbackBar: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    borderTop: '1.5px solid',
    padding: '16px 20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
  },
  feedbackContent: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  feedbackText: {
    flex: 1,
  },
  feedbackHeadline: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '16px',
    fontWeight: 800,
    margin: '0 0 4px',
  },
  feedbackExplanation: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '14px',
    color: colors.text,
    margin: 0,
    lineHeight: 1.5,
  },
  nextButton: {
    display: 'block',
    width: '100%',
    padding: '14px',
    color: '#fff',
    fontFamily: "'Nunito', sans-serif",
    fontSize: '16px',
    fontWeight: 700,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },

  // Out of hearts
  heading: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '26px',
    fontWeight: 800,
    color: colors.text,
    margin: 0,
  },
  subtext: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '15px',
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 1.5,
  },
  ghostButton: {
    display: 'block',
    width: '100%',
    padding: '14px',
    marginTop: '12px',
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    fontFamily: "'Nunito', sans-serif",
    fontSize: '15px',
    fontWeight: 700,
    border: `1.5px solid ${colors.border}`,
    borderRadius: '12px',
    cursor: 'pointer',
  },
};
