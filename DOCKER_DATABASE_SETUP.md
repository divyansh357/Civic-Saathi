# Docker PostgreSQL Setup with PostGIS

## Issue
Your local PostgreSQL (accessed via pgAdmin) doesn't have PostGIS extension installed. The Docker setup has PostgreSQL with PostGIS built-in.

## Solution: Use Docker PostgreSQL

### Step 1: Start Docker PostgreSQL

```bash
cd infra
docker compose up -d postgres
```

This will:
- Start PostgreSQL 16 with PostGIS 3.4
- Create the `Civic` database
- Enable PostGIS, uuid-ossp, and vector extensions
- Expose on port 5432

### Step 2: Connect pgAdmin to Docker PostgreSQL

1. Open pgAdmin
2. Right-click **Servers** → **Register** → **Server**
3. **General** tab:
   - Name: `Civic Docker`
4. **Connection** tab:
   - Host: `localhost`
   - Port: `5432`
   - Maintenance database: `Civic`
   - Username: `postgres` (from your .env)
   - Password: `root` (from your .env)
5. Click **Save**

### Step 3: Run Schema Script

1. In pgAdmin, connect to **Civic Docker** server
2. Navigate to **Databases → Civic**
3. Right-click → **Query Tool**
4. Run `force_drop_all_tables.sql` first (to clean existing tables)
5. Run `schema.sql` (will create all 25+ tables with PostGIS support)

### Step 4: Verify Setup

Run this query:
```sql
-- Check extensions
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('postgis', 'vector', 'pgcrypto', 'uuid-ossp');

-- Check tables
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

Expected:
- Extensions: postgis, vector (or uuid-ossp), pgcrypto (or uuid-ossp)
- Tables: 25+

## Backend Configuration

Your `.env` already points to `localhost:5432`, so the backend will automatically connect to the Docker PostgreSQL:

```env
DB_URL=jdbc:postgresql://localhost:5432/Civic
DB_USERNAME=postgres
DB_PASSWORD=root
```

No changes needed!

## Docker Commands

```bash
# Start PostgreSQL
cd infra
docker compose up -d postgres

# Stop PostgreSQL
docker compose down postgres

# View logs
docker compose logs -f postgres

# Restart PostgreSQL
docker compose restart postgres

# Remove PostgreSQL (deletes data!)
docker compose down -v postgres
```

## Troubleshooting

### Port 5432 already in use
If you have local PostgreSQL running:
```bash
# Windows
net stop postgresql-x64-16

# Or change Docker port in docker-compose.yml:
ports:
  - "5433:5432"  # Use 5433 on host
```

### Can't connect from pgAdmin
- Verify Docker container is running: `docker ps`
- Check logs: `docker compose logs postgres`
- Verify credentials match your `.env` file

### Extensions not available
- The Docker image `postgis/postgis:16-3.4` includes PostGIS
- pgvector may not be available (optional for AI features)
- The updated schema.sql handles missing extensions gracefully

## Summary

✅ **Use Docker PostgreSQL** - Has PostGIS built-in
✅ **Connect pgAdmin to Docker** - localhost:5432
✅ **Run schema.sql** - Will work with all extensions
✅ **Backend connects automatically** - No config changes needed

---

**Next Steps:**
1. Start Docker PostgreSQL: `docker compose up -d postgres`
2. Connect pgAdmin to Docker PostgreSQL
3. Run `force_drop_all_tables.sql`
4. Run `schema.sql`
5. Verify with `verify_full_schema.sql`
6. Let me know when complete!
