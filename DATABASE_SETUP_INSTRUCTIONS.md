# Database Setup Instructions - Phase 1

## Current Status
✅ Backend stopped
✅ application.yml updated (ddl-auto: validate)

## Next Steps - Run in pgAdmin

### Step 1: Open pgAdmin
1. Open pgAdmin 4
2. Connect to your PostgreSQL server
3. Navigate to: **Servers → PostgreSQL → Databases → Civic**
4. Right-click on **Civic** database → **Query Tool**

### Step 2: Drop Existing Hibernate Schema

In the Query Tool, run:
```sql
-- File: db/drop_hibernate_schema.sql
-- Copy and paste the contents or use File → Open
```

Or manually execute:
```sql
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS auth_tokens CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Verify clean slate
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

**Expected Result**: Empty result set (no tables)

### Step 3: Run Authoritative Schema

In the same Query Tool:

**Option A: Load from file**
1. Click **File → Open** (or Ctrl+O)
2. Navigate to: `d:\Civic\Civic-Saathi\db\schema.sql`
3. Click **Open**
4. Click **Execute** (F5) or the ▶ button

**Option B: Copy and paste**
1. Open `d:\Civic\Civic-Saathi\db\schema.sql` in a text editor
2. Copy all contents (Ctrl+A, Ctrl+C)
3. Paste into Query Tool (Ctrl+V)
4. Click **Execute** (F5)

### Step 4: Verify Schema Creation

Run this query:
```sql
-- Count tables created
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
```

**Expected Result**: Should show 25+ tables

Run this query to see all tables:
```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected Tables** (25+):
- analytics_snapshots
- assignments
- audit_logs
- auth_tokens
- categories
- cities
- complaint_category_map
- complaint_comments
- complaint_duplicates
- complaint_media
- complaint_status_history
- complaint_support_votes
- complaint_versions
- complaints
- departments
- feedback
- notification_types
- notifications
- reopen_requests
- roles
- user_roles
- users
- wards
- workers
- zones

### Step 5: Verify Extensions

Run this query:
```sql
-- Check PostgreSQL extensions
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('postgis', 'vector', 'pgcrypto');
```

**Expected Result**:
```
extname   | extversion
----------|------------
postgis   | 3.x.x
vector    | 0.x.x
pgcrypto  | 1.x
```

If any extension is missing, run:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Step 6: Verify Key Tables Structure

Check users table:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

Check complaints table:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'complaints'
ORDER BY ordinal_position;
```

## Troubleshooting

### Error: "relation does not exist"
- Make sure you dropped all old tables first
- Verify you're connected to the correct database (Civic)

### Error: "extension does not exist"
- Run the CREATE EXTENSION commands above
- You may need superuser privileges

### Error: "permission denied"
- Ensure your PostgreSQL user has CREATE privileges
- Check database ownership

## After Successful Schema Creation

Once all tables are created:

1. ✅ Verify 25+ tables exist
2. ✅ Verify extensions are enabled
3. ✅ Close pgAdmin Query Tool
4. 🔄 Return to Kiro - we'll start creating entities

## Status Checklist

- [ ] Backend stopped
- [ ] application.yml updated (ddl-auto: validate)
- [ ] Old Hibernate tables dropped
- [ ] schema.sql executed successfully
- [ ] 25+ tables verified
- [ ] Extensions verified (postgis, vector, pgcrypto)
- [ ] Ready for entity creation

---

**IMPORTANT**: Do NOT start the backend yet. We need to create the entity classes first, otherwise Hibernate validation will fail because entities don't match the new schema.

## Next Phase

After completing these steps, we'll proceed to:
- Phase 2: Create Geography entities (City, Ward, Zone)
- Phase 3: Create RBAC entities (Role, update User)
- Phase 4: Update all existing entities to match new schema
- Phase 5: Create new entities for extended features

Let me know when you've completed the database setup!
