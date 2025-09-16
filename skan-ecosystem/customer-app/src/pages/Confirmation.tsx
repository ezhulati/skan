import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useVenue } from '../contexts/VenueContext';

interface ConfirmationState {
  orderNumber: string;
  orderId: string;
  totalAmount: number;
}

export function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { venueSlug, tableNumber } = useParams<{ venueSlug: string; tableNumber: string }>();
  const { venue } = useVenue();
  
  const confirmationData = location.state as ConfirmationState;
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    // If no confirmation data, redirect to help
    if (!confirmationData) {
      navigate('/help');
      return;
    }

    // Hide celebration animation after 3 seconds
    const timer = setTimeout(() => {
      setShowCelebration(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [confirmationData, navigate]);

  const handleTrackOrder = () => {
    navigate(`/${venueSlug}/${tableNumber}/track/${confirmationData.orderNumber}`);
  };

  const handleNewOrder = () => {
    navigate(`/${venueSlug}/${tableNumber}/menu`);
  };

  const estimatedTime = venue?.settings?.estimatedPreparationTime || 15;
  const estimatedReadyTime = new Date(Date.now() + estimatedTime * 60000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (!confirmationData) {
    return null; // Will redirect to help
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-bounce">
              <div className="text-6xl">🎉</div>
            </div>
          </div>
          {/* Confetti effect */}
          <div className="absolute top-0 left-1/4 animate-ping">
            <div className="text-2xl">✨</div>
          </div>
          <div className="absolute top-10 right-1/4 animate-pulse delay-300">
            <div className="text-2xl">🎊</div>
          </div>
          <div className="absolute top-20 left-1/3 animate-bounce delay-500">
            <div className="text-xl">⭐</div>
          </div>
          <div className="absolute top-16 right-1/3 animate-ping delay-700">
            <div className="text-xl">✨</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900 text-center">Order Confirmation</h1>
        </div>
      </div>

      {/* Success Content */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h2>
          
          <p className="text-gray-600 mb-4">
            Thank you for your order. We'll start preparing it right away.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-lg font-semibold text-gray-900 mb-1">Order Number</div>
            <div className="text-2xl font-bold text-primary-600 font-mono tracking-wider">
              {confirmationData.orderNumber}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-xl font-bold text-gray-900">
                €{confirmationData.totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Table Number</span>
              <span className="font-semibold text-gray-900 uppercase">
                {tableNumber}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Estimated Ready Time</span>
              <span className="font-semibold text-gray-900">
                {estimatedReadyTime}
              </span>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                What happens next?
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Your order is being prepared by our kitchen</p>
                <p>• We'll update you when it's ready</p>
                <p>• Estimated preparation time: {estimatedTime} minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 mb-1">
                Please note
              </h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• Keep this order number for reference</p>
                <p>• You can track your order status anytime</p>
                <p>• Please remain at your table</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleTrackOrder}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Track Order Status
          </button>

          <button
            onClick={handleNewOrder}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add More Items
          </button>
        </div>

        {/* Customer Service */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Need help with your order?
          </p>
          <p className="text-sm text-gray-500">
            Please speak with a member of our staff
          </p>
        </div>
      </div>
    </div>
  );
}