import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-grade security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Control referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restrict browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=()' },
          // HSTS (only in production)
          ...(process.env.NODE_ENV === 'production' ? [
            { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }
          ] : []),
          // Content Security Policy
          { 
            key: 'Content-Security-Policy', 
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.resend.com https://*.supabase.co; frame-ancestors 'none'; form-action 'self';"
          }
        ]
      },
      // API routes with stricter CORS
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NODE_ENV === 'production' ? 'https://iec.alsi-election-org.workers.dev' : '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Max-Age', value: '86400' }
        ]
      }
    ]
  },

  // Enhanced security for API routes
  async rewrites() {
    return [
      {
        source: '/api/security/:path*',
        destination: '/api/security/:path*'
      }
    ]
  },

  // Disable powered by header
  poweredByHeader: false,

  // Strict trailing slash handling
  trailingSlash: false,

  // Enable React strict mode for better security
  reactStrictMode: true,

  };

export default nextConfig;
