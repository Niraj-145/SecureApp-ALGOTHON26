import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import CookieBanner from './components/CookieBanner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Records from './pages/Records';
import RecordDetails from './pages/RecordDetails';
import SecurityCenter from './pages/SecurityCenter';
import VulnerabilityDetails from './pages/VulnerabilityDetails';
import SecurityReport from './pages/SecurityReport';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

import { Menu } from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/404';

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" role="status" aria-label="Initializing platform"></div>
      </div>
    );
  }

  // Render full layout for authenticated pages
  return (
    <div>
      {/* Mobile Drawer Trigger */}
      {isAuthenticated && !isAuthPage && (
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>
      )}

      <div className={isAuthenticated && !isAuthPage ? 'app-layout' : ''}>
        {isAuthenticated && !isAuthPage && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <main className={isAuthenticated && !isAuthPage ? 'main-content' : ''}>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/records"
              element={
                <ProtectedRoute>
                  <Records />
                </ProtectedRoute>
              }
            />

            <Route
              path="/records/:id"
              element={
                <ProtectedRoute>
                  <RecordDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/security"
              element={
                <ProtectedRoute adminOnly={true}>
                  <SecurityCenter />
                </ProtectedRoute>
              }
            />

            <Route
              path="/security/vulnerabilities/:id"
              element={
                <ProtectedRoute adminOnly={true}>
                  <VulnerabilityDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/security/report"
              element={
                <ProtectedRoute adminOnly={true}>
                  <SecurityReport />
                </ProtectedRoute>
              }
            />

            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      <CookieBanner />
    </div>
  );
}
