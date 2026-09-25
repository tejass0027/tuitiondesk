import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets a phone on the same Wi-Fi open http://<this-PC's-IP>:3000
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
