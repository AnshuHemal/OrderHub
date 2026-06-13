import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy /backend/* → NestJS at localhost:4000 during development
  async rewrites() {
    return [
      {
        source:      "/backend/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "https://order-hub-backend.vercel.app"}/api/:path*`,
      },
    ];
  },

  // Allow Cloudinary images for menu items
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google OAuth avatars
      { protocol: "https", hostname: "avatars.githubusercontent.com" }, // GitHub avatars
    ],
  },
};

export default nextConfig;
