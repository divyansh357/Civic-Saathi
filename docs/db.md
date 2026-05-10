# Database Schema Guide

This file documents the current database schema in `db/schema.sql` and explains key design choices.

## 1. Core Design Decisions

- IDs use UUID across all core entities.
- Workflow statuses are controlled with CHECK constraints.
- Complaint ownership and scope are explicit: city + ward + zone + department.
- Geospatial and semantic search are enabled through PostGIS and pgvector.
- Auditability is first-class with `complaint_status_history` and `audit_logs`.

## 2. Required Extensions

- `postgis` for geospatial complaint location and radius-based queries.
- `vector` for embeddings and semantic similarity.
- `pgcrypto` for `gen_random_uuid()`.

## 3. Main Table Groups

### Identity and Access

- `users`
- `roles`
- `user_roles`
- `auth_tokens`

Highlights:
- Role assignment is managed through `roles` + `user_roles` (many-to-many).
- `users.status` is constrained to: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `BLOCKED`.
- `users.email` is optional (nullable) and unique when present.
- `users.password_hash` is optional to support OTP-first authentication flows.
- `auth_tokens` supports token lifecycle with `active`, `expires_at`, and `revoked_at`.

### Scope and Organization

- `cities`
- `wards`
- `zones`
- `departments`
- `workers`

Highlights:
- Wards are first-class and linked to cities.
- Zones are linked to cities and optionally to wards.
- Worker assignments are department-bound and user-backed.

### Complaints and Workflow

- `complaints`
- `complaint_category_map`
- `complaint_versions`
- `complaint_media`
- `assignments`
- `complaint_status_history`
- `complaint_duplicates`
- `complaint_comments`
- `complaint_support_votes`
- `feedback`
- `reopen_requests`

Highlights:
- `complaints.complaint_number` is unique and user-facing.
- `complaints.location` stores a geography point.
- Complaint status defaults to `SUBMITTED`.
- `complaints.embedding` stores a 1536-dimensional vector.
- Assignment flow supports acceptance/rejection and completion metadata.
- Duplicate worker assignment per complaint is blocked by `UNIQUE (complaint_id, worker_id)` in `assignments`.
- Support/upvote is modeled by `complaint_support_votes` with unique `(complaint_id, user_id)`.

### Notifications and Analytics

- `notification_types`
- `notifications`
- `analytics_snapshots`

### Audit

- `audit_logs`

## 4. Complaint Status Vocabulary

`complaints.status` and `complaint_status_history` support:

- `OPEN` (legacy compatibility)
- `SUBMITTED`
- `DUPLICATE_CHECKED`
- `VERIFIED`
- `ROUTED`
- `ASSIGNED`
- `ACKNOWLEDGED`
- `IN_PROGRESS`
- `RESOLVED`
- `VERIFIED_FOR_CLOSURE`
- `CLOSED`
- `REOPENED`
- `REJECTED`
- `CANCELLED`
- `ESCALATED`

Note:
- `OPEN` is retained for temporary compatibility with existing backend code that still uses legacy states.

## 5. Assignment Status Vocabulary

`assignments.status` supports:

- `ASSIGNED`
- `ACCEPTED`
- `REJECTED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

## 6. Important Indexes

- Complaint filtering: status, creator, department, city/ward/zone.
- Spatial search: GIST index on `complaints.location`.
- Semantic search: IVFFLAT index on `complaints.embedding` using cosine ops.
- Feed/timeline performance: index on `complaints.created_at`.
- Worker board performance: `(worker_id, status)`.
- Notification inbox performance: `(user_id, is_read)`.
- Audit and timeline queries: time-based compound indexes.

## 7. Implementation Notes

- `complaints.department_id` references `departments.id`.
- `complaints.assigned_worker_id` and `assignments.worker_id` reference `workers.id`.
- Use `complaint_status_history` for timeline views instead of inferring from current complaint state only.
- Keep write-path validation in backend service logic for allowed status transitions.

## 8. Migration Note for Existing Data

If an existing database uses SERIAL/INT IDs, create a dedicated migration script to:

1. Add UUID columns.
2. Backfill UUID values.
3. Rewire foreign keys.
4. Switch primary keys.
5. Drop old INT columns.

Do this carefully in staged migrations to avoid broken references.
