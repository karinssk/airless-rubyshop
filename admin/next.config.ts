import type { NextConfig } from "next";

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
};

export default nextConfig;
