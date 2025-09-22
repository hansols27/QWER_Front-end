const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../"),
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@theme": path.resolve(__dirname, "theme"),
      "@lib": path.resolve(__dirname, "lib"),
      "@shared": path.resolve(__dirname, "../shared")
    };

    const externalTSPaths = [
      path.resolve(__dirname, "../shared")
    ];

    config.module.rules.push({
      test: /\.tsx?$/,
      include: externalTSPaths,
      use: [
        {
          loader: "babel-loader",
          options: { presets: ["next/babel"] }
        }
      ]
    });

    return config;
  }
};

module.exports = nextConfig;
