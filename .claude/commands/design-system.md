# SKAN.AL Design System Documentation

## Overview

SKAN.AL uses a cohesive design system built on **Tailwind CSS** as the primary utility-first CSS framework, ensuring consistency across all three applications while maintaining flexibility for domain-specific needs.

## Architecture

### Multi-Application Structure
- **Marketing Site** (`skan.al`) - Astro + Tailwind CSS
- **Customer App** (`order.skan.al`) - React + Tailwind CSS + PWA
- **Admin Portal** (`admin.skan.al`) - React + Tailwind CSS

### Design System Foundation
- **Base Framework**: Tailwind CSS 3.x
- **Typography**: Inter font family (web fonts)
- **Component Pattern**: Utility-first with component classes
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance

## Color Palette

### Primary Colors (Blue Scale)
```css
primary: {
  50: '#eff6ff',   // Lightest blue backgrounds
  100: '#dbeafe',  // Light blue backgrounds
  200: '#bfdbfe',  // Subtle highlights (customer app only)
  300: '#93c5fd',  // Subtle highlights (customer app only)
  400: '#60a5fa',  // Subtle highlights (customer app only)
  500: '#3b82f6',  // Default primary
  600: '#2563eb',  // Primary buttons, main CTAs
  700: '#1d4ed8',  // Primary hover states
  800: '#1e40af',  // Dark primary (customer app only)
  900: '#1e3a8a',  // Darkest primary
}
```

### Semantic Colors
```css
success: {
  50: '#f0fdf4',   // Success backgrounds
  100: '#dcfce7',  // Light success
  500: '#22c55e',  // Success states
  600: '#16a34a',  // Success buttons
  700: '#15803d',  // Success hover
}

warning: {
  50: '#fffbeb',   // Warning backgrounds
  100: '#fef3c7',  // Light warning
  500: '#f59e0b',  // Warning states
  600: '#d97706',  // Warning buttons
  700: '#b45309',  // Warning hover
}

danger: {
  50: '#fef2f2',   // Error backgrounds
  100: '#fee2e2',  // Light error
  500: '#ef4444',  // Error states
  600: '#dc2626',  // Error buttons
  700: '#b91c1c',  // Error hover
}
```

### Neutral Grays
Uses Tailwind's default gray scale (`gray-50` to `gray-900`)

## Typography

### Font Stack
```css
font-family: 'Inter', system-ui, sans-serif
```

### Font Loading Strategy
- **Marketing Site**: Web fonts loaded via Google Fonts
- **Customer App**: System fonts with Inter fallback
- **Admin Portal**: System fonts with Inter fallback

### Font Rendering
- Antialiasing enabled across all applications
- `text-rendering: optimizeLegibility`
- `-webkit-font-smoothing: antialiased`
- `-moz-osx-font-smoothing: grayscale`

## Responsive Breakpoints

### Custom Breakpoints (All Apps)
```css
screens: {
  'xs': '375px',      // Small mobile phones
  'mobile': '480px',  // Restaurant tablet mode
  'tablet': '768px',  // Standard tablets
  'desktop': '1024px', // Desktop screens
  'kiosk': '1200px',  // Self-service kiosk displays
}
```

### Mobile-First Strategy
- All components designed mobile-first
- Progressive enhancement for larger screens
- Touch-optimized interactions for restaurant environment

## Component System

### Button Components

#### Primary Buttons
```css
.btn-primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors min-h-[48px];
}
```

#### Secondary Buttons
```css
.btn-secondary {
  @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors min-h-[48px];
}
```

#### Marketing Site Specific
```css
.btn-primary {
  @apply bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:bg-primary-700 focus:bg-primary-700;
}

.btn-secondary {
  @apply bg-white text-primary-600 border-2 border-primary-600 px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:bg-primary-50 focus:bg-primary-50;
}
```

### Link Components
```css
.link-primary {
  @apply text-primary-600 hover:text-primary-700 transition-colors duration-200 underline-offset-2 hover:underline;
}
```

### Touch Targets
- Minimum touch target: 48px × 48px
- Customer app uses `min-h-touch` utility (48px)
- Touch-friendly spacing on mobile devices

## Spacing System

