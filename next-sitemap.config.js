/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://www.neurochiro.co',
  generateRobotsTxt: true,
  exclude: ['/admin*', '/doctor*', '/student*', '/portal*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: ['/', '/api/og/'],
        disallow: ['/api/', '/admin', '/doctor', '/student', '/portal'],
      },
    ],
  },
  additionalPaths: async (config) => {
    const store = [await config.transform(config, '/store')];
    const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
    if (!token) return store;
    const domain = (process.env.SHOPIFY_STORE_DOMAIN || 'wpy2jn-q0.myshopify.com')
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`https://${domain}/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': token,
        },
        body: JSON.stringify({
          query: 'query { products(first: 100) { edges { node { handle } } } }',
        }),
        signal: controller.signal,
      });
      if (!response.ok) return store;
      const json = await response.json();
      const edges = json?.data?.products?.edges ?? [];
      const paths = [...store];
      for (const edge of edges) {
        const handle = edge?.node?.handle;
        if (typeof handle === 'string' && handle) paths.push(await config.transform(config, `/store/${handle}`));
      }
      return paths;
    } catch {
      return store;
    } finally {
      clearTimeout(timer);
    }
  },
};
