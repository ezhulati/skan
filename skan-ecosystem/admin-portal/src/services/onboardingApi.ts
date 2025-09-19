import { restaurantApiService } from './api';

export interface OnboardingStep {
  completed: boolean;
  data: Record<string, any>;
  updatedAt?: string;
}

export interface OnboardingStatus {
  isComplete: boolean;
  currentStep: number;
  completedSteps: string[];
  steps: {
    profileComplete: OnboardingStep;
    venueSetup: OnboardingStep;
    menuCategories: OnboardingStep;
    menuItems: OnboardingStep;
    tableSetup: OnboardingStep;
    staffSetup: OnboardingStep;
  };
  startedAt?: string;
  completedAt?: string;
}

export interface OnboardingApiResponse {
  onboarding: OnboardingStatus;
  user: {
    email: string;
    fullName: string;
    role: string;
    venueId: string | null;
  };
}

class OnboardingApiService {
  private baseUrl = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app';

  setToken(token: string) {
    restaurantApiService.setToken(token);
  }

  async getOnboardingStatus(): Promise<OnboardingApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/onboarding/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${restaurantApiService.getToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      throw error;
    }
  }

  async updateOnboardingStep(
    stepName: keyof OnboardingStatus['steps'], 
    data: Record<string, any>, 
    completed: boolean = true
  ): Promise<{ onboarding: OnboardingStatus }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/onboarding/step/${stepName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${restaurantApiService.getToken()}`
        },
        body: JSON.stringify({ data, completed })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      throw error;
    }
  }

  async completeOnboarding(): Promise<{ onboarding: OnboardingStatus }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${restaurantApiService.getToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  // Helper method to create a venue through the existing venue registration endpoint
  async createVenue(venueData: {
    venueName: string;
    address: string;
    phone: string;
    description: string;
    currency: string;
    tableCount: number;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/register/venue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...venueData,
          ownerName: 'Existing User', // This will be updated
          ownerEmail: 'existing@user.com', // This will be updated
          password: 'temp-password' // This won't be used
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating venue:', error);
      throw error;
    }
  }
}

export const onboardingApiService = new OnboardingApiService();