import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import icon from 'astro-icon';

export default defineConfig({
  integrations: [
    tailwind(),
    react({
      include: ['**/components/interactive/**']
    }),
    icon()
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