const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@theme'] = path.resolve(__dirname, 'theme');       // admin/theme
    config.resolve.alias['@lib'] = path.resolve(__dirname, 'lib');           // admin/lib
    config.resolve.alias['@front'] = path.resolve(__dirname, '../front_end/src'); // front_end/src
    config.resolve.alias['@shared'] = path.resolve(__dirname, '../shared');        // shared
     config.resolve.alias['@api'] = path.resolve(__dirname, '../front_end/src/utils/api.ts'); // front_end/src/utils/api.ts
    return config;
  },
};

module.exports = nextConfig;
