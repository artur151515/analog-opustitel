import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Opustoshitel TV',
  description: 'Professional trading signals with real-time analytics and statistics',
  keywords: 'trading signals, forex, binary options, analytics',
  authors: [{ name: 'Opustoshitel Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: process.env.NEXT_PUBLIC_APP_NAME || 'Opustoshitel TV',
    description: 'Professional trading signals with real-time analytics and statistics',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: process.env.NEXT_PUBLIC_APP_NAME || 'Opustoshitel TV',
    description: 'Professional trading signals with real-time analytics and statistics',
  },
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
          {children}
        </div>
      </body>
    </html>
  )
}
