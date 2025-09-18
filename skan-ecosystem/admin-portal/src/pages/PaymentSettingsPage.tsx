import React, { useState, useEffect } from 'react';

interface PaymentSettings {
  stripeConnectEnabled: boolean;
  stripeAccountId?: string;
  subscriptionTier: 'free' | 'paid';
  monthlyRevenue: number;
  transactionFees: number;
  totalOrders: number;
}

const PaymentSettingsPage: React.FC = () => {
  // Note: useAuth will be used for venue-specific API calls in production
  const [settings, setSettings] = useState<PaymentSettings>({
    stripeConnectEnabled: false,
    subscriptionTier: 'paid',
    monthlyRevenue: 0,
    transactionFees: 0,
    totalOrders: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load current payment settings
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    try {
      // Mock data for demo - in production, this would call the API
      setSettings({
        stripeConnectEnabled: false,
        subscriptionTier: 'paid',
        monthlyRevenue: 2480,
        transactionFees: 72,
        totalOrders: 156
      });
    } catch (error) {
      setError('Dështoi të ngarkohen cilësimet e pagesës');
    }
  };

  const handleToggleStripe = async () => {
    setIsLoading(true);
    try {
      const newSubscriptionTier: 'free' | 'paid' = !settings.stripeConnectEnabled ? 'free' : 'paid';
      const newSettings: PaymentSettings = {
        ...settings,
        stripeConnectEnabled: !settings.stripeConnectEnabled,
        subscriptionTier: newSubscriptionTier
      };
      
      // Mock API call - in production, this would save to Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings(newSettings);
      setSuccessMessage('Cilësimet e pagesës u përditësuan me sukses!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Dështoi të përditësohen cilësimet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeConnect = () => {
    // Demo mode - show success message instead of real Stripe Connect
    alert('🎉 Demo Mode: Stripe Connect u lidh me sukses!\n\nNë versionin real, kjo do të ju drejtojë në platformën Stripe për të lidhur llogarinë tuaj.');
    
    // Simulate successful connection in demo mode
    setSettings(prev => ({
      ...prev,
      stripeAccountId: 'acct_demo_stripe_account'
    }));
    setSuccessMessage('Llogaria Stripe u lidh me sukses në demo mode!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const calculateMonthlySavings = () => {
    const avgOrderValue = settings.monthlyRevenue / settings.totalOrders || 25;
    const monthlyStripeFees = settings.totalOrders * avgOrderValue * 0.029;
    const subscriptionCost = 35;
    return Math.max(0, monthlyStripeFees - subscriptionCost);
  };

  return (
    <div className="payment-settings-page">
      <div className="page-header">
        <h1>Cilësimet e Pagesës</h1>
        <p>Menaxhoni metodat e pagesës dhe planin tuaj të abonimit</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {successMessage}
        </div>
      )}

      {/* Current Plan Overview */}
      <div className="plan-overview">
        <div className="plan-card current-plan">
          <div className="plan-header">
            <div className="plan-icon">
              {settings.subscriptionTier === 'free' ? '💳' : '💵'}
            </div>
            <div>
              <h3>Plani Aktual</h3>
              <p className="plan-name">
                {settings.subscriptionTier === 'free' ? 'FALAS me Stripe Connect' : 'PAGUAR - Vetëm Kesh'}
              </p>
            </div>
          </div>
          <div className="plan-cost">
            {settings.subscriptionTier === 'free' ? (
              <div>
                <span className="cost-amount">2.9%</span>
                <span className="cost-period">për transaksion</span>
              </div>
            ) : (
              <div>
                <span className="cost-amount">€35</span>
                <span className="cost-period">në muaj</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Methods Configuration */}
      <div className="settings-section">
        <h2>Metodat e Pagesës</h2>
        
        <div className="payment-method-card">
          <div className="method-header">
            <div className="method-icon cash-icon">💵</div>
            <div className="method-info">
              <h3>Pagesa me Para në Dorë</h3>
              <p>Klientët paguajnë kur u shërbehet porosia</p>
            </div>
            <div className="method-status enabled">
              <span className="status-dot"></span>
              E Aktivizuar
            </div>
          </div>
        </div>

        <div className="payment-method-card">
          <div className="method-header">
            <div className="method-icon stripe-icon">💳</div>
            <div className="method-info">
              <h3>Pagesa me Kartë (Stripe Connect)</h3>
              <p>Pagesa të sigurta dhe të menjëhershme me kartë</p>
            </div>
            <div className="method-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.stripeConnectEnabled}
                  onChange={handleToggleStripe}
                  disabled={isLoading}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          {settings.stripeConnectEnabled && !settings.stripeAccountId && (
            <div className="stripe-connect-section">
              <div className="connect-prompt">
                <p>Për të aktivizuar pagesat me kartë, lidhuni me Stripe Connect:</p>
                <button 
                  className="stripe-connect-btn"
                  onClick={handleStripeConnect}
                >
                  <span className="stripe-logo">stripe</span>
                  Lidhu me Stripe
                </button>
              </div>
            </div>
          )}

          {settings.stripeConnectEnabled && settings.stripeAccountId && (
            <div className="stripe-connected">
              <div className="connected-status">
                <svg className="check-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Llogaria Stripe e lidhur me sukses
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="settings-section">
        <h2>Analitika e të Ardhurave</h2>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-icon">📊</div>
            <div className="analytics-content">
              <h3>Të Ardhurat Mujore</h3>
              <p className="analytics-value">€{settings.monthlyRevenue.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="analytics-card">
            <div className="analytics-icon">💳</div>
            <div className="analytics-content">
              <h3>Tarifat e Transaksioneve</h3>
              <p className="analytics-value">€{settings.transactionFees}</p>
            </div>
          </div>
          
          <div className="analytics-card">
            <div className="analytics-icon">📦</div>
            <div className="analytics-content">
              <h3>Porosite Totale</h3>
              <p className="analytics-value">{settings.totalOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Comparison */}
      <div className="settings-section">
        <h2>Krahasimi i Kostos</h2>
        <div className="cost-comparison">
          <div className="comparison-card">
            <h3>Plan FALAS (Stripe Connect)</h3>
            <div className="cost-breakdown">
              <div className="cost-item">
                <span>Abonimi Mujor</span>
                <span className="cost-free">€0</span>
              </div>
              <div className="cost-item">
                <span>Tarifat e Transaksioneve (2.9%)</span>
                <span>€{Math.round(settings.monthlyRevenue * 0.029)}</span>
              </div>
              <div className="cost-total">
                <span>Totali Mujor</span>
                <span>€{Math.round(settings.monthlyRevenue * 0.029)}</span>
              </div>
            </div>
          </div>

          <div className="comparison-card">
            <h3>Plan PAGUAR (Kesh)</h3>
            <div className="cost-breakdown">
              <div className="cost-item">
                <span>Abonimi Mujor</span>
                <span>€35</span>
              </div>
              <div className="cost-item">
                <span>Tarifat e Transaksioneve</span>
                <span className="cost-free">€0</span>
              </div>
              <div className="cost-total">
                <span>Totali Mujor</span>
                <span>€35</span>
              </div>
            </div>
          </div>
        </div>

        {calculateMonthlySavings() > 0 && (
          <div className="savings-highlight">
            <svg className="savings-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v20m8-18H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <h4>Rekomandim: Kaloni në planin PAGUAR</h4>
              <p>Mund të kurseni €{Math.round(calculateMonthlySavings())} në muaj duke kaluar në planin cash-only</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .payment-settings-page {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 8px 0;
        }

        .page-header p {
          font-size: 16px;
          color: #718096;
          margin: 0;
        }

        .alert {
          display: flex;
          align-items: center;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-weight: 500;
        }

        .alert-error {
          background: #fed7d7;
          color: #c53030;
          border: 1px solid #feb2b2;
        }

        .alert-success {
          background: #c6f6d5;
          color: #25543e;
          border: 1px solid #9ae6b4;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .plan-overview {
          margin-bottom: 40px;
        }

        .plan-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }

        .plan-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .plan-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .plan-header h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .plan-name {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .plan-cost {
          text-align: right;
        }

        .cost-amount {
          display: block;
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
        }

        .cost-period {
          font-size: 14px;
          opacity: 0.9;
        }

        .settings-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }

        .settings-section h2 {
          margin: 0 0 24px 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a202c;
        }

        .payment-method-card {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.3s ease;
        }

        .payment-method-card:hover {
          border-color: #cbd5e0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .method-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .method-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .cash-icon {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        }

        .stripe-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .method-info {
          flex: 1;
        }

        .method-info h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .method-info p {
          margin: 0;
          color: #718096;
          font-size: 14px;
        }

        .method-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .method-status.enabled {
          color: #38a169;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #38a169;
          border-radius: 50%;
        }

        .method-toggle {
          display: flex;
          align-items: center;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 34px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: #667eea;
        }

        input:checked + .toggle-slider:before {
          transform: translateX(26px);
        }

        .stripe-connect-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .connect-prompt p {
          margin: 0 0 16px 0;
          color: #4a5568;
        }

        .stripe-connect-btn {
          background: #635bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stripe-connect-btn:hover {
          background: #5a54d9;
          transform: translateY(-1px);
        }

        .stripe-logo {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .stripe-connected {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .connected-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #38a169;
          font-weight: 500;
        }

        .check-icon {
          width: 20px;
          height: 20px;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .analytics-card {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .analytics-icon {
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .analytics-content h3 {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #718096;
          font-weight: 500;
        }

        .analytics-value {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #1a202c;
        }

        .cost-comparison {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .comparison-card {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
        }

        .comparison-card h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .cost-breakdown {
          space-y: 12px;
        }

        .cost-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }

        .cost-item:last-of-type {
          border-bottom: none;
        }

        .cost-free {
          color: #38a169;
          font-weight: 600;
        }

        .cost-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0 0 0;
          border-top: 2px solid #e2e8f0;
          font-weight: 600;
          font-size: 16px;
          color: #1a202c;
        }

        .savings-highlight {
          display: flex;
          align-items: center;
          gap: 16px;
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin-top: 24px;
        }

        .savings-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
        }

        .savings-highlight h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .savings-highlight p {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .payment-settings-page {
            padding: 16px;
          }

          .plan-card {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .cost-comparison {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentSettingsPage;