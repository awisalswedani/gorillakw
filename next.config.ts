import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ هذا يسمح ببناء المشروع رغم أخطاء ESLint
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'awisapp.com',
        port: '',
        pathname: '/storage/app/public/**',
      },
      // Allow placeholder images for development/sample data
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
