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
      const token = restaurantApiService.getToken();
      console.log('Making onboarding status request to:', `${this.baseUrl}/v1/onboarding/status`);
      console.log('Using token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${this.baseUrl}/v1/onboarding/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Onboarding status response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Onboarding status error response:', errorText);
        console.error('Response status:', response.status);
        
        // Handle 404 specifically - this means the onboarding endpoint doesn't exist or user data not found
        // This is normal for new users who haven't started onboarding yet
        if (response.status === 404 || errorText.includes('User not found')) {
          console.log('Onboarding data not found (normal for new users), returning default structure');
          return {
            onboarding: {
              isComplete: false,
              currentStep: 1,
              completedSteps: [],
              steps: {
                profileComplete: { completed: false, data: {} },
                venueSetup: { completed: false, data: {} },
                menuCategories: { completed: false, data: {} },
                menuItems: { completed: false, data: {} },
                tableSetup: { completed: false, data: {} },
                staffSetup: { completed: false, data: {} }
              }
            },
            user: {
              email: '',
              fullName: '',
              role: '',
              venueId: null
            }
          };
        }
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Onboarding status result:', result);
      return result;
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      
      // Re-throw with more context if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to the server. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  async updateOnboardingStep(
    stepName: keyof OnboardingStatus['steps'], 
    data: Record<string, any>, 
    completed: boolean = true
  ): Promise<{ onboarding: OnboardingStatus }> {
    try {
      const token = restaurantApiService.getToken();
      const url = `${this.baseUrl}/v1/onboarding/step/${stepName}`;
      
      console.log(`Updating onboarding step: ${stepName}`);
      console.log('URL:', url);
      console.log('Data:', data);
      console.log('Token available:', !!token);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data, completed })
      });

      console.log(`Response for ${stepName}:`, response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response for ${stepName}:`, errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`Success for ${stepName}:`, result);
      return result;
    } catch (error) {
      console.error(`Error updating onboarding step ${stepName}:`, error);
      
      // Re-throw with more context if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error updating ${stepName}: Could not connect to the server`);
      }
      
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