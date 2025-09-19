const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next.js 워크스페이스 루트 명시 (복수 lockfile 문제 해결)
  outputFileTracingRoot: path.join(__dirname, "../"),

  webpack: (config) => {
    // Alias 설정
    config.resolve.alias = {
      ...config.resolve.alias,
      "@theme": path.resolve(__dirname, "theme"),
      "@lib": path.resolve(__dirname, "lib"),
      "@front": path.resolve(__dirname, "../front_end/src"),
      "@utils": path.resolve(__dirname, "../front_end/src/utils"),
      "@shared": path.resolve(__dirname, "../shared"),
    };

    // 외부 TypeScript / TSX 파일 트랜스파일
    const externalTSPaths = [
      path.resolve(__dirname, "../front_end/src"),
      path.resolve(__dirname, "../shared"),
    ];

    config.module.rules.push({
      test: /\.tsx?$/,
      include: externalTSPaths,
      use: [
        {
          loader: "babel-loader",
          options: {
            presets: ["next/babel"], // Next.js 기본 preset
          },
        },
      ],
    });

    return config;
  },
};

module.exports = nextConfig;
