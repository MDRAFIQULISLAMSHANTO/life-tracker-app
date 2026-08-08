const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://livio.rishanto.com'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private, per-user screens — nothing to index and nothing crawlable
        disallow: ['/dashboard', '/api/', '/offline'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
