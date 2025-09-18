import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useCart } from '../contexts/CartContext';
import { useVenue } from '../contexts/VenueContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { Order } from '../types';
import { CompactLanguagePicker } from '../components/LanguagePicker';

interface PaymentIntent {
  clientSecret: string;
  amount: number;
}

export function Payment() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const location = useLocation();
  const { venueSlug, tableNumber } = useParams<{ venueSlug: string; tableNumber: string }>();
  
  const { items, totalAmount, clearCart } = useCart();
  const { venue } = useVenue();
  const { t, language } = useLanguage();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  
  // Get order details from location state (passed from Cart)
  const orderDetails = location.state as {
    customerName?: string;
    orderNotes?: string;
  } || {};

  const createPaymentIntent = useCallback(async () => {
    try {
      const response = await api.createPaymentIntent({
        amount: Math.round(totalAmount * 97 * 100), // Convert EUR to Albanian Lek, then to cents
        currency: 'all', // Albanian Lek
        venueId: venue?.id,
        tableNumber
      });
      
      setPaymentIntent(response);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setError('Failed to initialize payment. Please try again.');
    }
  }, [totalAmount, venue?.id, tableNumber]);

  useEffect(() => {
    // Redirect back to cart if no items
    if (items.length === 0) {
      navigate(`/${venueSlug}/${tableNumber}/cart`);
      return;
    }

    // Create payment intent when component mounts
    createPaymentIntent();
  }, [items, venueSlug, tableNumber, navigate, createPaymentIntent]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      setError('Payment system not ready. Please wait and try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card information not found.');
      setIsProcessing(false);
      return;
    }

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: orderDetails.customerName || 'Customer',
            },
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
        return;
      }

      if (confirmedPayment?.status === 'succeeded') {
        // Payment successful, create order
        const order: Order = {
          venueId: venue!.id,
          tableNumber: tableNumber!,
          customerName: orderDetails.customerName?.trim() || undefined,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            nameAlbanian: item.nameAlbanian,
            price: item.price,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions
          })),
          totalAmount,
          specialInstructions: orderDetails.orderNotes?.trim() || undefined,
          status: 'new',
          paymentIntentId: confirmedPayment.id,
          paymentStatus: 'paid'
        };

        const orderResponse = await api.createOrder(order);
        
        // Clear cart after successful order
        clearCart();
        
        // Navigate to confirmation
        navigate(`/${venueSlug}/${tableNumber}/confirmation`, {
          state: {
            orderNumber: orderResponse.orderNumber,
            orderId: orderResponse.orderId,
            totalAmount: orderResponse.totalAmount,
            paymentConfirmed: true
          }
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToCart = () => {
    navigate(`/${venueSlug}/${tableNumber}/cart`);
  };

  if (!paymentIntent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading_payment')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToCart}
              className="text-primary-600 hover:text-primary-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('back')}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{t('payment')}</h1>
            <CompactLanguagePicker />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h2 className="font-semibold text-lg text-gray-900 mb-4">{t('order_summary')}</h2>
          
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {language === 'sq' && item.nameAlbanian ? item.nameAlbanian : item.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.quantity} × {Math.round(item.price * 97)} Lek
                  </p>
                </div>
                <span className="font-semibold text-gray-900">
                  {Math.round(item.price * item.quantity * 97)} Lek
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">{t('total')}</span>
              <span className="text-xl font-bold text-primary-600">
                {Math.round(totalAmount * 97)} Lek
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-lg text-gray-900 mb-4">{t('payment_details')}</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('card_details')}
              </label>
              <div className="border border-gray-300 rounded-lg p-3 bg-white">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!stripe || isProcessing}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('processing_payment')}
                </span>
              ) : (
                `${t('pay_now')} ${Math.round(totalAmount * 97)} Lek`
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              🔒 {t('payment_secure')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}