import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors } from '../constants/colors';
import { signUp, logIn, db } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try logging in instead.';
    case 'auth/invalid-email':
      return 'That doesn't look like a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Give it another try.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'No internet connection. Check your network and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSignUp = mode === 'signup';

  async function handleSubmit() {
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

        // Create user doc in Firestore
        await setDoc(doc(db, 'users', uid), {
          email: email.trim(),
          createdAt: serverTimestamp(),
          xp: 0,
          streak: 0,
          lastActivityDate: null,
          wolfStage: 1,
          currentUnit: 1,
          completedUnits: [],
          unitStars: {},
          placementTestComplete: false,
        });

        navigation.replace('Placement');
      } else {
        const credential = await logIn(email.trim(), password);
        const uid = credential.user.uid;

        // Check if user has completed placement test
        const userSnap = await getDoc(doc(db, 'users', uid));
        const userData = userSnap.data();

        if (userData?.placementTestComplete) {
          navigation.replace('Main');
        } else {
          navigation.replace('Placement');
        }
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setError('');
    setMode(isSignUp ? 'login' : 'signup');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Wolf + Title */}
        <View style={styles.header}>
          <Text style={styles.wolfEmoji}>🐺</Text>
          <Text style={styles.title}>The Wolf's Journey</Text>
          <Text style={styles.subtitle}>Master finance. One lesson at a time.</Text>
        </View>

        {/* Mode label */}
        <Text style={styles.modeLabel}>
          {isSignUp ? 'Create your account' : 'Welcome back, Wolf'}
        </Text>

        {/* Inputs */}
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Error message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? 'Begin the Journey' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Toggle mode */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </Text>
          <TouchableOpacity onPress={toggleMode}>
            <Text style={styles.toggleLink}>
              {isSignUp ? 'Log in' : 'Sign up'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  wolfEmoji: {
    fontSize: 72,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  modeLabel: {
    alignSelf: 'flex-start',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 12,
    alignSelf: 'flex-start',
    lineHeight: 20,
  },
  button: {
    width: '100%',
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  toggleRow: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  toggleLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
