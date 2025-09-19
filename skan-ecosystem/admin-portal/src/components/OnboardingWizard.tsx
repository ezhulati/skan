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
    description: ''
  });
  const [tableCount, setTableCount] = useState('');
  const [menuItems, setMenuItems] = useState<Array<{name: string, price: string}>>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

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
            description: venueData.description || ''
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
    { id: 2, title: 'Kategoritë' },
    { id: 3, title: 'Pjatet' },
    { id: 4, title: 'Tavolinat' },
    { id: 5, title: 'Perfunduar' }
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

  const addMenuItem = () => {
    console.log('addMenuItem called with:', { name: newItemName, price: newItemPrice });
    
    if (!newItemName.trim()) {
      console.log('Validation failed: empty name');
      alert('Ju lutemi shkruani emrin e pjatës');
      return;
    }
    
    if (!newItemPrice.trim()) {
      console.log('Validation failed: empty price');
      alert('Ju lutemi shkruani çmimin');
      return;
    }
    
    console.log('Adding menu item:', { name: newItemName.trim(), price: newItemPrice.trim() });
    setMenuItems([...menuItems, { name: newItemName.trim(), price: newItemPrice.trim() }]);
    setNewItemName('');
    setNewItemPrice('');
    console.log('Menu item added successfully');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="onboarding-step">
            <h2>Mirë se vini në SKAN.AL!</h2>
            <p>Le të konfigurojmë restorantin tuaj për porositje dixhitale. Kjo do të marrë vetëm disa minuta.</p>
            
            <div className="form-group">
              <label>Emri i Restorantit *</label>
              <input
                type="text"
                value={restaurantInfo.name}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, name: e.target.value})}
                placeholder="p.sh., Taverna Durrësi"
              />
            </div>

            <div className="form-group">
              <label>Adresa *</label>
              <input
                type="text"
                value={restaurantInfo.address}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, address: e.target.value})}
                placeholder="p.sh., Rruga Taulantia, Durrës"
              />
            </div>

            <div className="form-group">
              <label>Numri i Telefonit *</label>
              <input
                type="tel"
                value={restaurantInfo.phone}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, phone: e.target.value})}
                placeholder="p.sh., +355 67 123 4567"
              />
            </div>

            <div className="form-group">
              <label>Lloji i Kuzhinës *</label>
              <select
                value={restaurantInfo.cuisineType}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, cuisineType: e.target.value})}
              >
                <option value="">Zgjidhni llojin e kuzhinës...</option>
                <option value="traditional">Tradicionale Shqiptare</option>
                <option value="mediterranean">Mesdhetare</option>
                <option value="italian">Italiane</option>
                <option value="seafood">Peshku dhe Deti</option>
                <option value="international">Ndërkombëtare</option>
                <option value="cafe">Kafe/Bar</option>
              </select>
            </div>

            <div className="form-group">
              <label>Përshkrimi i Shkurtër</label>
              <textarea
                value={restaurantInfo.description}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, description: e.target.value})}
                placeholder="Përshkruani restorantin tuaj në disa fjalë..."
                rows={3}
              />
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
                              description: venueData.description || ''
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
          <div className="onboarding-step">
            <h2>Kategoritë e Menusë</h2>
            <p>Do të krijojmë këto kategori bazë për menunë tuaj. Mund t'i personalizoni më vonë.</p>
            
            <div className="category-preview">
              <div className="category-item">
                <div className="category-icon">
                  •
                </div>
                <span>Appetizers & Salads</span>
              </div>
              <div className="category-item">
                <div className="category-icon">
                  •
                </div>
                <span>Main Courses</span>
              </div>
              <div className="category-item">
                <div className="category-icon">
                  •
                </div>
                <span>Desserts</span>
              </div>
              <div className="category-item">
                <div className="category-icon">
                  •
                </div>
                <span>Beverages</span>
              </div>
            </div>

            <p><strong>Perfect for {restaurantInfo.cuisineType} cuisine!</strong></p>

            <div className="step-actions">
              <button className="prev-button" onClick={prevStep}>← Mbrapa</button>
              <button className="next-button" onClick={nextStep}>
                Create Categories →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="onboarding-step">
            <h2>Shtoni Artikujt e Parë të Menusë</h2>
            <p>Le të shtojmë disa artikuj për t'ju ndihmuar të filloni. Mund të shtoni më shumë më vonë!</p>
            
            <div className="sample-item-form">
              <h4>Shtoni një pjatë të njohur:</h4>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Emri i pjatës në shqip"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  style={{ flex: 1, marginRight: '8px' }}
                />
                <input
                  type="text"
                  placeholder="Çmimi (€)"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  style={{ width: '100px' }}
                />
              </div>
              <button className="add-item-button" onClick={addMenuItem}>+ Shto Artikull</button>
            </div>

            {menuItems.length > 0 && (
              <div className="added-items">
                <h4>Artikujt e Shtuar:</h4>
                <div className="items-list">
                  {menuItems.map((item, index) => (
                    <div key={index} className="item-card">
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">€{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="onboarding-tips">
              <h4>Për momentin:</h4>
              <ul>
                <li>Shtoni 3-5 pjata të popullarizuara për të filluar</li>
                <li>Përdorni emra të thjeshtë që klientët t'i kuptojnë lehtë</li>
                <li>Vendosni çmime të sakta - mund t'i ndryshoni më vonë</li>
              </ul>
              <p><strong>Më vonë në menunë komplete:</strong> Do të mund të shtoni foto, përkthime në anglisht, përshkrime dhe allergjenë.</p>
            </div>

            <div className="step-actions">
              <button className="prev-button" onClick={prevStep}>← Mbrapa</button>
              <button className="next-button" onClick={nextStep}>
                Vazhdo te Tavolinat →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="onboarding-step">
            <div className="step-header">
              <h2>Konfigurimi i Tavolinave</h2>
              <p className="step-description">Vendosni numrin e tavolinave për të gjeneruar kodrat QR për porositjet dixhitale.</p>
            </div>

            <div className="table-setup-container">
              <div className="table-input-section">
                <div className="input-group-modern">
                  <label className="input-label">Numri i Tavolinave</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      value={tableCount}
                      onChange={(e) => setTableCount(e.target.value)}
                      placeholder="12"
                      min="1"
                      max="100"
                      className="number-input-modern"
                    />
                    <span className="input-suffix">tavolina</span>
                  </div>
                  <small className="input-hint">Mund të shtoni ose hiqni tavolina më vonë</small>
                </div>
              </div>

              <div className="qr-preview-section">
                <div className="qr-preview-card">
                  <div className="qr-preview-header">
                    <h4>Çdo tavolinë do të ketë kodin e vet QR</h4>
                  </div>
                  
                  <div className="qr-demo-layout">
                    <div className="qr-code-visual">
                      <div className="qr-code-square">
                        <div className="qr-pattern">
                          <div className="qr-corner qr-corner-tl"></div>
                          <div className="qr-corner qr-corner-tr"></div>
                          <div className="qr-corner qr-corner-bl"></div>
                          <div className="qr-dots">
                            <span></span><span></span><span></span>
                            <span></span><span></span><span></span>
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                      </div>
                      <div className="table-label">Tavolinë 1</div>
                    </div>
                    
                    <div className="qr-benefits">
                      <div className="benefit-item">
                        <div className="benefit-icon">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M2 3C2 2.44772 2.44772 2 3 2H7C7.55228 2 8 2.44772 8 3V7C8 7.55228 7.55228 8 7 8H3C2.44772 8 2 7.55228 2 7V3Z" fill="currentColor"/>
                            <path d="M12 3C12 2.44772 12.4477 2 13 2H17C17.5523 2 18 2.44772 18 3V7C18 7.55228 17.5523 8 17 8H13C12.4477 8 12 7.55228 12 7V3Z" fill="currentColor"/>
                            <path d="M2 13C2 12.4477 2.44772 12 3 12H7C7.55228 12 8 12.4477 8 13V17C8 17.5523 7.55228 18 7 18H3C2.44772 18 2 17.5523 2 17V13Z" fill="currentColor"/>
                          </svg>
                        </div>
                        <div className="benefit-text">
                          <strong>Skanimi i menjëhershëm</strong>
                          <p>Klientët skanojnë dhe shohin menunë</p>
                        </div>
                      </div>
                      <div className="benefit-item">
                        <div className="benefit-icon">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M3 3C3 1.89543 3.89543 1 5 1H15C16.1046 1 17 1.89543 17 3V5.26756C16.4022 5.09668 15.7625 5 15.1 5C11.7721 5 9.1 7.91015 9.1 11.5C9.1 13.4825 9.97131 15.2385 11.3596 16.4472L10 17.9999L3 17.9999V3Z" fill="currentColor"/>
                            <circle cx="15.1" cy="11.5" r="5.5" fill="currentColor"/>
                            <path d="M13.3 11.5L14.6 12.8L16.9 10.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="benefit-text">
                          <strong>Porositje pa pritje</strong>
                          <p>Porosia dërgohet direkt në kuzhinë</p>
                        </div>
                      </div>
                      <div className="benefit-item">
                        <div className="benefit-icon">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="3" y="2" width="14" height="16" rx="2" fill="currentColor"/>
                            <rect x="6" y="6" width="8" height="1" fill="white"/>
                            <rect x="6" y="8" width="6" height="1" fill="white"/>
                            <rect x="6" y="10" width="8" height="1" fill="white"/>
                          </svg>
                        </div>
                        <div className="benefit-text">
                          <strong>Pa aplikacion</strong>
                          <p>Funksionon në çdo telefon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                    // Always advance to next step in onboarding, regardless of API success
                    console.log('Advancing to next step');
                    nextStep();
                  }
                }}
                disabled={!tableCount || parseInt(tableCount) < 1 || saving}
              >
                {saving ? 'Duke ruajtur...' : 'Gjenero Kodrat QR →'}
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="onboarding-step">
            <h2>Gati për përdorim!</h2>
            <p>Restoranti juaj është gati për porositje dixhitale. Ja çfarë kemi konfiguruar:</p>
            
            <div className="setup-summary">
              <div className="summary-item">
                <div className="summary-icon">
                  •
                </div>
                <div>
                  <strong>{restaurantInfo.name}</strong>
                  <p>{restaurantInfo.address}</p>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">
                  •
                </div>
                <div>
                  <strong>4 Menu Categories</strong>
                  <p>Ready for your items</p>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">
                  •
                </div>
                <div>
                  <strong>{tableCount} Tables</strong>
                  <p>With QR codes generated</p>
                </div>
              </div>
            </div>

            <div className="next-steps">
              <h4>🚀 What's Next:</h4>
              <ol>
                <li>Add your menu items in Menu Management</li>
                <li>Print your table QR codes</li>
                <li>Start receiving orders!</li>
              </ol>
            </div>

            <button 
              className="complete-button" 
              onClick={async () => {
                setSaving(true);
                try {
                  // Mark menu items as completed (simplified for demo)
                  await onboardingApiService.updateOnboardingStep('menuItems', {
                    itemsCreated: 1,
                    note: 'Basic setup completed, can add more items later'
                  });
                  
                  // Complete the onboarding process
                  await onboardingApiService.completeOnboarding();
                  
                  console.log('Onboarding API calls completed successfully');
                } catch (err) {
                  console.error('Error with onboarding API calls:', err);
                  // Continue anyway - this is just demo onboarding
                  console.log('Continuing to dashboard despite API errors');
                } finally {
                  setSaving(false);
                  // Always call onComplete to navigate to dashboard
                  onComplete();
                }
              }}
              disabled={saving}
            >
              {saving ? 'Duke përfunduar konfigurimin...' : 'Shko te Dashboard →'}
            </button>
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
          <div className="progress-container">
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
        </div>

        <div className="onboarding-content">
          {renderStepContent()}
        </div>
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
        .progress-container {
          padding: 24px 32px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin: 16px 24px;
        }

        .progress-bar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Background Progress Line */
        .progress-line-background {
          position: absolute;
          top: 22px;
          left: 22px;
          right: 22px;
          height: 2px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 1px;
          z-index: 1;
        }

        .progress-line-fill {
          height: 100%;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 1px;
          transition: width 0.5s ease;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
        }

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
          .progress-container {
            padding: 16px 20px;
            margin: 12px 16px;
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

          .progress-line-background {
            top: 18px;
            left: 18px;
            right: 18px;
          }

          .onboarding-header {
            padding: 16px;
          }
        }

        /* Tablet responsive adjustments */
        @media (max-width: 1024px) and (min-width: 769px) {
          .progress-container {
            padding: 20px 28px;
            margin: 14px 20px;
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

          .progress-line-background {
            top: 20px;
            left: 20px;
            right: 20px;
          }
        }

        /* Extra small screens */
        @media (max-width: 480px) {
          .progress-container {
            padding: 12px 16px;
            margin: 8px 12px;
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

          .progress-line-background {
            top: 16px;
            left: 16px;
            right: 16px;
          }

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

        /* Professional Table Setup Layout */
        .step-header {
          margin-bottom: 32px;
        }

        .step-description {
          font-size: 16px;
          color: #6c757d;
          line-height: 1.5;
          margin: 8px 0 0 0;
        }

        .table-setup-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
        }

        .table-input-section {
          background: #f8f9fa;
          border-radius: 16px;
          padding: 32px;
          border: 1px solid #e9ecef;
        }

        .input-group-modern {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .input-label {
          font-weight: 600;
          font-size: 16px;
          color: #343a40;
          margin: 0;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .number-input-modern {
          width: 100%;
          padding: 16px 20px;
          font-size: 24px;
          font-weight: 600;
          border: 3px solid #e9ecef;
          border-radius: 12px;
          background: white;
          color: #495057;
          text-align: center;
          transition: all 0.2s ease;
        }

        .number-input-modern:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .input-suffix {
          position: absolute;
          right: 20px;
          font-size: 16px;
          color: #6c757d;
          font-weight: 500;
          pointer-events: none;
        }

        .input-hint {
          font-size: 14px;
          color: #6c757d;
          margin: 0;
        }

        .qr-preview-section {
          display: flex;
          flex-direction: column;
        }

        .qr-preview-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .qr-preview-header {
          margin-bottom: 24px;
        }

        .qr-preview-header h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #343a40;
        }

        .qr-demo-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .qr-code-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px dashed #dee2e6;
        }

        .qr-code-square {
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #e9ecef;
        }

        .qr-pattern {
          width: 60px;
          height: 60px;
          position: relative;
          background: white;
        }

        .qr-corner {
          position: absolute;
          width: 16px;
          height: 16px;
          border: 3px solid #212529;
        }

        .qr-corner-tl {
          top: 2px;
          left: 2px;
          border-right: none;
          border-bottom: none;
        }

        .qr-corner-tr {
          top: 2px;
          right: 2px;
          border-left: none;
          border-bottom: none;
        }

        .qr-corner-bl {
          bottom: 2px;
          left: 2px;
          border-right: none;
          border-top: none;
        }

        .qr-dots {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .qr-dots span {
          width: 3px;
          height: 3px;
          background: #212529;
          border-radius: 1px;
        }

        .table-label {
          font-size: 14px;
          font-weight: 600;
          color: #495057;
        }

        .qr-benefits {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .benefit-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #e3f2fd;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1976d2;
          flex-shrink: 0;
        }

        .benefit-icon svg {
          width: 20px;
          height: 20px;
        }

        .benefit-text {
          flex: 1;
        }

        .benefit-text strong {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #343a40;
          margin-bottom: 4px;
        }

        .benefit-text p {
          margin: 0;
          font-size: 13px;
          color: #6c757d;
          line-height: 1.4;
        }

        /* Responsive adjustments for table setup */
        @media (max-width: 1024px) {
          .table-setup-container {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .table-input-section,
          .qr-preview-card {
            padding: 24px;
          }
        }

        @media (max-width: 768px) {
          .table-setup-container {
            gap: 20px;
          }

          .table-input-section,
          .qr-preview-card {
            padding: 20px;
          }

          .number-input-modern {
            font-size: 20px;
            padding: 14px 16px;
          }

          .qr-demo-layout {
            gap: 20px;
          }

          .benefit-item {
            gap: 10px;
          }

          .benefit-icon {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingWizard;