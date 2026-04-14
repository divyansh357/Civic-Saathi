# Roadmap and Build Order

This document turns the project into an execution plan. The order matters because the base must be strong enough to avoid future dead ends.

---

## 1. Build Philosophy

Do not build by randomly adding screens.

Build in this order:
1. identity,
2. complaint lifecycle,
3. assignment and resolution,
4. dashboards,
5. reporting,
6. intelligence,
7. scale enhancements.

This order keeps the system coherent.

---

## 2. Phase 0: Finalize the Product Contract

Before coding, lock:
- final roles,
- complaint lifecycle states,
- department mapping rules,
- status transition rules,
- visibility policy,
- and minimal admin rights.

---

## 3. Phase 1: Core Working System

### Deliverables
- authentication,
- role-based routing,
- complaint creation,
- image upload,
- location capture,
- complaint list views,
- complaint detail view,
- officer queue,
- worker task board,
- complaint assignment,
- status transitions,
- notifications,
- audit logs.

### Why this phase matters
This is the minimum system that can actually operate in the real world.

---

## 4. Phase 2: Operational Hardening

### Deliverables
- duplicate detection,
- SLA rules,
- escalation engine,
- reopen workflow,
- approval workflow,
- worker acceptance / rejection,
- manual reassignment,
- public complaint visibility if approved,
- and basic analytics.

### Why this phase matters
This is where the platform becomes credible for government operations.

---

## 5. Phase 3: Differentiation Layer

### Deliverables
- AI category suggestion,
- AI summary generation,
- semantic duplicate support,
- smart priority scoring,
- heatmaps,
- route optimization,
- department performance ranking,
- complaint cluster insights.

### Why this phase matters
This is where your product becomes meaningfully better than a basic grievance app.

---

## 6. Phase 4: Production Readiness

### Deliverables
- logging and monitoring,
- backups,
- rate limiting,
- security hardening,
- role audit review,
- data export,
- report automation,
- error handling,
- retry logic,
- and deployment documentation.

---

## 7. Team Division Recommendation

Given a team of 4:

### Member 1
Backend core:
- Spring Boot,
- auth,
- complaint workflow,
- assignment workflow.

### Member 2
Frontend mobile:
- React Native,
- citizen screens,
- worker screens.

### Member 3
Frontend web + admin:
- React dashboard,
- charts,
- maps,
- admin flows.

### Member 4
Research / presentation / QA / documentation:
- competitor study,
- requirements,
- testing,
- slides,
- feature tracking,
- release notes.

This division can be adjusted, but each role should own a full logical surface.

---

## 8. Development Rules

### Rule 1
Do not code AI before the workflow works.

### Rule 2
Do not code dashboards before the complaint state machine is stable.

### Rule 3
Do not split into microservices prematurely.

### Rule 4
Do not let frontend logic become the source of truth.

### Rule 5
Do not ship without audit logs.

---

## 9. Recommended Iteration Sequence

### Iteration 1
- login,
- complaint creation,
- complaint listing,
- database schema,
- file upload.

### Iteration 2
- routing,
- assignment,
- status changes,
- notifications.

### Iteration 3
- field worker board,
- officer dashboard,
- citizen tracking.

### Iteration 4
- SLA,
- escalation,
- duplicate detection,
- analytics.

### Iteration 5
- AI assistance,
- public transparency map,
- reports,
- optimization features.

---

## 10. Definition of Done for Each Module

A module is complete only if:
- UI exists,
- API exists,
- validation exists,
- authorization exists,
- persistence exists,
- error handling exists,
- audit logging exists,
- and role-specific visibility is correct.

---

## 11. Future Expansion Plan

Once the core is stable, the system can grow into:
- multiple cities,
- citizen reputation system,
- IoT sensor ingestion,
- smart-bin automation,
- streetlight monitoring,
- WhatsApp reporting,
- and external civic integrations.

---

## 12. Final Note

This project should be treated as a platform.  
Every new feature must strengthen the complaint lifecycle, operational transparency, or citizen trust.

If a feature does not do that, it should not be prioritized before launch.
