import './globals.css'
import { AuthProvider } from '../context/AuthContext'
import { FinanceProvider } from '../context/FinanceContext'
import { ThemeProvider } from '../context/ThemeContext'
import ServiceWorkerRegistrar from '../components/ServiceWorkerRegistrar'

export const metadata = {
  title: 'Livio - Personal Finance',
  description: 'Personal finance management — budgets, accounts, and insights',
  manifest: '/site.webmanifest',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#ef4444' },
  ],
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
