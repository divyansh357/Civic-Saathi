# Schema Implementation Guide

## Issue Identified ✅

You are correct! The `db/schema.sql` file is the **authoritative database schema** and should not be modified. However, Hibernate has created a simplified schema that doesn't match the comprehensive design in `db/schema.sql`.

## Current Situation

### What Hibernate Created (7 tables)
1. users
2. auth_tokens
3. departments
4. workers
5. complaints
6. assignments
7. notifications

### What Should Exist (25+ tables from schema.sql)
1. **RBAC & Users**: roles, cities, wards, zones, departments, users, user_roles, workers, auth_tokens
2. **Categories**: categories, complaint_category_map
3. **Complaints**: complaints, complaint_versions, complaint_media
4. **Assignments**: assignments
5. **Status & Audit**: complaint_status_history, audit_logs
6. **Feedback**: feedback, reopen_requests, complaint_support_votes
7. **Notifications**: notification_types, notifications
8. **Duplicates**: complaint_duplicates
9. **Comments**: complaint_comments
10. **Analytics**: analytics_snapshots

## Solution: Implement the Proper Schema

### Step 1: Drop Hibernate-Created Schema

Run this in pgAdmin Query Tool:

```sql
-- Drop all Hibernate-created tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS auth_tokens CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Verify all tables are dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
```

### Step 2: Run the Authoritative Schema

In pgAdmin:
1. Open Query Tool (Tools → Query Tool)
2. Open the file: `d:\Civic\Civic-Saathi\db\schema.sql`
3. Execute the entire script (F5 or click Execute button)
4. Verify all tables are created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

You should see 25+ tables.

### Step 3: Disable Hibernate Schema Management

Update `application.yml` to prevent Hibernate from modifying the schema:

```yaml
jpa:
  hibernate:
    ddl-auto: validate  # Changed from 'update' to 'validate'
```

This tells Hibernate to:
- ✅ Validate that entities match the database schema
- ❌ NOT create, update, or drop tables
- ❌ NOT modify the schema in any way

### Step 4: Update Java Entities to Match Schema

The current entities need to be updated to match the `db/schema.sql` structure. Here are the key changes needed:

#### 4.1 User Entity Changes

**Current (simplified)**:
```java
@Entity
@Table(name = "users")
public class User {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String role; // Single role as String
    private String city; // City as String
    // ...
}
```

**Required (from schema.sql)**:
```java
@Entity
@Table(name = "users")
public class User {
    private UUID id;
    private String name;
    private String phone;
    private String email;
    private String passwordHash;
    private String status;
    private Integer failedLoginAttempts;
    private LocalDateTime lastLoginAt;
    
    @ManyToOne
    @JoinColumn(name = "city_id")
    private City city; // City as entity
    
    @ManyToOne
    @JoinColumn(name = "ward_id")
    private Ward ward;
    
    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;
    
    @ManyToMany
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles; // Many-to-many roles
    
    private String languagePreference;
    private String profilePictureUrl;
    private Boolean verified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
```

#### 4.2 New Entities Needed

**Role.java**:
```java
@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;
    
    @Column(unique = true, nullable = false)
    private String name;
}
```

**City.java**:
```java
@Entity
@Table(name = "cities")
public class City {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;
    
    private String name;
    private String state;
    private String country;
    private LocalDateTime createdAt;
}
```

**Ward.java**, **Zone.java**, **Category.java**, etc.

#### 4.3 Complaint Entity Changes

**Current**:
```java
@Entity
public class Complaint {
    private UUID id;
    private String title;
    private String description;
    private String category; // Single category as String
    private String status;
    // ...
}
```

**Required**:
```java
@Entity
@Table(name = "complaints")
public class Complaint {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;
    
    @Column(unique = true, nullable = false)
    private String complaintNumber;
    
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String status;
    private String priority;
    
    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
    
    @ManyToOne
    @JoinColumn(name = "assigned_worker_id")
    private Worker assignedWorker;
    
    @ManyToOne
    @JoinColumn(name = "city_id")
    private City city;
    
    @ManyToOne
    @JoinColumn(name = "ward_id")
    private Ward ward;
    
    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;
    
    @Column(columnDefinition = "geography(Point,4326)")
    private Point location; // PostGIS geometry
    
    private String addressText;
    private String visibility;
    private BigDecimal trustScore;
    private Boolean isDuplicate;
    private String aiSummary;
    private Float aiPriorityScore;
    
    @Column(columnDefinition = "vector(1536)")
    private float[] embedding; // pgvector
    
    @ManyToMany
    @JoinTable(
        name = "complaint_category_map",
        joinColumns = @JoinColumn(name = "complaint_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private Set<Category> categories; // Multi-category
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
```

## Implementation Strategy

Given the complexity of the full schema, here's a phased approach:

### Phase 1: Core Tables (Immediate)
1. Run `db/schema.sql` to create all tables
2. Change `ddl-auto` to `validate`
3. Update existing entities to match core tables:
   - users (with city_id, ward_id, zone_id as UUID)
   - auth_tokens
   - departments
   - workers
   - complaints (basic fields)
   - assignments
   - notifications

### Phase 2: RBAC & Geography (Next)
4. Create new entities:
   - Role, City, Ward, Zone
   - Update User to use many-to-many roles
   - Update relationships to use entity references

### Phase 3: Extended Features (Later)
5. Create remaining entities:
   - Category, ComplaintCategoryMap
   - ComplaintVersion, ComplaintMedia
   - ComplaintStatusHistory, AuditLog
   - Feedback, ReopenRequest, ComplaintSupportVote
   - NotificationType, ComplaintDuplicate
   - ComplaintComment, AnalyticsSnapshot

## Immediate Action Required

### Option A: Quick Fix (Keep Current Entities)

If you want to keep the current simplified entities working:

1. **Don't run schema.sql yet**
2. Keep `ddl-auto: update`
3. Continue with current 7-table structure
4. Plan migration to full schema later

### Option B: Implement Full Schema (Recommended)

If you want to implement the proper schema now:

1. **Stop the backend**
2. **Run schema.sql in pgAdmin** to create all 25+ tables
3. **Change `ddl-auto` to `validate`**
4. **Update entities** to match the schema (Phase 1 first)
5. **Fix compilation errors**
6. **Update services and controllers**
7. **Restart backend**

## My Recommendation

Since you have the web dashboard and mobile app already built and working with the simplified schema, I recommend:

### Hybrid Approach:

1. **Keep current entities working** (Option A for now)
2. **Run schema.sql** to create the full schema
3. **Gradually migrate** entities to match the full schema
4. **Use database views** or **DTOs** to bridge the gap temporarily

This allows you to:
- ✅ Keep the current app working
- ✅ Have the proper database schema in place
- ✅ Migrate incrementally without breaking changes
- ✅ Test each phase before moving to the next

## What Would You Like to Do?

Please choose:

**A)** Keep current simplified entities, continue development, migrate to full schema later

**B)** Implement full schema now, update all entities to match (will require significant refactoring)

**C)** Hybrid approach: Run schema.sql, keep current entities, migrate gradually

Let me know your preference and I'll help you implement it!

---

**Important**: The `db/schema.sql` file is the source of truth and should not be modified. All entity changes must conform to this schema.
