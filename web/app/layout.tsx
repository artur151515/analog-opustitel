import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from './components/ErrorBoundary'
import MarketTicker from './components/MarketTicker'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '📈 Vision of Trading',
  description: 'Professional trading signals with real-time analytics and statistics',
  keywords: 'trading signals, forex, binary options, analytics',
  authors: [{ name: 'Vision of Trading Team' }],
  robots: 'index, follow',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📈</text></svg>',
  },
  openGraph: {
    title: '📈 Vision of Trading',
    description: 'Professional trading signals with real-time analytics and statistics',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: '📈 Vision of Trading',
    description: 'Professional trading signals with real-time analytics and statistics',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <div id="root" className="h-full">
          <ErrorBoundary>
            <MarketTicker />
            {children}
          </ErrorBoundary>
        </div>
      </body>
    </html>
  )
}
