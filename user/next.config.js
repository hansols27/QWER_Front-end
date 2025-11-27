const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: path.join(__dirname, "../"),
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },

    // 👈 이미지 설정 추가 시작
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                // S3 버킷 도메인 hostname을 정확하게 입력
                hostname: 'qwerfansite.s3.ap-northeast-2.amazonaws.com', 
                port: '',
                pathname: '/albums/**', // S3 내 앨범 이미지 경로 지정
            },
        ],
    },
    // 👈 이미지 설정 추가 끝

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