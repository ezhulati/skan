import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  children: React.ReactNode;
}

const Navigation: React.FC<NavigationProps> = ({ children }) => {
  const { auth, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };


  return (
    <div className={`navigation-layout ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      <header className="mobile-header">
        <div className="mobile-brand">
          <svg className="app-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 9h6v6H9z" fill="currentColor"/>
            <path d="M9 15l6-6" stroke="white" strokeWidth="1.5"/>
          </svg>
          <h1 className="mobile-brand-name">Skan.al</h1>
        </div>
        <button className={`mobile-menu-button ${isMobileMenuOpen ? 'menu-open' : ''}`} onClick={toggleMobileMenu} aria-label={isMobileMenuOpen ? "Mbyll menunë e navigimit" : "Hap menunë e navigimit"}>
          <div className="hamburger-lines">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </header>
      <nav className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="nav-header">
          <h2>{auth.venue?.name || 'Restaurant'}</h2>
        </div>

        <ul className="nav-menu">
          <li>
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="9" rx="1" fill="currentColor"/>
                <rect x="14" y="3" width="7" height="5" rx="1" fill="currentColor"/>
                <rect x="14" y="12" width="7" height="9" rx="1" fill="currentColor"/>
                <rect x="3" y="16" width="7" height="5" rx="1" fill="currentColor"/>
              </svg>
              Paneli i Porosive
            </Link>
          </li>
          <li>
            <Link 
              to="/menu" 
              className={`nav-link ${isActive('/menu') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="8" cy="6" r="1" fill="currentColor"/>
                <circle cx="8" cy="12" r="1" fill="currentColor"/>
                <circle cx="8" cy="18" r="1" fill="currentColor"/>
              </svg>
              Menaxhimi i Menusë
            </Link>
          </li>
          <li>
            <Link 
              to="/qr-codes" 
              className={`nav-link ${isActive('/qr-codes') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="5" y="5" width="4" height="4" fill="currentColor"/>
                <rect x="15" y="5" width="4" height="4" fill="currentColor"/>
                <rect x="5" y="15" width="4" height="4" fill="currentColor"/>
                <rect x="13" y="13" width="3" height="3" fill="currentColor"/>
                <rect x="17" y="13" width="2" height="2" fill="currentColor"/>
                <rect x="13" y="17" width="2" height="2" fill="currentColor"/>
                <rect x="17" y="17" width="4" height="4" fill="currentColor"/>
              </svg>
              Kodet QR
            </Link>
          </li>
          <li>
            <Link 
              to="/users" 
              className={`nav-link ${isActive('/users') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Menaxhimi i Përdoruesve
            </Link>
          </li>
          <li>
            <Link 
              to="/payment-settings" 
              className={`nav-link ${isActive('/payment-settings') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2v20m8-18H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Cilësimet e Pagesës
            </Link>
          </li>
        </ul>

        <div className="nav-footer">
          <div className="user-info">
            <p className="user-name">{auth.user?.fullName}</p>
            <p className="user-email">{auth.user?.email}</p>
          </div>
          <button className="logout-button" onClick={logout}>
            Dilni
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}
      <main className="main-content">
        {children}
      </main>

      <style>{`
        .navigation-layout {
          display: flex;
          min-height: 100vh;
          background: #f8f9fa;
          position: relative;
        }

        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(44, 62, 80, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 1001;
          padding: 0 20px;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 1px 20px rgba(0, 0, 0, 0.1);
        }

        .mobile-brand {
          display: flex;
          align-items: center;
          flex: 1;
          margin-left: 0px;
          gap: 8px;
        }

        .app-icon {
          width: 24px;
          height: 24px;
          color: #ffffff;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .mobile-brand-name {
          color: #ffffff;
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          line-height: 1.1;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .mobile-menu-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          width: 44px;
          height: 44px;
          cursor: pointer;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .mobile-menu-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .mobile-menu-button:hover::before {
          opacity: 1;
        }

        .mobile-menu-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .mobile-menu-button:active {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0.95);
        }

        .hamburger-lines {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 18px;
          height: 14px;
          position: relative;
        }

        .hamburger-lines span {
          display: block;
          height: 2px;
          background: white;
          border-radius: 1px;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
          position: absolute;
          transform-origin: center;
        }

        .hamburger-lines span:nth-child(1) {
          width: 18px;
          top: 0;
        }

        .hamburger-lines span:nth-child(2) {
          width: 14px;
          top: 6px;
        }

        .hamburger-lines span:nth-child(3) {
          width: 18px;
          top: 12px;
        }

        .mobile-menu-button.menu-open .hamburger-lines span:nth-child(1) {
          transform: rotate(45deg);
          top: 6px;
          width: 18px;
        }

        .mobile-menu-button.menu-open .hamburger-lines span:nth-child(2) {
          opacity: 0;
        }

        .mobile-menu-button.menu-open .hamburger-lines span:nth-child(3) {
          transform: rotate(-45deg);
          top: 6px;
          width: 18px;
        }

        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          display: none;
        }

        .sidebar {
          width: 280px;
          background: rgba(44, 62, 80, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          color: white;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          left: 0;
          top: 0;
          z-index: 1000;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-header {
          padding: 20px;
          border-bottom: 1px solid #34495e;
          position: relative;
        }


        .nav-header h2 {
          margin: 0 0 5px 0;
          color: #ffffff;
          font-size: 24px;
          font-weight: bold;
        }

        .venue-name {
          margin: 0;
          color: #bdc3c7;
          font-size: 14px;
        }

        .nav-menu {
          flex: 1;
          list-style: none;
          padding: 24px 16px;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-menu li {
          margin: 0;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
          border-radius: 12px;
          font-weight: 500;
          font-size: 15px;
          position: relative;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(52, 152, 219, 0.2) 0%, rgba(155, 89, 182, 0.2) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .nav-link:hover::before {
          opacity: 1;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateX(4px);
          border-color: rgba(52, 152, 219, 0.3);
        }

        .nav-link.active {
          background: linear-gradient(135deg, rgba(52, 152, 219, 0.3) 0%, rgba(155, 89, 182, 0.3) 100%);
          color: white;
          border-color: rgba(52, 152, 219, 0.5);
          box-shadow: 0 4px 20px rgba(52, 152, 219, 0.3);
        }

        .nav-link.active::before {
          opacity: 1;
        }

        .nav-icon {
          margin-right: 16px;
          width: 20px;
          height: 20px;
          position: relative;
          z-index: 1;
          color: inherit;
          flex-shrink: 0;
        }

        .nav-footer {
          padding: 20px;
          border-top: 1px solid #34495e;
        }

        .user-info {
          margin-bottom: 15px;
        }

        .user-name {
          margin: 0 0 5px 0;
          font-weight: bold;
          color: white;
          font-size: 14px;
        }

        .user-email {
          margin: 0;
          color: #bdc3c7;
          font-size: 12px;
        }

        .logout-button {
          width: 100%;
          padding: 8px 16px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s ease;
        }

        .logout-button:hover {
          background: #c0392b;
        }

        .main-content {
          flex: 1;
          margin-left: 280px;
          min-height: 100vh;
          background: #f8f9fa;
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
          }

          .mobile-overlay {
            display: block;
          }

          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
            z-index: 1000;
            top: 64px;
            height: calc(100vh - 64px);
            box-shadow: 0 8px 40px rgba(0,0,0,0.3);
            width: 90vw;
            max-width: 320px;
            border-radius: 0;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .main-content {
            margin-left: 0 !important;
            padding-top: 64px;
            width: 100%;
            max-width: 100vw;
            overflow-x: hidden;
          }

          .nav-header {
            padding: 24px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .nav-header h2 {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }

          .nav-menu {
            padding: 20px 16px;
            gap: 12px;
          }

          .nav-link {
            padding: 18px 20px;
            font-size: 16px;
            border-radius: 14px;
          }

          .nav-footer {
            padding: 24px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .logout-button {
            padding: 14px 20px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            border: none;
            box-shadow: 0 4px 20px rgba(231, 76, 60, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
          }

          .logout-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(231, 76, 60, 0.4);
          }
        }
      `}</style>
    </div>
  );
};

export default Navigation;