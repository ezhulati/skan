import React, { useState, useEffect } from 'react';
import { onboardingApiService } from '../services/onboardingApi';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingWizardProps {
  onComplete: () => void;
}

interface RestaurantInfo {
  name: string;
  address: string;
  phone: string;
  cuisineType: string;
  description: string;
  operatingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  paymentMethods: string[];
}

interface MenuItem {
  name: string;
  nameAlbanian: string;
  description: string;
  price: string;
  category: string;
}


const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { auth } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
    name: '',
    address: '',
    phone: '',
    cuisineType: '',
    description: '',
    operatingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '22:00', closed: false },
      sunday: { open: '09:00', close: '22:00', closed: false }
    },
    paymentMethods: ['cash']
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableCount, setTableCount] = useState('');

  // Load onboarding status on mount
  useEffect(() => {
    const loadOnboardingStatus = async () => {
      try {
        // First, try to load from localStorage
        const savedRestaurantInfo = localStorage.getItem('onboarding_restaurant_info');
        const savedCurrentStep = localStorage.getItem('onboarding_current_step');
        
        if (savedRestaurantInfo) {
          try {
            const parsedInfo = JSON.parse(savedRestaurantInfo);
            setRestaurantInfo(parsedInfo);
            console.log('Loaded restaurant info from localStorage:', parsedInfo);
          } catch (e) {
            console.warn('Failed to parse saved restaurant info:', e);
          }
        }
        
        if (savedCurrentStep) {
          const stepNumber = parseInt(savedCurrentStep);
          if (stepNumber >= 1 && stepNumber <= 5) {
            setCurrentStep(stepNumber);
            console.log('Loaded current step from localStorage:', stepNumber);
          }
        }

        if (!auth.token) {
          console.log('No auth token available, using local data only');
          setLoading(false);
          return;
        }

        console.log('Loading onboarding status with token:', auth.token?.substring(0, 20) + '...');
        onboardingApiService.setToken(auth.token);
        
        const response = await onboardingApiService.getOnboardingStatus();
        console.log('Onboarding status loaded:', response);
        
        // Resume from the current step (prefer API data over localStorage)
        if (response?.onboarding?.currentStep) {
          setCurrentStep(response.onboarding.currentStep);
        }
        
        // Load existing data if available (prefer API data over localStorage)
        if (response?.onboarding?.steps?.venueSetup?.data) {
          const venueData = response.onboarding.steps.venueSetup.data;
          setRestaurantInfo({
            name: venueData.venueName || '',
            address: venueData.address || '',
            phone: venueData.phone || '',
            cuisineType: venueData.cuisineType || '',
            description: venueData.description || '',
            operatingHours: {
              monday: { open: '09:00', close: '22:00', closed: false },
              tuesday: { open: '09:00', close: '22:00', closed: false },
              wednesday: { open: '09:00', close: '22:00', closed: false },
              thursday: { open: '09:00', close: '22:00', closed: false },
              friday: { open: '09:00', close: '22:00', closed: false },
              saturday: { open: '09:00', close: '22:00', closed: false },
              sunday: { open: '09:00', close: '22:00', closed: false }
            },
            paymentMethods: ['cash']
          });
          
          // Clear localStorage since we got fresh data from API
          localStorage.removeItem('onboarding_restaurant_info');
          localStorage.removeItem('onboarding_current_step');
        }
        
        if (response?.onboarding?.steps?.tableSetup?.data) {
          setTableCount(response.onboarding.steps.tableSetup.data.tableCount || '');
        }
      } catch (err) {
        console.error('Error loading onboarding status:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        
        // Provide more detailed error message
        let errorMessage = 'Failed to load onboarding progress';
        if (err instanceof Error) {
          // Check for common error patterns
          if (err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('Invalid token')) {
            errorMessage = 'Authentication failed. Please try logging in again.';
          } else if (err.message.includes('404') || err.message.includes('User not found') || err.message.includes('not found')) {
            errorMessage = 'Starting fresh onboarding setup.';
            console.log('User not found in onboarding system - this is normal for new users');
            // Clear the error since this is expected for new users
            setError(null);
            setLoading(false);
            return;
          } else if (err.message.includes('network') || err.message.includes('fetch')) {
            errorMessage = 'Connection error. Using saved data if available.';
          } else {
            errorMessage = `Connection issue: ${err.message}`;
          }
        }
        
        setError(errorMessage);
        
        // Don't block the user - allow them to continue with onboarding even if loading fails
        console.log('Continuing with local/fresh onboarding setup due to error');
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingStatus();
  }, [auth.token]);

  const steps = [
    { id: 1, title: 'Informacioni' },
    { id: 2, title: 'Menyja' },
    { id: 3, title: 'Tavolinat' }
  ];

  const nextStep = () => {
    console.log('nextStep called, currentStep:', currentStep, 'steps.length:', steps.length);
    if (currentStep < steps.length) {
      console.log('Advancing from step', currentStep, 'to step', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Already at last step, not advancing');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestaurantInfoSubmit = async () => {
    setSaving(true);
    setError(null);
    
    try {
      console.log('Starting restaurant info submission...');
      console.log('Auth user:', auth.user);
      console.log('Auth token available:', !!auth.token);
      console.log('Restaurant info:', restaurantInfo);

      // Basic validation
      if (!restaurantInfo.name || !restaurantInfo.address || !restaurantInfo.phone || !restaurantInfo.cuisineType) {
        throw new Error('Ju lutemi plotësoni të gjitha fushat e detyrueshme.');
      }

      // Ensure token is set
      if (!auth.token) {
        throw new Error('Kërkohet vërtetimi. Ju lutemi kyçuni përsëri.');
      }

      onboardingApiService.setToken(auth.token);

      try {
        // Update profile completion step with user's full name
        console.log('Updating profile completion step...');
        await onboardingApiService.updateOnboardingStep('profileComplete', {
          fullName: auth.user?.fullName || '',
          email: auth.user?.email || ''
        });
        
        // Update venue setup step with restaurant info
        console.log('Updating venue setup step...');
        await onboardingApiService.updateOnboardingStep('venueSetup', {
          venueName: restaurantInfo.name,
          address: restaurantInfo.address,
          phone: restaurantInfo.phone,
          description: restaurantInfo.description,
          cuisineType: restaurantInfo.cuisineType
        });
        
        // Auto-complete menu categories step (default categories)
        console.log('Updating menu categories step...');
        await onboardingApiService.updateOnboardingStep('menuCategories', {
          categoriesCreated: 4,
          categories: ['Appetizers & Salads', 'Main Courses', 'Desserts', 'Beverages']
        });
        
        console.log('All steps completed successfully, moving to next step');
      } catch (apiError) {
        console.warn('API save failed, but continuing with local data:', apiError);
        // Store data locally if API fails, but don't block the user
        localStorage.setItem('onboarding_restaurant_info', JSON.stringify(restaurantInfo));
        localStorage.setItem('onboarding_current_step', '2');
      }
      
      // Always proceed to next step regardless of API success/failure
      nextStep();
    } catch (err) {
      console.error('Error in restaurant info submission:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save restaurant information. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('required fields')) {
          errorMessage = err.message;
        } else if (err.message.includes('Authentication')) {
          errorMessage = 'Authentication failed. Please refresh the page and try again.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Connection error. You can continue setup and we\'ll save your data later.';
          
          // For network errors, still allow them to proceed
          localStorage.setItem('onboarding_restaurant_info', JSON.stringify(restaurantInfo));
          setError(errorMessage + ' Klikoni "Vazhdo gjithsesi" për të vazhduar.');
        } else {
          errorMessage = `Setup error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="onboarding-step">
            <h2>Informacioni i Restorantit</h2>
            
            <div className="form-fields">
              <div className="field-group">
                <label className="field-label">Emri i Restorantit</label>
                <input
                  type="text"
                  value={restaurantInfo.name}
                  onChange={(e) => setRestaurantInfo({...restaurantInfo, name: e.target.value})}
                  className="field-input"
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label">Adresa</label>
                <input
                  type="text"
                  value={restaurantInfo.address}
                  onChange={(e) => setRestaurantInfo({...restaurantInfo, address: e.target.value})}
                  className="field-input"
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label">Telefoni</label>
                <input
                  type="tel"
                  value={restaurantInfo.phone}
                  onChange={(e) => setRestaurantInfo({...restaurantInfo, phone: e.target.value})}
                  className="field-input"
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label">Lloji i Kuzhinës</label>
                <select
                  value={restaurantInfo.cuisineType}
                  onChange={(e) => setRestaurantInfo({...restaurantInfo, cuisineType: e.target.value})}
                  className="field-select"
                  required
                >
                  <option value="">Zgjidhni llojin</option>
                  <option value="traditional">Tradicionale Shqiptare</option>
                  <option value="mediterranean">Mesdhetare</option>
                  <option value="italian">Italiane</option>
                  <option value="seafood">Peshku dhe Deti</option>
                  <option value="international">Ndërkombëtare</option>
                  <option value="cafe">Kafe/Bar</option>
                </select>
              </div>
            </div>


            {error && (
              <div className="error-message" style={{ 
                color: '#856404', 
                marginBottom: '16px', 
                padding: '12px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7',
                borderRadius: '6px'
              }}>
                <div style={{ marginBottom: '8px' }}>{error}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={async () => {
                      setError(null);
                      setLoading(true);
                      try {
                        if (auth.token) {
                          onboardingApiService.setToken(auth.token);
                          const response = await onboardingApiService.getOnboardingStatus();
                          
                          if (response?.onboarding?.currentStep) {
                            setCurrentStep(response.onboarding.currentStep);
                          }
                          
                          if (response?.onboarding?.steps?.venueSetup?.data) {
                            const venueData = response.onboarding.steps.venueSetup.data;
                            setRestaurantInfo({
                              name: venueData.venueName || '',
                              address: venueData.address || '',
                              phone: venueData.phone || '',
                              cuisineType: venueData.cuisineType || '',
                              description: venueData.description || '',
                              operatingHours: {
                                monday: { open: '09:00', close: '22:00', closed: false },
                                tuesday: { open: '09:00', close: '22:00', closed: false },
                                wednesday: { open: '09:00', close: '22:00', closed: false },
                                thursday: { open: '09:00', close: '22:00', closed: false },
                                friday: { open: '09:00', close: '22:00', closed: false },
                                saturday: { open: '09:00', close: '22:00', closed: false },
                                sunday: { open: '09:00', close: '22:00', closed: false }
                              },
                              paymentMethods: ['cash']
                            });
                          }
                          
                          if (response?.onboarding?.steps?.tableSetup?.data) {
                            setTableCount(response.onboarding.steps.tableSetup.data.tableCount || '');
                          }
                        }
                      } catch (err) {
                        setError('Failed to retry loading onboarding progress');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    style={{
                      background: '#856404',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Retry
                  </button>
                  <button 
                    onClick={() => setError(null)}
                    style={{
                      background: 'none',
                      border: '1px solid #856404',
                      color: '#856404',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                    title="Dismiss and continue"
                  >
                    Vazhdo gjithsesi
                  </button>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                className="next-button"
                onClick={handleRestaurantInfoSubmit}
                disabled={!restaurantInfo.name || !restaurantInfo.address || !restaurantInfo.phone || !restaurantInfo.cuisineType || saving}
              >
                {saving ? 'Duke ruajtur...' : 'Vazhdo te Menyja →'}
              </button>
              
              {error && (
                <button 
                  className="skip-button"
                  onClick={() => {
                    // Save locally and continue
                    localStorage.setItem('onboarding_restaurant_info', JSON.stringify(restaurantInfo));
                    setError(null);
                    nextStep();
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid #6c757d',
                    color: '#6c757d',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Kalo & Vazhdo
                </button>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ padding: '40px 24px', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#1a1a1a', fontSize: '24px', fontWeight: '700', marginBottom: '8px', textAlign: 'left' }}>Shtoni Pjatat Kryesore</h2>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', textAlign: 'left' }}>Shtoni të paktën 3 pjata për të nisur menjën tuaj dixhitale.</p>
            </div>
            
            <div style={{ marginBottom: '40px' }}>
              {menuItems.map((item, index) => (
                <div key={index} className="menu-item-card">
                  <div className="item-header">
                    <h4>Pjata {index + 1}</h4>
                    <button 
                      onClick={() => setMenuItems(menuItems.filter((_, i) => i !== index))}
                      className="remove-button"
                    >
                      Hiq
                    </button>
                  </div>
                  <div className="item-fields">
                    <input
                      type="text"
                      placeholder="Emri i pjatës (shqip)"
                      value={item.nameAlbanian}
                      onChange={(e) => {
                        const updated = [...menuItems];
                        updated[index].nameAlbanian = e.target.value;
                        setMenuItems(updated);
                      }}
                      className="field-input"
                    />
                    <input
                      type="text"
                      placeholder="Çmimi (€)"
                      value={item.price}
                      onChange={(e) => {
                        const updated = [...menuItems];
                        updated[index].price = e.target.value;
                        setMenuItems(updated);
                      }}
                      className="field-input"
                    />
                    <textarea
                      placeholder="Përshkrimi i shkurtër"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...menuItems];
                        updated[index].description = e.target.value;
                        setMenuItems(updated);
                      }}
                      className="field-input"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => setMenuItems([...menuItems, { 
                  name: '', 
                  nameAlbanian: '', 
                  description: '', 
                  price: '', 
                  category: 'main' 
                }])}
                style={{
                  background: '#f1f5f9',
                  border: '2px dashed #cbd5e1',
                  color: '#475569',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginBottom: '24px',
                  width: '100%',
                  transition: 'all 0.15s ease'
                }}
              >
                + Shto Pjatë të Re
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => setCurrentStep(3)}
                disabled={menuItems.length < 3 || menuItems.some(item => !item.nameAlbanian || !item.price)}
                style={{
                  background: menuItems.length >= 3 && menuItems.every(item => item.nameAlbanian && item.price) ? '#3b82f6' : '#e2e8f0',
                  color: menuItems.length >= 3 && menuItems.every(item => item.nameAlbanian && item.price) ? 'white' : '#9ca3af',
                  border: 'none',
                  padding: '14px 20px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: menuItems.length >= 3 && menuItems.every(item => item.nameAlbanian && item.price) ? 'pointer' : 'not-allowed',
                  width: '100%',
                  transition: 'all 0.15s ease'
                }}
              >
                Vazhdo te Tavolinat → ({menuItems.length}/3 minimum)
              </button>
              
              <button
                onClick={() => setCurrentStep(3)}
                style={{
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.background = '#f9fafb';
                  target.style.borderColor = '#9ca3af';
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.background = 'white';
                  target.style.borderColor = '#d1d5db';
                }}
              >
                Kalo këtë hap dhe shtoji më vonë
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="onboarding-step">
            <div className="step-header">
              <h2>Konfigurimi i Tavolinave</h2>
              <p className="step-description">Vendosni numrin e tavolinave për të gjeneruar kodrat QR për porositjet dixhitale.</p>
            </div>

            <div className="table-form">
              <label className="form-label">Numri i Tavolinave</label>
              <input
                type="number"
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value)}
                className="table-input"
                min="1"
                max="100"
                required
              />
              <p className="form-help">Do të gjenerojmë një kod QR për çdo tavolinë që klientët skanojnë për të porositur.</p>
            </div>

            <div className="step-actions">
              <button className="prev-button" onClick={prevStep}>← Mbrapa</button>
              <button 
                className="next-button" 
                onClick={async () => {
                  setSaving(true);
                  setError(null);
                  try {
                    console.log('Saving table setup with count:', tableCount);
                    await onboardingApiService.updateOnboardingStep('tableSetup', {
                      tableCount: parseInt(tableCount)
                    });
                    console.log('Table setup saved successfully, advancing to next step');
                  } catch (err: any) {
                    console.error('Failed to save table setup:', err);
                    console.log('API call failed, but continuing with onboarding flow');
                    // For onboarding, we'll continue even if API fails
                    // The user can set this up later in the actual dashboard
                  } finally {
                    setSaving(false);
                    // Complete onboarding and go to dashboard
                    console.log('Completing onboarding');
                    onComplete();
                  }
                }}
                disabled={!tableCount || parseInt(tableCount) < 1 || saving}
              >
                {saving ? 'Duke ruajtur...' : 'Përfundo dhe Hap Dashboard ✓'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="onboarding-wizard">
        <div className="onboarding-container">
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e1e8ed',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: '#6c757d', fontSize: '16px' }}>Loading your onboarding progress...</p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="onboarding-wizard">
        <div className="onboarding-container">
          <div className="onboarding-header">
            <div className="progress-bar">
              {/* Background progress line */}
              <div className="progress-line-background">
                <div 
                  className="progress-line-fill" 
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>
              </div>
              
              {/* Step circles */}
              {steps.map((step, index) => (
                <div key={step.id} className={`progress-step ${
                  currentStep > step.id ? 'completed' : 
                  currentStep === step.id ? 'active' : 'pending'
                }`}>
                  <div className="step-circle">
                    {currentStep > step.id ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span className="step-number">{step.id}</span>
                    )}
                  </div>
                  <div className="step-label">{step.title}</div>
                </div>
              ))}
            </div>
        </div>

        <div className="onboarding-content">
          {renderStepContent()}
        </div>

        <style>{`
        .onboarding-wizard {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .onboarding-container {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .onboarding-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          border-radius: 16px 16px 0 0;
        }

        /* Progress Container */
        .progress-bar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px 24px;
        }

        /* Progress bar without line - cleaner look */

        /* Step Components */
        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 2;
          transition: all 0.3s ease;
          min-width: 80px;
        }

        .step-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
          z-index: 10;
          border: 3px solid transparent;
          z-index: 10;
        }

        .step-number {
          font-size: 16px;
          font-weight: 700;
          transition: all 0.3s ease;
        }

        .step-label {
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          transition: all 0.3s ease;
          line-height: 1.3;
          white-space: nowrap;
        }

        /* Step States */
        .progress-step.pending .step-circle {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .progress-step.pending .step-number {
          color: rgba(255, 255, 255, 0.6);
        }

        .progress-step.pending .step-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .progress-step.active .step-circle {
          background: white;
          border-color: white;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2), 0 8px 24px rgba(0, 0, 0, 0.15);
          transform: scale(1.1);
        }

        .progress-step.active .step-number {
          color: #6366f1;
        }

        .progress-step.active .step-label {
          color: white;
          transform: translateY(-2px);
        }

        .progress-step.completed .step-circle {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(255, 255, 255, 0.9);
          color: #10b981;
        }

        .progress-step.completed .step-label {
          color: rgba(255, 255, 255, 0.8);
        }

        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .progress-bar {
            padding: 12px 16px;
          }

          .progress-step {
            min-width: 60px;
            gap: 8px;
          }

          .step-circle {
            width: 36px;
            height: 36px;
          }

          .step-number {
            font-size: 14px;
          }

          .step-label {
            font-size: 11px;
            line-height: 1.2;
          }

          /* No progress line needed */

          .onboarding-header {
            padding: 16px;
          }
        }

        /* Tablet responsive adjustments */
        @media (max-width: 1024px) and (min-width: 769px) {
          .progress-bar {
            padding: 16px 20px;
          }

          .progress-step {
            min-width: 70px;
            gap: 10px;
          }

          .step-circle {
            width: 40px;
            height: 40px;
          }

          .step-number {
            font-size: 15px;
          }

          .step-label {
            font-size: 12px;
          }

          /* No progress line needed */
        }

        /* Extra small screens */
        @media (max-width: 480px) {
          .progress-bar {
            padding: 8px 12px;
          }

          .progress-step {
            min-width: 50px;
            gap: 6px;
          }

          .step-circle {
            width: 32px;
            height: 32px;
          }

          .step-number {
            font-size: 13px;
          }

          .step-label {
            font-size: 10px;
            line-height: 1.1;
          }

          /* No progress line needed */

          .progress-step.active .step-circle {
            transform: scale(1.05);
          }
        }

          .onboarding-content {
            padding: 20px;
          }
        }

        .onboarding-content {
          padding: 32px;
        }

        .onboarding-step h2 {
          margin: 0 0 16px 0;
          color: #2c3e50;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #34495e;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e8ed;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .category-preview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin: 24px 0;
        }

        .category-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px solid #e9ecef;
        }

        .category-icon {
          font-size: 24px;
        }

        .step-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
        }

        .prev-button,
        .next-button,
        .complete-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .prev-button {
          background: #e9ecef;
          color: #6c757d;
        }

        .prev-button:hover {
          background: #dee2e6;
        }

        .next-button,
        .complete-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .next-button:hover,
        .complete-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .next-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .setup-summary {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin: 24px 0;
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .summary-icon {
          font-size: 32px;
        }

        .next-steps {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }

        .next-steps h4 {
          margin: 0 0 12px 0;
          color: #1976d2;
        }

        .next-steps ol {
          margin: 0;
          color: #424242;
        }

        .onboarding-tips {
          background: #fff3e0;
          border: 1px solid #ffcc02;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }

        .onboarding-tips h4 {
          margin: 0 0 12px 0;
          color: #f57c00;
        }

        .add-item-button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 12px;
          transition: background 0.3s;
        }

        .add-item-button:hover {
          background: #45a049;
        }

        .form-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .form-row input {
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.3s;
        }

        .form-row input:focus {
          border-color: #6c5ce7;
        }

        .added-items {
          margin: 20px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .added-items h4 {
          margin: 0 0 16px 0;
          color: #495057;
          font-size: 16px;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .item-name {
          font-weight: 500;
          color: #495057;
        }

        .item-price {
          font-weight: 600;
          color: #28a745;
          font-size: 14px;
        }

        .sample-item-form {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e9ecef;
          margin-bottom: 20px;
        }

        .sample-item-form h4 {
          margin: 0 0 16px 0;
          color: #495057;
          font-size: 16px;
        }

        .qr-icon {
          width: 24px;
          height: 24px;
          background: #6c5ce7;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .qr-icon::before {
          content: "";
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 2px;
          background-image: linear-gradient(45deg, #6c5ce7 25%, transparent 25%), 
                            linear-gradient(-45deg, #6c5ce7 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #6c5ce7 75%), 
                            linear-gradient(-45deg, transparent 75%, #6c5ce7 75%);
          background-size: 4px 4px;
          background-position: 0 0, 0 2px, 2px -2px, -2px 0px;
        }

        /* Clean Table Setup Form */
        .table-form {
          max-width: 400px;
          margin: 32px 0;
        }

        .form-label {
          display: block;
          font-weight: 600;
          font-size: 16px;
          color: #2c3e50;
          margin-bottom: 8px;
        }

        .table-input {
          width: 100%;
          padding: 12px 16px;
          font-size: 18px;
          font-weight: 500;
          border: 2px solid #e1e8ed;
          border-radius: 8px;
          background: white;
          color: #2c3e50;
          transition: border-color 0.2s ease;
        }

        .table-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-help {
          margin: 12px 0 0 0;
          font-size: 14px;
          color: #6c757d;
          line-height: 1.4;
        }

        /* Consistent Form Styling */
        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 500px;
          margin: 24px 0;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-weight: 600;
          font-size: 16px;
          color: #2c3e50;
        }

        .field-input,
        .field-select {
          padding: 12px 16px;
          font-size: 16px;
          border: 2px solid #e1e8ed;
          border-radius: 8px;
          background: white;
          color: #2c3e50;
          transition: border-color 0.2s ease;
        }

        .field-input:focus,
        .field-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .field-select {
          cursor: pointer;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin: 16px 0;
          font-size: 14px;
        }

        /* Step 2: Categories */
        .category-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 400px;
          margin: 24px 0;
        }

        .category-item {
          padding: 16px 20px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          font-weight: 500;
          color: #495057;
        }

        /* Step 5: Completion */
        .completion-summary {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 500px;
          margin: 24px 0;
        }

        .completion-summary .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px 20px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
        }

        .completion-summary .summary-item strong {
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
        }

        .completion-summary .summary-item span {
          font-size: 14px;
          color: #6c757d;
        }

        .next-steps {
          margin: 32px 0;
          max-width: 500px;
        }

        .next-steps h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
        }

        .next-steps ol {
          margin: 0;
          padding-left: 20px;
          color: #495057;
        }

        .next-steps ol li {
          margin-bottom: 8px;
          line-height: 1.4;
        }
        `}</style>
      </div>
    </div>
  );
};

export default OnboardingWizard;