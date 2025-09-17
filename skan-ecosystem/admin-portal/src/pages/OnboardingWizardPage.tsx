import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface VenueSetup {
  hasMenuItems: boolean;
  hasCustomCategories: boolean;
  hasStaffMembers: boolean;
  hasConfiguredTables: boolean;
  onboardingCompleted: boolean;
}

const OnboardingWizardPage: React.FC = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [venueSetup, setVenueSetup] = useState<VenueSetup>({
    hasMenuItems: false,
    hasCustomCategories: false,
    hasStaffMembers: false,
    hasConfiguredTables: false,
    onboardingCompleted: false
  });

  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: 'welcome',
      title: 'Welcome to Skan.al!',
      description: 'Let\'s get your restaurant ready to accept orders',
      completed: true
    },
    {
      id: 'menu',
      title: 'Set Up Your Menu',
      description: 'Add your dishes, drinks, and pricing',
      completed: venueSetup.hasMenuItems
    },
    {
      id: 'tables',
      title: 'Configure Your Tables',
      description: 'Customize table names and generate QR codes',
      completed: venueSetup.hasConfiguredTables
    },
    {
      id: 'staff',
      title: 'Invite Your Team',
      description: 'Add staff members to help manage orders',
      completed: venueSetup.hasStaffMembers
    },
    {
      id: 'complete',
      title: 'You\'re Ready!',
      description: 'Start accepting orders from customers',
      completed: venueSetup.onboardingCompleted
    }
  ], [venueSetup]);

  const fetchVenueSetup = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://api-mkazmlu7ta-ew.a.run.app/v1/venue/setup-status`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVenueSetup(data.setup);
        
        // Find the first incomplete step
        const incompleteStepIndex = steps.findIndex(step => !step.completed);
        setCurrentStep(incompleteStepIndex >= 0 ? incompleteStepIndex : steps.length - 1);
      }
    } catch (error) {
      console.error('Error fetching venue setup:', error);
    } finally {
      setLoading(false);
    }
  }, [auth.token, steps]);

  const completeOnboarding = async () => {
    try {
      const response = await fetch(`https://api-mkazmlu7ta-ew.a.run.app/v1/venue/complete-onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Scroll to top immediately before navigation
        window.scrollTo({ top: 0, left: 0 });
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const skipOnboarding = () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to skip the setup wizard? You can always return to complete it later.')) {
      // Scroll to top immediately before navigation
      window.scrollTo({ top: 0, left: 0 });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    fetchVenueSetup();
  }, [fetchVenueSetup]);

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="spinner"></div>
        <p>Loading your setup progress...</p>
      </div>
    );
  }

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="onboarding-wizard">
      <div className="onboarding-header">
        <div className="venue-info">
          <h1>Welcome to {auth.venue?.name}!</h1>
          <p>Let's get your restaurant ready to accept orders</p>
        </div>
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="progress-text">{completedSteps}/{steps.length} steps completed</span>
        </div>
      </div>

      <div className="onboarding-content">
        <div className="steps-overview">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`step-item ${index === currentStep ? 'active' : ''} ${step.completed ? 'completed' : ''}`}
              onClick={() => setCurrentStep(index)}
            >
              <div className="step-number">
                {step.completed ? '✓' : index + 1}
              </div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="current-step-detail">
          {currentStep === 0 && (
            <div className="welcome-step">
              <div className="welcome-icon">🎉</div>
              <h2>Welcome to Skan.al!</h2>
              <p>
                Your restaurant account has been created successfully. Now let's set up everything 
                you need to start accepting QR code orders from your customers.
              </p>
              <div className="venue-details">
                <div className="detail-item">
                  <strong>Restaurant:</strong> {auth.venue?.name}
                </div>
                <div className="detail-item">
                  <strong>QR Code URL:</strong> https://order.skan.al/{auth.venue?.slug}
                </div>
                <div className="detail-item">
                  <strong>Tables Created:</strong> 5 default tables
                </div>
              </div>
              <div className="step-actions">
                <button 
                  className="btn-primary"
                  onClick={() => setCurrentStep(1)}
                >
                  Let's Get Started
                </button>
                <button 
                  className="btn-secondary"
                  onClick={skipOnboarding}
                >
                  Skip for Now
                </button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="menu-step">
              <h2>🍽️ Set Up Your Menu</h2>
              <p>
                Add your dishes, drinks, and pricing. Customers will browse your menu 
                before placing orders.
              </p>
              <div className="step-preview">
                <div className="preview-item">
                  <div className="preview-icon">📂</div>
                  <div>
                    <strong>Menu Categories</strong>
                    <p>Organize your items (Appetizers, Main Courses, Desserts, Drinks)</p>
                  </div>
                </div>
                <div className="preview-item">
                  <div className="preview-icon">🍕</div>
                  <div>
                    <strong>Menu Items</strong>
                    <p>Add dishes with photos, descriptions, and prices</p>
                  </div>
                </div>
                <div className="preview-item">
                  <div className="preview-icon">⚡</div>
                  <div>
                    <strong>Quick Options</strong>
                    <p>Mark items as popular, vegetarian, or spicy</p>
                  </div>
                </div>
              </div>
              <div className="step-actions">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    // Scroll to top immediately before navigation
                    window.scrollTo({ top: 0, left: 0 });
                    document.body.scrollTop = 0;
                    document.documentElement.scrollTop = 0;
                    navigate('/menu');
                  }}
                >
                  Set Up Menu
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setCurrentStep(2)}
                >
                  Skip This Step
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="tables-step">
              <h2>🏷️ Configure Your Tables</h2>
              <p>
                Customize your table names and generate QR codes for each table. 
                Customers will scan these to place orders.
              </p>
              <div className="step-preview">
                <div className="preview-item">
                  <div className="preview-icon">🏷️</div>
                  <div>
                    <strong>Table Names</strong>
                    <p>Customize table names (Table 1, Terrace A, Window Booth, etc.)</p>
                  </div>
                </div>
                <div className="preview-item">
                  <div className="preview-icon">📱</div>
                  <div>
                    <strong>QR Codes</strong>
                    <p>Generate and print QR codes for each table</p>
                  </div>
                </div>
                <div className="preview-item">
                  <div className="preview-icon">🎯</div>
                  <div>
                    <strong>Table Status</strong>
                    <p>Enable/disable tables and track their status</p>
                  </div>
                </div>
              </div>
              <div className="step-actions">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    // Scroll to top immediately before navigation
                    window.scrollTo({ top: 0, left: 0 });
                    document.body.scrollTop = 0;
                    document.documentElement.scrollTop = 0;
                    navigate('/qr-codes');
                  }}
                >
                  Configure Tables
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setCurrentStep(3)}
                >
                  Skip This Step
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="staff-step">
              <h2>👥 Invite Your Team</h2>
              <p>
                Add staff members to help manage orders, update the menu, 
                and handle customer service.
              </p>
              <div className="step-preview">
                <div className="preview-item">
                  <div className="preview-icon">👨‍💼</div>
                  <div>
                    <strong>Managers</strong>
                    <p>Can manage menu, staff, and all restaurant operations</p>
                  </div>
                </div>
                <div className="preview-item">
                  <div className="preview-icon">👨‍🍳</div>
                  <div>
                    <strong>Staff</strong>
                    <p>Can view and manage orders, update order status</p>
                  </div>
                </div>
                <div className="preview-item">
                  <div className="preview-icon">📧</div>
                  <div>
                    <strong>Email Invites</strong>
                    <p>Send invitation emails with secure access tokens</p>
                  </div>
                </div>
              </div>
              <div className="step-actions">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    // Scroll to top immediately before navigation
                    window.scrollTo({ top: 0, left: 0 });
                    document.body.scrollTop = 0;
                    document.documentElement.scrollTop = 0;
                    navigate('/users');
                  }}
                >
                  Invite Team
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setCurrentStep(4)}
                >
                  Skip This Step
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="complete-step">
              <div className="success-icon">🚀</div>
              <h2>You're Ready to Go!</h2>
              <p>
                Congratulations! Your restaurant is now set up and ready to accept orders. 
                Customers can scan your QR codes to browse your menu and place orders.
              </p>
              <div className="next-steps">
                <h3>What happens next?</h3>
                <ul>
                  <li>Customers scan QR codes at tables</li>
                  <li>They browse your menu and place orders</li>
                  <li>Orders appear in your dashboard in real-time</li>
                  <li>You can track and manage all orders</li>
                </ul>
              </div>
              <div className="step-actions">
                <button 
                  className="btn-primary"
                  onClick={completeOnboarding}
                >
                  Go to Dashboard
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    // Scroll to top immediately before navigation
                    window.scrollTo({ top: 0, left: 0 });
                    document.body.scrollTop = 0;
                    document.documentElement.scrollTop = 0;
                    navigate('/qr-codes');
                  }}
                >
                  Print QR Codes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .onboarding-wizard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .onboarding-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          color: white;
        }

        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .onboarding-header {
          max-width: 1200px;
          margin: 0 auto 30px;
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .venue-info h1 {
          margin: 0 0 10px 0;
          color: #2c3e50;
          font-size: 28px;
          font-weight: 700;
        }

        .venue-info p {
          margin: 0;
          color: #7f8c8d;
          font-size: 16px;
        }

        .progress-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        .progress-bar {
          width: 200px;
          height: 8px;
          background: #e0e6ed;
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #27ae60, #2ecc71);
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 14px;
          color: #7f8c8d;
          font-weight: 500;
        }

        .onboarding-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 30px;
        }

        .steps-overview {
          background: white;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          height: fit-content;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 10px;
        }

        .step-item:hover {
          background: #f8f9fa;
        }

        .step-item.active {
          background: #e3f2fd;
          border: 2px solid #2196f3;
        }

        .step-item.completed {
          background: #e8f5e8;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          background: #e0e6ed;
          color: #7f8c8d;
        }

        .step-item.active .step-number {
          background: #2196f3;
          color: white;
        }

        .step-item.completed .step-number {
          background: #27ae60;
          color: white;
        }

        .step-content h3 {
          margin: 0 0 5px 0;
          font-size: 16px;
          color: #2c3e50;
        }

        .step-content p {
          margin: 0;
          font-size: 14px;
          color: #7f8c8d;
        }

        .current-step-detail {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .welcome-step,
        .menu-step,
        .tables-step,
        .staff-step,
        .complete-step {
          text-align: center;
        }

        .welcome-icon,
        .success-icon {
          font-size: 60px;
          margin-bottom: 20px;
          display: block;
        }

        .current-step-detail h2 {
          color: #2c3e50;
          font-size: 28px;
          margin-bottom: 15px;
          font-weight: 700;
        }

        .current-step-detail p {
          color: #7f8c8d;
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 30px;
        }

        .venue-details {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin: 30px 0;
          text-align: left;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e9ecef;
        }

        .detail-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .step-preview {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin: 30px 0;
          text-align: left;
        }

        .preview-item {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .preview-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .preview-item strong {
          display: block;
          color: #2c3e50;
          margin-bottom: 5px;
          font-size: 16px;
        }

        .preview-item p {
          margin: 0;
          color: #7f8c8d;
          font-size: 14px;
        }

        .next-steps {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin: 30px 0;
          text-align: left;
        }

        .next-steps h3 {
          color: #2c3e50;
          margin-bottom: 15px;
        }

        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }

        .next-steps li {
          color: #555;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .step-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 40px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(52, 152, 219, 0.4);
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: #7f8c8d;
        }

        @media (max-width: 768px) {
          .onboarding-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .onboarding-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .step-actions {
            flex-direction: column;
          }

          .current-step-detail {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingWizardPage;