import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OnboardingWizard from '../components/OnboardingWizard';

const OnboardingWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkOnboardingStatus, markOnboardingComplete } = useAuth();

  const handleOnboardingComplete = async () => {
    // Mark onboarding as complete immediately to prevent redirect loops
    markOnboardingComplete();
    
    // Clear development force onboarding flag
    localStorage.removeItem('dev_force_onboarding');
    
    // Try to refresh auth status from server
    try {
      await checkOnboardingStatus();
    } catch (error) {
      console.log('Could not refresh onboarding status from server, proceeding anyway');
    }
    
    // Navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <OnboardingWizard onComplete={handleOnboardingComplete} />
  );
};

export default OnboardingWizardPage;