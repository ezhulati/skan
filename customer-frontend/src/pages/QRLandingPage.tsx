import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useCart } from '../contexts/CartContext';

// Performance optimization: Memoized loading component
const LoadingComponent = React.memo(() => (
  <div className="loading-container min-h-screen flex flex-col items-center justify-center p-4">
    <div className="loading-spinner w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
    <p className="text-gray-600 text-center">Loading restaurant information...</p>
  </div>
));

// Performance optimization: Memoized error component
const ErrorComponent = React.memo(({ error }: { error: string }) => (
  <div className="error-container min-h-screen flex flex-col items-center justify-center p-4 text-center">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
      <h2 className="text-xl font-semibold text-red-800 mb-2">Oops!</h2>
      <p className="text-red-600 mb-4">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
));

const QRLandingPage: React.FC = () => {
  const { venueSlug, tableNumber } = useParams<{ venueSlug: string; tableNumber: string }>();
  const navigate = useNavigate();
  const { setVenueInfo } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [venueData, setVenueData] = useState<any>(null);

  // Performance optimization: Memoize venue loading logic
  const loadVenueData = useMemo(() => async () => {
    if (!venueSlug) {
      setError('Invalid QR code - missing venue information');
      setLoading(false);
      return;
    }

    try {
      // Start API call immediately for faster loading
      const response = await apiService.getMenuBySlug(venueSlug);
      setVenueData(response.venue);
      setVenueInfo(
        response.venue.id,
        response.venue.name,
        tableNumber || '',
        response.venue.slug
      );
      setLoading(false);
    } catch (err) {
      console.error('Error loading venue:', err);
      setError('Restaurant not found. Please check the QR code.');
      setLoading(false);
    }
  }, [venueSlug, tableNumber, setVenueInfo]);

  useEffect(() => {
    loadVenueData();
  }, [loadVenueData]);

  // Performance optimization: Memoize navigation handler
  const handleContinueToMenu = useMemo(() => () => {
    if (venueData) {
      navigate(`/menu/${venueData.slug}`);
    }
  }, [venueData, navigate]);

  // Early returns for better performance
  if (loading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <ErrorComponent error={error} />;
  }

  return (
    <div className="qr-landing-page min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Critical content first for faster rendering */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section - Optimized for mobile-first */}
        <div className="venue-info text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {venueData?.name}
          </h1>
          
          {/* Table info with mobile-optimized design */}
          <div className="table-info bg-white shadow-lg rounded-lg p-4 mb-4 inline-block">
            <span className="table-label text-gray-600 text-sm font-medium mr-2">Table:</span>
            <span className="table-number text-2xl font-bold text-blue-600">{tableNumber}</span>
          </div>
          
          {venueData?.address && (
            <p className="venue-address text-gray-600 text-sm md:text-base">
              📍 {venueData.address}
            </p>
          )}
        </div>
        
        {/* Welcome message with improved UX */}
        <div className="welcome-message bg-white shadow-lg rounded-lg p-6 mb-8 text-center">
          <p className="text-gray-700 text-lg leading-relaxed">
            Welcome! You can now browse our menu and place your order directly from your table.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Fast, easy, and contactless ordering 🍽️
          </p>
        </div>
        
        {/* CTA button optimized for mobile tapping */}
        <div className="text-center">
          <button 
            className="continue-button bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 min-w-[200px]"
            onClick={handleContinueToMenu}
          >
            View Menu 🍽️
          </button>
        </div>
        
        {/* Performance hint: Preload menu page */}
        {venueData && (
          <link 
            rel="prefetch" 
            href={`/menu/${venueData.slug}`} 
          />
        )}
      </div>
    </div>
  );
};

export default QRLandingPage;
