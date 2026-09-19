import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // The schedule/event SQLite file is opened by better-sqlite3's native
  // binding (a dynamic fs call the tracer can't follow statically), and it's
  // generated fresh by the `vercel-build` script right before this build
  // runs — without this it silently wouldn't ship in the deployed bundle.
  outputFileTracingIncludes: {
    "/*": ["./data/*.sqlite"],
  },
};

export default nextConfig;
