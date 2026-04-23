import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence multi-lockfile workspace warning
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
