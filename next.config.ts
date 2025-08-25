import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
