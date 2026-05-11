-- Verify Full Schema Implementation
-- Run this after executing schema.sql to confirm everything is set up correctly

-- 1. Count total tables
SELECT 
    'Total Tables' as check_name,
    COUNT(*)::text as result,
    CASE WHEN COUNT(*) >= 25 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- 2. List all tables
SELECT 
    'Table List' as check_name,
    string_agg(table_name, ', ' ORDER BY table_name) as result,
    '✅ INFO' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- 3. Check required extensions
SELECT 
    'Extensions' as check_name,
    string_agg(extname || ' (' || extversion || ')', ', ') as result,
    CASE WHEN COUNT(*) >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_extension 
WHERE extname IN ('postgis', 'vector', 'pgcrypto');

-- 4. Verify core tables exist
SELECT 
    'Core Tables' as check_name,
    string_agg(
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = t.name
        ) THEN t.name ELSE 'MISSING: ' || t.name END,
        ', '
    ) as result,
    CASE WHEN COUNT(*) = (
        SELECT COUNT(*) FROM (VALUES 
            ('users'), ('roles'), ('user_roles'), ('cities'), ('wards'), ('zones'),
            ('departments'), ('workers'), ('auth_tokens'), ('categories'),
            ('complaints'), ('assignments'), ('notifications')
        ) AS x
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM (VALUES 
    ('users'), ('roles'), ('user_roles'), ('cities'), ('wards'), ('zones'),
    ('departments'), ('workers'), ('auth_tokens'), ('categories'),
    ('complaints'), ('assignments'), ('notifications')
) AS t(name);

-- 5. Check users table structure
SELECT 
    'Users Table Columns' as check_name,
    COUNT(*)::text || ' columns' as result,
    CASE WHEN COUNT(*) >= 15 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'users';

-- 6. Check complaints table structure
SELECT 
    'Complaints Table Columns' as check_name,
    COUNT(*)::text || ' columns' as result,
    CASE WHEN COUNT(*) >= 20 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'complaints';

-- 7. Verify UUID columns
SELECT 
    'UUID Primary Keys' as check_name,
    COUNT(*)::text || ' tables with UUID id' as result,
    CASE WHEN COUNT(*) >= 20 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'id'
  AND data_type = 'uuid';

-- 8. Check foreign key constraints
SELECT 
    'Foreign Keys' as check_name,
    COUNT(*)::text || ' foreign key constraints' as result,
    CASE WHEN COUNT(*) >= 20 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND constraint_type = 'FOREIGN KEY';

-- 9. Check indexes
SELECT 
    'Indexes' as check_name,
    COUNT(*)::text || ' indexes created' as result,
    CASE WHEN COUNT(*) >= 15 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_indexes
WHERE schemaname = 'public';

-- 10. Verify PostGIS geometry column
SELECT 
    'PostGIS Geometry' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'complaints' 
          AND column_name = 'location'
          AND udt_name = 'geography'
    ) THEN 'location column exists' ELSE 'MISSING location column' END as result,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'complaints' 
          AND column_name = 'location'
          AND udt_name = 'geography'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 11. Verify pgvector embedding column
SELECT 
    'pgvector Embedding' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'complaints' 
          AND column_name = 'embedding'
    ) THEN 'embedding column exists' ELSE 'MISSING embedding column' END as result,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'complaints' 
          AND column_name = 'embedding'
    ) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- 12. Summary
SELECT 
    '=== SUMMARY ===' as check_name,
    'Schema setup ' || CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ) >= 25 
        AND (
            SELECT COUNT(*) FROM pg_extension 
            WHERE extname IN ('postgis', 'vector', 'pgcrypto')
        ) >= 3
        THEN 'COMPLETE ✅'
        ELSE 'INCOMPLETE ❌'
    END as result,
    '' as status;