### Custom Spacing
```css
spacing: {
  '18': '4.5rem',  // 72px - Common for card spacing
  '88': '22rem',   // 352px - Large sections
}
```

### Container Widths
```css
maxWidth: {
  'mobile': '480px',  // Mobile container max-width
  'tablet': '768px',  // Tablet container max-width
}
```

## Animation & Transitions

### Standard Transitions
- `transition-colors` for color changes
- `transition-all duration-200` for comprehensive transitions
- `hover:` and `focus:` states for all interactive elements

### Custom Animations (Customer App)
```css
animation: {
  'bounce-slow': 'bounce 2s infinite',
  'pulse-slow': 'pulse 3s infinite',
}
```

### Accessibility Considerations
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Accessibility Features

### Focus Management
```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-primary-500;
}
```

### Touch Target Enhancement
```css
@media (pointer: coarse) {
  button, [role="button"], input[type="submit"], input[type="button"], a {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### Screen Reader Support
- Semantic HTML elements used throughout
- ARIA labels and descriptions where needed
- Proper heading hierarchy maintained

## Custom Utilities

### Scrollbar Hiding (Customer App)
```css
.scrollbar-hide {
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: 'none',
  },
  /* Hide scrollbar for IE, Edge and Firefox */
  '-ms-overflow-style': 'none',
  'scrollbar-width': 'none',
}
```

### Aspect Ratios (Customer App)
```css
aspectRatio: {
  '4/3': '4 / 3',   // Food photography
  '16/9': '16 / 9', // Video content
}
```

## Application-Specific Patterns

### Marketing Site (Astro)
- **Focus**: SEO optimization and conversion
- **Components**: Hero sections, feature cards, testimonials
- **Performance**: Optimized images, minimal JavaScript
- **Typography**: Heavier font weights for impact

### Customer App (React PWA)
- **Focus**: Mobile ordering experience
- **Components**: Menu items, cart, order tracking
- **Performance**: Offline capabilities, fast interactions
- **UX**: Touch-optimized, minimal cognitive load

### Admin Portal (React)
- **Focus**: Dashboard efficiency
- **Components**: Data tables, forms, status indicators
- **Performance**: Real-time updates, data visualization
- **UX**: Information density, quick actions

## Build Tools & Workflow

### Tailwind Configuration
- **PostCSS**: Used for processing CSS in all applications
- **Autoprefixer**: Automatic vendor prefixing
- **PurgeCSS**: Built into Tailwind for production optimization

### Development Tools
```json
{
  "postcss": "^8.4.18",
  "tailwindcss": "^3.2.1+",
  "autoprefixer": "^10.4.12"
}
```

### Build Commands
```bash
# Marketing Site (Astro)
npm run dev      # Development server
npm run build    # Production build

# Customer App (React)
npm start        # Development server  
npm run build    # Production build

# Admin Portal (React)
npm start        # Development server
npm run build    # Production build
```

## Consistency Maintenance

### Design Token Strategy
- Colors defined once in Tailwind config
- Shared across all applications
- Easy updates through configuration changes

### Component Reusability
- Utility classes over custom CSS
- Consistent naming conventions
- Shared component patterns documented

### Quality Assurance
- ESLint for code consistency
- Prettier for formatting
- TypeScript for type safety
- Playwright for E2E testing

### Version Management
- Tailwind CSS versions kept in sync
- Regular dependency updates
- Configuration changes versioned with Git

## Performance Considerations

### CSS Optimization
- Tailwind's built-in purging removes unused CSS
- Critical CSS inlined for above-the-fold content
- Non-critical CSS loaded asynchronously

### Font Loading
- `font-display: swap` for web fonts
- System font fallbacks for fast rendering
- Preload critical font files

### Bundle Size Management
- Utility-first approach reduces overall CSS size
- Component classes only for frequently used patterns
- Regular analysis of bundle composition

## Future Considerations

### Design System Evolution
- Component library extraction for shared components
- Design token management system
- Advanced theme management for multi-tenancy

### Accessibility Enhancements
- Automated accessibility testing
- Color contrast validation
- Keyboard navigation testing

### Performance Monitoring
- Core Web Vitals tracking
- CSS bundle size monitoring
- Runtime performance analysis

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Version**: 1.0.0