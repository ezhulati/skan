import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface WelcomeHeaderProps {
  ordersCount?: number;
  todayRevenue?: number;
  activeOrders?: number;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ 
  ordersCount = 0, 
  todayRevenue = 0, 
  activeOrders = 0 
}) => {
  const { auth } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Smooth entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) {
      return {
        text: 'Mirëmëngjes',
        emoji: "☀️",
        timeOfDay: "morning"
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        text: 'Mirëdita',
        emoji: "🌤️",
        timeOfDay: "afternoon"
      };
    } else if (hour >= 17 && hour < 24) {
      return {
        text: 'Mirëmbrëma',
        emoji: "🌙",
        timeOfDay: "evening"
      };
    } else {
      return {
        text: 'Natën e mirë',
        emoji: "🌃", 
        timeOfDay: "night"
      };
    }
  };

  const getMotivationalMessage = () => {
    if (activeOrders > 0) {
      return {
        text: `Keni ${activeOrders} porosi aktive`,
        type: "active"
      };
    } else if (ordersCount > 0) {
      return {
        text: `${ordersCount} porosi të marra sot`,
        type: "success"
      };
    } else {
      return {
        text: 'Gati për porosi të reja',
        type: "ready"
      };
    }
  };

  const formatRevenue = (amount: number) => {
    return `${Math.round(amount).toLocaleString()} Lek`;
  };

  const greeting = getTimeBasedGreeting();
  const motivation = getMotivationalMessage();
  const userName = auth.user?.fullName?.split(' ')[0] || 'Admin';
  const venueName = auth.venue?.name || 'Restaurant';

  return (
    <header className={`welcome-header ${isVisible ? 'visible' : ''}`}>
      <div className="welcome-content">
        <div className="greeting-section">
          <div className="main-greeting">
            <span className="greeting-text">
              {greeting.text}, <span className="user-name">{userName}</span>!
            </span>
            <span className="greeting-emoji">{greeting.emoji}</span>
          </div>
          <div className="venue-greeting">
            Mirë se erdhe në <span className="venue-name">{venueName}</span>
          </div>
          <div className="current-time">
            {currentTime.toLocaleTimeString('sq-AL', { 
              hour: '2-digit', 
              minute: '2-digit',
              weekday: 'long'
            })}
          </div>
        </div>

        <div className="stats-section">
          <div className="motivation-badge">
            <div className={`motivation-icon ${motivation.type === 'active' ? 'no-animation' : ''}`}>
              {motivation.type === 'active' ? '🔔' : 
               motivation.type === 'success' ? '✨' : '🚀'}
            </div>
            <div className="motivation-text">{motivation.text}</div>
          </div>
          
          {todayRevenue > 0 && (
            <div className="revenue-display">
              <div className="revenue-label">Shitjet e sotme</div>
              <div className="revenue-amount">{formatRevenue(todayRevenue)}</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .welcome-header {
          background: linear-gradient(135deg, 
            rgba(52, 152, 219, 0.1) 0%, 
            rgba(155, 89, 182, 0.1) 50%,
            rgba(44, 62, 80, 0.05) 100%
          );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px;
          margin: 0 0 20px 0;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .welcome-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg,
            rgba(52, 152, 219, 0.05) 0%,
            rgba(155, 89, 182, 0.05) 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .welcome-header:hover::before {
          opacity: 1;
        }

        .welcome-header.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .welcome-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 32px;
          position: relative;
          z-index: 1;
        }

        .greeting-section {
          flex: 1;
        }

        .main-greeting {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .greeting-text {
          font-size: 24px;
          font-weight: 600;
          color: #2c3e50;
          letter-spacing: -0.3px;
          line-height: 1.3;
          font-family: inherit;
        }

        .user-name {
          color: #2c3e50 !important;
          font-weight: 600 !important;
          font-size: inherit !important;
          font-family: inherit !important;
        }

        .greeting-emoji {
          font-size: 20px;
          animation: gentle-bounce 3s ease-in-out infinite;
        }

        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }

        .venue-greeting {
          font-size: 16px;
          color: #5a6c7d;
          margin-bottom: 8px;
          font-weight: 500;
          font-family: inherit;
        }

        .venue-name {
          color: #3498db;
          font-weight: 600;
        }

        .current-time {
          font-size: 13px;
          color: #7f8c8d;
          text-transform: capitalize;
          font-weight: 500;
          font-family: inherit;
        }

        .stats-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-end;
        }

        .motivation-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          background: rgba(52, 152, 219, 0.1);
          border: 1px solid rgba(52, 152, 219, 0.2);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          cursor: default;
        }

        .motivation-badge:hover {
          background: rgba(52, 152, 219, 0.15);
          border-color: rgba(52, 152, 219, 0.3);
          transform: translateY(-2px);
        }

        .motivation-icon {
          font-size: 20px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .motivation-icon.no-animation {
          animation: none !important;
          transform: none !important;
        }

        .motivation-text {
          font-size: 14px;
          font-weight: 600;
          color: #2c3e50;
          white-space: nowrap;
          font-family: inherit;
        }

        .revenue-display {
          text-align: right;
          padding: 12px 0;
        }

        .revenue-label {
          font-size: 12px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          font-weight: 600;
        }

        .revenue-amount {
          font-size: 18px;
          font-weight: 600;
          color: #27ae60;
          letter-spacing: -0.3px;
          font-family: inherit;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .welcome-header {
            margin: 0 0 16px 0;
            padding: 24px 20px;
            border-radius: 16px;
          }

          .welcome-content {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }

          .greeting-text {
            font-size: 20px;
          }

          .greeting-emoji {
            font-size: 18px;
          }

          .venue-greeting {
            font-size: 14px;
          }

          .stats-section {
            align-items: stretch;
          }

          .motivation-badge {
            justify-content: center;
            padding: 14px 20px;
          }

          .revenue-display {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .welcome-header {
            margin: 0 0 12px 0;
            padding: 20px 16px;
          }

          .greeting-text {
            font-size: 18px;
          }

          .main-greeting {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .motivation-badge {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
        }
      `}</style>
    </header>
  );
};

export default WelcomeHeader;