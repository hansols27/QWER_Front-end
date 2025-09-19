const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@theme"] = path.resolve(__dirname, "theme");
    config.resolve.alias["@lib"] = path.resolve(__dirname, "lib");
    config.resolve.alias["@front"] = path.resolve(__dirname, "../front_end/src");
    config.resolve.alias["@utils"] = path.resolve(__dirname, "../front_end/src/utils");
    config.resolve.alias["@shared"] = path.resolve(__dirname, "../shared/");
    return config;
  },
};

module.exports = nextConfig;
