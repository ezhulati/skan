import React, { useState } from 'react';
import { MenuItem as MenuItemType } from '../types';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useVenue } from '../contexts/VenueContext';
import { formatPrice } from '../utils/currency';

interface MenuItemProps {
  item: MenuItemType;
}

export function MenuItem({ item }: MenuItemProps) {
  const { addItem, updateQuantity, items } = useCart();
  const { t, language } = useLanguage();
  const { venue } = useVenue();
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Find this item in the cart
  const cartItem = items.find(cartItem => cartItem.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    addItem(item);
    
    setTimeout(() => {
      setIsAdding(false);
    }, 300);
  };

  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(item.id, quantity + 1);
    } else {
      addItem(item);
    }
  };

  const handleDecrement = () => {
    if (cartItem && quantity > 0) {
      updateQuantity(item.id, quantity - 1);
    }
  };

  return (
    <div data-testid="menu-item" className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6">
      {item.imageUrl && !imageError && (
        <div className="w-full aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg mb-4 overflow-hidden">
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {language === 'sq' && item.nameAlbanian ? item.nameAlbanian : item.name}
          </h3>
          {language === 'en' && item.nameAlbanian && item.nameAlbanian !== item.name && (
            <p className="text-sm text-gray-600 italic">
              {item.nameAlbanian}
            </p>
          )}
        </div>

        {item.description && (
          <div className="text-sm text-gray-700">
            <p>{language === 'sq' && item.descriptionAlbanian ? item.descriptionAlbanian : item.description}</p>
            {language === 'en' && item.descriptionAlbanian && item.descriptionAlbanian !== item.description && (
              <p className="italic text-gray-600 mt-1">
                {item.descriptionAlbanian}
              </p>
            )}
          </div>
        )}

        {item.allergens && item.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.allergens.map((allergen) => (
              <span 
                key={allergen}
                className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
              >
                {allergen}
              </span>
            ))}
          </div>
        )}

        {item.preparationTime > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {item.preparationTime} {t('minutes')}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xl font-bold text-gray-900">
            {formatPrice(item.price, venue?.settings?.currency)}
          </div>
          
          {quantity === 0 ? (
            <button
              data-testid="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${
                isAdding 
                  ? 'bg-green-500 scale-95' 
                  : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
              } min-h-[48px] min-w-[100px]`}
            >
              {isAdding ? (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {language === 'sq' ? 'Shtuar!' : 'Added!'}
                </div>
              ) : (
                t('add_to_cart')
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2" data-testid="quantity-controls">
              <button
                data-testid="minus-button"
                onClick={handleDecrement}
                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <span data-testid="quantity-display" className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                {quantity}
              </span>
              
              <button
                data-testid="plus-button"
                onClick={handleIncrement}
                className="w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-semibold flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}