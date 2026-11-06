/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
};

export default nextConfig;
