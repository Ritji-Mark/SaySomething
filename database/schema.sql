-- ============================================================================
-- SaySomething — Database Schema
-- ----------------------------------------------------------------------------
-- Generated from the live PostgreSQL 18 + PostGIS 3.6 database (`saysomething`)
-- and extended with the spatial / foreign-key indexes the running DB is missing.
--
-- To recreate the database from scratch:
--   createdb saysomething
--   psql -d saysomething -f database/schema.sql
--
-- Notes:
--   * `reports.location` is tightened to geography(Point, 4326) to match how the
--     API writes it (ST_SetSRID(ST_MakePoint(lng, lat), 4326)). The current live
--     DB uses an untyped `geography` column; this is a safe, compatible narrowing.
--   * Timestamps use `timestamp without time zone` to match the live DB.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ----------------------------------------------------------------------------
-- Reference / lookup tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- NOTE: `categories` is defined lower down (after `departments`) because it now
-- carries foreign keys to authorities/departments for category → authority
-- routing, and those tables must exist first.

CREATE TABLE IF NOT EXISTS report_status (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- ----------------------------------------------------------------------------
-- Organizations
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS authorities (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    description   TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(30),
    address       TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id           SERIAL PRIMARY KEY,
    authority_id INTEGER NOT NULL,
    name         VARCHAR(150) NOT NULL,
    description  TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_department_authority
        FOREIGN KEY (authority_id) REFERENCES authorities(id) ON DELETE CASCADE
);

-- Report categories. `default_authority_id` / `default_department_id` implement
-- category → authority routing: when set, new reports in this category are
-- auto-assigned to that authority (+ optional department). Nullable; cleared
-- automatically if the referenced org is removed.
CREATE TABLE IF NOT EXISTS categories (
    id                    SERIAL PRIMARY KEY,
    name                  VARCHAR(100) NOT NULL UNIQUE,
    description           TEXT,
    default_authority_id  INTEGER,
    default_department_id INTEGER,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_default_authority
        FOREIGN KEY (default_authority_id) REFERENCES authorities(id) ON DELETE SET NULL,
    CONSTRAINT fk_category_default_department
        FOREIGN KEY (default_department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- Users
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    phone         VARCHAR(30),
    password_hash TEXT,                 -- nullable: Google-only accounts have no password
    google_id     VARCHAR(255) UNIQUE,  -- Google OAuth subject (sub); null for password accounts
    avatar_url    TEXT,                 -- profile picture from Google, when available
    role_id       INTEGER NOT NULL,
    authority_id  INTEGER,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_user_authority
        FOREIGN KEY (authority_id) REFERENCES authorities(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- Reports (core table)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reports (
    id            SERIAL PRIMARY KEY,
    report_number VARCHAR(30) NOT NULL UNIQUE,
    user_id       INTEGER NOT NULL,
    category_id   INTEGER NOT NULL,
    title         VARCHAR(200) NOT NULL,
    description   TEXT NOT NULL,
    location      geography(Point, 4326),
    address       TEXT,
    status_id     INTEGER NOT NULL,
    authority_id  INTEGER,
    department_id INTEGER,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at   TIMESTAMP,
    CONSTRAINT fk_report_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_report_category
        FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_report_status
        FOREIGN KEY (status_id) REFERENCES report_status(id),
    CONSTRAINT fk_report_authority
        FOREIGN KEY (authority_id) REFERENCES authorities(id) ON DELETE SET NULL,
    CONSTRAINT fk_report_department
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- Report-related tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS status_history (
    id         SERIAL PRIMARY KEY,
    report_id  INTEGER NOT NULL,
    status_id  INTEGER NOT NULL,
    changed_by INTEGER,  -- nullable: NULL = system/automated action (e.g. category auto-routing)
    note       TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_report
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_status
        FOREIGN KEY (status_id) REFERENCES report_status(id),
    CONSTRAINT fk_history_user
        FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
    id         SERIAL PRIMARY KEY,
    report_id  INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    comment    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_report
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evidence (
    id          SERIAL PRIMARY KEY,
    report_id   INTEGER NOT NULL,
    file_url    TEXT NOT NULL,
    file_type   VARCHAR(50),
    uploaded_by INTEGER NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidence_report
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_evidence_user
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    report_id  INTEGER,
    title      VARCHAR(200) NOT NULL,
    message    TEXT NOT NULL,
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_report
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Password-reset tokens (only the SHA-256 hash is stored; 1-hour, single-use).
CREATE TABLE IF NOT EXISTS password_resets (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- Indexes  (recommended additions — NOT present in the current live DB)
-- ----------------------------------------------------------------------------
-- Postgres does not auto-index foreign keys, and there is no spatial index yet.
-- These support the role-scoped list queries and future geospatial features.
-- ============================================================================

-- Spatial index for map / proximity / duplicate-detection queries
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST (location);

-- Foreign-key / filter indexes on reports
CREATE INDEX IF NOT EXISTS idx_reports_user_id       ON reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_authority_id  ON reports (authority_id);
CREATE INDEX IF NOT EXISTS idx_reports_department_id ON reports (department_id);
CREATE INDEX IF NOT EXISTS idx_reports_category_id   ON reports (category_id);
CREATE INDEX IF NOT EXISTS idx_reports_status_id     ON reports (status_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at    ON reports (created_at DESC);

-- Related tables
CREATE INDEX IF NOT EXISTS idx_status_history_report_id ON status_history (report_id);
CREATE INDEX IF NOT EXISTS idx_comments_report_id       ON comments (report_id);
CREATE INDEX IF NOT EXISTS idx_evidence_report_id       ON evidence (report_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id) WHERE is_read = FALSE;

-- Password resets
CREATE INDEX IF NOT EXISTS idx_password_resets_token   ON password_resets (token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets (user_id);

-- Users & departments
CREATE INDEX IF NOT EXISTS idx_users_role_id           ON users (role_id);
CREATE INDEX IF NOT EXISTS idx_users_authority_id      ON users (authority_id);
CREATE INDEX IF NOT EXISTS idx_departments_authority_id ON departments (authority_id);

-- ============================================================================
-- Seed data — required reference values (matches the live DB)
-- ============================================================================

INSERT INTO roles (id, name) VALUES
    (1, 'Citizen'),
    (2, 'Authority'),
    (3, 'Administrator')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description) VALUES
    (1, 'Roads',         'Road-related issues'),
    (2, 'Electricity',   'Electricity-related issues'),
    (3, 'Water',         'Water-related issues'),
    (4, 'Environment',   'Environmental issues'),
    (5, 'Public Safety', 'Public safety concerns')
ON CONFLICT (id) DO NOTHING;

INSERT INTO report_status (id, name, description) VALUES
    (1, 'Submitted',    'Report submitted'),
    (2, 'Under Review', 'Report under review'),
    (3, 'Assigned',     'Assigned to authority'),
    (4, 'In Progress',  'Work in progress'),
    (5, 'Resolved',     'Issue resolved')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- OPTIONAL sample data — one authority + department (safe to delete)
-- ----------------------------------------------------------------------------
INSERT INTO authorities (id, name, description, contact_email, contact_phone, address) VALUES
    (1, 'Jos Metropolitan Development Board',
        'Responsible for urban infrastructure and road development within the metropolitan area.',
        'roads@saysomething.local', '08000000001', 'Jos, Plateau State')
ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (id, authority_id, name, description) VALUES
    (1, 1, 'Roads and Infrastructure',
        'Responsible for road maintenance, potholes, drainage and related infrastructure issues.')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Keep sequences in sync with the explicit IDs inserted above
-- ----------------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('roles', 'id'),         (SELECT COALESCE(MAX(id), 1) FROM roles));
SELECT setval(pg_get_serial_sequence('categories', 'id'),    (SELECT COALESCE(MAX(id), 1) FROM categories));
SELECT setval(pg_get_serial_sequence('report_status', 'id'), (SELECT COALESCE(MAX(id), 1) FROM report_status));
SELECT setval(pg_get_serial_sequence('authorities', 'id'),   (SELECT COALESCE(MAX(id), 1) FROM authorities));
SELECT setval(pg_get_serial_sequence('departments', 'id'),   (SELECT COALESCE(MAX(id), 1) FROM departments));
