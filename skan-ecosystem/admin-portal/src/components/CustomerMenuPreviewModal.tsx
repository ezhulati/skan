import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
  id: string;
  name: string;
  nameAlbanian: string;
  description: string;
  descriptionAlbanian: string;
  price: number;
  allergens?: string[];
  imageUrl?: string;
  sortOrder: number;
}

interface MenuCategory {
  id: string;
  name: string;
  nameAlbanian: string;
  sortOrder: number;
  items: MenuItem[];
}

interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  description: string;
  settings: {
    currency: string;
    orderingEnabled: boolean;
    estimatedPreparationTime: number;
  };
}

interface MenuData {
  venue: Venue;
  categories: MenuCategory[];
}

interface CustomerMenuPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerMenuPreviewModal: React.FC<CustomerMenuPreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { auth } = useAuth();
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'english' | 'albanian'>('english');
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});

  const loadMenu = async () => {
    if (!auth.venue?.slug) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api-mkazmlu7ta-ew.a.run.app/v1/venue/${auth.venue.slug}/menu`
      );

      if (!response.ok) {
        throw new Error('Failed to load menu');
      }

      const data = await response.json();
      setMenuData(data);
    } catch (err) {
      console.error('Error loading menu:', err);
      setError('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && auth.venue?.slug) {
      loadMenu();
    }
  }, [isOpen, auth.venue?.slug]);

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getCartTotal = () => {
    if (!menuData) return 0;
    
    let total = 0;
    menuData.categories.forEach(category => {
      category.items.forEach(item => {
        const quantity = cart[item.id] || 0;
        total += item.price * quantity;
      });
    });
    return total;
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="customer-menu-modal-overlay" onClick={onClose}>
      <div className="customer-menu-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <h2>Customer Menu Preview</h2>
            <p>See how your menu appears to customers</p>
          </div>
          <div className="header-controls">
            <div className="language-toggle">
              <button
                className={`lang-btn ${language === 'english' ? 'active' : ''}`}
                onClick={() => setLanguage('english')}
              >
                EN
              </button>
              <button
                className={`lang-btn ${language === 'albanian' ? 'active' : ''}`}
                onClick={() => setLanguage('albanian')}
              >
                SQ
              </button>
            </div>
            <button className="close-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading menu...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={loadMenu}>Retry</button>
            </div>
          )}

          {menuData && (
            <div className="customer-menu-view">
              <div className="venue-header">
                <h1>{menuData.venue.name}</h1>
                <p>{menuData.venue.description}</p>
              </div>

              <div className="menu-categories">
                {menuData.categories.map(category => (
                  <div key={category.id} className="menu-category">
                    <h3 className="category-title">
                      {language === 'albanian' && category.nameAlbanian 
                        ? category.nameAlbanian 
                        : category.name}
                    </h3>
                    
                    <div className="menu-items">
                      {category.items.map(item => (
                        <div key={item.id} className="menu-item">
                          <div className="item-info">
                            <h4 className="item-name">
                              {language === 'albanian' && item.nameAlbanian 
                                ? item.nameAlbanian 
                                : item.name}
                            </h4>
                            <p className="item-description">
                              {language === 'albanian' && item.descriptionAlbanian 
                                ? item.descriptionAlbanian 
                                : item.description}
                            </p>
                            {item.allergens && item.allergens.length > 0 && (
                              <div className="allergens">
                                <span className="allergens-label">Allergens:</span>
                                <span className="allergens-list">
                                  {item.allergens.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="item-controls">
                            <div className="price">
                              {Math.round(item.price * 97)} Lek
                            </div>
                            
                            <div className="quantity-controls">
                              {cart[item.id] > 0 && (
                                <>
                                  <button
                                    className="qty-btn minus"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    -
                                  </button>
                                  <span className="quantity">{cart[item.id]}</span>
                                </>
                              )}
                              <button
                                className="qty-btn plus"
                                onClick={() => addToCart(item.id)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {getCartItemCount() > 0 && (
                <div className="cart-summary">
                  <div className="cart-info">
                    <span className="cart-items">
                      {getCartItemCount()} item{getCartItemCount() !== 1 ? 's' : ''}
                    </span>
                    <span className="cart-total">
                      {Math.round(getCartTotal() * 97)} Lek
                    </span>
                  </div>
                  <button className="order-btn">
                    View Order
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <style>{`
          .customer-menu-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .customer-menu-modal {
            background: white;
            border-radius: 12px;
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #e5e7eb;
          }

          .header-content h2 {
            margin: 0 0 4px 0;
            font-size: 24px;
            font-weight: 600;
            color: #111827;
          }

          .header-content p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }

          .header-controls {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .language-toggle {
            display: flex;
            background: #f3f4f6;
            border-radius: 8px;
            padding: 2px;
          }

          .lang-btn {
            padding: 6px 12px;
            border: none;
            background: transparent;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #6b7280;
          }

          .lang-btn.active {
            background: white;
            color: #111827;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .close-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            color: #6b7280;
            transition: all 0.2s ease;
          }

          .close-btn:hover {
            background: #f3f4f6;
            color: #111827;
          }

          .close-btn svg {
            width: 20px;
            height: 20px;
          }

          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 0;
          }

          .loading-state, .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #f3f4f6;
            border-top: 3px solid #4472c4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .customer-menu-view {
            position: relative;
          }

          .venue-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
          }

          .venue-header h1 {
            margin: 0 0 8px 0;
            font-size: 32px;
            font-weight: 700;
          }

          .venue-header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
          }

          .menu-categories {
            padding: 24px;
          }

          .menu-category {
            margin-bottom: 40px;
          }

          .category-title {
            font-size: 24px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 20px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }

          .menu-items {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .menu-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 20px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
          }

          .menu-item:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-color: #d1d5db;
          }

          .item-info {
            flex: 1;
            margin-right: 20px;
          }

          .item-name {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
            color: #111827;
          }

          .item-description {
            margin: 0 0 8px 0;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
          }

          .allergens {
            display: flex;
            gap: 8px;
            font-size: 12px;
          }

          .allergens-label {
            font-weight: 500;
            color: #ef4444;
          }

          .allergens-list {
            color: #6b7280;
          }

          .item-controls {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 12px;
          }

          .price {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
          }

          .quantity-controls {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .qty-btn {
            width: 32px;
            height: 32px;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.2s ease;
          }

          .qty-btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
          }

          .qty-btn.plus {
            background: #4472c4;
            border-color: #4472c4;
            color: white;
          }

          .qty-btn.plus:hover {
            background: #3b60b0;
          }

          .quantity {
            min-width: 20px;
            text-align: center;
            font-weight: 600;
            color: #111827;
          }

          .cart-summary {
            position: sticky;
            bottom: 0;
            background: white;
            border-top: 1px solid #e5e7eb;
            padding: 20px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
          }

          .cart-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .cart-items {
            font-size: 14px;
            color: #6b7280;
          }

          .cart-total {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
          }

          .order-btn {
            background: #4472c4;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .order-btn:hover {
            background: #3b60b0;
          }

          @media (max-width: 768px) {
            .customer-menu-modal {
              margin: 0;
              border-radius: 0;
              max-height: 100vh;
              height: 100vh;
            }

            .modal-header {
              padding: 16px;
            }

            .venue-header {
              padding: 24px 16px;
            }

            .venue-header h1 {
              font-size: 24px;
            }

            .menu-categories {
              padding: 16px;
            }

            .menu-item {
              flex-direction: column;
              gap: 16px;
            }

            .item-info {
              margin-right: 0;
            }

            .item-controls {
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              width: 100%;
            }

            .cart-summary {
              padding: 16px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default CustomerMenuPreviewModal;