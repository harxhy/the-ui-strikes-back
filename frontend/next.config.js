/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hackathon / monorepo convenience: allow importing the UI schema parser from `../backend`.
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
