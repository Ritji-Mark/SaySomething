-- 001_google_auth.sql
-- Adds Google (OAuth) sign-in support to the users table.
-- Google-authenticated users have no password, so password_hash becomes nullable.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id  VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
