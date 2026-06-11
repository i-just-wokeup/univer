import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : "qmslcvnuzjraphvnaqxx.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
