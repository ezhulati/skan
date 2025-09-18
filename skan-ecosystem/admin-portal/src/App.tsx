import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import QRCodePage from './pages/QRCodePage';
import MenuManagementPage from './pages/MenuManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import PaymentSettingsPage from './pages/PaymentSettingsPage';
import OnboardingWizardPage from './pages/OnboardingWizardPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;