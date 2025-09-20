import React, { useState, useEffect } from 'react';
import { onboardingApiService } from '../services/onboardingApi';
import { useAuth } from '../contexts/AuthContext';
import './OnboardingWizard.css';

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
            
            <div className="step-intro">
              <p>Plotësoni informacionet bazë për restorantin tuaj. Këto detaje do të përdoren për të krijuar profilin tuaj.</p>
            </div>
            
            <div className="form-group">
              <label>Emri i Restorantit</label>
              <input
                type="text"
                value={restaurantInfo.name}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, name: e.target.value})}
                placeholder="Shkruani emrin e restorantit"
                required
              />
            </div>

            <div className="form-group">
              <label>Adresa</label>
              <input
                type="text"
                value={restaurantInfo.address}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, address: e.target.value})}
                placeholder="Rruga, qyteti, shteti"
                required
              />
            </div>

            <div className="form-group">
              <label>Telefoni</label>
              <input
                type="tel"
                value={restaurantInfo.phone}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, phone: e.target.value})}
                placeholder="+355 69 123 4567"
                required
              />
            </div>

            <div className="form-group">
              <label>Lloji i Kuzhinës</label>
              <select
                value={restaurantInfo.cuisineType}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, cuisineType: e.target.value})}
                required
              >
                <option value="">Zgjidhni llojin e kuzhinës</option>
                <option value="traditional">Tradicionale Shqiptare</option>
                <option value="mediterranean">Mesdhetare</option>
                  <option value="italian">Italiane</option>
                  <option value="seafood">Peshku dhe Deti</option>
                  <option value="international">Ndërkombëtare</option>
                  <option value="cafe">Kafe/Bar</option>
                </select>
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
            
            <div className="form-buttons">
              <button 
                className="primary-button"
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
          <div className="onboarding-step">
            <h2>Shtoni Pjatat Kryesore</h2>
            
            <div className="step-intro">
              <p>Shtoni të paktën 3 pjata për të nisur menjën tuaj dixhitale.</p>
            </div>
            
            <div className="menu-items-section">
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
                className="add-plate-button"
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
            <h2>Konfigurimi i Tavolinave</h2>
            
            <div className="step-intro">
              <p>Vendosni numrin e tavolinave për të gjeneruar kodrat QR për porositjet dixhitale.</p>
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
      </div>
    );
  }

  return (
    <div className="onboarding-wizard">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="progress-bar">
            {/* Step circles */}
            {steps.map((step, index) => (
              <div key={step.id} className={`progress-step ${currentStep > step.id ? 'completed' : currentStep === step.id ? 'active' : 'pending'}`}>
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
      </div>
    </div>
  );
};

export default OnboardingWizard;
