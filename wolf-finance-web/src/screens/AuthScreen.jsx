import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { signUp, logIn, db } from '../services/firebase';
import { colors } from '../constants/colors';

const ERROR_MAP = {
  'auth/wrong-password': 'Wrong password, try again.',
  'auth/invalid-credential': 'Wrong password, try again.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/invalid-email': 'That doesn\'t look like a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts — wait a moment and try again.',
  'auth/network-request-failed': 'No internet connection. Check your network.',
};

function friendlyError(code) {
  return ERROR_MAP[code] ?? 'Something went wrong. Please try again.';
}

export default function AuthScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();

  const isSignUp = mode === 'signup';

  function toggleMode() {
    setError('');
    setMode(isSignUp ? 'login' : 'signup');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const credential = await signUp(email.trim(), password);
        const uid = credential.user.uid;

        await setDoc(doc(db, 'users', uid), {
          email: email.trim(),
          createdAt: serverTimestamp(),
          placementComplete: false,
          xp: 0,
          streak: 0,
          currentUnit: 'meadow',
          wolfStage: 1,
        });

        navigate('/placement');
      } else {
        const credential = await logIn(email.trim(), password);
        const uid = credential.user.uid;

        const userSnap = await getDoc(doc(db, 'users', uid));
        const placementComplete = userSnap.exists()
          ? userSnap.data().placementComplete
          : false;

        navigate(placementComplete ? '/home' : '/placement');
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* ── Header ── */}
        <div style={s.header}>
          <span style={s.wolfEmoji}>🐺</span>
          <h1 style={s.title}>The Wolf's Journey</h1>
          <p style={s.subtitle}>Master finance. One lesson at a time.</p>
        </div>

        {/* ── Animated form area ── */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={s.form}
            noValidate
          >
            <p style={s.modeLabel}>
              {isSignUp ? 'Create your account' : 'Welcome back, Wolf'}
            </p>

            {/* Email */}
            <div style={s.inputWrapper}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={{
                  ...s.input,
                  borderColor: emailFocused ? colors.primaryLight : colors.border,
                  boxShadow: emailFocused
                    ? `0 0 0 3px ${colors.primaryPale}`
                    : 'none',
                }}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div style={s.inputWrapper}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={{
                  ...s.input,
                  borderColor: passwordFocused ? colors.primaryLight : colors.border,
                  boxShadow: passwordFocused
                    ? `0 0 0 3px ${colors.primaryPale}`
                    : 'none',
                }}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                disabled={loading}
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={s.errorText}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...s.button,
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <Spinner /> : isSignUp ? 'Begin the Journey' : 'Continue'}
            </button>

            {/* Toggle mode */}
            <div style={s.toggleRow}>
              <span style={s.toggleText}>
                {isSignUp
                  ? 'Already have an account?'
                  : 'New here?'}
              </span>
              <button
                type="button"
                onClick={toggleMode}
                style={s.toggleLink}
              >
                {isSignUp ? 'Log in' : 'Create an account'}
              </button>
            </div>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={s.spinnerWrapper}>
      <motion.span
        style={s.spinnerDot}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
      />
    </span>
  );
}

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
    maxWidth: '420px',
    backgroundColor: colors.background,
    borderRadius: '24px',
    padding: '40px 36px 32px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    border: `1px solid ${colors.border}`,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px',
  },
  wolfEmoji: {
    fontSize: '60px',
    lineHeight: 1,
    marginBottom: '12px',
    display: 'block',
  },
  title: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '32px',
    fontWeight: 700,
    color: colors.primary,
    margin: 0,
    textAlign: 'center',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '16px',
    color: colors.textSecondary,
    margin: '8px 0 0',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  modeLabel: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '18px',
    fontWeight: 700,
    color: colors.text,
    margin: '0 0 4px',
  },
  inputWrapper: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: '52px',
    padding: '0 16px',
    fontSize: '16px',
    fontFamily: "'Nunito', sans-serif",
    color: colors.text,
    backgroundColor: colors.surface,
    border: `1.5px solid ${colors.border}`,
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    boxSizing: 'border-box',
  },
  errorText: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '14px',
    color: colors.error,
    margin: '0',
    lineHeight: 1.4,
  },
  button: {
    width: '100%',
    height: '54px',
    backgroundColor: colors.primary,
    color: '#fff',
    fontSize: '17px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    border: 'none',
    borderRadius: '14px',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(27,94,32,0.30)',
    transition: 'opacity 0.15s ease, transform 0.1s ease',
  },
  spinnerWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
  },
  spinnerDot: {
    display: 'block',
    width: '20px',
    height: '20px',
    border: '2.5px solid rgba(255,255,255,0.35)',
    borderTopColor: '#fff',
    borderRadius: '50%',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    marginTop: '8px',
  },
  toggleText: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '14px',
    color: colors.textSecondary,
  },
  toggleLink: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '14px',
    fontWeight: 700,
    color: colors.primary,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
};
