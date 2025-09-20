import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useVenue } from '../contexts/VenueContext';
import { formatPrice } from '../utils/currency';

export function CartSummary() {
  const { totalAmount, itemCount } = useCart();
  const { t } = useLanguage();
  const { venue } = useVenue();
  const navigate = useNavigate();
  const { venueSlug, tableNumber } = useParams<{ venueSlug: string; tableNumber: string }>();

  if (itemCount === 0) {
    return null;
  }

  const handleViewCart = () => {
    // Scroll to top immediately before navigation
    window.scrollTo({ top: 0, left: 0 });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    navigate(`/${venueSlug}/${tableNumber}/cart`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-md mx-auto px-4 py-3">
        <button
          onClick={handleViewCart}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-between min-h-[56px]"
        >
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
              {itemCount}
            </div>
            <span>{t('view_cart')}</span>
          </div>
          
          <div className="text-lg font-bold">
            {formatPrice(totalAmount, venue?.settings?.currency)}
          </div>
        </button>
      </div>
    </div>
  );
}