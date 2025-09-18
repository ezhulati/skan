import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [
    tailwind(),
    react({
      include: ['**/components/interactive/**']
    }),
    icon(),
    sitemap({
      // Albanian market SEO optimization
      changefreq: 'weekly',
      priority: 0.7,
      
      // Exclude development/internal pages
      filter: (page) => 
        !page.includes('/dev/') && 
        !page.includes('/admin/') &&
        !page.includes('/internal/') &&
        !page.includes('/api/'),
      
      // SEO customization per page type for Albanian market
      serialize(item) {
        // Homepage gets highest priority
        if (item.url === 'https://skan.al/' || item.url === 'https://skan.al') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        
        // Blog content gets high priority for Albanian restaurant SEO
        if (item.url.includes('/blog/')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        
        // City-specific pages for Albanian local SEO
        if (item.url.includes('/tirana') || 
            item.url.includes('/durres') || 
            item.url.includes('/vlore') || 
            item.url.includes('/sarande')) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        
        // Product pages (QR ordering, features)
        if (item.url.includes('/qr-ordering') || 
            item.url.includes('/features') ||
            item.url.includes('/pricing')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        }
        
        // Demo and contact pages for lead generation
        if (item.url.includes('/demo') || 
            item.url.includes('/contact') ||
            item.url.includes('/signup')) {
          item.priority = 0.9;
          item.changefreq = 'daily';
        }
        
        return item;
      }
    })
  ],
  site: 'https://skan.al',
  output: 'static',
  build: {
    format: 'directory'
  },
  vite: {
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  }
});