import type { NextConfig } from "next";
import path from "path";

const clockShim = path.resolve(process.cwd(), "src/lib/threeClockShim.ts");

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "three/src/core/Clock.js": clockShim,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "three/src/core/Clock.js": clockShim,
    };
    return config;
  },
};

export default nextConfig;
