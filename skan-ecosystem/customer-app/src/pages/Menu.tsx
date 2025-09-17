import React, { useState } from 'react';
import { useVenue } from '../contexts/VenueContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MenuItem } from '../components/MenuItem';
import { CartSummary } from '../components/CartSummary';
import { CompactLanguagePicker } from '../components/LanguagePicker';
import Icon from '../components/shared/Icon';

export function Menu() {
  const { venue, menuCategories, isLoading, error } = useVenue();
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-primary-600 mb-4 flex justify-center">
            <Icon name="warning" size={64} className="text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load menu</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!venue || menuCategories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No menu available</h2>
          <p className="text-gray-600">This venue doesn't have an active menu at the moment.</p>
        </div>
      </div>
    );
  }

  const filteredCategories = activeCategory 
    ? menuCategories.filter(cat => cat.id === activeCategory)
    : menuCategories;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6 relative">
          {/* Language picker in top right */}
          <div className="absolute top-4 right-4">
            <CompactLanguagePicker />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2 pr-20">{venue.name}</h1>
          <p className="text-gray-600 text-sm">{venue.address}</p>
        </div>
      </div>

      {menuCategories.length > 1 && (
        <div className="bg-gray-50 border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-md mx-auto relative">
            <div className="flex overflow-x-auto py-2 px-4 space-x-2 scrollbar-hide">
              {/* Scroll indicator gradient */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 via-gray-50/90 to-transparent pointer-events-none z-10"></div>
              
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150 min-h-[36px] flex items-center ${
                  activeCategory === null
                    ? 'bg-gray-900 text-white rounded-lg shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg'
                }`}
              >
                {language === 'sq' ? 'Të gjitha' : 'All'}
              </button>
              
              {menuCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150 min-h-[36px] flex items-center ${
                    activeCategory === category.id
                      ? 'bg-gray-900 text-white rounded-lg shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg'
                  }`}
                >
                  {language === 'sq' && category.nameAlbanian ? category.nameAlbanian : category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {language === 'sq' && category.nameAlbanian ? category.nameAlbanian : category.name}
                </h2>
                {language === 'en' && category.nameAlbanian && category.nameAlbanian !== category.name && (
                  <p className="text-sm text-gray-600 italic">
                    {category.nameAlbanian}
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                {category.items.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CartSummary />
    </div>
  );
}