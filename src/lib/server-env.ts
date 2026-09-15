// File: lib/server-env.ts
import 'server-only'; // Enforces server-only execution; prevents client bundle leakage

export const SERVER_ENV = {
    // === Database & Auth ===
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_smAJPypV0wg3@ep-orange-bar-adwhxow1-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    JWT_SECRET: process.env.JWT_SECRET || "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", // Ensure to rotate in production

    // === Hugging Face & Render ===
    RENDER_SERVER_TOKEN: process.env.RENDER_SERVER_TOKEN || "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",
    RENDER_SERVER_URL: process.env.RENDER_SERVER_URL || "https://dothien1710-edge-api5.hf.space/7862/",
    HF_TOKEN: process.env.HF_TOKEN || "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",
    RENDER_MODE: process.env.RENDER_MODE || "remote",
    SSR_MODE: process.env.SSR_MODE || "ssr-local",
    // === APIs & External Services ===
    PEXELS_API_KEY: process.env.PEXELS_API_KEY || "563492ad6f9170000100000172ccefc96f674d01869ba24acc62a573",
    VOICE_API_TOKEN: process.env.VOICE_API_TOKEN || "dc_live_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    COMBO_SK: process.env.COMBO_SK || "dc_live_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    COMBO_SH_JWT: process.env.COMBO_SH_JWT || "dc_live_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    SONITRANSLATE_API_ID: process.env.SONITRANSLATE_API_ID || "hoangquocviet/shortlixserver",
    TRANSCRIB_API_ID: process.env.TRANSCRIB_API_ID || "hoangquocviet/faster-whisper-webuiwss",
    PI_NETWORK_API_KEY: process.env.PI_NETWORK_API_KEY || process.env.PI_API || process.env.PI_SERVER_API_KEY || "qsdyfehi7rgik3qt1n5e3tuhhfqepgh5funpjqewct6anpsuchi88ojitspxsekd",
    PI_API: process.env.PI_NETWORK_API_KEY || process.env.PI_API || process.env.PI_SERVER_API_KEY || "qsdyfehi7rgik3qt1n5e3tuhhfqepgh5funpjqewct6anpsuchi88ojitspxsekd",
    REMOVE_ADS_PRICE_PI: Number(process.env.REMOVE_ADS_PRICE_PI || 5.0),
    REMOTE_RENDER_MONTHLY_PRICE_PI: Number(process.env.REMOTE_RENDER_MONTHLY_PRICE_PI || 10.0),
    VIP_PRICE_PI: Number(process.env.VIP_PRICE_PI || 1.0),
    CREDIT_PACKAGE_PRICE_PI: Number(process.env.CREDIT_PACKAGE_PRICE_PI || 0.5),
};
