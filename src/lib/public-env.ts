// File: lib/public-env.ts
// LƯU Ý: File này DÀNH CHO FRONTEND. KHÔNG dùng thẻ 'server-only' ở đây.
// Được phép import vào các Client Component (những file có "use client").

export const PUBLIC_ENV = {
    RENDER_MODE: process.env.NEXT_PUBLIC_RENDER_MODE || process.env.RENDER_MODE || "remote",
    RENDER_SERVER_URL: process.env.NEXT_PUBLIC_RENDER_SERVER_URL || process.env.RENDER_SERVER_URL || "https://dothien1710-edge-api5.hf.space/7863/",
    SSR_MODE: process.env.NEXT_PUBLIC_SSR_MODE || process.env.SSR_MODE || "ssr-local",
    DEFAULT_RENDER_MODE: process.env.NEXT_PUBLIC_DEFAULT_RENDER_MODE || "csr",
    NODE_ENV: process.env.NODE_ENV || "production",
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCRIS1kx-z919qxUx1OnhCvBWYGuwNiUIg",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "veditor-73d90.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "veditor-73d90",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "veditor-73d90.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "25486957527",
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:25486957527:web:39fe6048a6e0adaadf8992",
};
