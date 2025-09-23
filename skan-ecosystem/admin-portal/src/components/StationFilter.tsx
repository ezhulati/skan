/**
 * Station Filter Component
 * Allows kitchen staff to filter orders by cooking stations (Grill, Fryer, Cold, Drinks)
 */

import React, { useMemo } from 'react';
import { Order } from '../services/api';

interface StationConfig {
  id: string;
  name: string;
  nameAlbanian: string;
  color: string;
  icon: string;
  keywords: string[];
}

const STATIONS: StationConfig[] = [
  {
    id: 'all',
    name: 'All',
    nameAlbanian: 'Të Gjitha',
    color: '#6c757d',
    icon: '🍽️',
    keywords: []
  },
  {
    id: 'grill',
    name: 'Grill',
    nameAlbanian: 'Skara',
    color: '#FF5722',
    icon: '🔥',
    keywords: ['burger', 'meat', 'grilled', 'steak', 'chicken', 'beef', 'pork', 'lamb', 'kos', 'mish', 'skara']
  },
  {
    id: 'fryer',
    name: 'Fryer',
    nameAlbanian: 'Skuqës',
    color: '#FFC107',
    icon: '🍟',
    keywords: ['fries', 'fried', 'chips', 'tempura', 'crispy', 'patate', 'skuq', 'patatina']
  },
  {
    id: 'cold',
    name: 'Cold',
    nameAlbanian: 'Të Ftohta',
    color: '#2196F3',
    icon: '🥗',
    keywords: ['salad', 'cold', 'fresh', 'raw', 'sallat', 'ftoht', 'domat', 'kastrave']
  },
  {
    id: 'drinks',
    name: 'Drinks',
    nameAlbanian: 'Pije',
    color: '#4CAF50',
    icon: '🍺',
    keywords: ['beer', 'water', 'coca', 'juice', 'coffee', 'tea', 'drink', 'pije', 'birr', 'ujë', 'kafe']
  },
  {
    id: 'hot',
    name: 'Hot Kitchen',
    nameAlbanian: 'Kuzhinë Nxehtë',
    color: '#FF9800',
    icon: '🍲',
    keywords: ['pasta', 'soup', 'rice', 'hot', 'cooked', 'nxeht', 'supë', 'makarona', 'oriz']
  }
];

interface StationFilterProps {
  orders: Order[];
  selectedStation: string;
  onStationChange: (stationId: string) => void;
  deviceType: 'phone' | 'tablet' | 'tv';
}

