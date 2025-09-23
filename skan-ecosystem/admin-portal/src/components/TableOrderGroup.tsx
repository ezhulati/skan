/**
 * Table Order Group Component
 * Groups multiple orders from the same table together for better kitchen flow
 */

import React, { useMemo } from 'react';
import { Order } from '../services/api';
import EnhancedKDSCard from './EnhancedKDSCard';

interface TableOrderGroupProps {
  tableNumber: string;
  orders: Order[];
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onLongPress?: (orderId: string) => void;
  getStatusColor: (status: string) => string;
  getNextStatus: (status: string) => string | null;
  getStatusDisplayName: (status: string) => string;
  deviceType: 'phone' | 'tablet' | 'tv';
  lockedOrders?: { [orderId: string]: string }; // orderId -> lockedBy
}

const TableOrderGroup: React.FC<TableOrderGroupProps> = ({
  tableNumber,
  orders,
  onStatusUpdate,
  onLongPress,
  getStatusColor,
  getNextStatus,
  getStatusDisplayName,
  deviceType,
  lockedOrders = {}
}) => {
  // Calculate group statistics
  const groupStats = useMemo(() => {
    const total = orders.length;
    const byStatus = orders.reduce((acc, order) => {
      const status = order.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Determine overall readiness
    const allReady = orders.every(order => ['ready', 'served'].includes(order.status));
    const allServed = orders.every(order => order.status === 'served');
    const hasActive = orders.some(order => ['new', 'preparing'].includes(order.status));

    return {
      total,
      byStatus,
      allReady,
      allServed,
      hasActive
    };
  }, [orders]);

  // Sort orders by creation time (oldest first) and identify oldest per status
  const { sortedOrders, oldestByStatus } = useMemo(() => {
    const sorted = [...orders].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Find the oldest order for each status (FIFO highlighting)
    const oldestMap: { [status: string]: string } = {};
    sorted.forEach(order => {
      if (!oldestMap[order.status]) {
        oldestMap[order.status] = order.id;
      }
    });
    
    return { sortedOrders: sorted, oldestByStatus: oldestMap };
  }, [orders]);

  // Calculate estimated completion time for the group
  const getGroupEstimate = useMemo(() => {
    if (groupStats.allServed) return null;
    if (groupStats.allReady) return 'Gati për Shërbim';

    const activeOrders = orders.filter(order => ['new', 'preparing'].includes(order.status));
    if (activeOrders.length === 0) return null;

    // Estimate based on longest remaining order
    const maxMinutes = Math.max(...activeOrders.map(order => {
      const elapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
      const target = 15; // Default target time
      return Math.max(0, target - elapsed);
    }));

    return maxMinutes > 0 ? `~${Math.ceil(maxMinutes)} min` : 'Afër gatis';
  }, [orders, groupStats.allReady, groupStats.allServed]);

  // Get group urgency level
  const getGroupUrgency = useMemo(() => {
    const oldestOrder = sortedOrders[0];
    if (!oldestOrder || groupStats.allServed) return 'normal';

    const elapsedMinutes = (Date.now() - new Date(oldestOrder.createdAt).getTime()) / (1000 * 60);
    
    if (elapsedMinutes > 25) return 'critical';
    if (elapsedMinutes > 15) return 'warning';
    if (elapsedMinutes > 10) return 'attention';
    return 'normal';
  }, [sortedOrders, groupStats.allServed]);

  const getGroupHeaderColor = () => {
    switch (getGroupUrgency) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ff6b35';
      case 'attention': return '#ffc107';
      default: return '#6c757d';
    }
  };

  if (orders.length === 1) {
    // Single order - render as individual card
    const order = orders[0];
    return (
      <EnhancedKDSCard
        order={order}
        onStatusUpdate={onStatusUpdate}
        onLongPress={onLongPress}
        isLocked={!!lockedOrders[order.id]}
        lockedBy={lockedOrders[order.id]}
        getStatusColor={getStatusColor}
        getNextStatus={getNextStatus}
        getStatusDisplayName={getStatusDisplayName}
        deviceType={deviceType}
      />
    );
  }

  return (
    <div className={`table-order-group urgency-${getGroupUrgency} device-${deviceType}`}>
      {/* Group Header */}
      <div 
        className="group-header"
        style={{ borderLeftColor: getGroupHeaderColor() }}
      >
        <div className="table-info">
          <span className="table-label">Tavolina</span>
          <span className="table-number">{tableNumber}</span>
          <span className="order-count">({orders.length} porosite)</span>
        </div>
        
        <div className="group-stats">
          {getGroupEstimate && (
            <div className="estimate">
              <span className="estimate-icon">⏱️</span>
              <span className="estimate-text">{getGroupEstimate}</span>
            </div>
          )}
          
          <div className="status-summary">
            {Object.entries(groupStats.byStatus).map(([status, count]) => (
              <div 
                key={status}
                className="status-badge"
                style={{ backgroundColor: getStatusColor(status) }}
              >
                {count}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Cards */}
      <div className="group-orders">
        {sortedOrders.map((order) => {
          const isOldestInStatus = oldestByStatus[order.status] === order.id;
          
          return (
            <div 
              key={order.id} 
              className={`order-wrapper ${isOldestInStatus ? 'oldest-in-status' : ''}`}
            >
              {isOldestInStatus && (
                <div className="fifo-indicator">
                  <span className="fifo-icon">⚠️</span>
                  <span className="fifo-text">NAJSTARIJE</span>
                </div>
              )}
              <EnhancedKDSCard
                order={order}
                onStatusUpdate={onStatusUpdate}
                onLongPress={onLongPress}
                isLocked={!!lockedOrders[order.id]}
                lockedBy={lockedOrders[order.id]}
                getStatusColor={getStatusColor}
                getNextStatus={getNextStatus}
                getStatusDisplayName={getStatusDisplayName}
                deviceType={deviceType}
              />
            </div>
          );
        })}
      </div>

      {/* Group Actions (for tablet/TV mode) */}
      {deviceType !== 'phone' && groupStats.hasActive && (
        <div className="group-actions">
          <button 
            className="group-action-button advance-all"
            onClick={() => {
              // Advance all orders that can be advanced
              orders.forEach(order => {
                const nextStatus = getNextStatus(order.status);
                if (nextStatus && !lockedOrders[order.id]) {
                  onStatusUpdate(order.id, nextStatus);
                }
              });
            }}
          >
            <span className="action-icon">⚡</span>
            <span className="action-text">Përditëso Të Gjitha</span>
          </button>
        </div>
      )}

      <style jsx>{`
        .table-order-group {
          background: #f8f9fa;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
          border-left: 4px solid #e0e0e0;
          transition: all 0.2s ease;
        }

        .table-order-group.urgency-attention {
          border-left-color: #ffc107;
          background: linear-gradient(90deg, rgba(255, 193, 7, 0.03) 0%, #f8f9fa 100%);
        }

        .table-order-group.urgency-warning {
          border-left-color: #ff6b35;
          background: linear-gradient(90deg, rgba(255, 107, 53, 0.05) 0%, #f8f9fa 100%);
        }

        .table-order-group.urgency-critical {
          border-left-color: #dc3545;
          background: linear-gradient(90deg, rgba(220, 53, 69, 0.08) 0%, #f8f9fa 100%);
          animation: group-pulse 2s infinite;
        }

        @keyframes group-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }

        .group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: white;
          border-radius: 12px;
          margin-bottom: 12px;
          border-left: 4px solid #e0e0e0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .table-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .table-label {
          font-size: 14px;
          color: #6c757d;
          font-weight: 500;
        }

        .table-number {
          font-size: 20px;
          font-weight: 700;
          color: #2c3e50;
        }

        .order-count {
          font-size: 14px;
          color: #6c757d;
          font-weight: 500;
        }

        .group-stats {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .estimate {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(76, 175, 80, 0.1);
          color: #2e7d32;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
        }

        .status-summary {
          display: flex;
          gap: 6px;
        }

        .status-badge {
          min-width: 24px;
          height: 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        .group-orders {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .order-wrapper {
          position: relative;
        }

        .order-wrapper.oldest-in-status {
          border-left: 4px solid #ff6b35;
          border-radius: 8px;
          padding-left: 8px;
          background: linear-gradient(90deg, rgba(255, 107, 53, 0.05) 0%, transparent 100%);
        }

        .fifo-indicator {
          position: absolute;
          top: -8px;
          left: 8px;
          background: #ff6b35;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(255, 107, 53, 0.3);
        }

        .fifo-icon {
          font-size: 8px;
        }

        .fifo-text {
          font-size: 9px;
        }

        .group-actions {
          margin-top: 12px;
          display: flex;
          justify-content: center;
        }

        .group-action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .group-action-button:hover {
          background: #0056b3;
          transform: translateY(-1px);
        }

        .action-icon {
          font-size: 16px;
        }

        .action-text {
          font-size: 14px;
        }

        /* Device-specific styles */
        .device-phone .table-order-group {
          padding: 12px;
          margin-bottom: 12px;
        }

        .device-phone .group-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .device-phone .group-stats {
          width: 100%;
          justify-content: space-between;
        }

        .device-tv .table-order-group {
          margin-bottom: 20px;
        }

        .device-tv .table-number {
          font-size: 24px;
        }

        .device-tv .group-orders {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }
      `}</style>
    </div>
  );
};

export default TableOrderGroup;