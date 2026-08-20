-- 003_category_routing.sql
-- Category → authority routing + a nullable actor on status_history so
-- automated (non-human) status changes can be recorded.

-- Category routing defaults. Nullable; auto-cleared if the referenced org is
-- removed, mirroring reports.authority_id / department_id (ON DELETE SET NULL).
-- Inline FKs via ADD COLUMN IF NOT EXISTS keep this idempotent.
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS default_authority_id INTEGER
        REFERENCES authorities(id) ON DELETE SET NULL;

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS default_department_id INTEGER
        REFERENCES departments(id) ON DELETE SET NULL;

-- Allow system/automated status-history rows (changed_by = NULL). Re-running
-- is a no-op. Mirrors 001_google_auth.sql's `password_hash DROP NOT NULL`.
ALTER TABLE status_history ALTER COLUMN changed_by DROP NOT NULL;
