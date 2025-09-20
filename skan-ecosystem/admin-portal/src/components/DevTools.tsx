import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DevTools: React.FC = () => {
  const { auth, markOnboardingComplete, forceOnboardingRequired } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const resetOnboardingStatus = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('onboarding_restaurant_info');
      localStorage.removeItem('onboarding_current_step');
      localStorage.removeItem('dev_force_onboarding');
      
      // Force onboarding required in auth state
      forceOnboardingRequired();
      
      // Also set the dev force flag for double protection
      localStorage.setItem('dev_force_onboarding', 'true');
      
      setMessage('✅ Onboarding status reset successfully');

      // Navigate to onboarding
      setTimeout(() => {
        window.location.href = '/onboarding';
      }, 1000);
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearAllData = () => {
    localStorage.clear();
    sessionStorage.clear();
    setMessage('✅ All browser data cleared');
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  };

  const forceOnboarding = () => {
    // Manually set localStorage to force onboarding
    localStorage.setItem('dev_force_onboarding', 'true');
    setMessage('✅ Forcing onboarding flow');
    setTimeout(() => {
      window.location.href = '/onboarding';
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: isOpen ? '20px' : '10px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      minWidth: isOpen ? '300px' : 'auto',
      transition: 'all 0.3s ease'
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          cursor: 'pointer', 
          fontWeight: 'bold',
          marginBottom: isOpen ? '10px' : '0'
        }}
      >
        🛠️ DEV TOOLS {isOpen ? '▼' : '▶'}
      </div>
      
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '10px', opacity: 0.7 }}>
            User: {auth.user?.email || 'Not logged in'}<br/>
            Onboarding: {auth.needsOnboarding ? 'Required' : 'Complete'}
          </div>
          
          <button
            onClick={resetOnboardingStatus}
            style={{
              padding: '8px 12px',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Reset Onboarding Status
          </button>
          
          <button
            onClick={forceOnboarding}
            style={{
              padding: '8px 12px',
              backgroundColor: '#4ecdc4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Force Onboarding Flow
          </button>
          
          <button
            onClick={clearAllData}
            style={{
              padding: '8px 12px',
              backgroundColor: '#ffa726',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Clear All Data & Logout
          </button>
          
          {message && (
            <div style={{
              padding: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              fontSize: '10px',
              marginTop: '5px'
            }}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DevTools;