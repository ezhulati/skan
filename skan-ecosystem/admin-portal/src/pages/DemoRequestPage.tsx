import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DemoRequestPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    businessName: '',
    demoType: 'both'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const myForm = e.target as HTMLFormElement;
      const formDataToSubmit = new FormData(myForm);

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formDataToSubmit as any).toString()
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Ka ndodhur një gabim. Ju lutemi provoni përsëri.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
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
          
          <div className="success-message" style={{
            padding: '24px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
              color: '#16a34a',
              marginBottom: '16px'
            }}>
              <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 style={{ color: '#16a34a', marginBottom: '8px' }}>Kërkesa u dërgua me sukses!</h3>
            <p style={{ color: '#15803d' }}>
              Faleminderit për interesin tuaj! Do t'ju kontaktojmë brenda 24 orëve me kredencialet e demo-s.
              <br />
              Kontrolloni email-in tuaj (edhe dosjen spam) për detaje të mëtejshme.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link 
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#667eea',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#764ba2'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#667eea'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Kthehu tek Login
            </Link>
          </div>
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
          <h2>Kërko Akses Demo</h2>
          <p className="login-subtitle">Plotësoni të dhënat tuaja për të marrë kredencialet e demo-s</p>
        </div>
        
        {/* Hidden form for Netlify to detect */}
        <form name="demo-request" data-netlify="true" style={{ display: 'none' }}>
          <input type="text" name="firstName" />
          <input type="text" name="lastName" />
          <input type="email" name="email" />
          <input type="text" name="businessName" />
          <input type="text" name="demoType" />
          <input type="email" name="admin-email" />
        </form>

        <form 
          name="demo-request"
          method="POST"
          data-netlify="true"
          className="login-form" 
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="form-name" value="demo-request" />
          <input type="hidden" name="admin-email" value="enrizhulati@gmail.com" />
          <input type="hidden" name="demoType" value={formData.demoType} />
          
          <div className="form-group">
            <label htmlFor="firstName">Emri</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              placeholder="Shkruaj emrin tënd"
              disabled={isSubmitting}
              className="clean-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Mbiemri</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              placeholder="Shkruaj mbiemrin tënd"
              disabled={isSubmitting}
              className="clean-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Adresa e Emailit</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Shkruaj email-in tënd"
              disabled={isSubmitting}
              className="clean-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="businessName">Emri i Biznesit</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              required
              placeholder="Shkruaj emrin e restorantit ose biznesit tënd"
              disabled={isSubmitting}
              className="clean-input"
            />
          </div>
          
          
          {error && (
            <div className="error-message">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {error}
            </div>
          )}
          
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
                Duke u dërguar...
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
    </div>
  );
};

export default DemoRequestPage;