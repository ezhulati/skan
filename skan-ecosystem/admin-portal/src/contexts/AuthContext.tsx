import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  venueId: string;
}

interface Venue {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  user: User | null;
  venue: Venue | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
}

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkOnboardingStatus: () => Promise<void>;
  markOnboardingComplete: () => void;
  forceOnboardingRequired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    venue: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    needsOnboarding: false
  });

  const checkOnboardingStatus = useCallback(async () => {
    if (!auth.token) return;
    
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';
    
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/status`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuth(prev => ({
          ...prev,
          needsOnboarding: !data.onboarding.isComplete
        }));
      } else {
        // If onboarding API is not available, fall back to checking if user has venue
        console.log('New onboarding API not available, falling back to venue check');
        setAuth(prev => ({
          ...prev,
          needsOnboarding: !prev.user?.venueId
        }));
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Fallback: if user has no venue, they need onboarding
      setAuth(prev => ({
        ...prev,
        needsOnboarding: !prev.user?.venueId
      }));
    }
  }, [auth.token]);

  useEffect(() => {
    // Check for existing session (standard admin login)
    const savedAuth = localStorage.getItem('restaurantAuth');
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        if (!parsedAuth.token) {
          console.warn('Stored auth session missing token, clearing.');
          localStorage.removeItem('restaurantAuth');
        } else {
          const restoredAuth = {
            ...parsedAuth,
            isAuthenticated: true,
            isLoading: false,
            needsOnboarding: false
          };
          setAuth(restoredAuth);
          
          // Check onboarding status for restored sessions
          setTimeout(() => {
            checkOnboardingStatus();
          }, 100);
          return;
        }
      } catch (error) {
        console.error('Error parsing saved auth:', error);
        localStorage.removeItem('restaurantAuth');
      }
    }
    
    // Check for registration-based auth (from venue registration)
    const skanToken = localStorage.getItem('skanAuthToken');
    const skanUser = localStorage.getItem('skanUser');
    const skanVenue = localStorage.getItem('skanVenue');
    
    if (skanToken && skanUser && skanVenue) {
      try {
        const user = JSON.parse(skanUser);
        const venue = JSON.parse(skanVenue);
        
        setAuth({
          user,
          venue,
          token: skanToken,
          isAuthenticated: true,
          isLoading: false,
          needsOnboarding: true  // New registrations should go through onboarding
        });
        
        // Migrate to standard auth storage
        localStorage.setItem('restaurantAuth', JSON.stringify({
          user,
          venue,
          token: skanToken
        }));
        
        return;
      } catch (error) {
        console.error('Error parsing Skan auth:', error);
        localStorage.removeItem('skanAuthToken');
        localStorage.removeItem('skanUser');
        localStorage.removeItem('skanVenue');
      }
    }
    
    setAuth(prev => ({ ...prev, isLoading: false }));
  }, [checkOnboardingStatus]);

  const login = async (email: string, password: string) => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Handle both demo tokens and real access tokens
      const token = data.token || data.accessToken;
      
      const newAuth = {
        user: data.user,
        venue: data.venue,
        token: token,
        isAuthenticated: true,
        isLoading: false,
        needsOnboarding: false
      };

      setAuth(newAuth);
      localStorage.setItem('restaurantAuth', JSON.stringify({
        user: data.user,
        venue: data.venue,
        token: token
      }));
      
      // Check onboarding status after login
      setTimeout(() => {
        checkOnboardingStatus();
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const markOnboardingComplete = () => {
    setAuth(prev => ({
      ...prev,
      needsOnboarding: false
    }));
  };

  const forceOnboardingRequired = () => {
    setAuth(prev => ({
      ...prev,
      needsOnboarding: true
    }));
  };

  const logout = () => {
    setAuth({
      user: null,
      venue: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      needsOnboarding: false
    });
    localStorage.removeItem('restaurantAuth');
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, checkOnboardingStatus, markOnboardingComplete, forceOnboardingRequired }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
