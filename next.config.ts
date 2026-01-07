import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false,

  async redirects() {
    return [
      {
        source: "/",
        destination: "/feed",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
