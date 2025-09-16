import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel デプロイ最適化設定
  output: 'standalone',
  
  // Firebase Functions フォルダを除外
  outputFileTracingExcludes: {
    '*': ['./functions/**/*'],
  },
  
  // 画像最適化
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: false,
  },
  
  // 環境変数の設定
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  
  // ESLint設定
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
