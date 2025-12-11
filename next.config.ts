import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  // Note: Don't use env block here as it overrides .env.local values at build time
  // Environment variables are loaded automatically from .env.local at runtime
};

export default nextConfig;
