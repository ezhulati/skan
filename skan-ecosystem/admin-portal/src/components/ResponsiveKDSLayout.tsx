/**
 * Responsive KDS Layout Component
 * Provides device-specific layouts: Phone, Tablet, and Kitchen TV modes
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Order } from '../services/api';
import '../styles/responsiveKDS.css';

interface ResponsiveKDSLayoutProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  selectedStatus: string;
  getStatusColor: (status: string) => string;
  getNextStatus: (status: string) => string | null;
  getStatusLabel: (status: string) => string | null;
  getStatusDisplayName: (status: string) => string;
  formatTime: (dateString: string) => string;
  getOrderUrgency: (dateString: string, status: string, orderId?: string) => { level: string; className: string };
  filteredOrders: Order[];
}

type DeviceType = 'phone' | 'tablet' | 'tv';
type StationLane = 'new' | 'preparing' | 'ready' | 'served';
const STATION_LANES: StationLane[] = ['new', 'preparing', 'ready', 'served'];

const ResponsiveKDSLayout: React.FC<ResponsiveKDSLayoutProps> = ({
  orders,
  onStatusUpdate,
  selectedStatus,
  getStatusColor,
  getNextStatus,
  getStatusLabel,
  getStatusDisplayName,
  formatTime,
  getOrderUrgency,
  filteredOrders
}) => {
  const [deviceType, setDeviceType] = useState<DeviceType>('tablet');
  const [swipingOrder, setSwipingOrder] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);

  // Detect device type based on screen size and orientation
  const detectDeviceType = useCallback((): DeviceType => {
    const width = window.innerWidth;

    if (width <= 767) {
      return 'phone';
    } else if (width <= 1023) {
      return 'tablet';
    } else {
      return 'tv';
    }
  }, []);

  // Update device type on resize
  useEffect(() => {
    const updateDeviceType = () => {
      setDeviceType(detectDeviceType());
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    window.addEventListener('orientationchange', updateDeviceType);

    return () => {
      window.removeEventListener('resize', updateDeviceType);
      window.removeEventListener('orientationchange', updateDeviceType);
    };
  }, [detectDeviceType]);

  // Swipe gesture handling for phone mode
  const handleTouchStart = useCallback((e: React.TouchEvent, orderId: string) => {
    if (deviceType !== 'phone') return;
    
    setSwipingOrder(orderId);
    setSwipeX(0);
  }, [deviceType]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipingOrder || deviceType !== 'phone') return;

    const touch = e.touches[0];
    const startX = e.currentTarget.getBoundingClientRect().left;
    const currentX = touch.clientX - startX;
    const swipeDistance = Math.max(-100, Math.min(0, currentX - 50));
    
    setSwipeX(swipeDistance);
  }, [swipingOrder, deviceType]);

  const handleTouchEnd = useCallback((orderId: string) => {
    if (!swipingOrder || deviceType !== 'phone') return;

    if (swipeX < -50) {
      // Swipe completed - trigger status update
      const nextStatus = getNextStatus(
        orders.find(o => o.id === orderId)?.status || 'new'
      );
      if (nextStatus) {
        onStatusUpdate(orderId, nextStatus);
      }
    }

    setSwipingOrder(null);
    setSwipeX(0);
  }, [swipingOrder, deviceType, swipeX, orders, getNextStatus, onStatusUpdate]);

  // Phone Mode Component
  const PhoneModeLayout = () => (
    <div className="kds-phone-mode">
      <div className="orders-list">
        {filteredOrders.map(order => {
          const urgency = getOrderUrgency(order.createdAt, order.status, order.id);
          const nextStatus = getNextStatus(order.status);
          const isSweping = swipingOrder === order.id;
          
          return (
            <div
              key={order.id}
              className={`order-card ${urgency.className} ${isSweping ? 'swiping' : ''}`}
              style={isSweping ? { '--swipe-x': `${swipeX}px` } as React.CSSProperties : {}}
              onTouchStart={(e) => handleTouchStart(e, order.id)}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd(order.id)}
            >
              {nextStatus && (
                <div className="swipe-actions">
                  {getStatusLabel(order.status)}
                </div>
              )}
              
              <div className="order-header">
                <div className="order-number">{order.orderNumber}</div>
                <div 
                  className="order-status"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusDisplayName(order.status)}
                </div>
              </div>
              
              <div className="order-info">
                <div>
                  <div className="table-info">Tavolina: {order.tableNumber}</div>
                  {order.customerName && order.customerName !== 'Anonymous' && (
                    <div className="customer-name">
                      Klienti: {order.customerName}
                    </div>
                  )}
                </div>
                <div className="order-time">
                  {formatTime(order.createdAt)}
                </div>
              </div>
              
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span className="item-quantity">{item.quantity}</span>
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">{Math.round(item.price * item.quantity)} Lek</span>
                  </div>
                ))}
              </div>
              
              <div className="order-total">
                <strong>Totali: {Math.round(order.totalAmount)} Lek</strong>
              </div>
              
              {nextStatus && (
                <button
                  className="status-button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔥 BUTTON CLICKED!', order.id, nextStatus);
                    
                    try {
                      await onStatusUpdate(order.id, nextStatus);
                    } catch (error) {
                      console.error('Button click error:', error);
                    }
                  }}
                  style={{ backgroundColor: getStatusColor(nextStatus) }}
                >
                  {getStatusLabel(order.status)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Tablet Mode Component
  const TabletModeLayout = () => (
    <div className="kds-tablet-mode">
      <div className="orders-grid">
        {filteredOrders.map(order => {
          const urgency = getOrderUrgency(order.createdAt, order.status, order.id);
          const nextStatus = getNextStatus(order.status);
          
          return (
            <div key={order.id} className={`order-card ${urgency.className}`}>
              <div className="order-header">
                <div className="order-number">{order.orderNumber}</div>
                <div 
                  className="order-status"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusDisplayName(order.status)}
                </div>
              </div>
              
              <div className="order-info">
                <div className="table-info">Tavolina: {order.tableNumber}</div>
                <div className="order-time">
                  {formatTime(order.createdAt)}
                </div>
                {order.customerName && order.customerName !== 'Anonymous' && (
                  <div className="customer-name">
                    Klienti: {order.customerName}
                  </div>
                )}
              </div>
              
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span className="item-quantity">{item.quantity}</span>
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">{Math.round(item.price * item.quantity)} Lek</span>
                  </div>
                ))}
              </div>
              
              <div className="order-total">
                <strong>Totali: {Math.round(order.totalAmount)} Lek</strong>
              </div>
              
              {nextStatus && (
                <button
                  className="status-button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔥 BUTTON CLICKED!', order.id, nextStatus);
                    
                    try {
                      await onStatusUpdate(order.id, nextStatus);
                    } catch (error) {
                      console.error('Button click error:', error);
                    }
                  }}
                  style={{ backgroundColor: getStatusColor(nextStatus) }}
                >
                  {getStatusLabel(order.status)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const mapStatusToLane = useCallback((status: string): StationLane | null => {
    switch (status) {
      case '3': return 'new';
      case '5': return 'preparing';
      case '7': return 'ready';
      case '9': return 'served';
      case 'new': return 'new';
      case 'preparing': return 'preparing';
      case 'ready': return 'ready';
      case 'served': return 'served';
      default: return null;
    }
  }, []);

  const stationOrdersMap = useMemo(() => {
    const map: Record<StationLane, Order[]> = {
      new: [],
      preparing: [],
      ready: [],
      served: []
    };

    orders.forEach(order => {
      const mappedStatus = mapStatusToLane(order.status);
      if (mappedStatus) {
        map[mappedStatus].push(order);
      }
    });

    return map;
  }, [orders, mapStatusToLane]);

  // Kitchen TV Mode Component
  const TVModeLayout = () => {
    const getStationTitle = (station: StationLane): string => {
      switch (station) {
        case 'new': return 'Të Reja';
        case 'preparing': return 'Duke u Përgatitur';
        case 'ready': return 'Gati';
        case 'served': return 'Shërbyer';
        default: return station;
      }
    };

    return (
      <div className="kds-tv-mode">
        <div className="orders-grid">
          {STATION_LANES.map(station => (
            <div key={station} className={`station-lane station-${station}`}>
              <div className="station-header">
                {getStationTitle(station)} ({stationOrdersMap[station].length})
              </div>
              
              <div className="station-orders">
                {stationOrdersMap[station].map(order => {
                  const urgency = getOrderUrgency(order.createdAt, order.status, order.id);
                  const nextStatus = getNextStatus(order.status);
                  
                  return (
                    <div key={order.id} className={`order-card ${urgency.className}`}>
                      <div className="order-header">
                        <div className="order-number">{order.orderNumber}</div>
                        <div 
                          className="order-status"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {order.tableNumber}
                        </div>
                      </div>
                      
                      <div className="order-info">
                        <div className="table-info">{order.tableNumber}</div>
                        {order.customerName && order.customerName !== 'Anonymous' && (
                          <div className="customer-name">{order.customerName}</div>
                        )}
                        <div className="order-time">
                          {formatTime(order.createdAt)}
                        </div>
                      </div>
                      
                      <div className="order-items">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="order-item">
                            <span className="item-quantity">{item.quantity}</span>
                            <span className="item-name">{item.name}</span>
                            <span className="item-price">{Math.round(item.price * item.quantity)} Lek</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="order-item">
                            <span className="item-quantity">+</span>
                            <span className="item-name">{order.items.length - 3} më shumë...</span>
                            <span className="item-price"></span>
                          </div>
                        )}
                      </div>
                      
                      <div className="order-total">
                        {Math.round(order.totalAmount)} Lek
                      </div>
                      
                      {nextStatus && (
                        <button
                          className="status-button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔥 BUTTON CLICKED!', order.id, nextStatus);
                            
                            try {
                              await onStatusUpdate(order.id, nextStatus);
                            } catch (error) {
                              console.error('Button click error:', error);
                            }
                          }}
                          style={{ backgroundColor: getStatusColor(nextStatus) }}
                        >
                          {getStatusLabel(order.status)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render appropriate layout based on device type
  const renderLayout = () => {
    switch (deviceType) {
      case 'phone':
        return <PhoneModeLayout />;
      case 'tablet':
        return <TabletModeLayout />;
      case 'tv':
        return <TVModeLayout />;
      default:
        return <TabletModeLayout />;
    }
  };

  return (
    <div className={`responsive-kds-layout device-${deviceType}`}>
      {renderLayout()}
      
      {/* Device type indicator for debugging */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000,
        display: process.env.NODE_ENV === 'development' ? 'block' : 'none'
      }}>
        {deviceType.toUpperCase()} MODE
      </div>
    </div>
  );
};

export default ResponsiveKDSLayout;
