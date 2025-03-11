/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   serverActions: true,
  //   optimizePackageImports: ["@prisma/client"],
  // },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["api.star-history.com"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  headers: async () => {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|css|js|woff|woff2)",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
    ];
  },
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
