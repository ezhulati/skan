/**
 * Connection Status Bar Component
 * Shows real-time connection status with WebSocket and API connectivity
 */

import React, { useState, useEffect, useCallback } from 'react';

interface ConnectionStatus {
  websocket: 'connected' | 'connecting' | 'disconnected' | 'error';
  api: 'connected' | 'slow' | 'disconnected' | 'error';
  lastSync: Date | null;
  latency: number | null;
  reconnectAttempts: number;
}

interface ConnectionStatusBarProps {
  websocketConnected?: boolean;
  websocketConnecting?: boolean;
  websocketError?: string | null;
  onRefresh?: () => void;
  onReconnect?: () => void;
}

const ConnectionStatusBar: React.FC<ConnectionStatusBarProps> = ({
  websocketConnected = false,
  websocketConnecting = false,
  websocketError = null,
  onRefresh,
  onReconnect
}) => {
  const [status, setStatus] = useState<ConnectionStatus>({
    websocket: 'disconnected',
    api: 'connected',
    lastSync: null,
    latency: null,
    reconnectAttempts: 0
  });
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Update WebSocket status based on props
  useEffect(() => {
    let wsStatus: ConnectionStatus['websocket'] = 'disconnected';
    
    if (websocketError) {
      wsStatus = 'error';
    } else if (websocketConnecting) {
      wsStatus = 'connecting';
    } else if (websocketConnected) {
      wsStatus = 'connected';
    }

    setStatus(prev => ({
      ...prev,
      websocket: wsStatus,
      lastSync: wsStatus === 'connected' ? new Date() : prev.lastSync,
      reconnectAttempts: wsStatus === 'connected' ? 0 : prev.reconnectAttempts
    }));

    setLastUpdateTime(new Date());
  }, [websocketConnected, websocketConnecting, websocketError]);

  // Test API connectivity periodically
  const testApiConnectivity = useCallback(async () => {
    try {
      const startTime = Date.now();
      
      // Test with a simple health check or time endpoint
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const latency = Date.now() - startTime;
      
      setStatus(prev => ({
        ...prev,
        api: response.ok ? (latency > 2000 ? 'slow' : 'connected') : 'error',
        latency: response.ok ? latency : null,
        lastSync: response.ok ? new Date() : prev.lastSync
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        api: 'disconnected',
        latency: null
      }));
    }
  }, []);

  // Test API connectivity every 30 seconds
  useEffect(() => {
    testApiConnectivity();
    const interval = setInterval(testApiConnectivity, 30000);
    return () => clearInterval(interval);
  }, [testApiConnectivity]);

  // Auto-hide status bar when everything is working well
  useEffect(() => {
    const shouldBeVisible = 
      status.websocket !== 'connected' || 
      status.api !== 'connected' || 
      (status.latency !== null && status.latency > 1000);
    
    setIsVisible(!!shouldBeVisible);
  }, [status]);

  // Get overall connection quality
  const getConnectionQuality = () => {
    if (status.websocket === 'error' || status.api === 'error') return 'error';
    if (status.websocket === 'disconnected' || status.api === 'disconnected') return 'offline';
    if (status.websocket === 'connecting' || status.api === 'slow') return 'poor';
    if (status.websocket === 'connected' && status.api === 'connected') return 'excellent';
    return 'poor';
  };

  // Format time since last sync
  const getTimeSinceSync = () => {
    if (!status.lastSync) return 'Asnjëherë';
    
    const seconds = Math.floor((Date.now() - status.lastSync.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s më parë`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min më parë`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h më parë`;
  };

  const quality = getConnectionQuality();
  const timeSinceSync = getTimeSinceSync();

  // Don't render if connection is excellent and user doesn't need to see it
  if (!isVisible && quality === 'excellent') {
    return (
      <div className="connection-indicator-minimal">
        <div className="connection-dot connected" title="Lidhja është aktive">
          🟢
        </div>
      </div>
    );
  }

  return (
    <div className={`connection-status-bar quality-${quality}`}>
      <div className="connection-content">
        {/* Main status indicator */}
        <div className="status-indicator">
          {quality === 'excellent' && (
            <>
              <span className="status-icon">🟢</span>
              <span className="status-text">E Lidhur - Përditësimet në Kohë Reale</span>
            </>
          )}
          {quality === 'poor' && (
            <>
              <span className="status-icon">🟡</span>
              <span className="status-text">
                {status.websocket === 'connecting' ? 'Duke u lidhur...' : 'Lidhje e Ngadaltë'}
              </span>
            </>
          )}
          {quality === 'offline' && (
            <>
              <span className="status-icon">🔴</span>
              <span className="status-text">Offline - Godit për të rifreskuar</span>
            </>
          )}
          {quality === 'error' && (
            <>
              <span className="status-icon">⚠️</span>
              <span className="status-text">Problem Lidhjeje - Kontrollo internetin</span>
            </>
          )}
        </div>

        {/* Detailed connection info */}
        <div className="connection-details">
          <div className="detail-item">
            <span className="detail-label">Kohë Reale:</span>
            <span className={`detail-value ${status.websocket}`}>
              {status.websocket === 'connected' && '✓ Aktiv'}
              {status.websocket === 'connecting' && '⟳ Duke u lidhur'}
              {status.websocket === 'disconnected' && '✗ I shkëputur'}
              {status.websocket === 'error' && '⚠ Gabim'}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">API:</span>
            <span className={`detail-value ${status.api}`}>
              {status.api === 'connected' && '✓ Aktiv'}
              {status.api === 'slow' && '⚠ I ngadaltë'}
              {status.api === 'disconnected' && '✗ I shkëputur'}
              {status.api === 'error' && '⚠ Gabim'}
            </span>
          </div>

          {status.latency && (
            <div className="detail-item">
              <span className="detail-label">Latency:</span>
              <span className="detail-value">{status.latency}ms</span>
            </div>
          )}

          <div className="detail-item">
            <span className="detail-label">Sinkronizimi:</span>
            <span className="detail-value">{timeSinceSync}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="connection-actions">
          {quality !== 'excellent' && onRefresh && (
            <button 
              className="action-button refresh"
              onClick={onRefresh}
              title="Rifresko të dhënat"
            >
              🔄 Rifresko
            </button>
          )}
          
          {(status.websocket === 'disconnected' || status.websocket === 'error') && onReconnect && (
            <button 
              className="action-button reconnect"
              onClick={onReconnect}
              title="Përpjeku të lidhesh përsëri"
            >
              🔌 Lidhu Përsëri
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for connecting state */}
      {status.websocket === 'connecting' && (
        <div className="connecting-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      )}

      <style jsx>{`
        .connection-indicator-minimal {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 1000;
          font-size: 12px;
        }

        .connection-dot {
          cursor: pointer;
        }

        .connection-status-bar {
          position: sticky;
          top: 0;
          z-index: 999;
          background: white;
          border-bottom: 1px solid #e9ecef;
          padding: 12px 16px;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .connection-status-bar.quality-excellent {
          background: linear-gradient(90deg, rgba(76, 175, 80, 0.1) 0%, white 100%);
          border-bottom-color: #4caf50;
        }

        .connection-status-bar.quality-poor {
          background: linear-gradient(90deg, rgba(255, 193, 7, 0.1) 0%, white 100%);
          border-bottom-color: #ffc107;
        }

        .connection-status-bar.quality-offline {
          background: linear-gradient(90deg, rgba(255, 152, 0, 0.1) 0%, white 100%);
          border-bottom-color: #ff9800;
        }

        .connection-status-bar.quality-error {
          background: linear-gradient(90deg, rgba(220, 53, 69, 0.1) 0%, white 100%);
          border-bottom-color: #dc3545;
          animation: error-pulse 2s infinite;
        }

        @keyframes error-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }

        .connection-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .status-icon {
          font-size: 16px;
        }

        .status-text {
          color: #2c3e50;
        }

        .connection-details {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .detail-item {
          display: flex;
          gap: 6px;
          align-items: center;
          font-size: 12px;
        }

        .detail-label {
          color: #6c757d;
          font-weight: 500;
        }

        .detail-value {
          font-weight: 600;
        }

        .detail-value.connected {
          color: #28a745;
        }

        .detail-value.connecting {
          color: #ffc107;
        }

        .detail-value.disconnected {
          color: #dc3545;
        }

        .detail-value.error {
          color: #dc3545;
        }

        .detail-value.slow {
          color: #ff9800;
        }

        .connection-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          background: transparent;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          background: #f8f9fa;
          border-color: #6c757d;
        }

        .action-button.refresh {
          color: #007bff;
          border-color: #007bff;
        }

        .action-button.refresh:hover {
          background: #007bff;
          color: white;
        }

        .action-button.reconnect {
          color: #28a745;
          border-color: #28a745;
        }

        .action-button.reconnect:hover {
          background: #28a745;
          color: white;
        }

        .connecting-progress {
          margin-top: 8px;
        }

        .progress-bar {
          width: 100%;
          height: 3px;
          background: #e9ecef;
          border-radius: 1.5px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #ffc107;
          border-radius: 1.5px;
          animation: progress-animation 1.5s infinite;
        }

        @keyframes progress-animation {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 30%; margin-left: 70%; }
          100% { width: 0%; margin-left: 100%; }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .connection-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .connection-details {
            gap: 12px;
          }

          .connection-actions {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatusBar;