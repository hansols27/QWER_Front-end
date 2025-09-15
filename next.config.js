const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@theme'] = path.resolve(__dirname, 'admin/theme');
    config.resolve.alias['@lib'] = path.resolve(__dirname, 'admin/lib');
    config.resolve.alias['@frontend'] = path.resolve(__dirname, 'front_end/src');
    config.resolve.alias['@shared'] = path.resolve(__dirname, 'shared');
    return config;
  },
};

module.exports = nextConfig;
