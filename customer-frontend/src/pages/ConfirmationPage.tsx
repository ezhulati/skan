import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const ConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { cart } = useCart();
  
  const orderNumber = searchParams.get('orderNumber');

  const handleOrderMore = () => {
    if (cart.venueSlug) {
      navigate(`/menu/${cart.venueSlug}`);
      return;
    }
    navigate('/');
  };

  return (
    <div className="confirmation-page">
      <div className="confirmation-content">
        <div className="success-icon">
          ✓
        </div>
        
        <h1>Order Confirmed!</h1>
        
        <div className="order-details">
          <p className="order-number">
            Order Number: <strong>{orderNumber}</strong>
          </p>
          
          <div className="venue-info">
            <p>{cart.venueName}</p>
            <p>Table {cart.tableNumber}</p>
          </div>
        </div>
        
        <div className="confirmation-message">
          <p>Your order has been sent to the restaurant.</p>
          <p>The staff will prepare your order and bring it to your table.</p>
        </div>
        
        <div className="next-steps">
          <h3>What happens next?</h3>
          <ul>
            <li>Restaurant staff will prepare your order</li>
            <li>Your food will be delivered to Table {cart.tableNumber}</li>
            <li>No payment needed now - pay when you're ready to leave</li>
          </ul>
        </div>
        
        <div className="action-buttons">
          <button 
            className="order-more-button"
            onClick={handleOrderMore}
          >
            Order More Items
          </button>
        </div>
        
        <div className="footer-note">
          <p>Thank you for using Skan.al!</p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
