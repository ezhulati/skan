/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',      // Small mobile
        'mobile': '480px',  // Restaurant tablet mode
        'tablet': '768px',  // Tablet
        'desktop': '1024px', // Desktop
        'kiosk': '1200px',  // Self-service kiosk
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        'touch': '48px', // Minimum touch target
      },
      maxWidth: {
        'mobile': '480px',
        'tablet': '768px',
      }
    },
  },
  plugins: [],
}