import type { NextConfig } from "next";
import withPWA, { PWAConfig } from 'next-pwa'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NEXT_PUBLIC_APP_URL
        ? [new URL(process.env.NEXT_PUBLIC_APP_URL).hostname]
        : ['localhost:3000'],
    },
  },
  typedRoutes: true,
  typescript: {
    // Allow faster dev iteration; CI should run full type checks
    ignoreBuildErrors: isDev,
  },
  eslint: {
    ignoreDuringBuilds: isDev,
  },
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'images.unsplash.com',
      'cdn.jsdelivr.net',
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
    ]
  },
  async rewrites() {
    // Not recommended: For a production app, use environment variables
    // instead of hardcoding URLs.
    return [
      {
        source: '/api/proxy/stock-data/:path*',
        destination: 'https://api.upstox.com/v2/:path*',
      },
      {
        source: '/api/proxy/market-data/:path*',
        destination: 'https://api.kite.trade/:path*',
      },
    ]
  },
  async redirects() {
    return [
      { source: '/login', destination: '/auth/signin', permanent: true },
      { source: '/signup', destination: '/auth/signup', permanent: true },
      { source: '/profile', destination: '/dashboard', permanent: false },
    ]
  },
  // removed custom webpack svg loader to be Turbopack-compatible
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  output: 'standalone',
  compiler: {
    removeConsole: !isDev,
    reactRemoveProperties: !isDev,
  },
}

const pwaConfig: PWAConfig = {
  dest: 'public',
  disable: isDev,
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/_next\/static\/.+\.js$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-js',
        expiration: { maxEntries: 64, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/_next\/static\/css\/.+\.css$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-css',
        expiration: { maxEntries: 32, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
}

// Use double type assertion to handle next-pwa type mismatches with newer Next.js types
const config = isDev ? nextConfig : withPWA(pwaConfig)(nextConfig)
export default config