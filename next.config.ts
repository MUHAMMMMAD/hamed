import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // TypeScript 7 لا يوفّر واجهة المُصرِّف القديمة التي يستخدمها Next افتراضياً،
  // فنوجّهه لاستدعاء tsc عبر سطر الأوامر بدلاً منها.
  experimental: { useTypeScriptCli: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
