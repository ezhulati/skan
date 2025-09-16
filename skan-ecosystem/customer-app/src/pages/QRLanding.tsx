import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function QRLanding() {
  const { venueSlug, tableNumber } = useParams<{ venueSlug: string; tableNumber: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (venueSlug && tableNumber) {
      navigate(`/${venueSlug}/${tableNumber}/menu`, { replace: true });
    }
  }, [venueSlug, tableNumber, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to menu...</p>
      </div>
    </div>
  );
}