# Database Changes Log

This document tracks all past database schema changes and planned future changes for the Civic Saathi project.

## Current DB Status
- The database is currently hosted on Supabase.
- Main entities: User, Worker, Department, Complaint, Assignment, Location (City, Zone, Ward), Category.
- Assignment statuses: `ASSIGNED`, `ACCEPTED`, `REJECTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- Complaint statuses: `SUBMITTED`, `ACKNOWLEDGED`, `ROUTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `VERIFIED_FOR_CLOSURE`, `CLOSED`, `REJECTED`.

## Past Changes
- Added Worker entity linked to User.
- Synchronized frontend `ComplaintStatus` enum to match backend exactly (added `OPEN`, `ACKNOWLEDGED`, `VERIFIED_FOR_CLOSURE`).
- Added Assignment entity for Complaint-Worker mapping with statuses.
- Added PostGIS location support (Point) to Complaint.
- Added AI-verification fields (`ai_summary`, `ai_priority_score`, `verification_method`) to Complaint.
- Upgraded Assignment to support assignment timestamps (`assigned_at`, `accepted_at`, `completed_at`, `rejected_at`, `deadline_at`).

## Future / Pending Changes
- **Add multiple proof attachments for assignments**: Currently, the `Assignment` entity has a `@ElementCollection` for `completionImages` (List of Strings). Ensure this table (`assignment_completion_images`) is fully utilized or upgraded to handle video URLs as well.
- **Review Statuses**: Align `Complaint` and `Assignment` status enums precisely across backend and frontend to prevent parsing/mapping issues.
- **Time Management / SLAs**: Ensure proper fields exist for calculating SLA breaches based on task start and completion times.

*Note: Always verify changes via backend entities and Supabase state before applying new schema modifications.*
