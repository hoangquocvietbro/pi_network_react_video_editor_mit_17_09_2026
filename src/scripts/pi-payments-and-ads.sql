-- Migration for Pi Network Payments & Ads
-- Updates users table, creates payments and ad_rewards tables

-- 1. Ensure credits and is_vip exist on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;

-- 2. Create payments table to track transactions
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(255) PRIMARY KEY, -- Pi payment identifier
    user_id VARCHAR(255),
    user_uid VARCHAR(255),
    amount NUMERIC(18, 7),
    memo TEXT,
    metadata JSONB,
    txid VARCHAR(255),
    status VARCHAR(50) DEFAULT 'INITIALIZED', -- INITIALIZED, APPROVED, COMPLETED, CANCELLED, FAILED
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_uid ON payments(user_uid);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 3. Create ad_rewards table to prevent replay attacks
CREATE TABLE IF NOT EXISTS ad_rewards (
    ad_id VARCHAR(255) PRIMARY KEY,
    user_uid VARCHAR(255),
    reward_type VARCHAR(50) DEFAULT 'export_credit',
    reward_amount INTEGER DEFAULT 1,
    granted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_rewards_user_uid ON ad_rewards(user_uid);
