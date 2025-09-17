import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top instantly when route changes
    window.scrollTo({
      top: 0,
      left: 0
    });
    
    // Also try document.body scroll for better browser compatibility
    if (document.body.scrollTop !== 0) {
      document.body.scrollTop = 0;
    }
    
    // And document.documentElement for older browsers
    if (document.documentElement.scrollTop !== 0) {
      document.documentElement.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}

export default ScrollToTop;