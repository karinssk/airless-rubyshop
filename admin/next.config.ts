import type { NextConfig } from "next";

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL ||
  process.env.NEXT_PUBLIC_BACKEND_DEVELOPMENT_URL ||
  "http://localhost:5000";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
      },
      {
        protocol: "https",
        hostname: "**.rubyshop.co.th",
      },
      {
        protocol: "https",
        hostname: "rubyshop.co.th",
      },
    ],
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

export default nextConfig;
