/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://neurochiro.com',
  generateRobotsTxt: true,
  exclude: ['/admin*', '/doctor*', '/student*', '/portal*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/doctor', '/student', '/portal'],
      },
    ],
  },
};
