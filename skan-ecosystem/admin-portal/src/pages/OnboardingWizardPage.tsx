import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OnboardingWizard from '../components/OnboardingWizard';

const OnboardingWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkOnboardingStatus } = useAuth();

  const handleOnboardingComplete = async () => {
    // Refresh auth status to reflect completed onboarding
    await checkOnboardingStatus();
    
    // Navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <OnboardingWizard onComplete={handleOnboardingComplete} />
  );
};

export default OnboardingWizardPage;