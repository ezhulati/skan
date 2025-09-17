import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export function QRLanding() {
  const { venueSlug, tableNumber } = useParams<{ venueSlug: string; tableNumber: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (venueSlug && tableNumber) {
      navigate(`/${venueSlug}/${tableNumber}/menu`, { replace: true });
    }
  }, [venueSlug, tableNumber, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t('redirecting_to_menu')}</p>
      </div>
    </div>
  );
}