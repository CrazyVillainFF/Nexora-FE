import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeContextProvider } from './theme/ThemeContext';
import { useThemeMode } from './theme/ThemeContext';

import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import PeoplePage from './pages/PeoplePage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

const GhostCursor = React.lazy(() => import('./components/reactbits/GhostCursor'));

function GlobalGhostCursor() {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const coarsePointer = useMediaQuery('(pointer: coarse)');
  const { mode } = useThemeMode();

  if (reduceMotion || coarsePointer) return null;

  return (
    <React.Suspense fallback={null}>
      <GhostCursor
        fixed
        color={mode === 'dark' ? '#71D8F0' : '#087C98'}
        brightness={0.68}
        edgeIntensity={0}
        trailLength={32}
        inertia={0.46}
        grainIntensity={0.018}
        bloomStrength={0.12}
        bloomRadius={0.9}
        bloomThreshold={0.035}
        fadeDelayMs={650}
        fadeDurationMs={1000}
        maxDevicePixelRatio={0.5}
        zIndex={2}
        mixBlendMode={mode === 'dark' ? 'screen' : 'multiply'}
      />
    </React.Suspense>
  );
}

// Root index route handler
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />;
};

function App() {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Root / Landing */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<RootRedirect />} />
              </Route>

              {/* Authentication Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />
              </Route>

              {/* Main Application Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/home" element={<HomePage />} />
                <Route path="/profile/:id" element={<ProfilePage />} />
                <Route path="/profile/edit" element={<EditProfilePage />} />
                <Route path="/people" element={<PeoplePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
            <GlobalGhostCursor />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeContextProvider>
  );
}

export default App;
