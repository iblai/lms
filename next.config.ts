import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "base.manager.iblai.tech",
      },
      {
        protocol: "https",
        hostname: "base.manager.iblai.org",
      },
      {
        protocol: "https",
        hostname: "base.manager.iblai.app",
      },
      {
        protocol: "https",
        hostname: "api.iblai.app",
      },
      {
        protocol: "https",
        hostname: "api.iblai.org",
      },
    ],
  },
  transpilePackages: ["@tauri-apps/api"],
};

export default nextConfig;
