import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChange } from '../services/firebase';

import AuthScreen from '../screens/AuthScreen';
import PlacementScreen from '../screens/PlacementScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LessonScreen from '../screens/LessonScreen';
import UnitCompleteScreen from '../screens/UnitCompleteScreen';

function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontSize: 48,
    }}>
      🐺
    </div>
  );
}

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function Router() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser ?? null);
    });
    return unsubscribe;
  }, []);

  if (user === undefined) return <LoadingSpinner />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <AuthScreen />}
        />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute user={user}>
              <HomeScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement"
          element={
            <ProtectedRoute user={user}>
              <PlacementScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson"
          element={
            <ProtectedRoute user={user}>
              <LessonScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/unit-complete"
          element={
            <ProtectedRoute user={user}>
              <UnitCompleteScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute user={user}>
              <HomeScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <ProfileScreen />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? '/' : '/auth'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
