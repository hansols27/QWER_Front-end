const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@theme'] = path.resolve(__dirname, 'admin/theme');
    config.resolve.alias['@lib'] = path.resolve(__dirname, 'admin/lib');
    return config;
  },
};

module.exports = nextConfig;
