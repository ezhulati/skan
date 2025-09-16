import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, MenuResponse, MenuItem } from '../services/api';
import { useCart } from '../contexts/CartContext';

// Performance optimization: Memoized components
const LoadingComponent = React.memo(() => (
  <div className="loading-container min-h-screen flex flex-col items-center justify-center p-4">
    <div className="loading-spinner w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
    <p className="text-gray-600 text-center">Loading menu...</p>
  </div>
));

const ErrorComponent = React.memo(({ error }: { error: string }) => (
  <div className="error-container min-h-screen flex flex-col items-center justify-center p-4 text-center">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
      <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
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

// Optimized MenuItemComponent to avoid naming conflict
const MenuItemComponent = React.memo(({ 
  item, 
  quantity, 
  onAddItem, 
  onUpdateQuantity 
}: {
  item: MenuItem;
  quantity: number;
  onAddItem: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}) => (
  <div className="menu-item bg-white rounded-lg shadow-sm border p-4 mb-3 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div className="item-info flex-1 pr-4">
        <h3 className="item-name font-semibold text-gray-800 text-lg">{item.name}</h3>
        {item.nameEn && item.nameEn !== item.name && (
          <p className="item-name-en text-gray-500 text-sm italic">{item.nameEn}</p>
        )}
        <p className="item-price text-blue-600 font-bold text-lg mt-1">€{item.price.toFixed(2)}</p>
      </div>
      <div className="item-controls flex-shrink-0">
        {quantity === 0 ? (
          <button 
            className="add-button bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors active:scale-95"
            onClick={() => onAddItem(item)}
          >
            Add
          </button>
        ) : (
          <div className="quantity-controls flex items-center bg-gray-100 rounded-lg">
            <button 
              className="quantity-btn w-10 h-10 flex items-center justify-center text-xl font-bold text-blue-600 hover:bg-gray-200 rounded-l-lg transition-colors"
              onClick={() => onUpdateQuantity(item.id, quantity - 1)}
            >
              −
            </button>
            <span className="quantity px-4 py-2 font-semibold text-gray-800 min-w-[3rem] text-center">{quantity}</span>
            <button 
              className="quantity-btn w-10 h-10 flex items-center justify-center text-xl font-bold text-blue-600 hover:bg-gray-200 rounded-r-lg transition-colors"
              onClick={() => onUpdateQuantity(item.id, quantity + 1)}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
));

const MenuPage: React.FC = () => {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  const navigate = useNavigate();
  const { cart, addItem, updateQuantity, getTotalAmount, getTotalItems, setVenueInfo } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMenu = async () => {
      if (!venueSlug) {
        if (isMounted) {
          setMenuData(null);
          setError('Invalid venue');
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await apiService.getMenuBySlug(venueSlug);
        if (!isMounted) {
          return;
        }
        setMenuData(response);
      } catch (err) {
        console.error('Error loading menu:', err);
        if (!isMounted) {
          return;
        }
        setMenuData(null);
        setError('Failed to load menu. Please try again.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMenu();

    return () => {
      isMounted = false;
    };
  }, [venueSlug]);

  useEffect(() => {
    if (menuData?.venue) {
      setVenueInfo(
        menuData.venue.id,
        menuData.venue.name,
        cart.tableNumber || '',
        menuData.venue.slug
      );
    }
  }, [menuData, cart.tableNumber, setVenueInfo]);

  // Performance optimization: Memoize handlers
  const handleAddItem = useCallback((item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price
    });
  }, [addItem]);

  const handleUpdateQuantity = useCallback((itemId: string, quantity: number) => {
    updateQuantity(itemId, quantity);
  }, [updateQuantity]);

  const getItemQuantity = useCallback((itemId: string): number => {
    const cartItem = cart.items.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  }, [cart.items]);

  const handleGoToCart = useCallback(() => {
    navigate('/cart');
  }, [navigate]);

  // Performance optimization: Memoize total calculations
  const totalItems = useMemo(() => getTotalItems(), [getTotalItems]);
  const totalAmount = useMemo(() => getTotalAmount(), [getTotalAmount]);

  // Early returns for better performance
  if (loading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <ErrorComponent error={error} />;
  }

  return (
    <div className="menu-page min-h-screen bg-gray-50 pb-24">
      {/* Mobile-optimized header */}
      <header className="menu-header bg-white shadow-sm sticky top-0 z-10 p-4 border-b">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 text-center">{menuData?.venue.name}</h1>
          <p className="table-info text-center text-gray-600 mt-1">
            Table: <span className="font-semibold text-blue-600">{cart.tableNumber}</span>
          </p>
        </div>
      </header>

      {/* Optimized menu content */}
      <div className="menu-content container mx-auto px-4 py-6">
        {menuData?.menu.map(category => (
          <div key={category.id} className="menu-category mb-8">
            <h2 className="category-title text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-100">
              {category.name}
            </h2>
            <div className="menu-items">
              {category.items.map(item => {
                const quantity = getItemQuantity(item.id);
                return (
                  <MenuItemComponent
                    key={item.id}
                    item={item}
                    quantity={quantity}
                    onAddItem={handleAddItem}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Optimized sticky cart summary */}
      {totalItems > 0 && (
        <div className="cart-summary fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 z-20">
          <div className="container mx-auto flex items-center justify-between">
            <div className="cart-info">
              <div className="text-lg font-semibold text-gray-800">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </div>
              <div className="text-xl font-bold text-blue-600">
                €{totalAmount.toFixed(2)}
              </div>
            </div>
            <button 
              className="view-cart-button bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-colors min-w-[120px]"
              onClick={handleGoToCart}
            >
              View Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
