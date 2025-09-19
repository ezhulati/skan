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

  // Load onboarding status on mount
  useEffect(() => {
    const loadOnboardingStatus = async () => {
      try {
        if (auth.token) {
          onboardingApiService.setToken(auth.token);
          const response = await onboardingApiService.getOnboardingStatus();
          
          // Resume from the current step
          setCurrentStep(response.onboarding.currentStep);
          
          // Load existing data if available
          if (response.onboarding.steps.venueSetup.data) {
            const venueData = response.onboarding.steps.venueSetup.data;
            setRestaurantInfo({
              name: venueData.venueName || '',
              address: venueData.address || '',
              phone: venueData.phone || '',
              cuisineType: venueData.cuisineType || '',
              description: venueData.description || ''
            });
          }
          
          if (response.onboarding.steps.tableSetup.data) {
            setTableCount(response.onboarding.steps.tableSetup.data.tableCount || '');
          }
        }
      } catch (err) {
        console.error('Error loading onboarding status:', err);
        setError('Failed to load onboarding progress');
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingStatus();
  }, [auth.token]);

  const steps = [
    { id: 1, title: 'Restaurant Information', desc: 'Tell us about your restaurant' },
    { id: 2, title: 'Menu Categories', desc: 'Set up your menu structure' },
    { id: 3, title: 'Sample Menu Items', desc: 'Add your first menu items' },
    { id: 4, title: 'Table Setup', desc: 'Configure your tables and QR codes' },
    { id: 5, title: 'Ready to Go!', desc: 'Test your setup and go live' }
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
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
      // Update profile completion step with user's full name
      await onboardingApiService.updateOnboardingStep('profileComplete', {
        fullName: auth.user?.fullName || '',
        email: auth.user?.email || ''
      });
      
      // Update venue setup step with restaurant info
      await onboardingApiService.updateOnboardingStep('venueSetup', {
        venueName: restaurantInfo.name,
        address: restaurantInfo.address,
        phone: restaurantInfo.phone,
        description: restaurantInfo.description,
        cuisineType: restaurantInfo.cuisineType
      });
      
      // Auto-complete menu categories step (default categories)
      await onboardingApiService.updateOnboardingStep('menuCategories', {
        categoriesCreated: 4,
        categories: ['Appetizers & Salads', 'Main Courses', 'Desserts', 'Beverages']
      });
      
      nextStep();
    } catch (err) {
      console.error('Error saving restaurant info:', err);
      setError('Failed to save restaurant information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="onboarding-step">
            <h2>🏪 Welcome to SKAN.AL!</h2>
            <p>Let's set up your restaurant for digital ordering. This will only take a few minutes.</p>
            
            <div className="form-group">
              <label>Restaurant Name *</label>
              <input
                type="text"
                value={restaurantInfo.name}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, name: e.target.value})}
                placeholder="e.g., Taverna Durrësi"
              />
            </div>

            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                value={restaurantInfo.address}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, address: e.target.value})}
                placeholder="e.g., Rruga Taulantia, Durrës"
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={restaurantInfo.phone}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, phone: e.target.value})}
                placeholder="e.g., +355 69 123 4567"
              />
            </div>

            <div className="form-group">
              <label>Cuisine Type *</label>
              <select
                value={restaurantInfo.cuisineType}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, cuisineType: e.target.value})}
              >
                <option value="">Select cuisine type...</option>
                <option value="traditional">Traditional Albanian</option>
                <option value="mediterranean">Mediterranean</option>
                <option value="italian">Italian</option>
                <option value="seafood">Seafood</option>
                <option value="international">International</option>
                <option value="cafe">Café/Bar</option>
              </select>
            </div>

            <div className="form-group">
              <label>Short Description</label>
              <textarea
                value={restaurantInfo.description}
                onChange={(e) => setRestaurantInfo({...restaurantInfo, description: e.target.value})}
                placeholder="Describe your restaurant in a few words..."
                rows={3}
              />
            </div>

            {error && (
              <div className="error-message" style={{ color: '#dc3545', marginBottom: '16px', padding: '8px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
                {error}
              </div>
            )}
            
            <button 
              className="next-button"
              onClick={handleRestaurantInfoSubmit}
              disabled={!restaurantInfo.name || !restaurantInfo.address || !restaurantInfo.phone || !restaurantInfo.cuisineType || saving}
            >
              {saving ? 'Saving...' : 'Continue to Menu Setup →'}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="onboarding-step">
            <h2>📋 Menu Categories</h2>
            <p>We'll create these basic categories for your menu. You can customize them later.</p>
            
            <div className="category-preview">
              <div className="category-item">
                <span className="category-icon">🥗</span>
                <span>Appetizers & Salads</span>
              </div>
              <div className="category-item">
                <span className="category-icon">🍽️</span>
                <span>Main Courses</span>
              </div>
              <div className="category-item">
                <span className="category-icon">🍰</span>
                <span>Desserts</span>
              </div>
              <div className="category-item">
                <span className="category-icon">🥤</span>
                <span>Beverages</span>
              </div>
            </div>

            <p><strong>Perfect for {restaurantInfo.cuisineType} cuisine!</strong></p>

            <div className="step-actions">
              <button className="prev-button" onClick={prevStep}>← Back</button>
              <button className="next-button" onClick={nextStep}>
                Create Categories →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="onboarding-step">
            <h2>🍕 Add Your First Menu Items</h2>
            <p>Let's add a few items to get you started. You can add more later!</p>
            
            <div className="sample-item-form">
              <h4>Add a popular dish:</h4>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Item name in Albanian"
                  style={{ flex: 1, marginRight: '8px' }}
                />
                <input
                  type="text"
                  placeholder="Price (€)"
                  style={{ width: '100px' }}
                />
              </div>
              <button className="add-item-button">+ Add Item</button>
            </div>

            <div className="onboarding-tips">
              <h4>💡 Pro Tips:</h4>
              <ul>
                <li>Use our AI translation to automatically create English versions</li>
                <li>Upload appetizing photos to increase orders</li>
                <li>Add 3-5 popular items to start</li>
              </ul>
            </div>

            <div className="step-actions">
              <button className="prev-button" onClick={prevStep}>← Back</button>
              <button className="next-button" onClick={nextStep}>
                Continue to Tables →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="onboarding-step">
            <h2>🪑 Table Setup</h2>
            <p>How many tables does your restaurant have?</p>
            
            <div className="form-group">
              <label>Number of Tables *</label>
              <input
                type="number"
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value)}
                placeholder="e.g., 12"
                min="1"
                max="100"
              />
            </div>

            <div className="qr-preview">
              <h4>We'll generate QR codes for each table:</h4>
              <div className="qr-sample">
                <div className="qr-code-placeholder">
                  <span>📱</span>
                  <p>QR Code</p>
                  <small>Table 1</small>
                </div>
                <div className="qr-explanation">
                  <p>Customers scan this to:</p>
                  <ul>
                    <li>See your menu instantly</li>
                    <li>Place orders directly</li>
                    <li>No app download needed!</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button className="prev-button" onClick={prevStep}>← Back</button>
              <button 
                className="next-button" 
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onboardingApiService.updateOnboardingStep('tableSetup', {
                      tableCount: parseInt(tableCount)
                    });
                    nextStep();
                  } catch (err) {
                    setError('Failed to save table setup');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={!tableCount || parseInt(tableCount) < 1 || saving}
              >
                {saving ? 'Saving...' : 'Generate QR Codes →'}
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="onboarding-step">
            <h2>🎉 You're All Set!</h2>
            <p>Your restaurant is ready for digital ordering. Here's what we've set up:</p>
            
            <div className="setup-summary">
              <div className="summary-item">
                <span className="summary-icon">🏪</span>
                <div>
                  <strong>{restaurantInfo.name}</strong>
                  <p>{restaurantInfo.address}</p>
                </div>
              </div>
              <div className="summary-item">
                <span className="summary-icon">📋</span>
                <div>
                  <strong>4 Menu Categories</strong>
                  <p>Ready for your items</p>
                </div>
              </div>
              <div className="summary-item">
                <span className="summary-icon">🪑</span>
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
                  setError('Failed to complete onboarding. Please try again.');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? 'Completing Setup...' : 'Go to Dashboard →'}
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
            {steps.map((step) => (
              <div key={step.id} className={`step ${currentStep >= step.id ? 'active' : ''}`}>
                <div className="step-number">{step.id}</div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  <div className="step-desc">{step.desc}</div>
                </div>
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
          display: flex;
          gap: 16px;
          overflow-x: auto;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 140px;
          opacity: 0.6;
          transition: opacity 0.3s;
        }

        .step.active {
          opacity: 1;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .step.active .step-number {
          background: white;
          color: #667eea;
        }

        .step-title {
          font-weight: 600;
          font-size: 14px;
        }

        .step-desc {
          font-size: 12px;
          opacity: 0.8;
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
      `}</style>
    </div>
  );
};

export default OnboardingWizard;