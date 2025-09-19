import React, { useState } from 'react';
import { MenuItem as MenuItemType } from '../types';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

interface MenuItemProps {
  item: MenuItemType;
}

export function MenuItem({ item }: MenuItemProps) {
  const { addItem } = useCart();
  const { t, language } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    addItem(item);
    
    setTimeout(() => {
      setIsAdding(false);
    }, 300);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6">
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
            {item.price} Lek
          </div>
          
          <button
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
        </div>
      </div>
    </div>
  );
}