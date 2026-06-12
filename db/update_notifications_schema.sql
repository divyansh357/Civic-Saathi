-- ==============================================================================
-- MIGRATION SCRIPT: Update Notifications Schema
-- ==============================================================================
-- This script updates the local PostgreSQL database to remove the incomplete
-- notification_type_id constraint and restore the base notification fields
-- so that it aligns with the current Hibernate entities.
-- ==============================================================================

-- 1. Drop the incomplete notification_type_id constraint
ALTER TABLE notifications DROP COLUMN IF EXISTS notification_type_id CASCADE;

-- 2. Drop the unused notification_types table
DROP TABLE IF EXISTS notification_types CASCADE;

-- 3. Ensure the notifications table has the correct fields
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'SYSTEM';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'IN_APP';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';

-- Note: The type column is originally set to NOT NULL in the entity, but when altering 
-- existing tables with data, we provide a default value to prevent constraint violations
-- on older rows.

-- 4. Update any null values if they exist (defensive cleanup)
UPDATE notifications SET type = 'SYSTEM' WHERE type IS NULL;
UPDATE notifications SET channel = 'IN_APP' WHERE channel IS NULL;
UPDATE notifications SET status = 'PENDING' WHERE status IS NULL;
