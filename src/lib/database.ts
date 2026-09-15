// File: lib/database.ts
import 'server-only';
import { SERVER_ENV } from './server-env';

/**
 * Hàm gọi thẳng vào Neon DB bằng Pure HTTP Fetch.
 * Vượt qua mọi rào cản Edge Runtime và trình đóng gói.
 */
export async function executeNeonQuery(query: string, params: any[] = []) {
    const DATABASE_URL = SERVER_ENV.DATABASE_URL;

    if (!DATABASE_URL) {
        throw new Error('SERVER_ENV.DATABASE_URL is missing!');
    }

    const parsedUrl = new URL(DATABASE_URL);
    const fetchEndpoint = `https://${parsedUrl.hostname}/sql`;

    const response = await fetch(fetchEndpoint, {
        method: 'POST',
        headers: {
            'Neon-Connection-String': DATABASE_URL,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: query,
            params: params,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Neon DB Error: ${data.message || JSON.stringify(data)}`);
    }

    return data;
}

let isInitialized = false;

export async function ensurePiTablesExist() {
    if (isInitialized) return;
    try {
        const statements = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS remove_ads BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS remote_render_until TIMESTAMP;",
            `CREATE TABLE IF NOT EXISTS payments (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255),
                user_uid VARCHAR(255),
                amount NUMERIC(18, 7),
                memo TEXT,
                metadata JSONB,
                txid VARCHAR(255),
                status VARCHAR(50) DEFAULT 'INITIALIZED',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );`,
            "CREATE INDEX IF NOT EXISTS idx_payments_user_uid ON payments(user_uid);",
            "CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);",
            `CREATE TABLE IF NOT EXISTS ad_rewards (
                ad_id VARCHAR(255) PRIMARY KEY,
                user_uid VARCHAR(255),
                reward_type VARCHAR(50) DEFAULT 'export_credit',
                reward_amount INTEGER DEFAULT 1,
                granted_at TIMESTAMP DEFAULT NOW()
            );`,
            "CREATE INDEX IF NOT EXISTS idx_ad_rewards_user_uid ON ad_rewards(user_uid);"
        ];

        for (const sql of statements) {
            try {
                await executeNeonQuery(sql);
            } catch (e) {
                // Ignore if index/column already exists
            }
        }
        isInitialized = true;
    } catch (err) {
        console.warn('Auto-migration for Pi tables warning:', err);
    }
}
