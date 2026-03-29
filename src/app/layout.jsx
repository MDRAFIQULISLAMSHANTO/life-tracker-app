import './globals.css'
import { AuthProvider } from '../context/AuthContext'
import { FinanceProvider } from '../context/FinanceContext'

export const metadata = {
  title: 'Livio - Personal Life & Money Management',
  description: 'Manage your finances easily and smartly',
  /* Favicon: src/app/icon.svg → served as /icon.svg by Next.js */
  manifest: '/site.webmanifest',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0d9488',
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <FinanceProvider>
            {children}
          </FinanceProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
