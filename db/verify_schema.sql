-- Verify Database Schema for Civic Saathi
-- Run this in pgAdmin Query Tool to verify all tables and columns exist

-- Check if all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('users', 'auth_tokens', 'departments', 'workers', 'complaints', 'assignments', 'notifications')
ORDER BY table_name;

-- Check users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'users'
ORDER BY ordinal_position;

-- Check auth_tokens table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'auth_tokens'
ORDER BY ordinal_position;

-- Check departments table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'departments'
ORDER BY ordinal_position;

-- Check workers table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'workers'
ORDER BY ordinal_position;

-- Check complaints table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'complaints'
ORDER BY ordinal_position;

-- Check assignments table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'assignments'
ORDER BY ordinal_position;

-- Check notifications table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Verify all ID columns are UUID type
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name = 'id'
    AND table_name IN ('users', 'auth_tokens', 'departments', 'workers', 'complaints', 'assignments', 'notifications')
ORDER BY table_name;

-- Verify all foreign key columns are UUID type
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name LIKE '%_id'
    AND table_name IN ('auth_tokens', 'workers', 'complaints', 'assignments', 'notifications')
ORDER BY table_name, column_name;

-- Check foreign key constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Check if PostGIS extension is enabled
SELECT 
    extname AS extension_name,
    extversion AS version
FROM pg_extension
WHERE extname IN ('postgis', 'vector');

-- Count records in each table
SELECT 'users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL
SELECT 'auth_tokens', COUNT(*) FROM auth_tokens
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'workers', COUNT(*) FROM workers
UNION ALL
SELECT 'complaints', COUNT(*) FROM complaints
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY table_name;

-- Show sample data from users table (without sensitive info)
SELECT 
    id,
    name,
    email,
    role,
    city,
    verified,
    status,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- Show sample data from auth_tokens table
SELECT 
    id,
    user_id,
    token_type,
    active,
    created_at,
    expires_at
FROM auth_tokens
ORDER BY created_at DESC
LIMIT 5;
