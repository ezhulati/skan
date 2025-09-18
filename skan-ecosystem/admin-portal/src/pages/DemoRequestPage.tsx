import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DemoRequestPage: React.FC = () => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  // Check if form was successfully submitted via URL params
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setIsSubmitted(true);
    }
  }, []);

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('https://api-mkazmlu7ta-ew.a.run.app/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        window.location.href = '/dashboard';
      } else {
        const errorResult = await response.json();
        setError(errorResult.error || 'Invalid credentials. Please check your password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Ka ndodhur një gabim. Ju lutemi provoni përsëri.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && !showLoginForm) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-container">
                <svg className="login-icon" fill="currentColor" viewBox="0 0 200 200">
                  <path d="M75,15H35A20.06,20.06,0,0,0,15,35V75A20.06,20.06,0,0,0,35,95H75A20.06,20.06,0,0,0,95,75V35A20.06,20.06,0,0,0,75,15Zm0,60H35V35H75Zm0,30H35a20.06,20.06,0,0,0-20,20v40a20.06,20.06,0,0,0,20,20H75a20.06,20.06,0,0,0,20-20V125A20.06,20.06,0,0,0,75,105Zm0,60H35V125H75ZM165,15H125a20.06,20.06,0,0,0-20,20V75a20.06,20.06,0,0,0,20,20h40a20.06,20.06,0,0,0,20-20V35A20.06,20.06,0,0,0,165,15Zm0,60H125V35h40ZM50,65H60a5.38,5.38,0,0,0,5-5V50a5.38,5.38,0,0,0-5-5H50a5.38,5.38,0,0,0-5,5V60A5.38,5.38,0,0,0,50,65Zm0,90H60a5.38,5.38,0,0,0,5-5V140a5.38,5.38,0,0,0-5-5H50a5.38,5.38,0,0,0-5,5v10A5.38,5.38,0,0,0,50,155Zm90-90h10a5.38,5.38,0,0,0,5-5V50a5.38,5.38,0,0,0-5-5H140a5.38,5.38,0,0,0-5,5V60A5.38,5.38,0,0,0,140,65Zm-30,80h10a5.38,5.38,0,0,0,5-5V130a5.38,5.38,0,0,1,5-5h10a5.38,5.38,0,0,0,5-5V110a5.38,5.38,0,0,0-5-5H110a5.38,5.38,0,0,0-5,5v30a5.38,5.38,0,0,0,5,5Zm70-40H170a5.38,5.38,0,0,0-5,5v30a5.38,5.38,0,0,0,5,5h10a5.38,5.38,0,0,0,5-5V110A5.38,5.38,0,0,0,180,105Zm-60,60H110a5.38,5.38,0,0,0-5,5v10a5.38,5.38,0,0,0,5,5h10a5.38,5.38,0,0,0,5-5V170A5.38,5.38,0,0,0,120,165Zm60,0H170a5.38,5.38,0,1-5-5V150a5.38,5.38,0,0,0-5-5H130a5.38,5.38,0,0,0-5,5v10a5.38,5.38,0,0,0,5,5h10a5.38,5.38,0,1,5,5v10a5.38,5.38,0,0,0,5,5h30a5.38,5.38,0,0,0,5-5V170A5.38,5.38,0,0,0,180,165Z"/>
                </svg>
              </div>
              <h1>Skan.al</h1>
            </div>
            <h2>Kërkesa e Dorëzuar</h2>
            <p className="login-subtitle">Faleminderit për interesin tuaj!</p>
          </div>
          
          {/* Welcome to Demo Success Experience */}
          <div className="demo-success-container" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '32px',
            color: 'white',
            textAlign: 'center',
            marginBottom: '24px',
            boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
          }}>
            {/* Success Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              backdropFilter: 'blur(10px)'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h2 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '28px', 
              fontWeight: '700',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              🎉 Demo u aktivizua me sukses!
            </h2>
            
            <p style={{ 
              margin: '0 0 24px 0', 
              fontSize: '16px', 
              opacity: '0.9',
              lineHeight: '1.5'
            }}>
              Ju keni tani akses të plotë në platformën SKAN.AL për të testuar të gjitha veçoritë.
            </p>

            {/* Demo Credentials */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h4 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Kredencialet tuaja të Demo-s:
              </h4>
              
              <div className="credentials-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '16px',
                textAlign: 'left'
              }}>
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px',
                    opacity: '0.8'
                  }}>
                    Email / Username
                  </label>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#2c3e50',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    manager_email1@gmail.com
                  </div>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px',
                    opacity: '0.8'
                  }}>
                    Password
                  </label>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#2c3e50',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    demo1234
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Auto-Login Button */}
            <button
              onClick={async () => {
                // Directly log in the user without showing form
                setIsSubmitting(true);
                setError(null);
                
                try {
                  const response = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      email: 'manager_email1@gmail.com',
                      password: 'demo1234'
                    }),
                  });

                  if (response.ok) {
                    const result = await response.json();
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    window.location.href = '/dashboard';
                  } else if (response.status === 429) {
                    setError('Shumë kërkesa. Ju lutemi provoni përsëri pas disa sekondash.');
                  } else {
                    const errorResult = await response.json().catch(() => ({}));
                    setError(errorResult.error || 'Problem me hyrjen. Ju lutemi provoni përsëri.');
                  }
                } catch (err) {
                  console.error('Auto-login error:', err);
                  setError('Ka ndodhur një gabim. Ju lutemi provoni përsëri.');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#667eea',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '50px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.transform = 'translateY(-2px)';
                (e.target as HTMLElement).style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = 'translateY(0px)';
                (e.target as HTMLElement).style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
              }}
            >
              {isSubmitting ? (
                <>
                  <svg className="loading-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Duke u futur në Demo...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Hyr në Demo
                </>
              )}
            </button>

            <p style={{
              fontSize: '14px',
              opacity: '0.8',
              margin: '0',
              lineHeight: '1.4'
            }}>
              Ose shkoni tek <strong>Login</strong> dhe vendosni kredencialet manualisht
            </p>
          </div>

          {/* What to Expect */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h4 style={{
              margin: '0 0 16px 0',
              color: '#2c3e50',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Çfarë mund të testoni në demo:
            </h4>
            
            <div className="features-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📱</span>
                <div>
                  <strong style={{ color: '#2c3e50' }}>Menaxhim Porosish</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                    Shikoni porositë në kohë reale
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🍽️</span>
                <div>
                  <strong style={{ color: '#2c3e50' }}>Menu Dixhitale</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                    Modifikoni dhe organizoni menunë
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📊</span>
                <div>
                  <strong style={{ color: '#2c3e50' }}>Raporte & Analitikë</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                    Shikoni performancën e biznesit
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up CTA */}
          <div style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            color: 'white'
          }}>
            <p style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              🚀 Gati për të implementuar SKAN.AL në restorantin tuaj?
            </p>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              opacity: '0.9'
            }}>
              Ekipi ynë do t'ju kontaktojë për të diskutuar paketat dhe çmimet.
            </p>
            <div style={{
              fontSize: '12px',
              opacity: '0.8'
            }}>
              📞 +355 69 123 4567 | 📧 hello@skan.al
            </div>
          </div>

          {/* Responsive Styles */}
          <style>{`
            @media (max-width: 768px) {
              .demo-success-container {
                padding: 24px 20px !important;
                margin-bottom: 20px !important;
              }
              .demo-success-container h2 {
                font-size: 24px !important;
              }
              .demo-success-container .credentials-grid {
                grid-template-columns: 1fr !important;
                gap: 12px !important;
              }
              .demo-success-container button {
                width: 100% !important;
                padding: 14px 24px !important;
              }
            }
            @media (max-width: 480px) {
              .demo-success-container {
                padding: 20px 16px !important;
                border-radius: 12px !important;
              }
              .demo-success-container h2 {
                font-size: 20px !important;
              }
              .demo-success-container .features-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-container">
              <svg className="login-icon" fill="currentColor" viewBox="0 0 200 200">
                <path d="M75,15H35A20.06,20.06,0,0,0,15,35V75A20.06,20.06,0,0,0,35,95H75A20.06,20.06,0,0,0,95,75V35A20.06,20.06,0,0,0,75,15Zm0,60H35V35H75Zm0,30H35a20.06,20.06,0,0,0-20,20v40a20.06,20.06,0,0,0,20,20H75a20.06,20.06,0,0,0,20-20V125A20.06,20.06,0,0,0,75,105Zm0,60H35V125H75ZM165,15H125a20.06,20.06,0,0,0-20,20V75a20.06,20.06,0,0,0,20,20h40a20.06,20.06,0,0,0,20-20V35A20.06,20.06,0,0,0,165,15Zm0,60H125V35h40ZM50,65H60a5.38,5.38,0,0,0,5-5V50a5.38,5.38,0,0,0-5-5H50a5.38,5.38,0,0,0-5,5V60A5.38,5.38,0,0,0,50,65Zm0,90H60a5.38,5.38,0,0,0,5-5V140a5.38,5.38,0,0,0-5-5H50a5.38,5.38,0,0,0-5,5v10A5.38,5.38,0,0,0,50,155Zm90-90h10a5.38,5.38,0,0,0,5-5V50a5.38,5.38,0,0,0-5-5H140a5.38,5.38,0,0,0-5,5V60A5.38,5.38,0,0,0,140,65Zm-30,80h10a5.38,5.38,0,0,0,5-5V130a5.38,5.38,0,0,1,5-5h10a5.38,5.38,0,0,0,5-5V110a5.38,5.38,0,0,0-5-5H110a5.38,5.38,0,0,0-5,5v30a5.38,5.38,0,0,0,5,5Zm70-40H170a5.38,5.38,0,0,0-5,5v30a5.38,5.38,0,0,0,5,5h10a5.38,5.38,0,0,0,5-5V110A5.38,5.38,0,0,0,180,105Zm-60,60H110a5.38,5.38,0,0,0-5,5v10a5.38,5.38,0,0,0,5,5h10a5.38,5.38,0,0,0,5-5V170A5.38,5.38,0,0,0,120,165Zm60,0H170a5.38,5.38,0,1-5-5V150a5.38,5.38,0,0,0-5-5H130a5.38,5.38,0,0,0-5,5v10a5.38,5.38,0,0,0,5,5h10a5.38,5.38,0,1,5,5v10a5.38,5.38,0,0,0,5,5h30a5.38,5.38,0,0,0,5-5V170A5.38,5.38,0,0,0,180,165Z"/>
              </svg>
            </div>
            <h1>Skan.al</h1>
          </div>
          <h2>{showLoginForm ? 'Hyr në Demo' : 'Kërko Akses Demo'}</h2>
          <p className="login-subtitle">
            {showLoginForm 
              ? 'Vendosni kredencialet tuaja të demo-s' 
              : 'Plotësoni të dhënat tuaja për të marrë kredencialet e demo-s'
            }
          </p>
        </div>
        
        {/* Toggle between forms */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            padding: '4px',
            gap: '2px'
          }}>
            <button
              type="button"
              onClick={() => {
                setShowLoginForm(false);
                setError(null);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: !showLoginForm ? '#667eea' : 'transparent',
                color: !showLoginForm ? 'white' : '#667eea',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Kërko Demo
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLoginForm(true);
                setError(null);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: showLoginForm ? '#667eea' : 'transparent',
                color: showLoginForm ? 'white' : '#667eea',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Kam Kredenciale
            </button>
          </div>
        </div>

        {/* Error message display for both forms */}
        {error && (
          <div className="error-message" style={{ marginBottom: '24px' }}>
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {error}
          </div>
        )}
        
        {!showLoginForm ? (
          <form 
            name="demo-request"
            method="POST"
            data-netlify="true"
            data-netlify-honeypot="bot-field"
            action="/demo-request"
            className="login-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              setError(null);
              
              try {
                // Get form data
                const formData = new FormData(e.target as HTMLFormElement);
                
                // Submit to Netlify for lead capture
                const response = await fetch('/demo-request', {
                  method: 'POST',
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  body: new URLSearchParams(formData as any).toString()
                });
                
                if (response.ok) {
                  // Show our custom success experience instead of redirecting
                  setIsSubmitted(true);
                } else {
                  throw new Error('Form submission failed');
                }
              } catch (error) {
                console.error('Form submission error:', error);
                setError('Kishte një problem me dërgimin e formës. Ju lutemi provoni përsëri.');
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
          {/* Honeypot field for spam protection */}
          <input type="hidden" name="form-name" value="demo-request" />
          <div style={{ display: 'none' }}>
            <label>Don't fill this out if you're human: <input name="bot-field" /></label>
          </div>
          <input type="hidden" name="admin-email" value="enrizhulati@gmail.com" />
          <input type="hidden" name="demoType" value="both" />
          
          <div className="form-group">
            <label htmlFor="firstName">Emri</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              placeholder="Shkruaj emrin tënd"
              className="clean-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Mbiemri</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              placeholder="Shkruaj mbiemrin tënd"
              className="clean-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Adresa e Emailit</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="Shkruaj email-in tënd"
              className="clean-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="businessName">Emri i Biznesit</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              required
              placeholder="Shkruaj emrin e restorantit ose biznesit tënd"
              className="clean-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isSubmitting}
            style={{
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? (
              <>
                <svg className="login-arrow" style={{animation: 'spin 1s linear infinite'}} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="31.416">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                  </circle>
                </svg>
                Duke dërguar...
              </>
            ) : (
              <>
                <svg className="login-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12l8-8 8 8M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Dërgo Kërkesën
              </>
            )}
          </button>
        </form>
        ) : (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="loginEmail">Email</label>
              <input
                type="email"
                id="loginEmail"
                name="email"
                value={loginData.email}
                onChange={handleLoginInputChange}
                required
                placeholder="Vendosni email-in që keni marrë"
                disabled={isSubmitting}
                className="clean-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="loginPassword">Fjalëkalimi</label>
              <input
                type="password"
                id="loginPassword"
                name="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                required
                placeholder="Vendosni fjalëkalimin që keni marrë"
                disabled={isSubmitting}
                className="clean-input"
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="loading-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Duke u futur...
                </>
              ) : (
                <>
                  <svg className="login-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="10,17 15,12 10,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Hyr në Demo
                </>
              )}
            </button>
          </form>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link 
            to="/login"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#764ba2'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#667eea'}
          >
            ← Kthehu tek Login
          </Link>
        </div>
      </div>
      
      {/* Loading animation styles */}
      <style>{`
        .loading-icon {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DemoRequestPage;