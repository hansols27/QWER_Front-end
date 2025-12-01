const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../"),
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // 👈 이미지 설정
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qwerfansite.s3.ap-northeast-2.amazonaws.com", // S3 버킷 도메인
        port: "", // 기본 HTTPS 포트면 빈 문자열
        pathname: "/**", // 버킷 전체 접근
      },
    ],
    formats: ["image/avif", "image/webp"], // WebP/AVIF 자동 변환 옵션 추가
    minimumCacheTTL: 60, // 캐시 최소 시간 설정 (초 단위)
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@theme": path.resolve(__dirname, "theme"),
      "@lib": path.resolve(__dirname, "lib"),
      "@shared": path.resolve(__dirname, "../shared"),
    };

    const externalTSPaths = [path.resolve(__dirname, "../shared")];

    config.module.rules.push({
      test: /\.tsx?$/,
      include: externalTSPaths,
      use: [
        {
          loader: "babel-loader",
          options: { presets: ["next/babel"] },
        },
      ],
    });

    return config;
  },
};

module.exports = nextConfig;
