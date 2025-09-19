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
              <h4>Këshilla:</h4>
              <ul>
                <li>Përdorni përkthimin automatik për të krijuar versionet në anglisht</li>
                <li>Ngarkoni foto tërheqëse për të rritur porosinë</li>
                <li>Shtoni 3-5 artikuj të popullarë për të filluar</li>
              </ul>
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
            <h2>Konfigurimi i Tavolinave</h2>
            <p>Sa tavolina ka restoranti juaj?</p>
            
            <div className="form-group">
              <label>Numri i Tavolinave *</label>
              <input
                type="number"
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value)}
                placeholder="p.sh., 12"
                min="1"
                max="100"
              />
            </div>

            <div className="qr-preview">
              <h4>Do të gjenerojmë kodra QR për çdo tavolinë:</h4>
              <div className="qr-sample">
                <div className="qr-code-placeholder">
                  <div className="qr-icon"></div>
                  <p>Kodi QR</p>
                  <small>Tavolinë 1</small>
                </div>
                <div className="qr-explanation">
                  <p>Klientët skanojnë këtë për të:</p>
                  <ul>
                    <li>Parë menunë tuaj menjëherë</li>
                    <li>Bërë porosi drejtpërdrejt</li>
                    <li>Pa nevojë për aplikacion!</li>
                  </ul>
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
                  
                  // Call the completion callback
                  onComplete();
                } catch (err) {
                  console.error('Error completing onboarding:', err);
                  setError('Dështoi plotësimi i konfigurimit. Ju lutemi provoni përsëri.');
                } finally {
                  setSaving(false);
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
          <div className="step-progress">
            <div className="progress-line">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>
            {steps.map((step) => (
              <div key={step.id} className={`step ${currentStep >= step.id ? 'active' : ''}`}>
                <div className="step-number">
                  {step.id}
                </div>
                <div className="step-title">{step.title}</div>
              </div>
            ))}
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

        .step-progress {
          position: relative;
          display: flex;
          justify-content: space-between;
          gap: 8px;
          overflow-x: auto;
          padding: 0 8px;
        }

        .progress-line {
          position: absolute;
          top: 20px;
          left: 28px;
          right: 28px;
          height: 2px;
          background: rgba(255, 255, 255, 0.3);
          z-index: 1;
        }

        .progress-fill {
          height: 100%;
          background: white;
          transition: width 0.4s ease;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          min-width: 60px;
          opacity: 0.5;
          transition: all 0.3s;
          flex: 1;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .step.active {
          opacity: 1;
          transform: scale(1.05);
        }

        .step-number {
          font-size: 16px;
          font-weight: 600;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .step.active .step-number {
          background: white;
          color: #6366f1;
          border-color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .step-title {
          font-weight: 600;
          font-size: 12px;
          white-space: nowrap;
        }

        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .step {
            min-width: 50px;
            gap: 4px;
          }

          .step-number {
            width: 28px;
            height: 28px;
            font-size: 14px;
          }

          .step-title {
            font-size: 10px;
          }

          .progress-line {
            top: 16px;
            left: 25px;
            right: 25px;
          }

          .onboarding-header {
            padding: 16px;
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
      `}</style>
    </div>
  );
};

export default OnboardingWizard;