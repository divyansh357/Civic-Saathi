# Database Changes Log

This document tracks all past database schema changes and planned future changes for the Civic Saathi project.

## Current DB Status
- The database is currently running on **local PostgreSQL** (as configured in `.env`). Supabase is not currently being used.
- Main entities: User, Worker, Department, Complaint, Assignment, Location (City, Zone, Ward), Category.
- Assignment statuses: `ASSIGNED`, `ACCEPTED`, `REJECTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- Complaint statuses: `SUBMITTED`, `ACKNOWLEDGED`, `ROUTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `VERIFIED_FOR_CLOSURE`, `CLOSED`, `REJECTED`.

## Local Contributor Instructions
Because we are using local PostgreSQL, any schema changes must be applied by each contributor manually to their local database.

**IMPORTANT: Apply the following SQL to your local `Civic` database to resolve the Notification Schema Error:**
```sql
-- 1. Drop the incomplete notification_type_id constraint
ALTER TABLE notifications DROP COLUMN IF EXISTS notification_type_id CASCADE;

-- 2. Drop the unused notification_types table
DROP TABLE IF EXISTS notification_types CASCADE;

-- 3. Ensure the notifications table has the correct fields
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'SYSTEM';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'IN_APP';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
```
*(Note: A Spring Boot `@PostConstruct` hook in `CivicApplication.java` currently automatically drops `notification_type_id` on startup to prevent crashes, but running this SQL ensures your schema is perfectly aligned).*

## Past Changes
- Added Worker entity linked to User.
- Synchronized frontend `ComplaintStatus` enum to match backend exactly (added `OPEN`, `ACKNOWLEDGED`, `VERIFIED_FOR_CLOSURE`).
- Added Assignment entity for Complaint-Worker mapping with statuses.
- Added PostGIS location support (Point) to Complaint.
- Added AI-verification fields (`ai_summary`, `ai_priority_score`, `verification_method`) to Complaint.
- Upgraded Assignment to support assignment timestamps (`assigned_at`, `accepted_at`, `completed_at`, `rejected_at`, `deadline_at`).
- **Authentication Context Refactor**: Removed all reliance on custom `User-Id` headers across all API controllers (`UserController`, `ComplaintController`, `ComplaintCommentController`, `FeedbackController`, `ReopenController`) in favor of extracting `java.security.Principal` directly from the JWT token in the security context. No DB changes required — this is a backend API contract change.
- **Graceful Assignment Handling**: Updated logic to catch duplicate constraints on the `assignments_complaint_id_worker_id_key` unique index, ensuring idempotent assignment requests.

## Future / Pending Changes
- **Add multiple proof attachments for assignments**: Currently, the `Assignment` entity has a `@ElementCollection` for `completionImages` (List of Strings). Ensure this table (`assignment_completion_images`) is fully utilized or upgraded to handle video URLs as well.
- **Review Statuses**: Align `Complaint` and `Assignment` status enums precisely across backend and frontend to prevent parsing/mapping issues.
- **Time Management / SLAs**: Ensure proper fields exist for calculating SLA breaches based on task start and completion times.

*Note: Always verify changes via backend entities and Supabase state before applying new schema modifications.*
