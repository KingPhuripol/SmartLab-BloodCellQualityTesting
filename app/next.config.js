/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["xlsx"],
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
