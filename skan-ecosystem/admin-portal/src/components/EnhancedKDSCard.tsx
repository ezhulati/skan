/**
 * Enhanced KDS Order Card - KDS 2.0 Implementation
 * Features: Countdown timers, one-touch updates, station filtering, modifier alerts
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Order } from '../services/api';

interface EnhancedKDSCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onLongPress?: (orderId: string) => void;
  isLocked?: boolean;
  lockedBy?: string;
  getStatusColor: (status: string) => string;
  getNextStatus: (status: string) => string | null;
  getStatusDisplayName: (status: string) => string;
  deviceType: 'phone' | 'tablet' | 'tv';
}

interface KitchenConfig {
  statusThresholds: {
    new: { warning: number; critical: number };
    preparing: { warning: number; critical: number };
    ready: { warning: number; critical: number };
  };
  stations: {
    [key: string]: { name: string; color: string; icon: string };
  };
}

const KITCHEN_CONFIG: KitchenConfig = {
  statusThresholds: {
    new: { warning: 3, critical: 5 },        // NEW: 0-3min green, 3-5min yellow, 5+ red
    preparing: { warning: 15, critical: 20 }, // PREPARING: 0-15min green, 15-20min yellow, 20+ red  
    ready: { warning: 3, critical: 5 }       // READY: 0-3min green, 3-5min yellow, 5+ red
  },
  stations: {
    grill: { name: 'Skara', color: '#FF5722', icon: '🔥' },
    fryer: { name: 'Skuqës', color: '#FFC107', icon: '🍟' },
    cold: { name: 'Të Ftohta', color: '#2196F3', icon: '🥗' },
    drinks: { name: 'Pije', color: '#4CAF50', icon: '🍺' },
    hot: { name: 'Nxehtë', color: '#FF9800', icon: '🍲' }
  }
};

const EnhancedKDSCard: React.FC<EnhancedKDSCardProps> = ({
  order,
  onStatusUpdate,
  onLongPress,
  isLocked = false,
  lockedBy,
  getStatusColor,
  getNextStatus,
  getStatusDisplayName,
  deviceType
}) => {
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeCurrentX, setSwipeCurrentX] = useState<number | null>(null);
  const [isSwipingLeft, setIsSwipingLeft] = useState(false);
  const [isSwipingRight, setIsSwipingRight] = useState(false);
  const [elapsedTime, setElapsedTime] = useState({ minutes: 0, seconds: 0, urgencyLevel: 'normal' as 'normal' | 'warning' | 'critical' });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate elapsed time and urgency level based on status
  const calculateElapsedTime = useCallback(() => {
    const orderTime = new Date(order.createdAt).getTime();
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - orderTime) / (1000 * 60);
    
    // Normalize status to handle both string and numeric formats
    const normalizedStatus = order.status === '3' ? 'new' : 
                           order.status === '5' ? 'preparing' : 
                           order.status === '7' ? 'ready' : 
                           order.status === '9' ? 'served' : 
                           order.status;
    
    // Get thresholds for current status
    const thresholds = KITCHEN_CONFIG.statusThresholds[normalizedStatus as keyof typeof KITCHEN_CONFIG.statusThresholds] || 
                      KITCHEN_CONFIG.statusThresholds.preparing;
    
    // Determine urgency level
    let urgencyLevel: 'normal' | 'warning' | 'critical' = 'normal';
    if (elapsedMinutes >= thresholds.critical) {
      urgencyLevel = 'critical';
    } else if (elapsedMinutes >= thresholds.warning) {
      urgencyLevel = 'warning';
    }

    return {
      minutes: Math.floor(elapsedMinutes),
      seconds: Math.floor((elapsedMinutes % 1) * 60),
      urgencyLevel
    };
  }, [order.createdAt, order.status]);

  // Update elapsed time every second
  useEffect(() => {
    const updateElapsedTime = () => {
      const timeData = calculateElapsedTime();
      setElapsedTime(timeData);
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(interval);
  }, [calculateElapsedTime]);

  // Get dominant station for this order
  const getDominantStation = useCallback(() => {
    const itemNames = order.items.map(item => item.name.toLowerCase()).join(' ');
    
    if (itemNames.includes('beer') || itemNames.includes('coca') || itemNames.includes('water') || itemNames.includes('pije')) {
      return KITCHEN_CONFIG.stations.drinks;
    } else if (itemNames.includes('burger') || itemNames.includes('meat') || itemNames.includes('grilled')) {
      return KITCHEN_CONFIG.stations.grill;
    } else if (itemNames.includes('fries') || itemNames.includes('fried') || itemNames.includes('skuq')) {
      return KITCHEN_CONFIG.stations.fryer;
    } else if (itemNames.includes('salad') || itemNames.includes('sallat') || itemNames.includes('cold')) {
      return KITCHEN_CONFIG.stations.cold;
    } else {
      return KITCHEN_CONFIG.stations.hot;
    }
  }, [order.items]);

  // Extract modifiers and allergies from order
  const getModifiers = useCallback(() => {
    const modifiers: string[] = [];
    const allergies: string[] = [];
    
    if (order.specialInstructions) {
      const instructions = order.specialInstructions.toLowerCase();
      
      // Common Albanian allergy terms
      if (instructions.includes('alergji') || instructions.includes('alergjik')) {
        if (instructions.includes('arra') || instructions.includes('nuts')) allergies.push('Alergji: Arra');
        if (instructions.includes('qumësht') || instructions.includes('dairy')) allergies.push('Alergji: Qumësht');
        if (instructions.includes('gluten')) allergies.push('Alergji: Gluten');
      }
      
      // Common modifier terms
      if (instructions.includes('pa qepë') || instructions.includes('no onion')) modifiers.push('Pa Qepë');
      if (instructions.includes('shtesë') || instructions.includes('extra')) modifiers.push('Shtesë Salcë');
      if (instructions.includes('pa') && !instructions.includes('pa qepë')) modifiers.push('Ndryshime');
    }
    
    return { modifiers, allergies };
  }, [order.specialInstructions]);

  // Touch event handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (deviceType === 'tv' || isLocked) return;
    
    setSwipeStartX(e.touches[0].clientX);
    setSwipeCurrentX(e.touches[0].clientX);
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress(order.id);
        navigator.vibrate?.(100);
      }
    }, 800);
  }, [deviceType, isLocked, onLongPress, order.id]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeStartX || deviceType === 'tv' || isLocked) return;
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - swipeStartX;
    
    setSwipeCurrentX(currentX);
    
    if (deltaX > 50) {
      setIsSwipingRight(true);
      setIsSwipingLeft(false);
    } else if (deltaX < -50) {
      setIsSwipingLeft(true);
      setIsSwipingRight(false);
    } else {
      setIsSwipingLeft(false);
      setIsSwipingRight(false);
    }
  }, [swipeStartX, deviceType, isLocked]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    if (!swipeStartX || !swipeCurrentX || deviceType === 'tv' || isLocked) {
      setSwipeStartX(null);
      setSwipeCurrentX(null);
      setIsSwipingLeft(false);
      setIsSwipingRight(false);
      return;
    }
    
    const deltaX = swipeCurrentX - swipeStartX;
    const nextStatus = getNextStatus(order.status);
    
    if (deltaX > 100 && nextStatus) {
      // Swipe right - advance status
      onStatusUpdate(order.id, nextStatus);
      navigator.vibrate?.(50);
    } else if (deltaX < -100) {
      // Swipe left - undo (would need undo functionality)
      navigator.vibrate?.(100);
    }
    
    setSwipeStartX(null);
    setSwipeCurrentX(null);
    setIsSwipingLeft(false);
    setIsSwipingRight(false);
  }, [swipeStartX, swipeCurrentX, deviceType, isLocked, getNextStatus, order.status, order.id, onStatusUpdate]);

  // Handle tap to advance
  const handleCardTap = useCallback(() => {
    if (isLocked) return;
    
    const nextStatus = getNextStatus(order.status);
    if (nextStatus) {
      onStatusUpdate(order.id, nextStatus);
      navigator.vibrate?.(30);
    }
  }, [isLocked, getNextStatus, order.status, order.id, onStatusUpdate]);

  const station = getDominantStation();
  const { modifiers, allergies } = getModifiers();
  const nextStatus = getNextStatus(order.status);
  
  // Apply urgency styling based on elapsed time
  const getUrgencyClass = () => {
    switch (elapsedTime.urgencyLevel) {
      case 'critical': return 'order-critical';
      case 'warning': return 'order-warning';
      default: return '';
    }
  };

  const swipeTransform = swipeStartX && swipeCurrentX ? 
    `translateX(${Math.max(-100, Math.min(100, swipeCurrentX - swipeStartX))}px)` : 
    'translateX(0)';

  return (
    <div
      ref={cardRef}
      className={`enhanced-kds-card ${getUrgencyClass()} ${isLocked ? 'locked' : ''} device-${deviceType}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={deviceType !== 'phone' ? handleCardTap : undefined}
      style={{
        transform: swipeTransform,
        transition: swipeStartX ? 'none' : 'transform 0.2s ease'
      }}
    >
      {/* Swipe indicators */}
      {isSwipingRight && nextStatus && (
        <div className="swipe-indicator swipe-right">
          <span className="swipe-icon">→</span>
          <span className="swipe-text">Përditëso</span>
        </div>
      )}
      {isSwipingLeft && (
        <div className="swipe-indicator swipe-left">
          <span className="swipe-icon">←</span>
          <span className="swipe-text">Kthehu</span>
        </div>
      )}

      {/* Lock indicator */}
      {isLocked && lockedBy && (
        <div className="lock-indicator">
          <span className="lock-icon">👤</span>
          <span className="lock-text">{lockedBy} po punon</span>
        </div>
      )}

      {/* Order header with timer */}
      <div className="order-header">
        <div className="order-number-section">
          <span className="order-number">{order.orderNumber}</span>
          <div className="station-indicator" style={{ backgroundColor: station.color }}>
            <span className="station-icon">{station.icon}</span>
            <span className="station-name">{station.name}</span>
          </div>
        </div>
        
        <div className={`elapsed-timer urgency-${elapsedTime.urgencyLevel}`}>
          <span className="timer-icon">
            {elapsedTime.urgencyLevel === 'critical' ? '🚨' : 
             elapsedTime.urgencyLevel === 'warning' ? '⚠️' : '⏱️'}
          </span>
          <span className="timer-text">
            {getStatusDisplayName(order.status)} për: {elapsedTime.minutes}:{elapsedTime.seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Allergy and modifier alerts */}
      {(allergies.length > 0 || modifiers.length > 0) && (
        <div className="alerts-section">
          {allergies.map((allergy, index) => (
            <div key={index} className="allergy-alert">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{allergy}</span>
            </div>
          ))}
          {modifiers.map((modifier, index) => (
            <div key={index} className="modifier-alert">
              <span className="modifier-text">{modifier}</span>
            </div>
          ))}
        </div>
      )}

      {/* Order info */}
      <div className="order-info">
        <div className="table-info">
          <span className="table-label">Tavolina:</span>
          <span className="table-number">{order.tableNumber}</span>
        </div>
        {order.customerName && order.customerName !== 'Anonymous' && (
          <div className="customer-info">
            <span className="customer-label">Klienti:</span>
            <span className="customer-name">{order.customerName}</span>
          </div>
        )}
      </div>

      {/* Order items */}
      <div className="order-items">
        {order.items.map((item, index) => (
          <div key={index} className="order-item">
            <span className="item-quantity">{item.quantity}×</span>
            <span className="item-name">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Status and action */}
      <div className="order-footer">
        <div 
          className="current-status"
          style={{ backgroundColor: getStatusColor(order.status) }}
        >
          {getStatusDisplayName(order.status)}
        </div>
        
        {nextStatus && !isLocked && (
          <div className="advance-hint">
            <span className="hint-text">
              {deviceType === 'phone' ? 'Godit ose zvarrit →' : 'Godit për të vazhduar'}
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        .enhanced-kds-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-left: 4px solid #e0e0e0;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .enhanced-kds-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .enhanced-kds-card.locked {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .enhanced-kds-card.order-attention {
          border-left-color: #FFC107;
          background: linear-gradient(90deg, rgba(255, 193, 7, 0.05) 0%, transparent 100%);
        }

        .enhanced-kds-card.order-warning {
          border-left-color: #FF6B35;
          background: linear-gradient(90deg, rgba(255, 107, 53, 0.1) 0%, transparent 100%);
          animation: pulse-warning 2s infinite;
        }

        .enhanced-kds-card.order-critical {
          border-left-color: #dc3545;
          background: linear-gradient(90deg, rgba(220, 53, 69, 0.15) 0%, transparent 100%);
          animation: pulse-critical 1s infinite;
          box-shadow: 0 0 20px rgba(220, 53, 69, 0.3);
        }

        @keyframes pulse-warning {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes pulse-critical {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(220, 53, 69, 0.3); }
          50% { transform: scale(1.03); box-shadow: 0 0 30px rgba(220, 53, 69, 0.5); }
        }

        .swipe-indicator {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          z-index: 10;
        }

        .swipe-indicator.swipe-right {
          right: 16px;
          background: rgba(76, 175, 80, 0.9);
          color: white;
        }

        .swipe-indicator.swipe-left {
          left: 16px;
          background: rgba(255, 152, 0, 0.9);
          color: white;
        }

        .lock-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(108, 117, 125, 0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .order-number-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .order-number {
          font-size: 18px;
          font-weight: 700;
          color: #2c3e50;
        }

        .station-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .elapsed-timer {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .elapsed-timer.urgency-normal {
          background: rgba(76, 175, 80, 0.1);
          color: #2e7d32;
        }

        .elapsed-timer.urgency-warning {
          background: rgba(255, 193, 7, 0.15);
          color: #f57c00;
        }

        .elapsed-timer.urgency-critical {
          background: rgba(220, 53, 69, 0.15);
          color: #c62828;
          animation: critical-pulse 1s infinite;
        }

        @keyframes critical-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .timer-icon {
          font-size: 14px;
        }

        .timer-text {
          font-size: 14px;
        }

        .alerts-section {
          margin-bottom: 12px;
        }

        .allergy-alert {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(220, 53, 69, 0.1);
          color: #c62828;
          padding: 6px 10px;
          border-radius: 6px;
          margin-bottom: 4px;
          font-weight: 600;
          font-size: 14px;
        }

        .modifier-alert {
          display: inline-block;
          background: rgba(255, 193, 7, 0.2);
          color: #f57c00;
          padding: 4px 8px;
          border-radius: 12px;
          margin-right: 6px;
          margin-bottom: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .order-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .table-info, .customer-info {
          display: flex;
          gap: 6px;
        }

        .table-label, .customer-label {
          color: #6c757d;
        }

        .table-number, .customer-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .order-items {
          margin-bottom: 12px;
        }

        .order-item {
          display: flex;
          gap: 8px;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .item-quantity {
          font-weight: 700;
          color: #495057;
          min-width: 24px;
        }

        .item-name {
          color: #2c3e50;
        }

        .order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .current-status {
          padding: 6px 12px;
          border-radius: 6px;
          color: white;
          font-weight: 600;
          font-size: 12px;
        }

        .advance-hint {
          font-size: 12px;
          color: #6c757d;
          font-style: italic;
        }

        /* Device-specific styles */
        .device-phone .enhanced-kds-card {
          margin-bottom: 8px;
        }

        .device-tv .enhanced-kds-card {
          font-size: 14px;
        }

        .device-tv .order-number {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default EnhancedKDSCard;