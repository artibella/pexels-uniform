/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
    NEXT_PUBLIC_BUILD_TIMESTAMP: String(new Date().valueOf()),
  },
  reactStrictMode: true,
  experimental: {
    // react-icons related bug https://linear.app/uniform/issue/UNI-1373/need-to-set-esmexternals-to-use-the-mesh-sdk-with-nextjs
    esmExternals: false,
  },
};

module.exports = nextConfig;
