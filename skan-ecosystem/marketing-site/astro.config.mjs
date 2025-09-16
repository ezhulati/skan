import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    tailwind(),
    react({
      include: ['**/components/interactive/**']
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