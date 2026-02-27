/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        // If backend URL is provided via environment var, use it. Otherwise, assume docker `backend` hostname.
        const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://backend:3005';
        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/api/:path*`, // Proxy to Backend
            },
        ];
    },
};

export default nextConfig;
