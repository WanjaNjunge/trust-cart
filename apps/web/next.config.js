/** @type {import('next').NextConfig} */
const nextConfig = {
    // Strict mode for better development experience
    reactStrictMode: true,

    // Image optimization
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.trustcart.co.ke',
            },
        ],
    },

    // Environment variables exposed to browser
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    },
};

module.exports = nextConfig;
