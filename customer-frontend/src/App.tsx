import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import QRLandingPage from './pages/QRLandingPage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import ConfirmationPage from './pages/ConfirmationPage';
import { CartProvider } from './contexts/CartContext';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/order/:venueSlug/:tableNumber" element={<QRLandingPage />} />
            <Route path="/menu/:venueSlug" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
            <Route path="/" element={<div>Welcome to Skan.al</div>} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
