import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { restaurantApiService, Order } from '../services/api';

const DashboardPage: React.FC = () => {
  const { auth } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!auth.user?.venueId) return;

    try {
      setError(null);
      const ordersData = await restaurantApiService.getOrders(
        auth.user.venueId, 
        selectedStatus
      );
      setOrders(ordersData);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Dështoi ngarkimi i porosive');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [auth.user?.venueId, selectedStatus]);

  useEffect(() => {
    loadOrders();
  }, [auth.user?.venueId, selectedStatus, loadOrders]);

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (auth.user?.venueId) {
        setRefreshing(true);
        loadOrders();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [auth.user?.venueId, selectedStatus, loadOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await restaurantApiService.updateOrderStatus(orderId, newStatus);
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus as any, updatedAt: new Date().toISOString() }
            : order
        )
      );
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Dështoi përditësimi i statusit të porosisë');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#dc3545';
      case 'preparing': return '#fd7e14';
      case 'ready': return '#28a745';
      case 'served': return '#6c757d';
      default: return '#007bff';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'new': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'served';
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Prano Porosinë';
      case 'preparing': return 'Shëno si Gati';
      case 'ready': return 'Shëno si Shërbyer';
      default: return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'active') return ['new', 'preparing', 'ready'].includes(order.status);
    return order.status === selectedStatus;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours}h ${diffMinutes % 60}m ago`;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Duke ngarkuar porositë...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Paneli i Porosive</h1>
          <p>Menaxho porositë e ardhura dhe përditëso statusin e tyre</p>
        </div>
        <div className="header-right">
          <button 
            className="refresh-button"
            onClick={() => {
              setRefreshing(true);
              loadOrders();
            }}
            disabled={refreshing}
          >
            {refreshing ? 'Duke rifreskuar...' : 'Rifresko'}
          </button>
        </div>
      </header>

      <div className="status-filters">
        {['all', 'active', 'new', 'preparing', 'ready', 'served'].map(status => (
          <button
            key={status}
            className={`filter-button ${selectedStatus === status ? 'active' : ''}`}
            onClick={() => setSelectedStatus(status)}
          >
            {status === 'all' ? 'Të gjitha' : status === 'active' ? 'Aktive' : status === 'new' ? 'Të reja' : status === 'preparing' ? 'Duke u përgatitur' : status === 'ready' ? 'Gati' : status === 'served' ? 'Shërbyer' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="orders-container">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>Nuk u gjetën porosite për filtrin e zgjedhur.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-number">{order.orderNumber}</div>
                  <div 
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status.toUpperCase()}
                  </div>
                </div>
                
                <div className="order-info">
                  <div className="table-info">
                    <strong>Tavolina: {order.tableNumber}</strong>
                  </div>
                  {order.customerName && order.customerName !== 'Anonymous' && (
                    <div className="customer-name">
                      Klienti: {order.customerName}
                    </div>
                  )}
                  <div className="order-time">
                    {formatTime(order.createdAt)}
                  </div>
                </div>
                
                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span className="item-quantity">{item.quantity}x</span>
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="order-total">
                  <strong>Totali: €{order.totalAmount.toFixed(2)}</strong>
                </div>
                
                {getNextStatus(order.status) && (
                  <button
                    className="status-button"
                    onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status)!)}
                    style={{ backgroundColor: getStatusColor(getNextStatus(order.status)!) }}
                  >
                    {getStatusLabel(order.status)}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;