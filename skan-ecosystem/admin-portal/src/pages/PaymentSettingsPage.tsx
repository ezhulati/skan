import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionData {
  id: string;
  status: string;
  planId: string;
  createdAt: any;
  activatedAt?: any;
  cancelledAt?: any;
}

interface PaymentData {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paymentDate: any;
}

interface SubscriptionInfo {
  hasActiveSubscription: boolean;
  subscription?: SubscriptionData;
  recentPayments?: PaymentData[];
}

const PaymentSettingsPage: React.FC = () => {
  const { auth } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({ hasActiveSubscription: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const API_BASE_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 'https://api-mkazmlu7ta-ew.a.run.app/v1';

  const loadSubscriptionInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/venue/${auth.user?.venueId}/subscription`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data);
      } else {
        throw new Error('Failed to load subscription info');
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setError('Dështoi të ngarkohen informacionet e abonimit');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, auth.user?.venueId, auth.token]);

  useEffect(() => {
    if (auth.user?.venueId) {
      loadSubscriptionInfo();
    }
  }, [auth.user?.venueId, loadSubscriptionInfo]);

  const createSubscription = async () => {
    setIsCreatingSubscription(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/payments/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-cancelled`
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.approvalUrl) {
          // Redirect to PayPal for approval
          window.location.href = data.approvalUrl;
        } else {
          setSuccessMessage('Abonimi u krijua me sukses!');
          loadSubscriptionInfo();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError('Dështoi të krijohet abonimi. Ju lutemi provoni përsëri.');
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const cancelSubscription = async () => {
    if (!subscriptionInfo.subscription?.id) return;
    
    const confirmed = window.confirm('Jeni të sigurt që doni të anuloni abonimin? Kjo veprim nuk mund të zhbëhet.');
    if (!confirmed) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/payments/subscriptions/${subscriptionInfo.subscription.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'User requested cancellation'
        })
      });

      if (response.ok) {
        setSuccessMessage('Abonimi u anulua me sukses');
        loadSubscriptionInfo();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setError('Dështoi të anulohet abonimi. Ju lutemi provoni përsëri.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#38a169';
      case 'cancelled': return '#e53e3e';
      case 'payment_failed': return '#d69e2e';
      default: return '#718096';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'Aktiv';
      case 'cancelled': return 'I anuluar';
      case 'payment_failed': return 'Pagesa dështoi';
      case 'approval_pending': return 'Në pritje të miratimit';
      default: return status;
    }
  };

  return (
    <div className="payment-settings-page">
      <div className="page-header">
        <h1>Abonimi & Pagesat</h1>
        <p>Menaxhoni abonimin tuaj PayPal dhe historikun e pagesave</p>
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

      {/* Subscription Status */}
      <div className="subscription-overview">
        {subscriptionInfo.hasActiveSubscription ? (
          <div className="subscription-card active">
            <div className="subscription-header">
              <div className="subscription-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="subscription-info">
                <h2>Abonimi Aktiv</h2>
                <p>SKAN.AL Monthly Subscription</p>
              </div>
              <div className="subscription-status" style={{ color: getStatusColor(subscriptionInfo.subscription?.status || '') }}>
                {getStatusText(subscriptionInfo.subscription?.status || '')}
              </div>
            </div>
            
            <div className="subscription-details">
              <div className="detail-item">
                <span className="detail-label">Çmimi Mujor</span>
                <span className="detail-value">€35.00</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Data e krijimit</span>
                <span className="detail-value">{formatDate(subscriptionInfo.subscription?.createdAt)}</span>
              </div>
              {subscriptionInfo.subscription?.activatedAt && (
                <div className="detail-item">
                  <span className="detail-label">Data e aktivizimit</span>
                  <span className="detail-value">{formatDate(subscriptionInfo.subscription.activatedAt)}</span>
                </div>
              )}
            </div>

            <div className="subscription-actions">
              <button 
                className="btn btn-danger"
                onClick={cancelSubscription}
                disabled={isLoading}
              >
                {isLoading ? 'Duke anuluar...' : 'Anulo Abonimin'}
              </button>
            </div>
          </div>
        ) : (
          <div className="subscription-card inactive">
            <div className="subscription-header">
              <div className="subscription-icon inactive">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="subscription-info">
                <h2>Nuk ka Abonim Aktiv</h2>
                <p>Krijoni një abonim për të përdorur të gjitha funksionet e SKAN.AL</p>
              </div>
            </div>

            <div className="subscription-pricing">
              <div className="price-highlight">
                <span className="price-amount">€35</span>
                <span className="price-period">në muaj</span>
              </div>
              <ul className="feature-list">
                <li>✓ Porosi të pakufizuara</li>
                <li>✓ QR code për të gjitha tavolinat</li>
                <li>✓ Dashboard në kohë reale</li>
                <li>✓ Menaxhim i stafit</li>
                <li>✓ Statistika dhe raporte</li>
                <li>✓ Mbështetje 24/7</li>
              </ul>
            </div>

            <div className="subscription-actions">
              <button 
                className="btn btn-primary btn-paypal"
                onClick={createSubscription}
                disabled={isCreatingSubscription}
              >
                {isCreatingSubscription ? 'Duke krijuar...' : 'Krijo Abonim me PayPal'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment History */}
      {subscriptionInfo.hasActiveSubscription && subscriptionInfo.recentPayments && subscriptionInfo.recentPayments.length > 0 && (
        <div className="payment-history">
          <h2>Historiku i Pagesave</h2>
          <div className="payment-list">
            {subscriptionInfo.recentPayments.map((payment) => (
              <div key={payment.id} className="payment-item">
                <div className="payment-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="payment-details">
                  <div className="payment-amount">€{payment.amount}</div>
                  <div className="payment-date">{formatDate(payment.paymentDate)}</div>
                </div>
                <div className="payment-status success">
                  {getStatusText(payment.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PayPal Information */}
      <div className="payment-info">
        <h2>Informacion mbi Pagesat</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">🔒</div>
            <div className="info-content">
              <h3>Pagesa të Sigurta</h3>
              <p>Të gjitha pagesat procesohen përmes PayPal me enkriptim SSL dhe mbrojtje të avancuar për dhënat.</p>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">💳</div>
            <div className="info-content">
              <h3>Metoda Pagese</h3>
              <p>Pranojmë kartë krediti, kartë debiti, dhe llogari PayPal. Nuk ka tarifa të fshehura.</p>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">📧</div>
            <div className="info-content">
              <h3>Fatura Mujore</h3>
              <p>Do të merrni faturë detale në email për çdo pagesë mujore që kryhet.</p>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">🔄</div>
            <div className="info-content">
              <h3>Anulim i Lehtë</h3>
              <p>Mund të anuloni abonimin tuaj në çdo kohë. Nuk ka kontrata afatgjata ose penalitete.</p>
            </div>
          </div>
        </div>
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

        .subscription-overview {
          margin-bottom: 40px;
        }

        .subscription-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .subscription-card.active {
          border-color: #38a169;
          background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
        }

        .subscription-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }

        .subscription-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .subscription-icon.inactive {
          background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
        }

        .subscription-icon svg {
          width: 32px;
          height: 32px;
        }

        .subscription-info {
          flex: 1;
        }

        .subscription-info h2 {
          margin: 0 0 4px 0;
          font-size: 24px;
          font-weight: 700;
          color: #1a202c;
        }

        .subscription-info p {
          margin: 0;
          color: #718096;
          font-size: 16px;
        }

        .subscription-status {
          font-size: 16px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.8);
        }

        .subscription-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 12px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 14px;
          color: #718096;
          font-weight: 500;
        }

        .detail-value {
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .subscription-pricing {
          margin-bottom: 24px;
        }

        .price-highlight {
          text-align: center;
          margin-bottom: 24px;
        }

        .price-amount {
          font-size: 48px;
          font-weight: 700;
          color: #1a202c;
        }

        .price-period {
          font-size: 18px;
          color: #718096;
          margin-left: 8px;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .feature-list li {
          font-size: 16px;
          color: #4a5568;
          padding: 8px 0;
        }

        .subscription-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .btn {
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 180px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-paypal {
          background: linear-gradient(135deg, #0066cc 0%, #003d7a 100%);
        }

        .btn-paypal:hover:not(:disabled) {
          box-shadow: 0 8px 20px rgba(0, 102, 204, 0.4);
        }

        .btn-danger {
          background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(229, 62, 62, 0.4);
        }

        .payment-history {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 40px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }

        .payment-history h2 {
          margin: 0 0 24px 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a202c;
        }

        .payment-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .payment-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f7fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .payment-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .payment-icon svg {
          width: 20px;
          height: 20px;
        }

        .payment-details {
          flex: 1;
        }

        .payment-amount {
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .payment-date {
          font-size: 14px;
          color: #718096;
        }

        .payment-status.success {
          color: #38a169;
          font-weight: 600;
          font-size: 14px;
        }

        .payment-info {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }

        .payment-info h2 {
          margin: 0 0 24px 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a202c;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .info-card {
          display: flex;
          gap: 16px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .info-icon {
          font-size: 32px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .info-content h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a202c;
        }

        .info-content p {
          margin: 0;
          font-size: 14px;
          color: #718096;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .payment-settings-page {
            padding: 16px;
          }

          .subscription-card {
            padding: 20px;
          }

          .subscription-header {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }

          .subscription-details {
            grid-template-columns: 1fr;
          }

          .feature-list {
            grid-template-columns: 1fr;
          }

          .subscription-actions {
            flex-direction: column;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentSettingsPage;