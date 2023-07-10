/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ALCHEMY_BUNDLER_URL: process.env.ALCHEMY_BUNDLER_URL,
  },
};

module.exports = nextConfig;
