/**
 * KDS 2.0 Layout - The Ultimate Kitchen Display System
 * Combines all enhanced features for a production-ready kitchen experience
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Order } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocketContext } from '../contexts/WebSocketContext';

// Import all our enhanced components
import ConnectionStatusBar from './ConnectionStatusBar';
import RushModeDetector from './RushModeDetector';
import StationFilter from './StationFilter';
import TableOrderGroup from './TableOrderGroup';
import useOrderLocking from '../hooks/useOrderLocking';

interface KDS2LayoutProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onRefresh?: () => void;
  deviceType: 'phone' | 'tablet' | 'tv';
  getStatusColor: (status: string) => string;
  getNextStatus: (status: string) => string | null;
  getStatusDisplayName: (status: string) => string;
}

const KDS2Layout: React.FC<KDS2LayoutProps> = ({
  orders,
  onStatusUpdate,
  onRefresh,
  deviceType,
  getStatusColor,
  getNextStatus,
  getStatusDisplayName
}) => {
  const { auth } = useAuth();
  const webSocket = useWebSocketContext();
  
  // State management
  const [selectedStation, setSelectedStation] = useState('all');
  const [rushModeActive, setRushModeActive] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState<string | null>(null);

  // Order locking for collision prevention
  const orderLocking = useOrderLocking({
    lockDurationMinutes: 3,
    onLockConflict: (orderId, lockedBy) => {
      console.log(`Order ${orderId} is being worked on by ${lockedBy}`);
      // Could show a toast notification here
    },
    onLockExpired: (orderId) => {
      console.log(`Lock expired for order ${orderId}`);
    }
  });

  // Enhanced status update with automatic locking
  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: string) => {
    // Try to lock the order first
    const locked = await orderLocking.lockOrder(orderId);
    if (!locked) {
      // Order is locked by someone else
      return;
    }

    try {
      // Perform the status update
      await onStatusUpdate(orderId, newStatus);
      
      // Keep the lock for a short time to prevent conflicts
      setTimeout(() => {
        orderLocking.unlockOrder(orderId);
      }, 2000);
    } catch (error) {
      // Release lock on error
      orderLocking.unlockOrder(orderId);
      console.error('Status update failed:', error);
    }
  }, [onStatusUpdate, orderLocking]);

  // Handle long press for order details
  const handleLongPress = useCallback((orderId: string) => {
    setShowOrderDetails(orderId);
  }, []);

  // Filter orders by station
  const stationFilteredOrders = useMemo(() => {
    if (selectedStation === 'all') return orders;

    return orders.filter(order => {
      const itemNames = order.items.map(item => item.name.toLowerCase()).join(' ');
      
      switch (selectedStation) {
        case 'grill':
          return ['burger', 'meat', 'grilled', 'steak', 'chicken', 'beef', 'kos', 'mish', 'skara']
            .some(keyword => itemNames.includes(keyword));
        case 'fryer':
          return ['fries', 'fried', 'chips', 'patate', 'skuq', 'patatina']
            .some(keyword => itemNames.includes(keyword));
        case 'cold':
          return ['salad', 'cold', 'fresh', 'sallat', 'ftoht', 'domat', 'kastrave']
            .some(keyword => itemNames.includes(keyword));
        case 'drinks':
          return ['beer', 'water', 'coca', 'juice', 'coffee', 'pije', 'birr', 'ujë', 'kafe']
            .some(keyword => itemNames.includes(keyword));
        case 'hot':
          return ['pasta', 'soup', 'rice', 'nxeht', 'supë', 'makarona', 'oriz']
            .some(keyword => itemNames.includes(keyword));
        default:
          return true;
      }
    });
  }, [orders, selectedStation]);

  // Group orders by table
  const tableGroups = useMemo(() => {
    const groups: { [tableNumber: string]: Order[] } = {};
    
    stationFilteredOrders.forEach(order => {
      const table = order.tableNumber;
      if (!groups[table]) {
        groups[table] = [];
      }
      groups[table].push(order);
    });

    // Sort groups by urgency (oldest orders first)
    return Object.entries(groups)
      .map(([tableNumber, tableOrders]) => ({
        tableNumber,
        orders: tableOrders.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      }))
      .sort((a, b) => {
        // Sort by oldest order in each group
        const aOldest = new Date(a.orders[0]?.createdAt || 0).getTime();
        const bOldest = new Date(b.orders[0]?.createdAt || 0).getTime();
        return aOldest - bOldest;
      });
  }, [stationFilteredOrders]);

  // Handle rush mode changes
  const handleRushModeChange = useCallback((isActive: boolean) => {
    setRushModeActive(isActive);
    
    if (isActive) {
      // Auto-prioritize by preparation time during rush
      console.log('Rush mode activated - prioritizing orders by prep time');
    }
  }, []);

  // Auto-select most urgent station during rush mode
  useEffect(() => {
    if (rushModeActive && selectedStation === 'all') {
      // Find station with most urgent orders
      const stationUrgency = ['grill', 'fryer', 'hot', 'cold', 'drinks'].map(station => {
        const stationOrders = orders.filter(order => {
          const itemNames = order.items.map(item => item.name.toLowerCase()).join(' ');
          
          switch (station) {
            case 'grill':
              return ['burger', 'meat', 'grilled', 'steak', 'chicken', 'beef', 'kos', 'mish', 'skara']
                .some(keyword => itemNames.includes(keyword));
            case 'fryer':
              return ['fries', 'fried', 'chips', 'patate', 'skuq', 'patatina']
                .some(keyword => itemNames.includes(keyword));
            case 'cold':
              return ['salad', 'cold', 'fresh', 'sallat', 'ftoht', 'domat', 'kastrave']
                .some(keyword => itemNames.includes(keyword));
            case 'drinks':
              return ['beer', 'water', 'coca', 'juice', 'coffee', 'pije', 'birr', 'ujë', 'kafe']
                .some(keyword => itemNames.includes(keyword));
            case 'hot':
              return ['pasta', 'soup', 'rice', 'nxeht', 'supë', 'makarona', 'oriz']
                .some(keyword => itemNames.includes(keyword));
            default:
              return false;
          }
        });

        const urgentCount = stationOrders.filter(order => {
          const elapsedMinutes = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
          return elapsedMinutes > 10 && !['served', '9'].includes(order.status);
        }).length;

        return { station, urgentCount, totalCount: stationOrders.length };
      });

      const mostUrgentStation = stationUrgency
        .filter(s => s.urgentCount > 0)
        .sort((a, b) => b.urgentCount - a.urgentCount)[0];

      if (mostUrgentStation) {
        setSelectedStation(mostUrgentStation.station);
      }
    }
  }, [rushModeActive, selectedStation, orders]);

  return (
    <div className={`kds2-layout device-${deviceType} ${rushModeActive ? 'rush-mode' : ''}`}>
      {/* Connection Status Bar */}
      <ConnectionStatusBar
        websocketConnected={webSocket.connected}
        websocketConnecting={webSocket.connecting}
        websocketError={webSocket.error}
        onRefresh={onRefresh}
        onReconnect={webSocket.toggleConnection}
      />

      {/* Rush Mode Detector */}
      <RushModeDetector
        orders={orders}
        onRushModeChange={handleRushModeChange}
        config={{
          threshold: 8,
          timeWindowMinutes: 10,
          sustainedMinutes: 2
        }}
      />

      {/* Station Filter */}
      <StationFilter
        orders={orders}
        selectedStation={selectedStation}
        onStationChange={setSelectedStation}
        deviceType={deviceType}
      />

      {/* Orders Display */}
      <div className="orders-container">
        {tableGroups.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-content">
              <span className="no-orders-icon">🍽️</span>
              <h3>Nuk ka porosite</h3>
              <p>
                {selectedStation === 'all' 
                  ? 'Nuk ka porosite aktive në sistem'
                  : `Nuk ka porosite për stacionin e zgjedhur`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="table-groups">
            {tableGroups.map(({ tableNumber, orders: tableOrders }) => (
              <TableOrderGroup
                key={tableNumber}
                tableNumber={tableNumber}
                orders={tableOrders}
                onStatusUpdate={handleStatusUpdate}
                onLongPress={handleLongPress}
                getStatusColor={getStatusColor}
                getNextStatus={getNextStatus}
                getStatusDisplayName={getStatusDisplayName}
                deviceType={deviceType}
                lockedOrders={orderLocking.lockedOrders}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal (for long press) */}
      {showOrderDetails && (
        <div className="order-details-modal" onClick={() => setShowOrderDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detajet e Porosisë</h3>
              <button 
                className="close-button"
                onClick={() => setShowOrderDetails(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Order details would go here */}
              <p>Detajet e plotë për porosinë {showOrderDetails}</p>
              {/* TODO: Implement full order details view */}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .kds2-layout {
          min-height: 100vh;
          background: #f8f9fa;
          position: relative;
        }

        .kds2-layout.rush-mode {
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.03) 0%, #f8f9fa 100%);
        }

        .orders-container {
          padding: 16px;
          max-width: 100%;
          margin: 0 auto;
        }

        .table-groups {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .no-orders {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          text-align: center;
        }

        .no-orders-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          opacity: 0.6;
        }

        .no-orders-icon {
          font-size: 64px;
        }

        .no-orders-content h3 {
          margin: 0;
          color: #6c757d;
          font-size: 24px;
        }

        .no-orders-content p {
          margin: 0;
          color: #6c757d;
          font-size: 16px;
          max-width: 400px;
        }

        .order-details-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #6c757d;
          padding: 4px;
          border-radius: 4px;
        }

        .close-button:hover {
          background: #f8f9fa;
          color: #495057;
        }

        .modal-body {
          color: #495057;
        }

        /* Device-specific styles */
        .device-phone .orders-container {
          padding: 12px;
        }

        .device-phone .table-groups {
          gap: 12px;
        }

        .device-tv .orders-container {
          padding: 24px;
          max-width: none;
        }

        .device-tv .table-groups {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        /* Rush mode animations */
        .rush-mode .orders-container {
          animation: rush-subtle-pulse 3s infinite;
        }

        @keyframes rush-subtle-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.002); }
        }
      `}</style>
    </div>
  );
};

export default KDS2Layout;