import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PaymentMethodSelectorProps {
  selectedMethod: 'stripe' | 'cash';
  onMethodChange: (method: 'stripe' | 'cash') => void;
  stripeEnabled: boolean;
}

export function PaymentMethodSelector({ 
  selectedMethod, 
  onMethodChange, 
  stripeEnabled 
}: PaymentMethodSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-6" data-testid="payment-method-selector">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('payment_method')}
      </h3>
      
      <div className="space-y-3">
        {/* Stripe Payment Option */}
        {stripeEnabled && (
          <label className={`block cursor-pointer border-2 border-gray-200 rounded-xl p-4 transition-all bg-white hover:border-gray-300 hover:bg-gray-50 ${
            selectedMethod === 'stripe' ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10' : ''
          }`}>
            <input
              type="radio"
              name="paymentMethod"
              value="stripe"
              checked={selectedMethod === 'stripe'}
              onChange={() => onMethodChange('stripe')}
              className="absolute opacity-0 pointer-events-none"
              data-testid="stripe-payment-radio"
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-2xl mr-3">
                  💳
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-base">{t('pay_with_card')}</div>
                  <div className="text-gray-600 text-sm mt-0.5">{t('secure_instant_payment')}</div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                  selectedMethod === 'stripe' ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>🔒 {t('secure')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                  selectedMethod === 'stripe' ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>⚡ {t('instant')}</span>
              </div>
            </div>
          </label>
        )}

        {/* Cash Payment Option */}
        <label className={`block cursor-pointer border-2 border-gray-200 rounded-xl p-4 transition-all bg-white hover:border-gray-300 hover:bg-gray-50 ${
          selectedMethod === 'cash' ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10' : ''
        }`}>
          <input
            type="radio"
            name="paymentMethod"
            value="cash"
            checked={selectedMethod === 'cash'}
            onChange={() => onMethodChange('cash')}
            className="absolute opacity-0 pointer-events-none"
            data-testid="cash-payment-radio"
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-2xl mr-3">
                💵
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-base">{t('pay_with_cash')}</div>
                <div className="text-gray-600 text-sm mt-0.5">{t('pay_when_served')}</div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                selectedMethod === 'cash' ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>👤 {t('traditional')}</span>
            </div>
          </div>
        </label>
      </div>

    </div>
  );
}