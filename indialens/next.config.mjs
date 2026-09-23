/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Allow pages that fail static generation (e.g. Supabase unreachable locally)
    // to still build; they will SSR at runtime instead.
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
