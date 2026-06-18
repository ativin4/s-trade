import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#21808D',
}

export const metadata: Metadata = {
  title: 'S-Trade - AI-Powered Stock Trading',
  description: 'Progressive web app for AI-powered stock trading automation with multi-broker integration',
  keywords: ['trading', 'stocks', 'AI', 'automation', 'portfolio', 'investment'],
  authors: [{ name: 'S-Trade Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon-192x192.png',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="S-Trade" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.variable
      )}>
        <AppRouterCacheProvider>
        <Providers>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}