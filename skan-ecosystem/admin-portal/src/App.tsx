import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import DemoRequestPage from './pages/DemoRequestPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import QRCodePage from './pages/QRCodePage';
import MenuManagementPage from './pages/MenuManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import UserProfilePage from './pages/UserProfilePage';
import PaymentSettingsPage from './pages/PaymentSettingsPage';
import OnboardingWizardPage from './pages/OnboardingWizardPage';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import ScrollToTop from './components/ScrollToTop';
import DevTools from './components/DevTools';

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <ScrollToTop />
          <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/demo-request" element={<DemoRequestPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <OnboardingWizardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Navigation>
                    <DashboardPage />
                  </Navigation>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/qr-codes" 
              element={
                <ProtectedRoute>
                  <Navigation>
                    <QRCodePage />
                  </Navigation>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/menu" 
              element={
                <ProtectedRoute>
                  <Navigation>
                    <MenuManagementPage />
                  </Navigation>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <Navigation>
                    <UserManagementPage />
                  </Navigation>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment-settings" 
              element={
                <ProtectedRoute>
                  <Navigation>
                    <PaymentSettingsPage />
                  </Navigation>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Navigation>
                    <UserProfilePage />
                  </Navigation>
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          <DevTools />
        </div>
      </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;