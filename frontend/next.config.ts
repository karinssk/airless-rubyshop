import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL ||
  process.env.NEXT_PUBLIC_BACKEND_DEVELOPMENT_URL ||
  "http://localhost:5000";

const nextConfig: NextConfig = {
  images: {
    // Enable modern image formats for better compression
    formats: ["image/avif", "image/webp"],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes for smaller images
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4022",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
      },
      // Allow any subdomain for production flexibility
      {
        protocol: "https",
        hostname: "**.rubyshop.co.th",
      },
      {
        protocol: "https",
        hostname: "rubyshop.co.th",
      },
      // Common cloud storage patterns
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendUrl.replace(/\/+$/, "")}/uploads/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
