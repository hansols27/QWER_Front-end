const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: path.join(__dirname, "../"),

    // env 속성은 그대로 유지하여 다른 코드에서 NEXT_PUBLIC_API_URL을 사용할 수 있도록 합니다.
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },

    // ⭐️ Rewrites 설정을 제거합니다. ⭐️
    // async rewrites() {
    //     return [
    //         {
    //             source: "/api/:path*", 
    //             destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`, 
    //         },
    //     ];
    // },

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