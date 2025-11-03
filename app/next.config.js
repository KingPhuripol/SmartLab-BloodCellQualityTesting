/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: ["localhost"],
  },
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors.
    // Linting still runs in dev via `npm run lint`.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
