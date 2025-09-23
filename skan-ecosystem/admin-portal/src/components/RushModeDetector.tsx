/**
 * Rush Mode Detector Component
 * Automatically detects high order velocity and activates rush mode
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Order } from '../services/api';

interface RushModeConfig {
  threshold: number; // orders per time window
  timeWindowMinutes: number;
  sustainedMinutes: number; // how long rush must be sustained
}

interface RushModeState {
  isActive: boolean;
  currentVelocity: number;
  peakVelocity: number;
  activatedAt: Date | null;
  totalRushOrders: number;
}

interface RushModeDetectorProps {
  orders: Order[];
  config?: Partial<RushModeConfig>;
  onRushModeChange?: (isActive: boolean, stats: RushModeState) => void;
  children?: React.ReactNode;
}

const DEFAULT_CONFIG: RushModeConfig = {
  threshold: 8, // 8 orders per 10 minutes triggers rush mode
  timeWindowMinutes: 10,
  sustainedMinutes: 3 // Must be sustained for 3 minutes
};

const RushModeDetector: React.FC<RushModeDetectorProps> = ({
  orders,
  config = {},
  onRushModeChange,
  children
}) => {
  const [rushState, setRushState] = useState<RushModeState>({
    isActive: false,
    currentVelocity: 0,
    peakVelocity: 0,
    activatedAt: null,
    totalRushOrders: 0
  });

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rushStartTime = useRef<Date | null>(null);
  const lastNotificationTime = useRef<number>(0);

  // Initialize rush mode audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzuY3e/AcCwCKHfN7tqROgcTU6Pe5qlXFAhJot3vs2AeBzOj0e7ItS4AH27Z7t2UOgYNVKzt56VZFgVFp9/xs2EcCjKX3O7JtW0ABSaA3fjPcywD');
    }
  }, []);

  // Calculate order velocity and detect rush mode
  const calculateVelocity = useCallback(() => {
    const now = Date.now();
    const timeWindow = finalConfig.timeWindowMinutes * 60 * 1000;
    const cutoffTime = now - timeWindow;

    // Count orders within the time window
    const recentOrders = orders.filter(order => {
      const orderTime = new Date(order.createdAt).getTime();
      return orderTime >= cutoffTime;
    });

    const currentVelocity = recentOrders.length;
    const isAboveThreshold = currentVelocity >= finalConfig.threshold;

    // Check if rush has been sustained
    let shouldActivateRush = false;
    let shouldDeactivateRush = false;

    if (isAboveThreshold && !rushState.isActive) {
      if (!rushStartTime.current) {
        rushStartTime.current = new Date();
      } else {
        const sustainedDuration = (now - rushStartTime.current.getTime()) / (1000 * 60);
        if (sustainedDuration >= finalConfig.sustainedMinutes) {
          shouldActivateRush = true;
        }
      }
    } else if (!isAboveThreshold) {
      rushStartTime.current = null;
      if (rushState.isActive) {
        shouldDeactivateRush = true;
      }
    }

    // Update rush state
    const newRushState: RushModeState = {
      ...rushState,
      currentVelocity,
      peakVelocity: Math.max(rushState.peakVelocity, currentVelocity),
      isActive: shouldActivateRush ? true : shouldDeactivateRush ? false : rushState.isActive,
      activatedAt: shouldActivateRush ? new Date() : shouldDeactivateRush ? null : rushState.activatedAt,
      totalRushOrders: rushState.isActive ? rushState.totalRushOrders + recentOrders.filter(order => {
        const orderTime = new Date(order.createdAt).getTime();
        return orderTime >= (now - 60000); // Orders in last minute
      }).length : rushState.totalRushOrders
    };

    // Play audio notification when rush mode activates
    if (shouldActivateRush && audioRef.current) {
      try {
        audioRef.current.play();
        navigator.vibrate?.(500);
      } catch (error) {
        console.warn('Could not play rush mode audio:', error);
      }
    }

    setRushState(newRushState);

    // Notify parent component
    if (onRushModeChange && (shouldActivateRush || shouldDeactivateRush)) {
      onRushModeChange(newRushState.isActive, newRushState);
    }

    return newRushState;
  }, [orders, finalConfig, rushState, onRushModeChange]);

  // Update velocity every 30 seconds
  useEffect(() => {
    calculateVelocity();
    
    const interval = setInterval(() => {
      calculateVelocity();
    }, 30000);

    return () => clearInterval(interval);
  }, [calculateVelocity]);

  // Get rush mode intensity level
  const getRushIntensity = () => {
    if (!rushState.isActive) return 'normal';
    
    const ratio = rushState.currentVelocity / finalConfig.threshold;
    if (ratio >= 2) return 'extreme';
    if (ratio >= 1.5) return 'high';
    return 'moderate';
  };

  // Calculate simple queue depth
  const getQueueDepth = () => {
    return orders.filter(order => 
      !['served', '9'].includes(order.status)
    ).length;
  };

  const intensity = getRushIntensity();
  const queueDepth = getQueueDepth();

  return (
    <>
      {rushState.isActive && (
        <div className={`rush-mode-banner intensity-${intensity}`}>
          <div className="rush-content">
            <div className="rush-header">
              <div className="rush-icon">⚡</div>
              <div className="rush-title">
                <span className="rush-text">RUSH MODE</span>
                <span className="rush-subtitle">Të gjitha duart në punë!</span>
              </div>
            </div>
            
            <div className="rush-stats">
              <div className="stat">
                <span className="stat-value">{rushState.currentVelocity}</span>
                <span className="stat-label">Porosite/10min</span>
              </div>
              <div className="stat">
                <span className="stat-value">{queueDepth}</span>
                <span className="stat-label">Porosite në radhë</span>
              </div>
              <div className="stat">
                <span className="stat-value">{rushState.activatedAt ? 
                  Math.floor((Date.now() - rushState.activatedAt.getTime()) / 60000) : 0}min</span>
                <span className="stat-label">Kohëzgjatja</span>
              </div>
            </div>

            <div className="rush-actions">
              <button 
                className="priority-button"
                onClick={() => {
                  // Could trigger priority sorting or staff notifications
                  console.log('Priority mode activated');
                }}
              >
                🚨 Aktivizo Prioritetin
              </button>
            </div>
          </div>

          {/* Intensity indicator */}
          <div className="intensity-indicator">
            <div className="intensity-bars">
              {[1, 2, 3, 4, 5].map(level => (
                <div 
                  key={level}
                  className={`intensity-bar ${level <= rushState.currentVelocity / (finalConfig.threshold / 5) ? 'active' : ''}`}
                />
              ))}
            </div>
            <span className="intensity-label">{intensity.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Velocity indicator (always visible) */}
      <div className="velocity-indicator">
        <div className="velocity-bar">
          <div 
            className="velocity-fill"
            style={{ 
              width: `${Math.min(100, (rushState.currentVelocity / finalConfig.threshold) * 100)}%`,
              backgroundColor: rushState.isActive ? '#dc3545' : '#28a745'
            }}
          />
        </div>
        <span className="velocity-text">
          {rushState.currentVelocity}/{finalConfig.threshold} porosite (10min)
        </span>
      </div>

      {children}

      <style jsx>{`
        .rush-mode-banner {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          color: white;
          padding: 16px;
          margin-bottom: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
          animation: rush-banner-pulse 2s infinite;
        }

        .rush-mode-banner.intensity-high {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          animation: rush-banner-pulse 1.5s infinite;
        }

        .rush-mode-banner.intensity-extreme {
          background: linear-gradient(135deg, #8B0000 0%, #dc3545 100%);
          animation: rush-banner-pulse 1s infinite;
        }

        @keyframes rush-banner-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
          }
          50% { 
            transform: scale(1.01);
            box-shadow: 0 6px 25px rgba(255, 107, 53, 0.5);
          }
        }

        .rush-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .rush-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rush-icon {
          font-size: 32px;
          animation: icon-flash 1s infinite;
        }

        @keyframes icon-flash {
          0%, 50% { opacity: 1; }
          25%, 75% { opacity: 0.7; }
        }

        .rush-title {
          display: flex;
          flex-direction: column;
        }

        .rush-text {
          font-size: 24px;
          font-weight: 900;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .rush-subtitle {
          font-size: 14px;
          opacity: 0.9;
          font-weight: 600;
        }

        .rush-stats {
          display: flex;
          gap: 24px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 900;
          line-height: 1;
        }

        .stat-label {
          font-size: 11px;
          opacity: 0.8;
          font-weight: 500;
        }

        .rush-actions {
          display: flex;
          gap: 12px;
        }

        .priority-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .priority-button:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.8);
        }

        .intensity-indicator {
          position: absolute;
          top: 8px;
          right: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .intensity-bars {
          display: flex;
          gap: 2px;
        }

        .intensity-bar {
          width: 4px;
          height: 16px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          transition: all 0.2s ease;
        }

        .intensity-bar.active {
          background: white;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
        }

        .intensity-label {
          font-size: 8px;
          font-weight: 700;
          opacity: 0.8;
        }

        .velocity-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding: 8px 16px;
          background: rgba(248, 249, 250, 0.8);
          border-radius: 8px;
          font-size: 14px;
        }

        .velocity-bar {
          flex: 1;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .velocity-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 4px;
        }

        .velocity-text {
          color: #495057;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .rush-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .rush-stats {
            gap: 16px;
          }

          .stat-value {
            font-size: 18px;
          }

          .intensity-indicator {
            position: static;
            margin-top: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default RushModeDetector;