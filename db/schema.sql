-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- USERS & RBAC
-- =========================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state TEXT,
    country TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id),
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (city_id, name)
);

CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id),
    ward_id UUID REFERENCES wards(id),
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (city_id, name)
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city_id UUID REFERENCES cities(id),
    category_type TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED')),
    failed_login_attempts INT NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP,
    city_id UUID REFERENCES cities(id),
    ward_id UUID REFERENCES wards(id),
    zone_id UUID REFERENCES zones(id),
    language_preference TEXT,
    profile_picture_url TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE (user_id, role_id)
);

CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    designation TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
    specialization TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    complaints_assigned INT NOT NULL DEFAULT 0,
    complaints_resolved INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP
);

CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    token_type TEXT NOT NULL CHECK (token_type IN ('ACCESS', 'REFRESH', 'API_KEY')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================
-- CATEGORIES
-- =========================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- COMPLAINT CORE
-- =========================

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (
        status IN (
            'OPEN',
            'SUBMITTED',
            'DUPLICATE_CHECKED',
            'VERIFIED',
            'ROUTED',
            'ASSIGNED',
            'ACKNOWLEDGED',
            'IN_PROGRESS',
            'RESOLVED',
            'VERIFIED_FOR_CLOSURE',
            'CLOSED',
            'REOPENED',
            'REJECTED',
            'CANCELLED',
            'ESCALATED'
        )
    ),
    priority TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    assigned_worker_id UUID REFERENCES workers(id),
    city_id UUID NOT NULL REFERENCES cities(id),
    ward_id UUID REFERENCES wards(id),
    zone_id UUID REFERENCES zones(id),
    location GEOGRAPHY(Point, 4326),
    address_text TEXT,
    visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'PUBLIC')),
    trust_score NUMERIC(5, 2) DEFAULT 0,
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    ai_summary TEXT,
    ai_priority_score FLOAT,
    embedding VECTOR(1536),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- MULTI CATEGORY
CREATE TABLE complaint_category_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    UNIQUE (complaint_id, category_id)
);

-- VERSION HISTORY
CREATE TABLE complaint_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    edited_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- MEDIA (IMAGE + VIDEO)
CREATE TABLE complaint_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('IMAGE', 'VIDEO')),
    type TEXT CHECK (type IN ('BEFORE', 'AFTER', 'GENERAL')),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- ASSIGNMENTS (PARALLEL)
-- =========================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id),
    assigned_by UUID NOT NULL REFERENCES users(id),
    status TEXT NOT NULL CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    deadline_at TIMESTAMP,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    completed_at TIMESTAMP,
    UNIQUE (complaint_id, worker_id)
);

-- =========================
-- STATUS HISTORY (AUDIT)
-- =========================

CREATE TABLE complaint_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    old_status TEXT CHECK (
        old_status IN (
            'OPEN',
            'SUBMITTED',
            'DUPLICATE_CHECKED',
            'VERIFIED',
            'ROUTED',
            'ASSIGNED',
            'ACKNOWLEDGED',
            'IN_PROGRESS',
            'RESOLVED',
            'VERIFIED_FOR_CLOSURE',
            'CLOSED',
            'REOPENED',
            'REJECTED',
            'CANCELLED',
            'ESCALATED'
        )
    ),
    new_status TEXT NOT NULL CHECK (
        new_status IN (
            'OPEN',
            'SUBMITTED',
            'DUPLICATE_CHECKED',
            'VERIFIED',
            'ROUTED',
            'ASSIGNED',
            'ACKNOWLEDGED',
            'IN_PROGRESS',
            'RESOLVED',
            'VERIFIED_FOR_CLOSURE',
            'CLOSED',
            'REOPENED',
            'REJECTED',
            'CANCELLED',
            'ESCALATED'
        )
    ),
    changed_by UUID NOT NULL REFERENCES users(id),
    action_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    before_state JSONB,
    after_state JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- FEEDBACK + REOPEN
-- =========================

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_satisfied BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reopen_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    reopen_count INT CHECK (reopen_count <= 6),
    status TEXT NOT NULL CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE complaint_support_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (complaint_id, user_id)
);

-- =========================
-- NOTIFICATIONS
-- =========================

CREATE TABLE notification_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type_id UUID REFERENCES notification_types(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_id UUID,
    related_entity_type TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- DUPLICATES
-- =========================

CREATE TABLE complaint_duplicates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    duplicate_of UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    similarity_score FLOAT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (complaint_id, duplicate_of)
);

-- =========================
-- COMMENTS / CHAT
-- =========================

CREATE TABLE complaint_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    message TEXT,
    media_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- ANALYTICS SNAPSHOTS
-- =========================

CREATE TABLE analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE,
    total_complaints INT,
    resolved_count INT,
    pending_count INT,
    avg_resolution_time FLOAT,
    top_category TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- INDEXES (CRITICAL)
-- =========================

-- Complaints
CREATE INDEX idx_complaint_status ON complaints(status);
CREATE INDEX idx_complaint_user ON complaints(created_by);
CREATE INDEX idx_complaint_department ON complaints(department_id);
CREATE INDEX idx_complaint_city_ward_zone ON complaints(city_id, ward_id, zone_id);

-- GEO INDEX
CREATE INDEX idx_complaint_location ON complaints USING GIST(location);

-- VECTOR INDEX
CREATE INDEX idx_embedding ON complaints USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Time-based complaint listing
CREATE INDEX idx_complaint_created_at ON complaints(created_at);

-- Assignments
CREATE INDEX idx_worker_tasks ON assignments(worker_id, status);

-- Notifications
CREATE INDEX idx_user_notifications ON notifications(user_id, is_read);

-- Categories
CREATE INDEX idx_category_map ON complaint_category_map(category_id);

-- Status history
CREATE INDEX idx_status_history_complaint_time ON complaint_status_history(complaint_id, created_at);

-- Support votes
CREATE INDEX idx_support_votes_complaint ON complaint_support_votes(complaint_id);

-- Audit
CREATE INDEX idx_audit_logs_actor_time ON audit_logs(actor_id, created_at);