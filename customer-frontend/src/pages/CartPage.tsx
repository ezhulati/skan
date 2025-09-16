import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { apiService } from '../services/api';

const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, getTotalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, quantity);
    }
  };

  const handleSubmitOrder = async () => {
    if (cart.items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    if (!cart.venueId || !cart.tableNumber) {
      setError('Missing venue information. Please scan the QR code again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderData = {
        venueId: cart.venueId,
        tableNumber: cart.tableNumber,
        customerName: customerName || undefined,
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      };

      const response = await apiService.createOrder(orderData);
      clearCart();
      navigate(`/confirmation/${response.orderId}?orderNumber=${response.orderNumber}`);
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('Failed to submit order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add some items from the menu to get started.</p>
        <button
          onClick={() => navigate(
            cart.venueSlug ? `/menu/${cart.venueSlug}` : '/'
          )}
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <h1>Your Order</h1>
        <p>{cart.venueName} - Table {cart.tableNumber}</p>
      </header>

      <div className="cart-items">
        {cart.items.map(item => (
          <div key={item.id} className="cart-item">
            <div className="item-info">
              <h3>{item.name}</h3>
              <p className="item-price">€{item.price.toFixed(2)} each</p>
            </div>
            <div className="item-controls">
              <div className="quantity-controls">
                <button 
                  className="quantity-btn"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button 
                  className="quantity-btn"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <div className="item-total">
                €{(item.price * item.quantity).toFixed(2)}
              </div>
              <button 
                className="remove-btn"
                onClick={() => removeItem(item.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="order-form">
        <div className="customer-name">
          <label htmlFor="customerName">Your Name (Optional)</label>
          <input
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="order-summary">
          <div className="total">
            <strong>Total: €{getTotalAmount().toFixed(2)}</strong>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="action-buttons">
            <button 
              className="back-button"
              onClick={() => navigate(
                cart.venueSlug ? `/menu/${cart.venueSlug}` : '/'
              )}
            >
              Back to Menu
            </button>
            <button 
              className="submit-button"
              onClick={handleSubmitOrder}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