const StationFilter: React.FC<StationFilterProps> = ({
  orders,
  selectedStation,
  onStationChange,
  deviceType
}) => {
  // Categorize orders by station
  const ordersByStation = useMemo(() => {
    const categorized: { [stationId: string]: Order[] } = {};
    
    // Initialize all stations
    STATIONS.forEach(station => {
      categorized[station.id] = [];
    });

    orders.forEach(order => {
      let stationAssigned = false;
      
      // Check each item in the order
      order.items.forEach(item => {
        const itemName = item.name.toLowerCase();
        
        // Try to match with station keywords
        for (const station of STATIONS.slice(1)) { // Skip 'all' station
          if (station.keywords.some(keyword => itemName.includes(keyword))) {
            if (!categorized[station.id].find(o => o.id === order.id)) {
              categorized[station.id].push(order);
            }
            stationAssigned = true;
            break;
          }
        }
      });
      
      // If no station matched, assign to hot kitchen by default
      if (!stationAssigned) {
        categorized['hot'].push(order);
      }
      
      // Always include in 'all'
      categorized['all'].push(order);
    });

    return categorized;
  }, [orders]);

  // Get station counts for badges
  const getStationCount = (stationId: string): number => {
    return ordersByStation[stationId]?.length || 0;
  };

  // Get active order count for a station (excluding served orders)
  const getActiveStationCount = (stationId: string): number => {
    return ordersByStation[stationId]?.filter(order => 
      !['served', '9'].includes(order.status)
    ).length || 0;
  };

  // Determine if station has urgent orders
  const hasUrgentOrders = (stationId: string): boolean => {
    if (stationId === 'all') return false;
    
    return ordersByStation[stationId]?.some(order => {
      const elapsedMinutes = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
      return elapsedMinutes > 15 && !['served', '9'].includes(order.status);
    }) || false;
  };

  return (
    <div className={`station-filter device-${deviceType}`}>
      <div className="station-tabs">
        {STATIONS.map(station => {
          const count = getStationCount(station.id);
          const activeCount = getActiveStationCount(station.id);
          const isSelected = selectedStation === station.id;
          const isUrgent = hasUrgentOrders(station.id);

          return (
            <button
              key={station.id}
              className={`station-tab ${isSelected ? 'selected' : ''} ${isUrgent ? 'urgent' : ''}`}
              onClick={() => onStationChange(station.id)}
              style={{
                '--station-color': station.color,
                backgroundColor: isSelected ? station.color : 'transparent',
                color: isSelected ? 'white' : station.color,
                borderColor: station.color
              } as React.CSSProperties}
            >
              <div className="station-content">
                <span className="station-icon">{station.icon}</span>
                <span className="station-name">{station.nameAlbanian}</span>
                
                {count > 0 && (
                  <div className="station-badges">
                    {activeCount > 0 && (
                      <span className={`count-badge active ${isUrgent ? 'urgent' : ''}`}>
                        {activeCount}
                      </span>
                    )}
                    {count !== activeCount && (
                      <span className="count-badge total">
                        {count}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {isUrgent && (
                <div className="urgent-indicator">
                  <span className="urgent-icon">⚠️</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick stats for selected station */}
      {selectedStation !== 'all' && (
        <div className="station-stats">
          <div className="stat-item">
            <span className="stat-label">Aktive:</span>
            <span className="stat-value">{getActiveStationCount(selectedStation)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Gjithsej:</span>
            <span className="stat-value">{getStationCount(selectedStation)}</span>
          </div>
          {hasUrgentOrders(selectedStation) && (
            <div className="stat-item urgent">
              <span className="stat-label">⚠️ Urgjente:</span>
              <span className="stat-value">
                {ordersByStation[selectedStation]?.filter(order => {
                  const elapsedMinutes = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
                  return elapsedMinutes > 15 && !['served', '9'].includes(order.status);
                }).length || 0}
              </span>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .station-filter {
          margin-bottom: 20px;
        }

        .station-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-start;
        }

        .station-tab {
          position: relative;
          background: transparent;
          border: 2px solid;
          border-radius: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .station-tab:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .station-tab.selected {
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .station-tab.urgent {
          animation: urgent-pulse 2s infinite;
        }

        @keyframes urgent-pulse {
          0%, 100% { 
            border-color: var(--station-color);
          }
          50% { 
            border-color: #dc3545;
            box-shadow: 0 0 15px rgba(220, 53, 69, 0.3);
          }
        }

        .station-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
        }

        .station-icon {
          font-size: 20px;
        }

        .station-name {
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          line-height: 1.2;
        }

        .station-badges {
          display: flex;
          gap: 4px;
          margin-top: 2px;
        }

        .count-badge {
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }

        .count-badge.active {
          background: #dc3545;
          color: white;
        }

        .count-badge.active.urgent {
          background: #8B0000;
          animation: badge-pulse 1s infinite;
        }

        .count-badge.total {
          background: rgba(108, 117, 125, 0.2);
          color: #495057;
        }

        @keyframes badge-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .urgent-indicator {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #dc3545;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .urgent-icon {
          font-size: 8px;
        }

        .station-stats {
          display: flex;
          gap: 16px;
          margin-top: 12px;
          padding: 8px 16px;
          background: rgba(248, 249, 250, 0.8);
          border-radius: 8px;
          font-size: 14px;
        }

        .stat-item {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .stat-item.urgent {
          color: #dc3545;
          font-weight: 600;
        }

        .stat-label {
          color: #6c757d;
          font-weight: 500;
        }

        .stat-value {
          font-weight: 700;
          color: #2c3e50;
        }

        /* Device-specific styles */
        .device-phone .station-tabs {
          justify-content: space-between;
        }

        .device-phone .station-tab {
          flex: 1;
          min-width: 0;
          padding: 10px 8px;
        }

        .device-phone .station-name {
          font-size: 10px;
        }

        .device-phone .station-icon {
          font-size: 18px;
        }

        .device-phone .station-stats {
          flex-direction: column;
          gap: 8px;
        }

        .device-tv .station-tab {
          min-width: 120px;
          padding: 16px 20px;
        }

        .device-tv .station-icon {
          font-size: 24px;
        }

        .device-tv .station-name {
          font-size: 14px;
        }

        .device-tv .station-stats {
          justify-content: center;
          gap: 24px;
        }
      `}</style>
    </div>
  );
};

export default StationFilter;