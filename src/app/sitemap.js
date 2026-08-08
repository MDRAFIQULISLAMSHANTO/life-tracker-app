const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://livio.rishanto.com'

const ROUTES = [
  { path: '/', priority: 1 },
  { path: '/features', priority: 0.8 },
  { path: '/pricing', priority: 0.8 },
  { path: '/contact', priority: 0.5 },
  { path: '/login', priority: 0.4 },
  { path: '/signup', priority: 0.6 },
  { path: '/privacy', priority: 0.3 },
  { path: '/terms', priority: 0.3 },
]

export default function sitemap() {
  const lastModified = new Date()
  return ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: 'monthly',
    priority,
  }))
}
