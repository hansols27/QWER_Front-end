const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: path.join(__dirname, "../"),
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },

    images: {
        // 1. 서버 부하 방지의 핵심: 최적화 기능을 끄고 S3 원본을 브라우저가 직접 로드하게 함
        unoptimized: true, 
        
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'qwerfansite.s3.ap-northeast-2.amazonaws.com', 
                port: '',
                pathname: "/**",
            },
        ],
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