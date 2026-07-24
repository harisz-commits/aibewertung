import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Linting is run separately; do not fail production builds on lint.
    ignoreDuringBuilds: true
  }
};

export default withNextIntl(nextConfig);
