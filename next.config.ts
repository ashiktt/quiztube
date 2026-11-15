import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://lh3.googleusercontent.com https://*.googleusercontent.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://generativelanguage.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://api.razorpay.com https://api.resend.com",
      "frame-src 'self' https://www.youtube.com https://accounts.google.com https://api.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
