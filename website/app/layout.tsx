import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AppProvider } from '@/lib/app-store'
import { ErrorBoundary } from '@/lib/error-boundary'
import { NetworkStatusIndicator } from '@/components/network-status-indicator'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'auto',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'MedHome',
  description: 'Family medicine inventory, reminders, and restock planning',
  openGraph: {
    title: 'MedHome',
    description: 'Family medicine inventory, reminders, and restock planning',
    type: 'website',
    images: ['/icon.svg'],
  },
  manifest: '/manifest.json',
  generator: 'MedHome',
  icons: {
    icon: '/icon.svg',
    apple: '/placeholder-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <NetworkStatusIndicator />
          <AppProvider>{children}</AppProvider>
          {process.env.NODE_ENV === 'production' && <Analytics />}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              `,
            }}
          />
        </ErrorBoundary>
      </body>
    </html>
  )
}
