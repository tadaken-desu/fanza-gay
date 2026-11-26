import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // FANZA(同人)の作品画像。他ホスト・他パスの最適化を許さないよう、できるだけ絞る。
    remotePatterns: [
      {
        protocol: "https",
        hostname: "doujin-assets.dmm.co.jp",
        pathname: "/digital/**",
        search: "",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
