/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // Replace this with your actual production URL when you launch
  siteUrl: process.env.SITE_URL || 'https://www.caskayd.com',
  
  // Automatically generate a robots.txt file
  generateRobotsTxt: true,
  
  // Optional: Exclude specific paths from showing up in Google
  exclude: ['/dashboard/*', '/business/dashboard', '/creator/dashboard'],

  // Simple comment: Customizing the robots.txt rules
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/', // Allow Google to crawl the main site
        disallow: ['/api', '/_next'], // Hide internal Next.js and API routes
      },
    ],
  },
}