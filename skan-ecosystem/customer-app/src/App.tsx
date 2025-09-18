import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { VenueProvider } from './contexts/VenueContext';
import { CartProvider } from './contexts/CartContext';
import { QRLanding } from './pages/QRLanding';
import { Menu } from './pages/Menu';
import { Cart } from './pages/Cart';
import { Confirmation } from './pages/Confirmation';
import { OrderTracking } from './pages/OrderTracking';
import { CompactLanguagePicker } from './components/LanguagePicker';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

function VenueRoutes() {
  return (
    <Routes>
      <Route path="/:venueSlug/:tableNumber" element={<QRLanding />} />
      <Route path="/:venueSlug/:tableNumber/menu" element={<MenuWithContext />} />
      <Route path="/:venueSlug/:tableNumber/cart" element={<CartWithContext />} />
      <Route path="/:venueSlug/:tableNumber/confirmation" element={<ConfirmationWithContext />} />
      <Route path="/:venueSlug/:tableNumber/track/:orderNumber" element={<OrderTrackingWithContext />} />
      <Route path="/" element={<Navigate to="/help" replace />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/offline" element={<OfflinePage />} />
    </Routes>
  );
}

function MenuWithContext() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const venueSlug = pathParts[0];
  const tableNumber = pathParts[1];

  if (!venueSlug || !tableNumber) {
    return <Navigate to="/help" replace />;
  }

  return (
    <VenueProvider venueSlug={venueSlug} tableNumber={tableNumber}>
      <Menu />
    </VenueProvider>
  );
}

function CartWithContext() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const venueSlug = pathParts[0];
  const tableNumber = pathParts[1];

  if (!venueSlug || !tableNumber) {
    return <Navigate to="/help" replace />;
  }

  return (
    <VenueProvider venueSlug={venueSlug} tableNumber={tableNumber}>
      <Cart />
    </VenueProvider>
  );
}


function ConfirmationWithContext() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const venueSlug = pathParts[0];
  const tableNumber = pathParts[1];

  if (!venueSlug || !tableNumber) {
    return <Navigate to="/help" replace />;
  }

  return (
    <VenueProvider venueSlug={venueSlug} tableNumber={tableNumber}>
      <Confirmation />
    </VenueProvider>
  );
}

function OrderTrackingWithContext() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const venueSlug = pathParts[0];
  const tableNumber = pathParts[1];

  if (!venueSlug || !tableNumber) {
    return <Navigate to="/help" replace />;
  }

  return (
    <VenueProvider venueSlug={venueSlug} tableNumber={tableNumber}>
      <OrderTracking />
    </VenueProvider>
  );
}

function HelpPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 text-center">
        {/* Language picker in top right */}
        <div className="absolute top-4 right-4">
          <CompactLanguagePicker />
        </div>
        
        <div className="text-primary-600 mb-6">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Skan.al {t('help')}</h1>
        <div className="space-y-4 text-left">
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">{t('how_to_order')}</h2>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>{t('scan_qr')}</li>
              <li>{t('browse_menu')}</li>
              <li>{t('review_order')}</li>
              <li>{t('wait_preparation')}</li>
            </ol>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">{t('need_help')}</h2>
            <p className="text-sm text-gray-600">
              {t('ask_staff')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="text-gray-400 mb-6">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v20M2 12h20" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">You're offline</h1>
        <p className="text-gray-600 mb-6">
          Please check your internet connection and try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg min-h-[48px]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <VenueRoutes />
        </Router>
      </CartProvider>
    </LanguageProvider>
  );
}

export default App;