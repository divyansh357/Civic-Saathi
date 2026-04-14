# Technical Architecture and Stack Guide

This document defines the implementation stack, why each technology is used, what should be included now, what should be delayed, and how the system should scale from a strong initial build into a larger production environment.

---

## 1. Architecture Strategy

The best starting strategy is a **modular monolith**.

That means:
- one backend codebase,
- clear module boundaries,
- separate packages for complaint, user, routing, notifications, analytics, and AI,
- shared database,
- shared authentication,
- and clear service interfaces internally.

This approach is easier to build, test, and deploy early, while still leaving room to extract services later if needed.

---

## 2. Recommended Backend Stack

### Core backend
- Java 17+ or Java 21 if the team is comfortable,
- Spring Boot 3.x,
- Spring Web MVC,
- Spring Security,
- Spring Data JPA,
- Spring Validation,
- Spring Boot Actuator,
- Spring Mail if email is later needed,
- Spring WebSocket or SSE for live status updates.

### Why this stack
- stable,
- enterprise-grade,
- easy to maintain,
- well known in government and corporate environments,
- and future-proof enough for scale.

### WebFlux decision
Use WebFlux only if the team explicitly chooses a reactive stack end-to-end. For this problem, Web MVC is simpler and entirely adequate for the first strong version. Live updates can be handled with WebSocket or Server-Sent Events without forcing the whole application into reactive mode.

---

## 3. Security Stack

### Use
- Spring Security,
- JWT access tokens,
- refresh tokens if needed,
- role-based authorization,
- method-level security,
- route guards in frontend,
- secure file handling,
- optional OTP for citizens.

### Security rules
- never trust frontend role checks alone,
- protect every API with authorization,
- validate ownership and scope,
- log all privileged operations,
- and prevent direct access to internal admin actions.

---

## 4. Database Stack

### Primary database
- PostgreSQL

### Extensions
- PostGIS for geospatial queries,
- pgvector for embeddings and semantic similarity.

### Why this database
This project is location-heavy and state-heavy. PostgreSQL is suitable because it handles:
- relational workflow data,
- structured permissions,
- JSON where needed,
- geospatial data,
- and vector search.

---

## 5. File and Media Handling

### Images and attachments
Use object storage rather than storing large images directly in the database.

Possible early options:
- Supabase Storage,
- Firebase Storage,
- or another trial/free object storage layer.

### Media handling requirements
- compression,
- validation,
- size limits,
- type checks,
- optional EXIF stripping,
- secure signed access,
- and lifecycle cleanup.

---

## 6. Frontend Stack

### Mobile application
- React Native,
- React Native Paper or Tamagui,
- React Navigation,
- Zustand or Redux Toolkit depending on team preference,
- and a clean map integration layer.

### Admin web application
- React,
- Vite,
- a UI component system,
- map visualization library,
- charting library,
- table library,
- and dashboard widgets.

### Frontend principles
- role-based views,
- mobile-first citizen reporting,
- fast operational dashboard for staff,
- and consistent design tokens.

---

## 7. Map and Geo Stack

### Required
- PostGIS in backend,
- map rendering on frontend,
- location capture from device,
- geocoding / reverse geocoding if needed.

### Use cases
- show complaint pin,
- find complaints within a radius,
- detect clusters,
- support zoning,
- and visualize hotspots.

---

## 8. AI / LLM Layer

### Suggested AI design
Keep AI as a separate module inside the application, not as the core dependency.

### Potential uses
- category suggestion,
- complaint summarization,
- duplicate detection support,
- severity inference,
- priority recommendation,
- trend summarization.

### Java integration
LangChain4j is a reasonable orchestration layer for a Java backend.

### Budget approach
Use free or trial AI services at first, and keep the system useful even if AI is temporarily disabled.

### Practical principle
AI should improve the workflow, not become a single point of failure.

---

## 9. Notifications Stack

### Primary
- Firebase Cloud Messaging for push notifications

### Optional later
- email,
- SMS,
- WhatsApp.

### Notification triggers
- complaint submitted,
- complaint verified,
- complaint assigned,
- complaint progressed,
- complaint resolved,
- complaint reopened,
- complaint escalated.

---

## 10. Reporting Stack

### Documents
- JasperReports,
- or iText if custom PDF generation is needed.

### Reports
- complaint summaries,
- department performance,
- SLA reports,
- escalation reports,
- monthly dashboards,
- citizen feedback summaries.

---

## 11. Background Jobs

### Use cases
- daily summaries,
- overnight analytics,
- SLA checks,
- escalation timers,
- report generation,
- duplicate clustering recalculation,
- stale task re-evaluation.

### Tools
- Spring Batch for batch jobs,
- scheduled tasks for job triggers,
- asynchronous processing for non-blocking work.

### Rule
Spring Batch should process jobs; it is not a scheduler itself.

---

## 12. Caching / Queueing

### Recommendation
Do not force Redis into the first version unless needed.

### Use Redis later for
- caching dashboards,
- rate limiting,
- queueing notifications,
- temporary job state,
- and session acceleration if required.

### Initial approach
Use Postgres-backed job records first if the load is still moderate.

---

## 13. Deployment Stack

### Local development
- Docker,
- Docker Compose,
- environment files,
- local database container or hosted free DB.

### Early deployment
- Supabase free tier for database-related services,
- Render or Railway for demos and trials,
- Firebase for notifications,
- trial or free AI services.

### Important production note
Free hosting should be used as a development or demo bridge, not as the final city production target.

---

## 14. Scaling Path

### Phase 1: Strong monolith
- one backend,
- one DB,
- one mobile app,
- one admin app.

### Phase 2: Shared platform services
- separate notification worker,
- separate AI worker,
- separate reporting worker,
- optional Redis.

### Phase 3: Service extraction if needed
- complaint service,
- notification service,
- analytics service,
- identity service,
- AI service.

Only split once usage or operational complexity actually demands it.

---

## 15. What to Include Now

### Absolutely include
- Spring Boot,
- Spring Security,
- JPA,
- PostgreSQL,
- PostGIS,
- pgvector,
- React Native,
- React dashboard,
- FCM,
- Docker,
- report generation,
- audit logs,
- and modular backend design.

### Include if time permits
- WebSockets or SSE,
- LangChain4j,
- batch jobs,
- map clustering,
- basic analytics charts.

### Delay
- Redis,
- microservices,
- OpenNLP,
- too many cloud vendors,
- blockchain,
- advanced IoT integration.

---

## 16. Environment Management

### Must have
- dev,
- test,
- staging,
- production.

### Must use
- config via environment variables,
- separate API keys,
- separate DB instances or schemas,
- logging with environment labels,
- and safe secret handling.

---

## 17. Observability

Add from early stages:
- app logs,
- request tracing,
- error logging,
- health endpoints,
- operational metrics,
- audit events.

This reduces future debugging pain.

---

## 18. Architecture Rules That Prevent Dead Ends

- keep complaint state machine strict,
- keep role permissions explicit,
- keep geo logic in backend,
- keep AI optional,
- keep storage abstracted,
- keep notification channels modular,
- keep reports generated from database truth,
- and avoid hardcoding city assumptions into the core model.
