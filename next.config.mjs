import { readFileSync } from "node:fs";

// Versi app dari package.json, ditanam saat build -> tampil di header dashboard.
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // build mandiri untuk Docker (kecil, tanpa node_modules penuh)
  env: { APP_VERSION: pkg.version },
};

export default nextConfig;
