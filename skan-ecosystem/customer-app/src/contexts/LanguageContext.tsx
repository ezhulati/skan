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
    'proceed_to_payment': 'Vazhdo tek Pagesa',
    
    // Payment
    'payment_method': 'Mënyra e Pagesës',
    'pay_with_card': 'Paguaj me Kartë',
    'pay_with_cash': 'Paguaj me Para në Dorë',
    'secure_instant_payment': 'Pagesë e sigurt dhe e menjëhershme',
    'pay_when_served': 'Paguaj kur të shërbehet',
    'pay_waiter_when_served': 'Paguaj kamerierit kur të shërbehet',
    'cash_or_card_with_waiter': 'Para në dorë ose kartë me kamerierin',
    'secure': 'E Sigurt',
    'instant': 'E Menjëhershme',
    'traditional': 'Tradicionale',
    'payment': 'Pagesa',
    'payment_details': 'Detajet e Pagesës',
    'card_details': 'Detajet e Kartës',
    'pay_now': 'Paguaj Tani',
    'processing_payment': 'Duke përpunuar pagesën...',
    'payment_secure': 'Pagesa juaj është e sigurt dhe e enkriptuar',
    'loading_payment': 'Duke ngarkuar pagesën...',
    
    // Confirmation
    'order_confirmed': 'Porosia u Konfirmua!',
    'order_number': 'Numri i Porosisë',
    'estimated_time': 'Koha e Vlerësuar',
    'track_order': 'Ndiq Porosinë',
    'thank_you': 'Faleminderit për porosinë tuaj!',
    'order_confirmation': 'Konfirmimi i Porosisë',
    'thank_you_preparing': 'Faleminderit për porosinë tuaj. Do ta fillojmë përgatitjen menjëherë.',
    'total_amount': 'Shuma Totale',
    'table_number': 'Numri i Tavolinës',
    'estimated_ready_time': 'Ora e Vlerësuar e Gatishmërisë',
    'what_happens_next': 'Çfarë ndodh tani?',
    'order_being_prepared': '• Porosia juaj po përgatitet nga kuzhina jonë',
    'will_update': '• Do t\'ju njoftojmë kur të jetë gati',
    'estimated_prep_time': '• Koha e vlerësuar e përgatitjes: {time} minuta',
    'please_note': 'Ju lutemi vini re',
    'keep_order_number': '• Mbajeni këtë numër porosie për referencë',
    'can_track_order': '• Mund ta ndiqni statusin e porosisë në çdo kohë',
    'remain_at_table': '• Ju lutemi qëndroni në tavolinën tuaj',
    'track_order_status': 'Ndiq Statusin e Porosisë',
    'add_more_items': 'Shto Më Shumë Artikuj',
    'need_help_order': 'Keni nevojë për ndihmë me porosinë tuaj?',
    'speak_with_staff': 'Ju lutemi flisni me një anëtar të stafit tonë',
    
    // Order Tracking
    'order_status': 'Statusi i Porosisë',
    'order_tracking': 'Ndjekja e Porosisë',
    'status_new': 'E Re',
    'status_preparing': 'Duke u Përgatitur',
    'status_ready': 'Gati',
    'status_served': 'E Shërbyer',
    'refresh': 'Rifresko',
    'loading_order_status': 'Duke ngarkuar statusin e porosisë...',
    'unable_to_load_order': 'Nuk mund të ngarkohet porosia',
    'try_again': 'Provo Përsëri',
    'back_to_menu': 'Kthehu te Menyja',
    'order_not_found': 'Porosia nuk u gjet',
    'order_received': 'Porosia u Pranua',
    'order_received_desc': 'Porosia juaj është pranuar dhe po rishikohet',
    'preparing': 'Duke u Përgatitur',
    'preparing_desc': 'Kuzhina jonë po përgatit porosinë tuaj',
    'ready': 'Gati',
    'ready_desc': 'Porosia juaj është gati për shërbim',
    'served': 'E Shërbyer',
    'served_desc': 'Porosia juaj është shërbyer. Shijoni ushqimin!',
    'order_timeline': 'Kronologjia e Porosisë',
    'order_details': 'Detajet e Porosisë',
    'note': 'Shënim',
    'timing': 'Koha',
    'order_placed': 'Porosia u vu',
    'last_updated': 'Përditësuar së fundmi',
    'auto_refresh_notice': 'Kjo faqe përditësohet automatikisht çdo 30 sekonda. Mund të prekni butonin e rifreskimit për të kontrolluar përditësimet.',
    'order_another_round': 'Porosit Përsëri',
    'refresh_status': 'Rifresko Statusin',
    'progress_complete': 'Përparim: {percent}% e kompletuar',
    
    // Help
    'help': 'Ndihmë',
    'how_to_order': 'Si të porosis:',
    'scan_qr': 'Skano kodin QR në tavolinën tuaj',
    'browse_menu': 'Shfleto menynë dhe shto artikuj në shportë',
    'review_order': 'Rishiko porosinë tuaj dhe dërgoje',
    'wait_preparation': 'Prit që porosia të përgatitet',
    'need_help': 'Keni nevojë për ndihmë?',
    'ask_staff': 'Ju lutemi pyesni një anëtar të stafit për ndihmë me porositjen ose skanimin e kodit QR.',
    'redirecting_to_menu': 'Duke ju ridrejtuar te menyja...',
    
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
    'proceed_to_payment': 'Proceed to Payment',
    
    // Payment
    'payment_method': 'Payment Method',
    'pay_with_card': 'Pay with Card',
    'pay_with_cash': 'Pay with Cash',
    'secure_instant_payment': 'Secure & instant payment',
    'pay_when_served': 'Pay when served',
    'pay_waiter_when_served': 'Pay waiter when served',
    'cash_or_card_with_waiter': 'Cash or card with waiter',
    'secure': 'Secure',
    'instant': 'Instant',
    'traditional': 'Traditional',
    'payment': 'Payment',
    'payment_details': 'Payment Details',
    'card_details': 'Card Details',
    'pay_now': 'Pay Now',
    'processing_payment': 'Processing payment...',
    'payment_secure': 'Your payment is secure and encrypted',
    'loading_payment': 'Loading payment...',
    
    // Confirmation
    'order_confirmed': 'Order Confirmed!',
    'order_number': 'Order Number',
    'estimated_time': 'Estimated Time',
    'track_order': 'Track Order',
    'thank_you': 'Thank you for your order!',
    'order_confirmation': 'Order Confirmation',
    'thank_you_preparing': 'Thank you for your order. We\'ll start preparing it right away.',
    'total_amount': 'Total Amount',
    'table_number': 'Table Number',
    'estimated_ready_time': 'Estimated Ready Time',
    'what_happens_next': 'What happens next?',
    'order_being_prepared': '• Your order is being prepared by our kitchen',
    'will_update': '• We\'ll update you when it\'s ready',
    'estimated_prep_time': '• Estimated preparation time: {time} minutes',
    'please_note': 'Please note',
    'keep_order_number': '• Keep this order number for reference',
    'can_track_order': '• You can track your order status anytime',
    'remain_at_table': '• Please remain at your table',
    'track_order_status': 'Track Order Status',
    'add_more_items': 'Add More Items',
    'need_help_order': 'Need help with your order?',
    'speak_with_staff': 'Please speak with a member of our staff',
    
    // Order Tracking
    'order_status': 'Order Status',
    'order_tracking': 'Order Tracking',
    'status_new': 'New',
    'status_preparing': 'Preparing',
    'status_ready': 'Ready',
    'status_served': 'Served',
    'refresh': 'Refresh',
    'loading_order_status': 'Loading order status...',
    'unable_to_load_order': 'Unable to load order',
    'try_again': 'Try Again',
    'back_to_menu': 'Back to Menu',
    'order_not_found': 'Order not found',
    'order_received': 'Order Received',
    'order_received_desc': 'Your order has been received and is being reviewed',
    'preparing': 'Preparing',
    'preparing_desc': 'Our kitchen is preparing your order',
    'ready': 'Ready',
    'ready_desc': 'Your order is ready for pickup/serving',
    'served': 'Served',
    'served_desc': 'Your order has been served. Enjoy your meal!',
    'order_timeline': 'Order Timeline',
    'order_details': 'Order Details',
    'note': 'Note',
    'timing': 'Timing',
    'order_placed': 'Order placed',
    'last_updated': 'Last updated',
    'auto_refresh_notice': 'This page automatically updates every 30 seconds. You can also tap the refresh button to check for updates.',
    'order_another_round': 'Order Another Round',
    'refresh_status': 'Refresh Status',
    'progress_complete': 'Progress: {percent}% complete',
    
    // Help
    'help': 'Help',
    'how_to_order': 'How to order:',
    'scan_qr': 'Scan the QR code on your table',
    'browse_menu': 'Browse the menu and add items to cart',
    'review_order': 'Review your order and submit',
    'wait_preparation': 'Wait for your order to be prepared',
    'need_help': 'Need help?',
    'ask_staff': 'Please ask a member of staff for assistance with ordering or QR code scanning.',
    'redirecting_to_menu': 'Redirecting to menu...',
    
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