const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: path.join(__dirname, "../"),

    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },

    // ⭐️ CORS 오류 우회를 위한 Rewrites 설정 ⭐️
    async rewrites() {
        return [
            {
                // 프론트엔드에서 /api/ 로 시작하는 모든 요청을 가로챕니다.
                source: "/api/:path*", 
                // 환경 변수에 설정된 백엔드 URL로 요청을 전달합니다.
                destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`, 
            },
        ];
    },

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