# Crowdsourced Civic Issue Reporting and Resolution System
## Master Project Context

This document is the single source of truth for the project. It captures the problem, product intent, target users, scope, constraints, and the architectural direction that all other files expand upon.

---

## 1. Project Summary

The system is a **role-based civic issue reporting and resolution platform** designed for municipal operations. It allows citizens to report everyday urban problems, enables departments to triage and resolve them, and gives city administrators a full operational view of complaints, priorities, service levels, and outcomes.

The core problem is not just “complaint submission.” The actual problem is the lack of a **complete issue lifecycle system**:
- issue capture,
- location verification,
- duplicate detection,
- department routing,
- assignment,
- field resolution,
- proof-based closure,
- audit trail,
- analytics,
- and citizen feedback.

This platform is intended to work as a real operational product, not only as a college-level prototype.

---

## 2. Problem Statement

Urban local bodies often struggle with:
- delayed complaint handling,
- fragmented reporting channels,
- lack of accountability,
- weak tracking of complaint status,
- no reliable routing to the correct department,
- duplicate reports for the same issue,
- poor visibility into staff performance,
- and limited citizen trust.

The platform addresses these failures by creating a transparent digital workflow connecting citizens, field workers, departmental officers, and city-level administrators.

---

## 3. Primary Goals

### Functional goals
- Allow citizens to report issues quickly using mobile and web interfaces.
- Track each complaint through a defined lifecycle.
- Route issues automatically to the correct department.
- Assign tasks to field workers.
- Require proof-based resolution.
- Keep a complete audit trail.
- Provide operational dashboards and analytics.
- Support escalation and SLA tracking.
- Enable future integration with smart-city systems.

### Product goals
- Build a system that can be deployed in a real municipal environment.
- Keep the architecture extensible so it can scale without redesign.
- Use free or trial services during initial development.
- Avoid dead ends by designing the data model, roles, and workflows carefully from the start.

---

## 4. Core Product Principle

The product should be designed around **workflow integrity**.

That means:
- every role has a clear purpose,
- every action changes state in a controlled way,
- every complaint follows a defined lifecycle,
- every update is traceable,
- and every module can evolve without breaking the base system.

If the workflow layer is weak, no amount of UI polish will make the system dependable.

---

## 5. Target Deployment Context

The initial deployment context is a city-level civic operations environment, with Indore and Madhya Pradesh used as the contextual reference for requirements and competitor analysis.

This means the system should be able to support:
- one city,
- multiple wards/zones,
- multiple departments,
- multiple worker groups,
- and eventually multiple cities.

The first live deployment target should be a single-city operational setup, because it is the most realistic path to validation and funding.

---

## 6. Key Stakeholders

### Citizens
- report issues,
- follow resolution progress,
- provide feedback,
- and support public complaints already reported by others.

### Field Workers
- receive tasks,
- navigate to locations,
- update status,
- upload resolution evidence,
- and close physical work orders.

### Department Officers
- review incoming complaints,
- verify legitimacy,
- assign tasks,
- monitor execution,
- reassign if needed,
- and approve closure.

### City Administrators
- monitor departments,
- inspect analytics,
- manage SLAs,
- handle escalations,
- and configure policies.

### Super Admin / Future Multi-City Admin
- manage multiple municipalities,
- oversee system-wide standards,
- and control configuration at scale.

---

## 7. Final Product Vision

The final system should behave like a civic operations platform, not a basic grievance form.

It should provide:
- mobile reporting,
- public map visibility,
- structured departmental work queues,
- real-time status updates,
- escalation management,
- analytics and heatmaps,
- evidence-based closure,
- and an extensible API layer for future integrations.

---

## 8. Design Constraints

### Budget constraints
- Use free or trial-based services during build and early deployment.
- Prefer managed free tiers where possible.
- Do not depend on paid infrastructure for the first usable version.

### Team constraints
- Team size: 4
- Three technical members
- One presentation/documentation member

### Product constraints
- Must be realistic to build.
- Must be demonstrable with actual workflows.
- Must not depend on inaccessible government data.
- Must remain architecturally sound if scaled later.

---

## 9. Baseline Stack Direction (can be adjusted if needed)

The stack direction discussed so far is:

- Java + Spring Boot for backend
- Spring Security + JWT for authentication
- Spring Data JPA for persistence
- PostgreSQL as main database
- PostGIS for geospatial logic
- pgvector for semantic similarity and duplicate detection
- React Native for mobile client
- React for admin dashboard
- Firebase Cloud Messaging for push notifications
- Docker for packaging and local consistency
- Supabase for low-cost backend services during early stages
- LangChain4j for AI orchestration
- trial/free AI models or APIs where necessary
- JasperReports or iText for PDF reports

This stack is intentionally chosen to support real implementation while keeping the build practical.

---

## 10. Competitor Context

The project should be designed with awareness of existing civic reporting systems such as:
- Indore 311,
- Swachhata / sanitation grievance systems,
- CM Helpline style grievance portals,
- and FixMyStreet-style civic issue platforms.

The main weakness in many existing systems is not that they lack complaint entry; it is that they lack strong workflow orchestration, strong transparency, and strong operational intelligence.

---

## 11. Non-Negotiable System Qualities

- role-based access control,
- deterministic complaint lifecycle,
- location-aware routing,
- duplicate detection,
- proof-based closure,
- audit logging,
- operational dashboards,
- escalation management,
- and future extensibility.

If any of these are absent, the system will remain fragile.

---

## 12. Files in This Package

This project package contains:
- this master context file,
- a workflow and role specification,
- a feature and module specification,
- a technical architecture and stack guide,
- and a data / API design guide.

Together, these files are intended to serve as the implementation blueprint.
