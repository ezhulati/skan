import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useVenue } from '../contexts/VenueContext';
import { CompactLanguagePicker } from '../components/LanguagePicker';

export function QRLanding() {
  const { venueSlug, tableNumber } = useParams<{ venueSlug: string; tableNumber: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { venue, isLoading } = useVenue();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show the table confirmation for 2 seconds, then redirect
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);

    const redirectTimer = setTimeout(() => {
      if (venueSlug && tableNumber) {
        navigate(`/${venueSlug}/${tableNumber}/menu`, { replace: true });
      }
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(redirectTimer);
    };
  }, [venueSlug, tableNumber, navigate]);

  const handleViewMenu = () => {
    if (venueSlug && tableNumber) {
      navigate(`/${venueSlug}/${tableNumber}/menu`);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-50 flex items-center justify-center px-4">
      {/* Language picker in top right */}
      <div className="absolute top-4 right-4 z-10">
        <CompactLanguagePicker />
      </div>

      <div className={`max-w-md w-full text-center transition-all duration-500 ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Venue Name */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {venue?.name || t('welcome')}
            </h1>
            {venue?.address && (
              <p className="text-sm text-gray-600">{venue.address}</p>
            )}
          </div>

          {/* Table Number - Prominent Display */}
          <div className="mb-8">
            <div className="bg-primary-600 rounded-xl p-6 text-white mb-4">
              <div className="text-sm font-medium uppercase tracking-wide opacity-90 mb-1">
                {t('table')}
              </div>
              <div className="text-5xl font-bold">
                {tableNumber}
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              {t('table_confirmation')}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleViewMenu}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {t('view_menu')}
            </button>
            
            <p className="text-xs text-gray-500">
              {t('automatically_redirecting')}
            </p>
          </div>
        </div>

        {/* QR Code Info */}
        <div className="bg-white/80 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center text-gray-600 text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {t('qr_scanned_successfully')}
          </div>
        </div>
      </div>
    </div>
  );
}