import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'sq' | 'en'; // sq = Albanian (Shqip), en = English

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Translation strings
const translations = {
  sq: {
    // Common
    'back': 'Kthehu',
    'next': 'Vazhdo',
    'loading': 'Duke u ngarkuar...',
    'error': 'Gabim',
    'retry': 'Provo Përsëri',
    'total': 'Totali',
    'price': 'Çmimi',
    'quantity': 'Sasia',
    'add': 'Shto',
    'remove': 'Hiq',
    'order': 'Porosia',
    'cancel': 'Anulo',
    'confirm': 'Konfirmo',
    
    // Menu
    'menu': 'Menyja',
    'categories': 'Kategoritë',
    'items': 'Artikujt',
    'description': 'Përshkrimi',
    'allergens': 'Alergjent',
    'preparation_time': 'Koha e Përgatitjes',
    'minutes': 'minuta',
    'add_to_cart': 'Shto në Shportë',
    'view_cart': 'Shiko Shportën',
    
    // Cart
    'cart': 'Shporta',
    'cart_empty': 'Shporta është e zbrazët',
    'continue_shopping': 'Vazhdo Blerjet',
    'checkout': 'Finalizo Porosinë',
    'customer_name': 'Emri i Klientit',
    'customer_name_placeholder': 'Shkruani emrin tuaj (opsionale)',
    'special_instructions': 'Udhëzime të Veçanta',
    'special_instructions_placeholder': 'Ndonjë kërkesë speciale për kuzhinën...',
    'submit_order': 'Dërgo Porosinë',
    'order_summary': 'Përmbledhja e Porosisë',
    
    // Confirmation
    'order_confirmed': 'Porosia u Konfirmua!',
    'order_number': 'Numri i Porosisë',
    'estimated_time': 'Koha e Vlerësuar',
    'track_order': 'Ndiq Porosinë',
    'thank_you': 'Faleminderit për porosinë tuaj!',
    
    // Order Tracking
    'order_status': 'Statusi i Porosisë',
    'order_tracking': 'Ndjekja e Porosisë',
    'status_new': 'E Re',
    'status_preparing': 'Duke u Përgatitur',
    'status_ready': 'Gati',
    'status_served': 'E Shërbyer',
    'refresh': 'Rifresko',
    
    // Help
    'help': 'Ndihmë',
    'how_to_order': 'Si të porosis:',
    'scan_qr': 'Skano kodin QR në tavolinën tuaj',
    'browse_menu': 'Shfleto menynë dhe shto artikuj në shportë',
    'review_order': 'Rishiko porosinë tuaj dhe dërgoje',
    'wait_preparation': 'Prit që porosia të përgatitet',
    'need_help': 'Keni nevojë për ndihmë?',
    'ask_staff': 'Ju lutemi pyesni një anëtar të stafit për ndihmë me porositjen ose skanimin e kodit QR.',
    
    // Venue specific
    'table': 'Tavolina',
    'beachfront_terrace': 'Terrasa e Plazhit',
    'indoor_seating': 'Ulëse të Brendshme',
  },
  en: {
    // Common
    'back': 'Back',
    'next': 'Next',
    'loading': 'Loading...',
    'error': 'Error',
    'retry': 'Try Again',
    'total': 'Total',
    'price': 'Price',
    'quantity': 'Quantity',
    'add': 'Add',
    'remove': 'Remove',
    'order': 'Order',
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    
    // Menu
    'menu': 'Menu',
    'categories': 'Categories',
    'items': 'Items',
    'description': 'Description',
    'allergens': 'Allergens',
    'preparation_time': 'Preparation Time',
    'minutes': 'minutes',
    'add_to_cart': 'Add to Cart',
    'view_cart': 'View Cart',
    
    // Cart
    'cart': 'Cart',
    'cart_empty': 'Your cart is empty',
    'continue_shopping': 'Continue Shopping',
    'checkout': 'Checkout',
    'customer_name': 'Customer Name',
    'customer_name_placeholder': 'Enter your name (optional)',
    'special_instructions': 'Special Instructions',
    'special_instructions_placeholder': 'Any special requests for the kitchen...',
    'submit_order': 'Submit Order',
    'order_summary': 'Order Summary',
    
    // Confirmation
    'order_confirmed': 'Order Confirmed!',
    'order_number': 'Order Number',
    'estimated_time': 'Estimated Time',
    'track_order': 'Track Order',
    'thank_you': 'Thank you for your order!',
    
    // Order Tracking
    'order_status': 'Order Status',
    'order_tracking': 'Order Tracking',
    'status_new': 'New',
    'status_preparing': 'Preparing',
    'status_ready': 'Ready',
    'status_served': 'Served',
    'refresh': 'Refresh',
    
    // Help
    'help': 'Help',
    'how_to_order': 'How to order:',
    'scan_qr': 'Scan the QR code on your table',
    'browse_menu': 'Browse the menu and add items to cart',
    'review_order': 'Review your order and submit',
    'wait_preparation': 'Wait for your order to be prepared',
    'need_help': 'Need help?',
    'ask_staff': 'Please ask a member of staff for assistance with ordering or QR code scanning.',
    
    // Venue specific
    'table': 'Table',
    'beachfront_terrace': 'Beachfront Terrace',
    'indoor_seating': 'Indoor Seating',
  }
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Default to Albanian (sq)
  const [language, setLanguageState] = useState<Language>('sq');

  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('skan-language') as Language;
    if (savedLanguage && (savedLanguage === 'sq' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('skan-language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const translation = translations[language][key as keyof typeof translations[typeof language]];
    return translation || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}