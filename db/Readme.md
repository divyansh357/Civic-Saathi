# 🗄️ Civic Saathi - Database Structure

This directory contains SQL schemas, mock data scripts, and migration files documenting the underlying database architecture of the Civic Saathi platform.

## 🛠️ Technology
- **PostgreSQL 16**
- **PostGIS 3.4** (Crucial for `GEOGRAPHY` data types and spatial auto-routing)
- **pgvector** (For storing AI embeddings to detect duplicate complaints)

## 📂 Key Files
- `schema.sql`: Contains the DDL (Data Definition Language) for all 25+ core tables. Use this file as a reference or to manually apply the schema to a blank database.

## 💡 Key Design Patterns

### 1. Spatial Indexing
Civic Saathi heavily leverages PostGIS. The `Complaint` and `User` tables utilize the `GEOGRAPHY(Point, 4326)` type. This enables the backend to execute highly optimized `ST_DWithin` and `ST_Distance` queries to automatically route complaints to the nearest available Field Worker.

### 2. UUID Primary Keys
All entities (Users, Complaints, Departments) utilize `UUID`s as primary keys rather than auto-incrementing integers. This:
- Prevents ID enumeration attacks.
- Enhances security.
- Facilitates seamless data merging if the system becomes decentralized.

### 3. Comprehensive Audit Trails
For government accountability, no data is truly deleted. 
- `ComplaintStatusHistory` tracks every state transition.
- `ComplaintVersion` retains previous text states.
- `AuditLog` captures granular system actions.

### 4. Granular RBAC
Users are decoupled from a strict single-role string and instead utilize a Many-to-Many mapping table `user_roles`. This enables a single user to act as both a Citizen and a Worker depending on context.

## 🚀 Applying the Schema Manually
If you are not using Hibernate's `ddl-auto=update` and wish to apply the exact script:

```powershell
Get-Content schema.sql | docker exec -i civic_postgres psql -U postgres -d Civic
```
