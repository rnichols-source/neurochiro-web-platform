import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/dashboard/',
        '/doctor/',
        '/student/',
        '/portal/',
        '/vendor/',
      ],
    },
    sitemap: 'https://www.neurochiro.co/sitemap.xml',
  };
}
