import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/scanned-tag",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
