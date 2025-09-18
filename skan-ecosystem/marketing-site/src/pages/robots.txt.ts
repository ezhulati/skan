import type { APIRoute } from 'astro';

const getRobotsTxt = (sitemapURL: URL) => `User-agent: *
Allow: /

# Disallow admin and development areas
Disallow: /admin/
Disallow: /dev/
Disallow: /internal/
Disallow: /api/

# Allow important pages for Albanian restaurant market
Allow: /blog/
Allow: /features
Allow: /pricing
Allow: /demo
Allow: /contact
Allow: /register

# Albanian cities for local SEO
Allow: /tirana
Allow: /durres
Allow: /vlore
Allow: /sarande

# Crawl delay for better server performance
Crawl-delay: 1

# Sitemap location for search engines
Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  return new Response(getRobotsTxt(sitemapURL), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};