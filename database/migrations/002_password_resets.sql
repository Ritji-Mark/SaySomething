-- 002_password_resets.sql
-- Password-reset tokens. We store only the SHA-256 hash of each token, never
-- the token itself; tokens expire after 1 hour and are single-use (used_at).

CREATE TABLE IF NOT EXISTS password_resets (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token   ON password_resets (token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets (user_id);
