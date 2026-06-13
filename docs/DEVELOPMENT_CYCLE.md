# Civic Saathi — Complete Development Cycle

A comprehensive record of every phase, decision, build step, and milestone in the development of the Civic Saathi platform — from initial concept through production deployment.

---

## Table of Contents

1. [Project Concept & Problem Statement](#1-project-concept--problem-statement)
2. [Product Design Phase](#2-product-design-phase)
3. [Architecture & Stack Decisions](#3-architecture--stack-decisions)
4. [Database Design](#4-database-design)
5. [Phase 0 — Foundation Setup](#5-phase-0--foundation-setup)
6. [Phase 1 — Core Workflow (Level A)](#6-phase-1--core-workflow-level-a)
7. [Phase 2 — Operational Hardening (Level B)](#7-phase-2--operational-hardening-level-b)
8. [Phase 3 — AI Intelligence (Level C)](#8-phase-3--ai-intelligence-level-c)
9. [Mobile App Development](#9-mobile-app-development)
10. [Web Dashboard Development](#10-web-dashboard-development)
11. [Bug Fixes & Iterative Improvements](#11-bug-fixes--iterative-improvements)
12. [Hosting & Deployment](#12-hosting--deployment)
13. [Security Hardening](#13-security-hardening)
14. [Feature Enhancements Post-Launch](#14-feature-enhancements-post-launch)
15. [Current State & Known Gaps](#15-current-state--known-gaps)
16. [Development Timeline Summary](#16-development-timeline-summary)

---

## 1. Project Concept & Problem Statement

### The Problem
Urban local bodies suffer from:
- delayed and fragmented complaint handling
- no reliable routing to the correct department
- duplicate reports for the same issue
- lack of accountability and audit trails
- poor citizen trust due to zero status visibility
- no SLA tracking or escalation management

### The Vision
Build a **complete civic issue lifecycle platform** — not just a complaint inbox. The system needed to cover:
- issue capture → location verification → duplicate detection → department routing → worker assignment → field resolution → proof-based closure → citizen feedback → analytics

### Target Context
A city-level municipal operation. Initial reference context: Indore, Madhya Pradesh. The system was designed to support one city with multiple wards, zones, departments, and worker groups — extensible to multiple cities later.

### Team
4 members — 3 technical, 1 documentation/presentation.

---

## 2. Product Design Phase

### Role Model Defined

| Role | Primary Responsibility |
|---|---|
| **Citizen** | Report issues, track status, give feedback, reopen |
| **Field Worker** | Accept tasks, navigate to site, complete with proof |
| **Department Officer** | Verify, assign, monitor, approve closure |
| **City Admin** | Full oversight, analytics, policy, escalation |
| **Super Admin** | Multi-city platform governance (future) |

### Complaint Lifecycle State Machine (15 states)
```
SUBMITTED → DUPLICATE_CHECKED → VERIFIED → ROUTED → ASSIGNED
    → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → VERIFIED_FOR_CLOSURE
    → CLOSED
    
    (Alternative paths)
    → ESCALATED → REOPENED → REJECTED → CANCELLED
```

### Key Design Rules Established
1. Every state transition must be validated by business logic
2. Every privileged action must be audit-logged
3. AI is an enhancement layer — the workflow must function without it
4. Role permissions are enforced at API + service + frontend levels
5. No hardcoded city assumptions in the core data model

---

## 3. Architecture & Stack Decisions

### Decision: Modular Monolith (not microservices)
**Reason:** Easier to build, test, and deploy early. Clear module boundaries allow future extraction without immediate complexity.

### Final Stack Selected

| Layer | Technology | Reason |
|---|---|---|
| Backend | Spring Boot 3.3.6 + Java 17 | Enterprise-grade, stable, government-compatible |
| Security | Spring Security + JWT (jjwt 0.12.6) + BCrypt | Stateless auth, role-based access |
| Persistence | Spring Data JPA + Hibernate Spatial | ORM with geospatial support |
| Database | PostgreSQL 16 + PostGIS 3.4 + pgvector | Relational + geo + vector search |
| Mobile | React Native 0.81.5 + Expo 54 + TypeScript | Cross-platform, fast iteration |
| Web | React 18 + Vite + TypeScript | Fast builds, modern dev experience |
| State mgmt | Zustand | Lightweight, no boilerplate |
| AI | Cerebras LLM + rule-based fallback | Free tier LLM with offline fallback |
| Infrastructure | Docker + Docker Compose | Consistent local + prod environments |
| Hosting (prod) | Supabase (DB) + Render (backend) + Vercel (web) | Free tiers for initial deployment |

### Rejected Alternatives
- **Redis** — deferred; PostgreSQL-backed jobs sufficient for current scale
- **Microservices** — deferred; monolith is faster to validate first
- **WebFlux** — rejected; Web MVC adequate, simpler for team
- **Firebase Auth** — rejected; custom JWT gives full control

---

## 4. Database Design

### Core Schema (26 tables)

```
Users & RBAC:         users, roles, user_roles
Geography:            cities, wards, zones
Departments:          departments
Workers:              workers
Complaints:           complaints, complaint_category_map,
                      complaint_versions, complaint_media,
                      complaint_support_votes, complaint_duplicates,
                      complaint_comments, complaint_status_history
Assignments:          assignments
Feedback:             feedback, reopen_requests
Notifications:        notifications, notification_types
Analytics:            analytics_snapshots
Auth:                 auth_tokens
Categories:           categories
Audit:                audit_logs
```

### Key Design Choices
- UUID primary keys everywhere (native PostgreSQL `uuid` type)
- `GEOGRAPHY(Point, 4326)` for complaint location (PostGIS)
- `GIST` spatial index for proximity queries
- Many-to-many `user_roles` for RBAC (not enum on user)
- `complaint_status_history` for full audit trail
- `is_auto_assigned` flag on assignments to enable different denial flows
- `zone_number` on users as the interrelation key between citizens, workers, and admins

### Schema Migrations Applied
| Migration | Change |
|---|---|
| V1 (initial) | Full 26-table schema from `db/schema.sql` |
| V2 | Added `address`, `aadhar_number`, `zone_number` to `users` |
| V3 | Added `department_code` to `users` |

---

## 5. Phase 0 — Foundation Setup

### Steps Completed
1. Repository created at `github.com/divyansh357/Civic-Saathi`
2. Git branching strategy established — `dev` as main working branch
3. Project structure scaffolded:
   ```
   backend/        — Spring Boot Maven project
   mobile-app/     — Expo React Native project
   web-dashboard/  — Vite React project
   db/             — SQL schema + migrations
   infra/          — Docker Compose files
   docs/           — Architecture and specification docs
   ```
4. Docker Compose set up for local PostgreSQL with PostGIS
5. Base `.env.example` with all required environment variables documented
6. `application.yml` configured with env-variable-driven settings (no hardcoded secrets)

### Key Files Created
- `infra/docker-compose.yml` — dev environment
- `infra/docker-compose.prod.yml` — production deployment
- `infra/docker/backend.Dockerfile` — multi-stage Maven build
- `infra/docker/postgres.Dockerfile` — PostGIS-enabled Postgres
- `db/schema.sql` — full initial schema

---

## 6. Phase 1 — Core Workflow (Level A)

### What Was Built

#### Authentication System
- JWT access + refresh token pair on login and signup
- `RoleRepository` + `user_roles` many-to-many for RBAC
- `JwtTokenProvider` — generates/validates signed JWTs
- `JwtAuthenticationFilter` — extracts and validates tokens per request
- `SecurityConfig` — stateless session, public auth routes, CORS
- Signup supports: CITIZEN, WORKER, OFFICER, ADMIN roles
- `@municipal.in` email domain rule enforced for ADMIN/OFFICER/WORKER

#### Complaint System
- Full `Complaint` entity with PostGIS `GEOGRAPHY(Point, 4326)` location
- 15-state lifecycle with `ComplaintStatus` enum
- Complaint creation with images, GPS coordinates, category
- Multi-category support via `complaint_category_map`
- Complaint versioning, media, comments, support votes

#### Assignment System
- `Assignment` entity with `is_auto_assigned` flag
- Auto-assignment: AI category → department mapping → least-loaded worker
- Manual assignment by admin/officer
- SLA deadline calculation (all in hours):
  - Critical: 4h | High: 12h | Medium: 48h | Low: 120h | Very Low: 240h
- Worker acknowledgement (requires Aadhar on file)
- Worker start / complete / reject flows
- Denial request flow for manually-assigned tasks

#### Notifications
- `Notification` entity + `NotificationService`
- Triggered on: assignment, rejection, denial request, task completion
- Worker receives notification on new assignment
- Admin receives rejection reason / denial request

#### Audit Logging
- `audit_logs` table — every privileged action logged
- `complaint_status_history` — full state transition record

### API Endpoints Established (core)
```
POST   /auth/signup, /auth/login, /auth/refresh, /auth/logout
GET    /auth/me, /auth/validate
POST   /complaints
GET    /complaints, /complaints/{id}, /complaints/public
PUT    /complaints/{id}/status
POST   /assignments/auto-assign, /assignments/manual-assign
POST   /assignments/{id}/acknowledge, /start, /complete, /reject
POST   /assignments/{id}/denial-request
GET    /workers, /workers/department/{id}
```

---

## 7. Phase 2 — Operational Hardening (Level B)

### SLA Tracking & Escalation
- `deadline_at` on each assignment
- `SlaTimer` component on web dashboard shows live countdown
- `escalateOverdueAssignments()` scheduled job
- Overdue assignments trigger `ESCALATED` complaint status
- Admin dashboard shows overdue count with batch escalation button

### Feedback & Reopen System
- Citizens can rate (1–5 stars) + comment after closure
- `reopen_requests` table — citizen submits reason + evidence
- Officer approves/rejects reopen requests
- Max 6 reopens per complaint enforced at DB level

### Duplicate Detection
- `DuplicateDetectionService` — Jaccard similarity on title + description
- Duplicates linked via `complaint_duplicates` table
- Similar complaints surfaced during submission

### Department-Category Linking
- `Department.categoryType` string maps to AI category labels
- `normalizeCategoryToDeptType()` normalizes AI labels → dept types
  - "Road Damage" → "ROADS", "Water Supply" → "WATER", etc.
- Auto-assignment uses this mapping to find correct department

### Worker Management
- Availability toggle (ACTIVE / INACTIVE)
- `worker_preferred_zones` many-to-many
- `WorkerProfileScreen` — profile image, Aadhar, previous works, worker code

### Analytics
- `AnalyticsSnapshot` entity
- Live queries for: total/open/resolved/escalated counts
- Avg resolution time, SLA breach rate
- Department performance ranking
- Ward-level heatmap data

---

## 8. Phase 3 — AI Intelligence (Level C)

### AI Complaint Classification
- `CoreAiService` — wraps Cerebras LLM API
- Rule-based fallback (keyword matching) when API unavailable
- 6 categories: ROADS, WATER, ELECTRICITY, SANITATION, PARKS, GENERAL
- Auto-classifies on submission, persists category + AI summary

### Duplicate Detection (AI-enhanced)
- Jaccard similarity on tokenized title + description
- Configurable similarity threshold

### Dashboard Insights
- `generateInsights()` — summarizes live metrics via LLM
- Input: total complaints, escalated, resolved, avg resolution time
- Output: natural-language insight string displayed on admin dashboard

### Priority Scoring
- `scorePriority()` — maps LLM-suggested priority to float score (0.0–1.0)
- Stored in `ai_priority_score` on complaint

### Resolution Time Prediction
- Rule-based prediction by category:
  - ROADS: 48h | WATER: 24h | ELECTRICITY: 12h | SANITATION: 36h

---

## 9. Mobile App Development

### Technology Choices
- React Native 0.81.5 + Expo 54 (managed workflow)
- TypeScript throughout
- Zustand for auth + complaint state
- `expo-location` for GPS
- `expo-image-picker` for photo/video proof upload
- `expo-av` for voice notes
- Custom navigation with `useState` (no React Navigation — intentional simplicity)

### Screens Built

#### Auth Screens
| Screen | Features |
|---|---|
| `LoginScreen` | Email + password, eye toggle, success message from signup |
| `SignupScreen` | Two-step: role select → details; `PhoneField` with country code dropdown; `@municipal.in` enforcement for workers; zone number |

#### Citizen Screens
| Screen | Features |
|---|---|
| `HomeScreen` | Complaint list, stats, "Near me" tab |
| `NewComplaintScreen` | GPS capture, image picker, category, description |
| `ComplaintDetailScreen` | Full timeline, status, feedback button |
| `FeedbackScreen` | Star rating + comment |
| `ProfileScreen` | Edit name, phone, address, Aadhar (locked once set), zone number |

#### Worker Screens
| Screen | Features |
|---|---|
| `WorkerHomeScreen` | Assignment cards, SLA timers, GPS distance sort, availability toggle, denial modal |
| `WorkerProfileScreen` | Profile image, Aadhar, worker code, previous works, zone number |

#### Shared Screens
| Screen | Features |
|---|---|
| `CompleteProfileScreen` | Mandatory gate — address + Aadhar + zone required before any feature access |
| `NotificationsScreen` | Notification list with read/unread state |

#### Admin Redirect
- Admins on mobile see a redirect notice pointing to the web dashboard

### Profile Completion Gate
After login, `App.tsx` checks `user.profileComplete`. If false, renders `CompleteProfileScreen` for all roles before showing any feature screen.

### Localtunnel Integration
- `npm run tunnel` script opens a `loca.lt` HTTPS tunnel to `localhost:8080`
- Live-patches `EXPO_PUBLIC_API_URL` in `.env` with tunnel URL
- `bypass-tunnel-reminder` header added to API client to skip interstitial

---

## 10. Web Dashboard Development

### Technology Choices
- React 18 + Vite + TypeScript
- Zustand for auth state (with `localStorage` token persistence)
- Recharts for analytics charts
- Lucide React for icons
- Custom CSS with CSS variables for dark/light theming

### Pages Built

| Page | Key Features |
|---|---|
| `LoginPage` | Sign in + Create Account tabs; `@municipal.in` enforcement; country code + phone; password eye toggles; dept code, zone number fields |
| `DashboardPage` | Live stats, AI insights, recent complaints |
| `ComplaintsPage` | Paginated table, status/search filter, detail modal, inline auto-assign + manual assign; `AssignWorkerModal` filtered by complaint's department |
| `AssignmentsPage` | SLA timer, overdue tab, batch escalation, hours-from-now SLA editor, `TaskReviewModal` with approve/reject-work |
| `UsersPage` | Table with zone/dept columns, `ProfileModal` — full editable profile, Aadhar masked + locked once set |
| `WorkersPage` | Worker list, availability, stats |
| `DepartmentsPage` | Department list, category type |
| `AnalyticsPage` | Charts, heatmap data, dept ranking |
| `NotificationsPage` | Notification list |

### Global Config
- `CorsConfig.java` — allowed origins from `CORS_ALLOWED_ORIGINS` env var
- `vercel.json` — Vite build + SPA rewrite rule for Vercel deployment

---

## 11. Bug Fixes & Iterative Improvements

A complete record is maintained in `docs/DEVELOPMENT_ISSUES_AND_SOLUTIONS.md`. Summary of the 20 issues resolved:

| # | Issue | Resolution |
|---|---|---|
| 1 | `User.setRole()` no-op — users created with no roles | Fixed with `RoleRepository` + `user.addRole()` |
| 2 | `localhost:8080` unreachable from physical device | Created `mobile-app/.env` with correct LAN IP |
| 3 | LAN IP fragile — requires same Wi-Fi + firewall | Localtunnel integration (`npm run tunnel`) |
| 4 | Worker role routes to citizen UI after login | Fixed by `getPrimaryRole()` reading from roles Set |
| 5 | CORS blocking all web dashboard requests | `CorsConfig.java` global bean + env-var origins |
| 6 | Backend not starting on Render | Speculative fix reverted; root cause unconfirmed |
| 7 | Zone number missing from signup | Added to all signup forms + `SignupRequest.java` |
| 8 | Profile completion not enforced | `CompleteProfileScreen` gate in `App.tsx` |
| 9 | Phone field no 10-digit limit, no country code | `PhoneField` component on mobile + web |
| 10 | Password no eye toggle on web | `Eye`/`EyeOff` on all 3 password fields |
| 11 | Users page View button non-functional | `ProfileModal` with full editable form |
| 12 | No email verification for admin/officer | `@municipal.in` domain rule — auto-verified |
| 13 | Department code missing from signup | Added to all forms + User entity + migration V3 |
| 14 | No zone interrelation between users | `zoneNumber` on all roles, exposed in all responses |
| 15 | Auto-assignment ignored category → dept mapping | `normalizeCategoryToDeptType()` + improved lookup |
| 16 | Manual assignment showed all workers | `AssignWorkerModal` filters by `complaint.departmentId` |
| 17 | SLA deadlines used days not hours | All priority levels converted to `plusHours()` |
| 18 | Worker rejection broken on Android, no denial flow | Denial modal + `/denial-request` endpoint |
| 19 | No hosting config for Supabase + Render + Vercel | `render.yaml`, `vercel.json`, updated Dockerfile |
| 20 | Aadhar accepted any string — no format validation | `@Pattern(\\d{12})` at DTO + service + UI layers |

---

## 12. Hosting & Deployment

### Production Stack

```
Phone/Browser
     │
     ├── Mobile App (Expo Go / APK)
     │        │
     │        ▼
     └── Web Dashboard (Vercel)
              │
              │  VITE_API_URL / EXPO_PUBLIC_API_URL
              ▼
         Render (Spring Boot backend)
              │
              │  DB_URL (JDBC)
              ▼
         Supabase (PostgreSQL)
```

### Step-by-Step Deployment

**1. Supabase (Database)**
- Create project → enable pgvector extension
- Run `db/schema.sql` + `db/migrations/V2` + `db/migrations/V3` in SQL Editor
- Get JDBC connection string from Project Settings → Database

**2. Render (Backend)**
- New Web Service → connect GitHub repo (`dev` branch)
- Runtime: Docker | Dockerfile: `./infra/docker/backend.Dockerfile` | Context: `.`
- Set env vars: `DB_URL`, `DB_PASSWORD`, `JWT_SECRET` (auto-generated), `JPA_DDL_AUTO=none`, `CORS_ALLOWED_ORIGINS`

**3. Vercel (Web Dashboard)**
- Import repo → Root Directory: `web-dashboard`
- Set `VITE_API_URL=https://<render-url>/api/v1`

**4. Mobile App**
- Set `EXPO_PUBLIC_API_URL=https://<render-url>/api/v1` in `mobile-app/.env`
- Run `npx expo start --clear` — works on any network

### Live URLs
- Backend: `https://civic-saathi-4sz9.onrender.com`
- Web Dashboard: `https://civic-saathi-three.vercel.app`
- Mobile: via Expo Go scanning QR code

---

## 13. Security Hardening

### Measures Applied

| Area | Implementation |
|---|---|
| Authentication | JWT (HS256), BCrypt password hashing, refresh token rotation |
| Authorization | Spring Security `@PreAuthorize` on every endpoint, role hierarchy enforced |
| CORS | `CorsConfig.java` — explicit allowed origins, not `*` wildcard |
| CSRF | Disabled (stateless JWT, not cookie-based) |
| Email verification | `@municipal.in` domain rule for ADMIN/OFFICER/WORKER (auto-verified) |
| Aadhar validation | `@Pattern(\\d{12})` at DTO + service + UI — 12 numeric digits enforced |
| Aadhar immutability | Once set, `aadharNumber` cannot be updated — locked in `UserService` |
| Profile gate | No feature access until address + Aadhar + zone number completed |
| SQL injection | Parameterized queries via JPA/Hibernate — no raw SQL |
| JWT secret | Loaded from `JWT_SECRET` env var — defaults warn in logs, blocked in prod |
| Aadhar in acknowledgement | Worker must have Aadhar on `User` entity (or legacy `Worker` field) before accepting tasks |

---

## 14. Feature Enhancements Post-Launch

### Added After Initial Deployment

**Localtunnel dev launcher** (`mobile-app/scripts/tunnel-start.js`)
- Enables device-independent mobile testing without Wi-Fi/firewall requirements
- Auto-patches `.env` with fresh tunnel URL on every run

**Department ↔ Category normalization**
- AI category labels mapped to department `categoryType` values
- Auto-assignment now correctly routes to the right department

**Denial workflow redesign**
- Auto-assigned: direct rejection, sends admin a message with reason
- Manually-assigned: sends a denial request notification to admin; task stays assigned

**SLA hours unification**
- All SLA durations now use `plusHours()` for consistency
- Admin SLA editor on web changed from `datetime-local` to hours-from-now input

**Aadhar validation hardening** (Issue 20)
- `@Pattern(\\d{12})` added to both User and Worker update DTOs
- Service-layer guards throw `IllegalArgumentException` if format is wrong
- Mobile: red border + live digit counter + save blocked if invalid

**Aadhar check fix in `acknowledgeAssignment`**
- Was checking `worker.getAadharNo()` (old Worker entity field)
- Fixed to check `user.getAadharNumber()` first (new canonical field), fallback to Worker field

---

## 15. Current State & Known Gaps

### What Is Complete

| Layer | Status |
|---|---|
| Backend API | ✅ All core endpoints, auth, assignments, complaints, notifications, analytics |
| Database | ✅ 26 tables, migrations V1–V3 applied |
| Mobile — Citizen | ✅ Full complaint lifecycle (create, track, feedback, reopen) |
| Mobile — Worker | ✅ Assignment board, denial flow, profile, GPS navigation |
| Mobile — Admin/Officer | ✅ Redirect notice (uses web dashboard) |
| Web Dashboard | ✅ All pages functional with live API data |
| Auth | ✅ JWT, RBAC, `@municipal.in` rule, profile gate |
| Hosting | ✅ Supabase + Render + Vercel configured and live |
| AI Layer | ✅ Classification, summarization, duplicate detection, insights |

### Known Gaps / Future Work

| Gap | Notes |
|---|---|
| Push notifications (FCM) | Wired in architecture, not yet integrated with FCM |
| Complaint map (public) | Backend heatmap data ready, frontend map component not built |
| Offline draft support | Planned for Level C+ |
| Report PDF export | `JasperReports`/`iText` planned, not implemented |
| Multi-city support | Schema supports it, no UI or tenancy logic yet |
| Worker `aadhar_no` vs `aadharNumber` | Two fields exist on different entities — gradual migration ongoing |
| Admin can't approve denial requests via UI | Denial request is notified to admin but there is no dedicated UI action yet |

---

## 16. Development Timeline Summary

| Milestone | What Was Delivered |
|---|---|
| **M1 — Foundation** | Repo, Docker, DB schema, env config, project structure |
| **M2 — Auth** | JWT signup/login, RBAC, role assignment fix, `@municipal.in` rule |
| **M3 — Complaint Core** | Complaint CRUD, lifecycle, PostGIS location, images |
| **M4 — Assignment** | Auto/manual assignment, SLA, acknowledgement, completion |
| **M5 — Worker Mobile** | WorkerHomeScreen, assignments, GPS distance, availability |
| **M6 — Citizen Mobile** | Full citizen flow, HomeScreen, NewComplaint, Feedback, Profile |
| **M7 — Web Dashboard** | All 8 pages, modal flows, AssignWorker, SLA editor |
| **M8 — Level B** | SLA escalation, feedback, reopen, duplicate detection, analytics |
| **M9 — Level C** | AI classification, summarization, insights, priority scoring |
| **M10 — Hosting** | Supabase + Render + Vercel configuration and deployment |
| **M11 — Security** | CORS fix, email domain rule, profile gate, Aadhar validation |
| **M12 — Hardening** | Denial flow, dept-category linking, SLA in hours, phone validation |
| **M13 — Fixes** | Aadhar check fix, 12-digit validation, worker field alignment |

---

*This document is maintained alongside `DEVELOPMENT_ISSUES_AND_SOLUTIONS.md`. Together they provide a complete record of what was built, why, and how.*
