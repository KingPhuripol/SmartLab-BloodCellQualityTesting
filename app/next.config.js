/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel handles output automatically, standalone is for Docker
  output: process.env.VERCEL ? undefined : "standalone",
  experimental: {
    serverComponentsExternalPackages: ["xlsx"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

module.exports = nextConfig;
