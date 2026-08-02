/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // build mandiri untuk Docker (kecil, tanpa node_modules penuh)
};

export default nextConfig;
