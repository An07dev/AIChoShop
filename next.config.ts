import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/admin/courses",
        destination: "/admin/lessons",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

