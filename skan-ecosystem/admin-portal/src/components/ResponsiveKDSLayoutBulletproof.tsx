/**
 * BULLETPROOF Responsive KDS Layout Component
 * Zero glitches, perfect drag system with DOM cloning
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Order } from '../services/api';
import { BulletproofDrag } from './BulletproofDrag';
import '../styles/responsiveKDS.css';

interface ResponsiveKDSLayoutProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

type DeviceType = 'phone' | 'tablet' | 'tv';
type StationLane = 'new' | 'preparing' | 'ready' | 'served' | 'closed';

const STATION_LANES: StationLane[] = ['new', 'preparing', 'ready', 'served', 'closed'];

interface OrderUrgency {
  level: 'normal' | 'warning' | 'critical';
  className: string;
}

const ResponsiveKDSLayout: React.FC<ResponsiveKDSLayoutProps> = ({
  orders,
  onStatusUpdate
}) => {
  const [deviceType, setDeviceType] = useState<DeviceType>('tv'); // Default to TV mode with lanes
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Device detection - FORCE TV MODE for desktop experience with lanes
  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width <= 767) {
        setDeviceType('phone');
      } else if (width <= 1200) {
        setDeviceType('tv'); // Changed to TV mode for tablet/desktop to show lanes
      } else {
        setDeviceType('tv');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  // Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    // Listen for changes to dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => checkDarkMode();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // BULLETPROOF DRAG HANDLER - Zero glitches
  const handleBulletproofDrag = useCallback((orderId: string, fromStatus: string, dropTarget: HTMLElement | null) => {
    console.log('🎯 BULLETPROOF DRAG HANDLER CALLED:', { orderId, fromStatus, dropTarget });
    
    if (!dropTarget) {
      console.log('📍 No valid drop target');
      return;
    }
    
    console.log('📍 Drop target details:', {
      tagName: dropTarget.tagName,
      className: dropTarget.className,
      dataStation: dropTarget.getAttribute('data-station'),
      classList: Array.from(dropTarget.classList)
    });
    
    const targetStatus = dropTarget.getAttribute('data-station') || 
                        Array.from(dropTarget.classList)
                             .find(cls => cls.startsWith('station-') && cls !== 'station-lane')
                             ?.replace('station-', '');
    
    console.log('🎯 Target status determined:', targetStatus);
    console.log('🔄 Status comparison:', { fromStatus, targetStatus, different: targetStatus !== fromStatus });
    
    if (targetStatus && targetStatus !== fromStatus) {
      console.log(`🎯 BULLETPROOF DRAG: Moving ${orderId} from ${fromStatus} to ${targetStatus}`);
      console.log('🚀 Calling onStatusUpdate...');
      onStatusUpdate(orderId, targetStatus);
    } else {
      console.log('⚠️ No status update needed:', { targetStatus, fromStatus });
    }
  }, [onStatusUpdate]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => 
      order.status !== 'served' || 
      (new Date().getTime() - new Date(order.updatedAt || order.createdAt).getTime()) < 30 * 60 * 1000
    );
  }, [orders]);

  const getOrderUrgency = useCallback((createdAt: string, status: string, orderId: string): OrderUrgency => {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const ageInMinutes = Math.floor((now - created) / (1000 * 60));

    if (ageInMinutes > 20) {
      return { level: 'critical', className: 'critical-order' };
    } else if (ageInMinutes > 10) {
      return { level: 'warning', className: 'warning-order' };
    }
    return { level: 'normal', className: 'normal-order' };
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'new': return '#dc2626';
      case 'preparing': return '#ca8a04';
      case 'ready': return '#16a34a';
      case 'served': return '#6b7280';
      case 'closed': return isDarkMode ? '#1f2937' : '#374151'; // Darker in dark mode for better contrast
      default: return '#6b7280';
    }
  }, [isDarkMode]);

  const getStatusDisplayName = useCallback((status: string): string => {
    switch (status) {
      case 'new': return 'E Re';
      case 'preparing': return 'Duke u Përgatitur';
      case 'ready': return 'Gati';
      case 'served': return 'Shërbyer';
      case 'closed': return 'Mbyllur';
      default: return status;
    }
  }, []);

  const getNextStatus = useCallback((currentStatus: string): string | null => {
    switch (currentStatus) {
      case 'new': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'served';
      case 'served': return 'closed'; // Served orders can be closed
      default: return null;
    }
  }, []);

  const getStatusLabel = useCallback((status: string): string => {
    switch (status) {
      case 'new': return 'Fillo Përgatiujen';
      case 'preparing': return 'Shëno Gati';
      case 'ready': return 'Shërbeje';
      case 'served': return 'Mbyll'; // Close button for served orders
      default: return 'Përditëso';
    }
  }, []);

  const formatTime = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('sq-AL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Dark mode color helpers
  const getCardBackgroundColor = useCallback(() => {
    return isDarkMode ? '#374151' : 'white'; // Gray-700 for dark mode, white for light mode
  }, [isDarkMode]);

  const getCardTextColor = useCallback(() => {
    return isDarkMode ? '#f9fafb' : '#1f2937'; // Gray-50 for dark mode, Gray-800 for light mode
  }, [isDarkMode]);

  const getCardBorderColor = useCallback(() => {
    return isDarkMode ? '#4b5563' : '#e2e8f0'; // Gray-600 for dark mode, Gray-200 for light mode
  }, [isDarkMode]);

  const getStationBackgroundColor = useCallback(() => {
    return isDarkMode ? '#1f2937' : '#f8fafc'; // Gray-800 for dark mode, Gray-50 for light mode
  }, [isDarkMode]);

  const mapStatusToLane = useCallback((status: string): StationLane | null => {
    switch (status) {
      case '3': return 'new';
      case '5': return 'preparing';
      case '7': return 'ready';
      case '9': return 'served';
      case '11': return 'closed'; // New status code for closed
      case 'new': return 'new';
      case 'preparing': return 'preparing';
      case 'ready': return 'ready';
      case 'served': return 'served';
      case 'closed': return 'closed';
      default: return null;
    }
  }, []);

  const stationOrdersMap = useMemo(() => {
    const map: Record<StationLane, Order[]> = {
      new: [],
      preparing: [],
      ready: [],
      served: [],
      closed: []
    };

    orders.forEach(order => {
      const mappedStatus = mapStatusToLane(order.status);
      if (mappedStatus) {
        map[mappedStatus].push(order);
      }
    });

    return map;
  }, [orders, mapStatusToLane]);

  // Tablet Mode Component (Main Layout)
  const TabletModeLayout = () => (
    <div className="kds-tablet-mode">
      <div className="orders-grid">
        {filteredOrders.map(order => {
          const urgency = getOrderUrgency(order.createdAt, order.status, order.id);
          const nextStatus = getNextStatus(order.status);
          
          return (
            <BulletproofDrag 
              key={order.id}
              orderId={order.id}
              status={order.status}
              onDragEnd={handleBulletproofDrag}
            >
              <div 
                data-order-id={order.id}
                className={`order-card ${urgency.className}`}
                style={{
                  touchAction: 'none'
                }}
              >
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
                    data-button="true"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔥 BUTTON CLICKED!', order.id, nextStatus);
                      
                      try {
                        onStatusUpdate(order.id, nextStatus);
                      } catch (error) {
                        console.error('Button click error:', error);
                      }
                    }}
                    style={{ 
                      backgroundColor: getStatusColor(nextStatus),
                      border: isDarkMode && nextStatus === 'closed' ? '2px solid #6b7280' : 'none',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                      opacity: isDarkMode && nextStatus === 'closed' ? '0.9' : '1',
                      transition: 'all 0.2s ease',
                      pointerEvents: 'auto', // Ensure button can receive clicks
                      position: 'relative',
                      zIndex: 10 // Above drag handler
                    }}
                  >
                    {getStatusLabel(order.status)}
                  </button>
                )}
              </div>
            </BulletproofDrag>
          );
        })}
      </div>
      
      {/* Drop zones */}
      <div className="tablet-drop-zones" style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        gap: '8px',
        zIndex: '1000',
        pointerEvents: 'none'
      }}>
        {STATION_LANES.map(station => (
          <div 
            key={station}
            className={`station-lane station-${station}`}
            data-station={station}
            style={{
              flex: 1,
              background: 'rgba(100, 116, 139, 0.1)',
              border: '2px dashed rgba(100, 116, 139, 0.5)',
              borderRadius: '8px',
              padding: '16px',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: '#6c757d',
              fontWeight: '600',
              textAlign: 'center',
              pointerEvents: 'all'
            }}
          >
            {station === 'new' ? 'TË REJA' :
             station === 'preparing' ? 'DUKE U PËRGATITUR' :
             station === 'ready' ? 'GATI' :
             station === 'served' ? 'SHËRBYER' :
             'MBYLLUR'}
          </div>
        ))}
      </div>
    </div>
  );

  // TV Mode Component  
  const TVModeLayout = () => {
    const getStationTitle = (station: StationLane): string => {
      switch (station) {
        case 'new': return 'Të Reja';
        case 'preparing': return 'Duke u Përgatitur';
        case 'ready': return 'Gati';
        case 'served': return 'Shërbyer';
        case 'closed': return 'Mbyllur';
        default: return station;
      }
    };

    return (
      <div className="kds-tv-mode">
        <div className="station-lanes-container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)', // 5 lanes now
          gap: '16px', // Slightly smaller gap for 5 columns
          height: '80vh',
          padding: '20px'
        }}>
          {STATION_LANES.map(station => (
            <div key={station} className={`station-lane station-${station}`} data-station={station} style={{
              backgroundColor: getStationBackgroundColor(),
              border: `2px solid ${getCardBorderColor()}`,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '500px',
              position: 'relative'
            }}>
              <div className="station-header" style={{
                backgroundColor: station === 'new' ? '#dc2626' : 
                                station === 'preparing' ? '#ca8a04' : 
                                station === 'ready' ? '#16a34a' : 
                                station === 'served' ? '#6b7280' :
                                '#374151', // Darker gray for closed
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <h3 className="station-title" style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600'
                }}>{getStationTitle(station)}</h3>
                <span className="station-count" style={{
                  fontSize: '14px',
                  opacity: '0.9'
                }}>
                  {stationOrdersMap[station].length} porosi
                </span>
              </div>
              
              <div className="station-orders" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflow: 'auto',
                marginTop: '12px',
                minHeight: '0', // Important for flex overflow
                position: 'relative' // Establish stacking context
              }}>
                {stationOrdersMap[station].map(order => {
                  const urgency = getOrderUrgency(order.createdAt, order.status, order.id);
                  const nextStatus = getNextStatus(order.status);
                  
                  return (
                    <BulletproofDrag 
                      key={order.id}
                      orderId={order.id}
                      status={order.status}
                      onDragEnd={handleBulletproofDrag}
                    >
                      <div 
                        data-order-id={order.id}
                        className={`order-card compact ${urgency.className}`}
                        style={{
                          cursor: 'grab',
                          touchAction: 'none',
                          backgroundColor: getCardBackgroundColor(),
                          border: `1px solid ${getCardBorderColor()}`,
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                          marginBottom: '8px',
                          position: 'static', // Ensure normal document flow
                          display: 'block', // Block display for proper spacing
                          width: '100%', // Full width of container
                          boxSizing: 'border-box', // Include padding in width calc
                          color: getCardTextColor()
                        }}
                      >
                        <div className="order-header" style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                          color: getCardTextColor(),
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          <span className="order-number" style={{ color: getCardTextColor() }}>{order.orderNumber}</span>
                          <span className="order-time" style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>{formatTime(order.createdAt)}</span>
                        </div>
                        
                        <div className="order-table" style={{
                          color: getCardTextColor(),
                          fontSize: '13px',
                          fontWeight: '500',
                          marginBottom: '8px'
                        }}>
                          Tavolina {order.tableNumber}
                        </div>
                        
                        <div className="order-summary">
                          <div className="order-items-list" style={{
                            marginBottom: '8px'
                          }}>
                            {order.items.map((item, itemIndex) => (
                              <div key={itemIndex} style={{
                                color: getCardTextColor(),
                                fontSize: '12px',
                                marginBottom: '2px',
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}>
                                <span>{item.quantity}x {item.name}</span>
                                <span style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                                  {Math.round(item.price * item.quantity)} Lek
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="order-total" style={{
                            color: getCardTextColor(),
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '8px',
                            paddingTop: '4px',
                            borderTop: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`
                          }}>
                            Total: {Math.round(order.totalAmount)} Lek
                          </div>
                          
                          {nextStatus && (
                            <button
                              className="status-button-clean"
                              data-button="true"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🔥 BUTTON CLICKED!', order.id, nextStatus);
                                
                                try {
                                  onStatusUpdate(order.id, nextStatus);
                                } catch (error) {
                                  console.error('Button click error:', error);
                                }
                              }}
                              style={{
                                backgroundColor: getStatusColor(nextStatus),
                                border: isDarkMode && nextStatus === 'closed' ? '2px solid #6b7280' : 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                width: '100%',
                                marginTop: '8px',
                                boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                                outline: 'none',
                                pointerEvents: 'auto', // Ensure button can receive clicks
                                position: 'relative',
                                zIndex: 10, // Above drag handler
                                opacity: isDarkMode && nextStatus === 'closed' ? '0.9' : '1',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {getStatusLabel(order.status)}
                            </button>
                          )}
                        </div>
                      </div>
                    </BulletproofDrag>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Phone Mode Component
  const PhoneModeLayout = () => (
    <div className="kds-phone-mode">
      <div className="phone-orders-list">
        {filteredOrders.map(order => {
          const urgency = getOrderUrgency(order.createdAt, order.status, order.id);
          const nextStatus = getNextStatus(order.status);
          
          return (
            <BulletproofDrag 
              key={order.id}
              orderId={order.id}
              status={order.status}
              onDragEnd={handleBulletproofDrag}
            >
              <div 
                data-order-id={order.id}
                className={`order-card mobile ${urgency.className}`}
              >
                {/* Same content as tablet but optimized for mobile */}
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
                  <div className="table-info">T: {order.tableNumber}</div>
                  <div className="order-time">{formatTime(order.createdAt)}</div>
                </div>
                
                <div className="order-total">
                  <strong>{Math.round(order.totalAmount)} Lek</strong>
                </div>
                
                {nextStatus && (
                  <button
                    className="status-button"
                    data-button="true"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔥 BUTTON CLICKED!', order.id, nextStatus);
                      
                      try {
                        onStatusUpdate(order.id, nextStatus);
                      } catch (error) {
                        console.error('Button click error:', error);
                      }
                    }}
                    style={{ 
                      backgroundColor: getStatusColor(nextStatus),
                      border: isDarkMode && nextStatus === 'closed' ? '2px solid #6b7280' : 'none',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                      opacity: isDarkMode && nextStatus === 'closed' ? '0.9' : '1',
                      transition: 'all 0.2s ease',
                      pointerEvents: 'auto', // Ensure button can receive clicks
                      position: 'relative',
                      zIndex: 10 // Above drag handler
                    }}
                  >
                    {getStatusLabel(order.status)}
                  </button>
                )}
              </div>
            </BulletproofDrag>
          );
        })}
      </div>
      
      {/* Drop zones for phone */}
      <div className="phone-drop-zones">
        {STATION_LANES.map(station => (
          <div 
            key={station}
            className={`station-lane station-${station}`}
            data-station={station}
            style={{
              background: 'rgba(100, 116, 139, 0.1)',
              border: '2px dashed rgba(100, 116, 139, 0.5)',
              borderRadius: '8px',
              padding: '8px',
              margin: '4px 0',
              textAlign: 'center',
              fontSize: '12px',
              color: '#6c757d',
              fontWeight: '600'
            }}
          >
            {station === 'new' ? 'TË REJA' :
             station === 'preparing' ? 'PËRGATITUR' :
             station === 'ready' ? 'GATI' :
             station === 'served' ? 'SHËRBYER' :
             'MBYLLUR'}
          </div>
        ))}
      </div>
    </div>
  );

  // Render appropriate layout
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
        {deviceType.toUpperCase()} MODE - BULLETPROOF DRAG
      </div>
    </div>
  );
};

export default ResponsiveKDSLayout;