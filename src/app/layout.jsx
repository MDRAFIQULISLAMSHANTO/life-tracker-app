import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { AuthProvider } from '../context/AuthContext'
import { FinanceProvider } from '../context/FinanceContext'
import { ThemeProvider } from '../context/ThemeContext'
import ServiceWorkerRegistrar from '../components/ServiceWorkerRegistrar'

// Self-hosted by Next — a CSS @import blocked first paint on every page load
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://livio.rishanto.com'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Livio — Money & Growth',
    template: '%s · Livio',
  },
  description:
    'One place for your money and your growth — expenses, budgets, habits, goals and tomorrow’s plan.',
  applicationName: 'Livio',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  // Without this iOS shows a page screenshot instead of the icon and never
  // launches fullscreen from the Home Screen.
  appleWebApp: {
    capable: true,
    title: 'Livio',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'Livio',
    title: 'Livio — Money & Growth',
    description:
      'One place for your money and your growth — expenses, budgets, habits, goals and tomorrow’s plan.',
    url: SITE_URL,
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'Livio' }],
  },
  twitter: {
    card: 'summary',
    title: 'Livio — Money & Growth',
    description: 'Track money, habits, goals and your daily plan in one place.',
    images: ['/icons/icon-512.png'],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <FinanceProvider>
              <ServiceWorkerRegistrar />
              {children}
            </FinanceProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
