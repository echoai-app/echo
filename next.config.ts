import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the on-screen Next.js dev indicator (bottom-left badge).
  devIndicators: false,
  // The app is a client-routed SPA; these friendly URLs all serve it, and the
  // client boots to the matching screen — so a reload keeps you where you were.
  async rewrites() {
    return [
      { source: '/:screen(home|profile|account|privacy|help|journey|recall|session)', destination: '/' },
    ];
  },
};

export default nextConfig;
